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
    setRowDrafts((prev) => ({ ...prev, [actual]: { ...rows[actual] } }));
    setEditingModal({ open: true, idx: actual });
  };

  const saveRow = (sortedIndex, rows, onUpdateRow) => {
    let actual = sortedIndex;
    if (actual === -1) return;
    const draft = rowDrafts[actual];
    if (!draft) return;
    
    // normalize launchAt before saving and ensure date-only gets 00:00:00
    let normalizedLaunch = draft.launchAt
      ? normalizeDateTime(draft.launchAt) || draft.launchAt
      : draft.launchAt;
    if (normalizedLaunch && /^\d{2}\/\d{2}\/\d{4}$/.test(normalizedLaunch)) {
      normalizedLaunch = normalizedLaunch + ' 00:00:00';
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
