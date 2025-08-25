import { useCallback } from 'react';
import { newRow, saveDataToStorage, normalizeDateTime } from '../utils';
import { saveWorkspaceData } from '../services/firebase';

export const useDataOperations = (rows, setRows, workspaceId, isRemoteUpdateRef) => {
  // Add new row
  const addRow = useCallback((rowData = null) => {
    const newRowData = rowData || newRow();
    setRows(prevRows => {
      const updatedRows = [...prevRows, newRowData];
      saveDataToStorage(updatedRows);
      if (workspaceId) {
        saveWorkspaceData(workspaceId, updatedRows);
      }
      return updatedRows;
    });
  }, [setRows, workspaceId]);

  // Update specific row
  const updateRow = useCallback((index, updates) => {
    setRows(prevRows => {
      const updatedRows = [...prevRows];
      updatedRows[index] = { ...updatedRows[index], ...updates };
      saveDataToStorage(updatedRows);
      if (workspaceId && !isRemoteUpdateRef.current) {
        saveWorkspaceData(workspaceId, updatedRows);
      }
      return updatedRows;
    });
  }, [setRows, workspaceId, isRemoteUpdateRef]);

  // Remove row
  const removeRow = useCallback((index) => {
    setRows(prevRows => {
      const updatedRows = prevRows.filter((_, i) => i !== index);
      saveDataToStorage(updatedRows);
      if (workspaceId) {
        saveWorkspaceData(workspaceId, updatedRows);
      }
      return updatedRows;
    });
  }, [setRows, workspaceId]);

  // Replace all rows
  const replaceRows = useCallback((newRows) => {
    setRows(newRows);
    saveDataToStorage(newRows);
    if (workspaceId) {
      saveWorkspaceData(workspaceId, newRows);
    }
  }, [setRows, workspaceId]);

  // Add multiple rows
  const addMultipleRows = useCallback((newRowsData) => {
    setRows(prevRows => {
      const updatedRows = [...prevRows, ...newRowsData];
      saveDataToStorage(updatedRows);
      if (workspaceId) {
        saveWorkspaceData(workspaceId, updatedRows);
      }
      return updatedRows;
    });
  }, [setRows, workspaceId]);

  // Validate add form - only API ID is required
  const validateAddForm = useCallback((form) => {
    console.log('🔍 validateAddForm called with:', form);
    const errors = {};
    
    // Only API ID is required
    if (!form.apiId.trim()) {
      errors.apiId = 'API ID is required';
    }
    
    console.log('🔍 Validation result:', errors);
    return errors;
  }, []);

  // Handle add row submit
  const handleAddRowSubmit = useCallback((form) => {
    console.log('🔍 handleAddRowSubmit called with form:', form);
    const errors = validateAddForm(form);
    console.log('🔍 Validation errors:', errors);
    if (Object.keys(errors).length > 0) {
      console.log('❌ Form validation failed');
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

    console.log('✅ Creating new row:', newRowData);
    addRow(newRowData);
    console.log('✅ Row added successfully');
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
