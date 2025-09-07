import { useCallback } from 'react';
import { newTgeRow, saveTgeDataToStorage, normalizeDateTime, clearAllPriceHistory, isMainToken, removePriceFromTgeRows, removePriceAndRewardFromRows } from '../utils';
import { saveTgeWorkspaceData, TGE_WORKSPACE_ID } from '../services/neon';

export const useTgeDataOperations = (
  rows,
  setRows,
  workspaceId,
  isRemoteUpdateRef,
  setLastSyncTime
) => {
  // Clean row data function
  const cleanRowData = useCallback((rowData) => {
    if (!rowData) return rowData;
    
    const cleaned = { ...rowData };
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined || cleaned[key] === null) {
        cleaned[key] = '';
      }
    });
    return cleaned;
  }, []);

  // Add new row
  const addRow = useCallback((rowData = null) => {
    const newRowData = rowData ? cleanRowData(rowData) : newTgeRow();
    console.log('TGE: Adding new row:', newRowData);
    
    setRows(prevRows => {
      const updatedRows = [...prevRows, newRowData];
      
      // CHỈ save localStorage khi KHÔNG phải remote update
      if (!isRemoteUpdateRef.current) {
        saveTgeDataToStorage(updatedRows);
        console.log('TGE: Saved to localStorage, total rows:', updatedRows.length);
      }
      
      // Always save to TGE workspace - exclude price field
      try {
        const rowsWithoutPrice = removePriceFromTgeRows(updatedRows);
        saveTgeWorkspaceData(TGE_WORKSPACE_ID, rowsWithoutPrice);
        console.log('TGE: Saved to Neon database, total rows:', rowsWithoutPrice.length);
        
        // Update last sync time when successfully saved to database
        if (setLastSyncTime) {
          setLastSyncTime(new Date());
        }
      } catch (error) {
        console.error('TGE: Failed to save to Neon:', error);
      }
      
      return updatedRows;
    });
  }, [setRows, cleanRowData, isRemoteUpdateRef, setLastSyncTime]);

  // Update specific row (for API operations - doesn't trigger database save)
  const updateRowForAPI = useCallback((index, updates) => {
    setRows(prevRows => {
      const updatedRows = [...prevRows];
      const cleanedUpdates = cleanRowData(updates);
      updatedRows[index] = { ...updatedRows[index], ...cleanedUpdates };
      
      // Don't save to database for API updates (price will be excluded anyway)
      // Only save to localStorage for persistence
      saveTgeDataToStorage(updatedRows);
      
      return updatedRows;
    });
  }, [setRows, cleanRowData]);

  // Update specific row (for user operations - triggers database save)
  const updateRow = useCallback((index, updates) => {
    // Ensure we're not in a remote update state when user manually edits
    if (isRemoteUpdateRef.current) {
      console.log('Resetting remote update flag for manual edit');
      isRemoteUpdateRef.current = false;
    }
    
    setRows(prevRows => {
      const updatedRows = [...prevRows];
      const cleanedUpdates = cleanRowData(updates);
      updatedRows[index] = { ...updatedRows[index], ...cleanedUpdates };
      
      // CHỈ save localStorage khi KHÔNG phải remote update
      if (!isRemoteUpdateRef.current) {
        saveTgeDataToStorage(updatedRows);
      }
      
      // Always save to TGE workspace if not a remote update - exclude price field
      if (!isRemoteUpdateRef.current) {
        try {
          const rowsWithoutPrice = removePriceFromTgeRows(updatedRows);
          saveTgeWorkspaceData(TGE_WORKSPACE_ID, rowsWithoutPrice);
          console.log('TGE: Successfully saved row update to Neon');
          
          // Update last sync time when successfully saved to database
          if (setLastSyncTime) {
            setLastSyncTime(new Date());
          }
        } catch (error) {
          console.error('TGE: Failed to save to Neon:', error);
        }
      }
      
      return updatedRows;
    });
  }, [setRows, isRemoteUpdateRef, cleanRowData, setLastSyncTime]);

  // Remove row
  const removeRow = useCallback((index) => {
    setRows(prevRows => {
      const updatedRows = prevRows.filter((_, i) => i !== index);
      
      // CHỈ save localStorage khi KHÔNG phải remote update
      if (!isRemoteUpdateRef.current) {
        saveTgeDataToStorage(updatedRows);
      }
      
      // Always save to TGE workspace - exclude price field
      try {
        const rowsWithoutPrice = removePriceFromTgeRows(updatedRows);
        saveTgeWorkspaceData(TGE_WORKSPACE_ID, rowsWithoutPrice);
        
        // Update last sync time when successfully saved to database
        if (setLastSyncTime) {
          setLastSyncTime(new Date());
        }
      } catch (error) {
        console.error('TGE: Failed to save to Neon:', error);
      }
      
      return updatedRows;
    });
  }, [setRows, isRemoteUpdateRef, setLastSyncTime]);

  // Add multiple rows
  const addMultipleRows = useCallback((newRows) => {
    const cleanedRows = newRows.map(row => cleanRowData(row));
    setRows(prevRows => {
      const updatedRows = [...prevRows, ...cleanedRows];
      
      // CHỈ save localStorage khi KHÔNG phải remote update
      if (!isRemoteUpdateRef.current) {
        saveTgeDataToStorage(updatedRows);
      }
      
      // Always save to TGE workspace - exclude price field
      try {
        const rowsWithoutPrice = removePriceFromTgeRows(updatedRows);
        saveTgeWorkspaceData(TGE_WORKSPACE_ID, rowsWithoutPrice);
        console.log('TGE: Saved multiple rows to Neon database, total rows:', rowsWithoutPrice.length);
        
        // Update last sync time when successfully saved to database
        if (setLastSyncTime) {
          setLastSyncTime(new Date());
        }
      } catch (error) {
        console.error('TGE: Failed to save to Neon:', error);
      }
      
      return updatedRows;
    });
  }, [setRows, cleanRowData, isRemoteUpdateRef, setLastSyncTime]);

  // Replace all rows
  const replaceRows = useCallback((newRows) => {
    const cleanedRows = newRows.map(row => cleanRowData(row));
    setRows(cleanedRows);
    
    // CHỈ save localStorage khi KHÔNG phải remote update
    if (!isRemoteUpdateRef.current) {
      saveTgeDataToStorage(cleanedRows);
    }
    
    // Always save to TGE workspace - exclude price field
    try {
      const rowsWithoutPrice = removePriceAndRewardFromRows(cleanedRows);
      saveTgeWorkspaceData(TGE_WORKSPACE_ID, rowsWithoutPrice);
      
      // Update last sync time when successfully saved to database
      if (setLastSyncTime) {
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error('TGE: Failed to save to Neon:', error);
    }
  }, [setRows, cleanRowData, isRemoteUpdateRef, setLastSyncTime]);

  // Clear all data
  const clearAllData = useCallback(async () => {
    setRows([]);
    saveTgeDataToStorage([]);
    
    // Clear price history
    clearAllPriceHistory();
    
    // Save empty array to TGE Neon to ensure all devices sync
    try {
      await saveTgeWorkspaceData(TGE_WORKSPACE_ID, []);
      console.log('TGE: Successfully cleared data from Neon database');
      
      // Update last sync time when successfully cleared from database
      if (setLastSyncTime) {
        setLastSyncTime(new Date());
      }
      
    } catch (error) {
      console.error('TGE: Failed to save to Neon:', error);
      
    }
  }, [setRows, setLastSyncTime]);

  // Handle add row submit
  const handleAddRowSubmit = useCallback((form) => {
    const errors = {};
    
    // Validate required fields
    if (!form.apiId || form.apiId.trim() === '') {
      errors.apiId = 'API ID is required';
    }
    
    // If there are errors, return them
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }
    
    // Combine date and time into launchAt
    let launchAt = '';
    
    if (form.launchDate && form.launchTime) {
      // Both date and time provided
      const date = new Date(form.launchDate + 'T' + form.launchTime);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      launchAt = `${day}/${month}/${year} ${hours}:${minutes}`;
    } else if (form.launchDate && !form.launchTime) {
      // Only date provided, set time to 00:00
      const date = new Date(form.launchDate + 'T00:00');
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      launchAt = `${day}/${month}/${year} 00:00`;
    } else if (form.launchAt) {
      launchAt = normalizeDateTime(form.launchAt);
    }
    
    // Create new row data (excluding price - will be fetched from API)
    const newRowData = {
      name: form.name || '',
      launchAt: launchAt,
      apiId: form.apiId.trim(),
      point: form.point || '',
      type: form.type || 'TGE',
      ath: form.ath || 0,
      logo: form.logo || '',
      symbol: form.symbol || ''
    };
    
    // Add the row
    addRow(newRowData);
    
    
    return { success: true };
  }, [addRow]);

  return {
    addRow,
    updateRow,
    updateRowForAPI,
    removeRow,
    addMultipleRows,
    replaceRows,
    clearAllData,
    handleAddRowSubmit
  };
};
