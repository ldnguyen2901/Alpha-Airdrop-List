import { useCallback } from 'react';
import { newRow, saveDataToStorage, normalizeDateTime } from '../utils';
import { saveWorkspaceData, SHARED_WORKSPACE_ID } from '../services/firebase';

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
    const newRowData = rowData ? cleanRowData(rowData) : newRow({
      ath: 0, // Initialize ATH
    });
    
    setRows(prevRows => {
      const updatedRows = [...prevRows, newRowData];
      saveDataToStorage(updatedRows);
      
      // Always save to shared workspace
      try {
        saveWorkspaceData(SHARED_WORKSPACE_ID, updatedRows);
      } catch (error) {
        console.error('Failed to save to Firebase:', error);
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
          console.error('Failed to save to Firebase:', error);
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
        console.error('Failed to save to Firebase:', error);
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
      console.error('Failed to save to Firebase:', error);
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
        console.error('Failed to save to Firebase:', error);
      }
      return updatedRows;
    });
  }, [setRows]);

  // Validate add form - require API ID and Date
  const validateAddForm = useCallback((form) => {
    const errors = {};
    
    // Required: API ID
    if (!form.apiId.trim()) {
      errors.apiId = 'API ID is required';
    }
    // Required: Launch Date
    if (!String(form.launchDate || '').trim()) {
      errors.launchDate = 'Launch date is required';
    }
    
    return errors;
  }, []);

  // Handle add row submit
  const handleAddRowSubmit = useCallback((form) => {
    const errors = validateAddForm(form);
    
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }
    
    // Create new row data
    const launchAt = normalizeDateTime(form.launchDate, form.launchTime) || '';
    const newRowData = newRow({
      name: form.name.trim(),
      amount: parseFloat(form.amount) || 0,
      launchAt,
      apiId: form.apiId.trim(),
      pointPriority: form.pointPriority.trim() || '',
      pointFCFS: form.pointFCFS.trim() || '',
      contractAddress: form.contractAddress || '',
      ath: 0, // Initialize ATH
    });
    
    // Add the row
    addRow(newRowData);
    
    return { success: true };
  }, [validateAddForm, addRow]);

  return {
    addRow,
    updateRow,
    removeRow,
    replaceRows,
    addMultipleRows,
    validateAddForm,
    handleAddRowSubmit,
  };
};
