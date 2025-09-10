import { useCallback } from 'react';
import { newRow, saveDataToStorage, normalizeDateTime, clearAllPriceHistory, filterMainTokensFromRows, isMainToken, removePriceAndRewardFromRows, updateRewardInRow } from '../utils';
import { saveWorkspaceData, SHARED_WORKSPACE_ID } from '../services/neon';

export const useDataOperations = (
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
    const newRowData = rowData ? cleanRowData(rowData) : newRow();
    setRows(prevRows => {
      const updatedRows = [...prevRows, newRowData];
      
      // CHỈ save localStorage khi KHÔNG phải remote update
      if (!isRemoteUpdateRef.current) {
        saveDataToStorage(updatedRows);
      }
      
      // Always save to shared workspace - exclude main tokens and price/reward fields
      try {
        const filteredRows = filterMainTokensFromRows(updatedRows);
        const rowsWithoutPriceAndReward = removePriceAndRewardFromRows(filteredRows);
        saveWorkspaceData(SHARED_WORKSPACE_ID, rowsWithoutPriceAndReward);
        
        // Update last sync time when successfully saved to database
        if (setLastSyncTime) {
          setLastSyncTime(new Date());
        }
      } catch (error) {
        console.error('Failed to save to Neon:', error);
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
      
      // Auto-calculate reward if amount or price changed
      updatedRows[index] = updateRewardInRow(updatedRows[index]);
      
      // Don't save to database for API updates (price will be excluded anyway)
      // Only save to localStorage for persistence
      saveDataToStorage(updatedRows);
      
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
      
      // Auto-calculate reward if amount or price changed
      updatedRows[index] = updateRewardInRow(updatedRows[index]);
      
      // CHỈ save localStorage khi KHÔNG phải remote update
      if (!isRemoteUpdateRef.current) {
        saveDataToStorage(updatedRows);
      }
      
      // Always save to shared workspace if not a remote update - exclude main tokens and price/reward fields
      if (!isRemoteUpdateRef.current) {
        try {
          const filteredRows = filterMainTokensFromRows(updatedRows);
          const rowsWithoutPriceAndReward = removePriceAndRewardFromRows(filteredRows);
          saveWorkspaceData(SHARED_WORKSPACE_ID, rowsWithoutPriceAndReward);
          console.log('✅ Successfully saved row update to Neon');
          
          // Update last sync time when successfully saved to database
          if (setLastSyncTime) {
            setLastSyncTime(new Date());
          }
        } catch (error) {
          console.error('Failed to save to Neon:', error);
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
        saveDataToStorage(updatedRows);
      }
      
      // Always save to shared workspace - exclude main tokens and price/reward fields
      try {
        const filteredRows = filterMainTokensFromRows(updatedRows);
        const rowsWithoutPriceAndReward = removePriceAndRewardFromRows(filteredRows);
        saveWorkspaceData(SHARED_WORKSPACE_ID, rowsWithoutPriceAndReward);
        
        // Update last sync time when successfully saved to database
        if (setLastSyncTime) {
          setLastSyncTime(new Date());
        }
      } catch (error) {
        console.error('Failed to save to Neon:', error);
      }
      return updatedRows;
    });
  }, [setRows, isRemoteUpdateRef, setLastSyncTime]);

  // Replace all rows
  const replaceRows = useCallback((newRows) => {
    setRows(newRows);
    
    // CHỈ save localStorage khi KHÔNG phải remote update
    if (!isRemoteUpdateRef.current) {
      saveDataToStorage(newRows);
    }
    
    // Always save to shared workspace - exclude main tokens and price/reward fields
    try {
      const filteredRows = filterMainTokensFromRows(newRows);
      const rowsWithoutPriceAndReward = removePriceAndRewardFromRows(filteredRows);
      saveWorkspaceData(SHARED_WORKSPACE_ID, rowsWithoutPriceAndReward);
      
      // Update last sync time when successfully saved to database
      if (setLastSyncTime) {
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error('Failed to save to Neon:', error);
    }
  }, [setRows, isRemoteUpdateRef, setLastSyncTime]);

  // Add multiple rows
  const addMultipleRows = useCallback((newRowsData) => {
    setRows(prevRows => {
      const updatedRows = [...prevRows, ...newRowsData];
      
      // CHỈ save localStorage khi KHÔNG phải remote update
      if (!isRemoteUpdateRef.current) {
        saveDataToStorage(updatedRows);
      }
      
      // Always save to shared workspace - exclude main tokens and price/reward fields
      try {
        const filteredRows = filterMainTokensFromRows(updatedRows);
        const rowsWithoutPriceAndReward = removePriceAndRewardFromRows(filteredRows);
        saveWorkspaceData(SHARED_WORKSPACE_ID, rowsWithoutPriceAndReward);
        
        // Update last sync time when successfully saved to database
        if (setLastSyncTime) {
          setLastSyncTime(new Date());
        }
      } catch (error) {
        console.error('Failed to save to Neon:', error);
      }
      return updatedRows;
    });
  }, [setRows, isRemoteUpdateRef, setLastSyncTime]);

  // Validate add form - only API ID is required
  const validateAddForm = useCallback((form) => {
  
    const errors = {};
    
    // Only API ID is required
    if (!form.apiId.trim()) {
      errors.apiId = 'API ID is required';
    }
    
    // Prevent adding main tokens (BTC, ETH, BNB)
    if (isMainToken(form.apiId.trim())) {
      errors.apiId = 'Cannot add main tokens (BTC, ETH, BNB) to the table. They are managed separately in statscard.';
    }

    return errors;
  }, []);

  // Clear all data
  const clearAllData = useCallback(async () => {
    // Clear local state first
    setRows([]);
    
    // Clear localStorage completely
    localStorage.removeItem('airdrop-alpha-data');
    
    // Clear all price history data
    clearAllPriceHistory();
    
    // Save empty array to Neon to ensure all devices sync
    try {
      await saveWorkspaceData(SHARED_WORKSPACE_ID, []);
      console.log('Successfully cleared data from Neon database');
      
      // Update last sync time when successfully cleared from database
      if (setLastSyncTime) {
        setLastSyncTime(new Date());
      }
      
    } catch (error) {
      console.error('Failed to save to Neon:', error);
      
    }
  }, [setRows, setLastSyncTime]);

  // Handle add row submit
  const handleAddRowSubmit = useCallback((form) => {
  
    const errors = validateAddForm(form);

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

    // Debug: Log original API ID before processing
    console.log('🔍 DEBUG useDataOperations - Original API ID from form:', form.apiId);
    console.log('🔍 DEBUG useDataOperations - API ID after trim:', form.apiId.trim());
    
    const newRowData = newRow({
      name: form.name.trim() || form.apiId.trim(), // Use API ID as name if name is empty
      amount: parseFloat(form.amount) || 0, // Default to 0 if amount is empty
      launchAt,
      apiId: form.apiId.trim().toLowerCase(), // Convert to lowercase
      pointPriority: form.pointPriority.trim() || '',
      pointFCFS: form.pointFCFS.trim() || '',
    });
    
    // Debug: Log final API ID in newRowData
    console.log('🔍 DEBUG useDataOperations - Final API ID in newRowData:', newRowData.apiId);

    // Clean the row data before adding
    const cleanedRowData = cleanRowData(newRowData);


    addRow(cleanedRowData);

    return { success: true };
  }, [validateAddForm, addRow, cleanRowData]);

  return {
    addRow,
    updateRow,
    updateRowForAPI,
    removeRow,
    replaceRows,
    addMultipleRows,
    validateAddForm,
    handleAddRowSubmit,
    clearAllData,
  };
};
