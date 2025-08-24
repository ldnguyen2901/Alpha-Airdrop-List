import { useState } from 'react';
import { normalizeDateTime } from '../utils/helpers';

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
      console.log('🔍 Parsing launchAt for edit:', launchAtStr);
      
      // Handle DD/MM/YYYY HH:mm format (more flexible)
      if (/^\d{1,2}\/\d{1,2}\/\d{4}(\s+\d{1,2}:\d{1,2})?$/.test(launchAtStr)) {
        const parts = launchAtStr.split(' ');
        const datePart = parts[0]; // DD/MM/YYYY
        const timePart = parts[1] || ''; // HH:mm or empty
        
        console.log('🔍 Date part:', datePart, 'Time part:', timePart);
        
        // Convert DD/MM/YYYY to YYYY-MM-DD for date picker
        if (datePart) {
          const [day, month, year] = datePart.split('/');
          launchDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('🔍 Converted date:', launchDate);
        }
        
        // Extract time for time picker (HH:mm format)
        if (timePart) {
          const timeMatch = timePart.match(/^(\d{2}):(\d{2})$/);
          if (timeMatch) {
            launchTime = `${timeMatch[1]}:${timeMatch[2]}`;
            console.log('🔍 Extracted time:', launchTime);
          }
        }
      } else {
        console.log('🔍 launchAt format not recognized:', launchAtStr);
      }
    }
    
    console.log('🔍 Final draft values:', { launchDate, launchTime, originalLaunchAt: row.launchAt });
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
