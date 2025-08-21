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

  const isEditing = (sortedIndex) => {
    const actual = getActualIndex(sortedIndex);
    return rowDrafts[actual] !== undefined;
  };

  const startEditRow = (sortedIndex) => {
    const actual = getActualIndex(sortedIndex);
    if (actual === -1) return;
    setRowDrafts((prev) => ({ ...prev, [actual]: { ...rows[actual] } }));
    setEditingModal({ open: true, idx: actual });
  };

  const saveRow = (sortedIndex, rows, onUpdateRow) => {
    let actual = getActualIndex(sortedIndex);
    if (
      actual === -1 &&
      Number.isInteger(sortedIndex) &&
      sortedIndex >= 0 &&
      sortedIndex < rows.length
    ) {
      actual = sortedIndex;
    }
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

  const handleDeleteRow = (rowIndex, sortedRows, rows, onRemoveRow) => {
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

  const getActualIndex = (sortedIndex) => {
    const rowRef = sortedRows[sortedIndex];
    return rows.findIndex((r) => r === rowRef);
  };

  const getDraftField = (sortedIndex, field) => {
    const actual = getActualIndex(sortedIndex);
    const draft = rowDrafts[actual];
    return draft ? draft[field] : undefined;
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
