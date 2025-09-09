import { useState } from 'react';
import { normalizeDateTime } from '../utils';

export function useTableEditing() {
  const [rowDrafts, setRowDrafts] = useState({});
  const [editingModal, setEditingModal] = useState({ open: false, idx: -1 });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    idx: -1,
    token: '',
    input: '',
    error: '',
  });

  const getActualIndex = (sortedIndex, sortedRows, rows) => {
    const rowRef = sortedRows[sortedIndex];
    return rows.findIndex((r) => r === rowRef);
  };

  const getDraftField = (sortedIndex, field, sortedRows, rows) => {
    const actual = getActualIndex(sortedIndex, sortedRows, rows);
    const draft = rowDrafts[actual];
    return draft ? draft[field] : undefined;
  };

  const isEditing = (sortedIndex, sortedRows, rows) => {
    const actual = getActualIndex(sortedIndex, sortedRows, rows);
    return rowDrafts[actual] !== undefined;
  };

  const startEditRow = (sortedIndex, sortedRows, rows) => {
    const actual = getActualIndex(sortedIndex, sortedRows, rows);
    if (actual === -1) return;
    
    const row = rows[actual];
    let launchDate = '';
    let launchTime = '';
    
    // Parse launchAt to extract date and time for date/time pickers
    if (row.launchAt) {
      const launchAtStr = String(row.launchAt).trim();
  
      
      // Handle DD/MM/YYYY HH:mm:ss format (legacy) and DD/MM/YYYY HH:mm format (new)
      if (/^\d{1,2}\/\d{1,2}\/\d{4}(\s+\d{1,2}:\d{1,2}(:\d{1,2})?)?$/.test(launchAtStr)) {
        const parts = launchAtStr.split(' ');
        const datePart = parts[0]; // DD/MM/YYYY
        const timePart = parts[1] || ''; // HH:mm:ss or HH:mm or empty
        

        
        // Convert DD/MM/YYYY to YYYY-MM-DD for date picker
        if (datePart) {
          const [day, month, year] = datePart.split('/');
          launchDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        }
        
        // Extract time for time picker (HH:mm format) - strip seconds if present
        if (timePart) {
          // Handle both HH:mm:ss and HH:mm formats
          const timeMatch = timePart.match(/^(\d{1,2}):(\d{1,2})(:\d{1,2})?$/);
          if (timeMatch) {
            const hours = timeMatch[1].padStart(2, '0');
            const minutes = timeMatch[2].padStart(2, '0');
            launchTime = `${hours}:${minutes}`;
  
          }
        }
      } else {

      }
    }
    
    
    setRowDrafts((prev) => ({ 
      ...prev, 
      [actual]: { 
        ...row,
        launchDate,
        launchTime
      } 
    }));
    setEditingModal({ open: true, idx: actual });
  };

  const saveRow = (sortedIndex, rows, onUpdateRow) => {
    let actual = sortedIndex;
    if (actual === -1) return;
    const draft = rowDrafts[actual];
    if (!draft) return;
    
    // Create launchAt from date and time pickers
    let normalizedLaunch = '';
    if (draft.launchDate) {
      // Convert YYYY-MM-DD to DD/MM/YYYY
      const [year, month, day] = draft.launchDate.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      
      // Add time if available
      if (draft.launchTime) {
        normalizedLaunch = `${formattedDate} ${draft.launchTime}`;
      } else {
        normalizedLaunch = `${formattedDate} 00:00`;
      }
    } else if (draft.launchAt) {
      // Fallback to existing launchAt if no date picker
      normalizedLaunch = normalizeDateTime(draft.launchAt) || draft.launchAt;
      if (normalizedLaunch && /^\d{2}\/\d{2}\/\d{4}$/.test(normalizedLaunch)) {
        normalizedLaunch = normalizedLaunch + ' 00:00';
      }
    }
    
    const toSave = { ...draft, launchAt: normalizedLaunch, _forceTop: false };
    onUpdateRow(actual, toSave);
    setRowDrafts((prev) => {
      const next = { ...prev };
      delete next[actual];
      return next;
    });
    setEditingModal((m) =>
      m && m.idx === actual ? { open: false, idx: -1 } : m,
    );
  };

  const handleDeleteRow = (rowIndex, sortedRows, rows) => {
    const rowToDelete = sortedRows[rowIndex];
    const actualIndex = rows.findIndex((r) => r === rowToDelete);
    if (actualIndex === -1) return;
    const tokenName = String(rows[actualIndex].name || '').trim();
    setDeleteModal({
      open: true,
      idx: actualIndex,
      token: tokenName,
      input: '',
      error: '',
    });
  };

  const confirmDelete = (onRemoveRow) => {
    const actual = deleteModal.idx;
    if (actual === -1) return;
    onRemoveRow(actual);
    setDeleteModal({ open: false, idx: -1, token: '', input: '', error: '' });
  };

  return {
    rowDrafts,
    setRowDrafts,
    editingModal,
    setEditingModal,
    deleteModal,
    setDeleteModal,
    isEditing,
    startEditRow,
    saveRow,
    handleDeleteRow,
    confirmDelete,
    getActualIndex,
    getDraftField
  };
}

