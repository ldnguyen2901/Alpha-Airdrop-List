import { useCallback } from 'react';
import { newRow, saveDataToStorage, normalizeDateTime, clearAllPriceHistory } from '../utils';
import { saveWorkspaceData, SHARED_WORKSPACE_ID } from '../services';

export const useDataOperations = (rows, setRows, workspaceId, isRemoteUpdateRef, addNotification) => {
  // Helper function to clean row data
  const cleanRowData = useCallback((row) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(row)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }, []);

  // Add new row
  const addRow = useCallback((rowData = null) => {
    const newRowData = rowData ? cleanRowData(rowData) : newRow();
    setRows(prevRows => {
      const updatedRows = [...prevRows, newRowData];
      saveDataToStorage(updatedRows);
      
      // Always save to shared workspace
      try {
        saveWorkspaceData(SHARED_WORKSPACE_ID, updatedRows);
      } catch (error) {
        console.error('Failed to save to Neon:', error);
      }
      return updatedRows;
    });
  }, [setRows, cleanRowData]);

  // Update specific row
  const updateRow = useCallback((index, updates) => {
    setRows(prevRows => {
      const updatedRows = [...prevRows];
      const cleanedUpdates = cleanRowData(updates);
      updatedRows[index] = { ...updatedRows[index], ...cleanedUpdates };
      saveDataToStorage(updatedRows);
      
      // Always save to shared workspace if not a remote update
      if (!isRemoteUpdateRef.current) {
        try {
          saveWorkspaceData(SHARED_WORKSPACE_ID, updatedRows);
        } catch (error) {
          console.error('Failed to save to Neon:', error);
        }
      }
      return updatedRows;
    });
  }, [setRows, isRemoteUpdateRef, cleanRowData]);

  // Remove row
  const removeRow = useCallback((index) => {
    setRows(prevRows => {
      const updatedRows = prevRows.filter((_, i) => i !== index);
      saveDataToStorage(updatedRows);
      
      // Always save to shared workspace
      try {
        saveWorkspaceData(SHARED_WORKSPACE_ID, updatedRows);
      } catch (error) {
        console.error('Failed to save to Neon:', error);
      }
      return updatedRows;
    });
  }, [setRows]);

  // Replace all rows
  const replaceRows = useCallback((newRows) => {
    setRows(newRows);
    saveDataToStorage(newRows);
    
    // Always save to shared workspace
    try {
      saveWorkspaceData(SHARED_WORKSPACE_ID, newRows);
    } catch (error) {
      console.error('Failed to save to Neon:', error);
    }
  }, [setRows]);

  // Add multiple rows
  const addMultipleRows = useCallback((newRowsData) => {
    setRows(prevRows => {
      const updatedRows = [...prevRows, ...newRowsData];
      saveDataToStorage(updatedRows);
      
      // Always save to shared workspace
      try {
        saveWorkspaceData(SHARED_WORKSPACE_ID, updatedRows);
      } catch (error) {
        console.error('Failed to save to Neon:', error);
      }
      return updatedRows;
    });
  }, [setRows]);

  // Validate add form - only API ID is required
  const validateAddForm = useCallback((form) => {
  
    const errors = {};
    
    // Only API ID is required
    if (!form.apiId.trim()) {
      errors.apiId = 'API ID is required';
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
      
      if (addNotification) {
        addNotification('All data cleared successfully from Neon database!', 'success');
      }
    } catch (error) {
      console.error('Failed to save to Neon:', error);
      
      if (addNotification) {
        addNotification('Failed to clear data from Neon database. Local data cleared only.', 'error');
      }
    }
  }, [setRows, addNotification]);

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

    const newRowData = newRow({
      name: form.name.trim() || form.apiId.trim(), // Use API ID as name if name is empty
      amount: parseFloat(form.amount) || 0, // Default to 0 if amount is empty
      launchAt,
      apiId: form.apiId.trim(),
      pointPriority: form.pointPriority.trim() || '',
      pointFCFS: form.pointFCFS.trim() || '',
    });

    // Clean the row data before adding
    const cleanedRowData = cleanRowData(newRowData);


    addRow(cleanedRowData);

    if (addNotification) {
      addNotification('Token added successfully!', 'success');
    }
    return { success: true };
  }, [validateAddForm, addRow, addNotification, cleanRowData]);

  return {
    addRow,
    updateRow,
    removeRow,
    replaceRows,
    addMultipleRows,
    validateAddForm,
    handleAddRowSubmit,
    clearAllData,
  };
};