// TGE-specific table editing hook
export function useTgeTableEditing() {
  const [rowDrafts, setRowDrafts] = useState({});
  const [editingModal, setEditingModal] = useState({ open: false, idx: -1 });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    idx: -1,
    token: '',
    input: '',
    error: '',
  });

  const getActualIndex = (sortedIndex, sortedRows, rows) => {
    const rowRef = sortedRows[sortedIndex];
    return rows.findIndex((r) => r === rowRef);
  };

  const getDraftField = (sortedIndex, field, sortedRows, rows) => {
    const actual = getActualIndex(sortedIndex, sortedRows, rows);
    const draft = rowDrafts[actual];
    return draft ? draft[field] : undefined;
  };

  const isEditing = (sortedIndex, sortedRows, rows) => {
    const actual = getActualIndex(sortedIndex, sortedRows, rows);
    return rowDrafts[actual] !== undefined;
  };

  const startEditRow = (sortedIndex, sortedRows, rows) => {
    const actual = getActualIndex(sortedIndex, sortedRows, rows);
    if (actual === -1) return;
    
    const row = rows[actual];
    let launchDate = '';
    let launchTime = '';
    
    // Parse launchAt to extract date and time for date/time pickers
    if (row.launchAt) {
      const launchAtStr = String(row.launchAt).trim();
      
      // Handle DD/MM/YYYY HH:mm:ss format (legacy) and DD/MM/YYYY HH:mm format (new)
      if (/^\d{1,2}\/\d{1,2}\/\d{4}(\s+\d{1,2}:\d{1,2}(:\d{1,2})?)?$/.test(launchAtStr)) {
        const parts = launchAtStr.split(' ');
        const datePart = parts[0]; // DD/MM/YYYY
        const timePart = parts[1] || ''; // HH:mm:ss or HH:mm or empty
        
        // Convert DD/MM/YYYY to YYYY-MM-DD for date picker
        if (datePart) {
          const [day, month, year] = datePart.split('/');
          launchDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Extract time for time picker (HH:mm format) - strip seconds if present
        if (timePart) {
          // Handle both HH:mm:ss and HH:mm formats
          const timeMatch = timePart.match(/^(\d{1,2}):(\d{1,2})(:\d{1,2})?$/);
          if (timeMatch) {
            const hours = timeMatch[1].padStart(2, '0');
            const minutes = timeMatch[2].padStart(2, '0');
            launchTime = `${hours}:${minutes}`;
          }
        }
      }
    }
    
    setRowDrafts((prev) => ({ 
      ...prev, 
      [actual]: { 
        ...row,
        launchDate,
        launchTime
      } 
    }));
    setEditingModal({ open: true, idx: actual });
  };

  const saveRow = (sortedIndex, rows, onUpdateRow) => {
    let actual = sortedIndex;
    if (actual === -1) return;
    const draft = rowDrafts[actual];
    if (!draft) return;
    
    // Create launchAt from date and time pickers
    let normalizedLaunch = '';
    if (draft.launchDate) {
      // Convert YYYY-MM-DD to DD/MM/YYYY
      const [year, month, day] = draft.launchDate.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      
      // Add time if available
      if (draft.launchTime) {
        normalizedLaunch = `${formattedDate} ${draft.launchTime}`;
      } else {
        normalizedLaunch = `${formattedDate} 00:00`;
      }
    } else if (draft.launchAt) {
      // Fallback to existing launchAt if no date picker
      normalizedLaunch = normalizeDateTime(draft.launchAt) || draft.launchAt;
      if (normalizedLaunch && /^\d{2}\/\d{2}\/\d{4}$/.test(normalizedLaunch)) {
        normalizedLaunch = normalizedLaunch + ' 00:00';
      }
    }
    
    // Create clean TGE object with only TGE-specific fields (excluding price)
    const toSave = {
      name: draft.name || '',
      launchAt: normalizedLaunch,
      apiId: draft.apiId || '',
      point: draft.point || '',
      type: draft.type || 'TGE',
      ath: draft.ath || '',
      logo: draft.logo || '',
      symbol: draft.symbol || '',
      exchanges: draft.exchanges || [], // ⭐ (thêm mới)
      chains: draft.chains || [], // ⭐ (thêm mới)
      categories: draft.categories || [], // ⭐ (thêm mới)
      _forceTop: false
    };
    onUpdateRow(actual, toSave);
    setRowDrafts((prev) => {
      const next = { ...prev };
      delete next[actual];
      return next;
    });
    setEditingModal((m) =>
      m && m.idx === actual ? { open: false, idx: -1 } : m,
    );
  };

  const handleDeleteRow = (rowIndex, sortedRows, rows) => {
    const rowToDelete = sortedRows[rowIndex];
    const actualIndex = rows.findIndex((r) => r === rowToDelete);
    if (actualIndex === -1) return;
    const tokenName = String(rows[actualIndex].name || '').trim();
    setDeleteModal({
      open: true,
      idx: actualIndex,
      token: tokenName,
      input: '',
      error: '',
    });
  };

  const confirmDelete = (onRemoveRow) => {
    const actual = deleteModal.idx;
    if (actual === -1) return;
    onRemoveRow(actual);
    setDeleteModal({ open: false, idx: -1, token: '', input: '', error: '' });
  };

  return {
    rowDrafts,
    setRowDrafts,
    editingModal,
    setEditingModal,
    deleteModal,
    setDeleteModal,
    isEditing,
    startEditRow,
    saveRow,
    handleDeleteRow,
    confirmDelete,
    getActualIndex,
    getDraftField
  };
}
