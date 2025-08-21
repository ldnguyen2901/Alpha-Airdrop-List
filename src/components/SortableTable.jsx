import { useState, useMemo, useEffect } from 'react';
import { TABLE_HEADERS } from '../utils/constants';
import { getCountdownText } from '../utils/dateTimeUtils';
import { useTableSort } from '../hooks/useTableSort';
import { useTableEditing } from '../hooks/useTableEditing';
import TableHeader from './table/TableHeader';
import TableRow from './table/TableRow';
import EditModal from './modals/EditModal';
import DeleteModal from './modals/DeleteModal';

export default function SortableTable({
  rows,
  onUpdateRow,
  onRemoveRow,
  showHighestPrice: showHighestPriceProp,
  searchToken,
}) {
  const showHighestPrice = !!showHighestPriceProp;
  const [now, setNow] = useState(Date.now());
  
  const { sortConfig, requestSort, getSortIcon, sortRows } = useTableSort();
  const {
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
    confirmDelete
  } = useTableEditing();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const sortedRows = useMemo(() => {
    return sortRows(rows, searchToken);
  }, [rows, sortConfig, searchToken, sortRows]);

  const handleStartEdit = (index) => {
    const actual = getActualIndex(index, sortedRows, rows);
    if (actual === -1) return;
    setRowDrafts((prev) => ({ ...prev, [actual]: { ...rows[actual] } }));
    setEditingModal({ open: true, idx: actual });
  };

  const handleSaveRow = (index) => {
    let actual = getActualIndex(index, sortedRows, rows);
    if (
      actual === -1 &&
      Number.isInteger(index) &&
      index >= 0 &&
      index < rows.length
    ) {
      actual = index;
    }
    if (actual === -1) return;
    const draft = rowDrafts[actual];
    if (!draft) return;
    
    onUpdateRow(actual, draft);
    setRowDrafts((prev) => {
      const next = { ...prev };
      delete next[actual];
      return next;
    });
    setEditingModal((m) =>
      m && m.idx === actual ? { open: false, idx: -1 } : m,
    );
  };

  const handleDelete = (index) => {
    const rowToDelete = sortedRows[index];
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

  const handleConfirmDelete = () => {
    const actual = deleteModal.idx;
    if (actual === -1) return;
    onRemoveRow(actual);
    setDeleteModal({ open: false, idx: -1, token: '', input: '', error: '' });
  };

  const getActualIndex = (sortedIndex, sortedRows, rows) => {
    const rowRef = sortedRows[sortedIndex];
    return rows.findIndex((r) => r === rowRef);
  };

  const getDraftField = (sortedIndex, field) => {
    const actual = getActualIndex(sortedIndex, sortedRows, rows);
    const draft = rowDrafts[actual];
    return draft ? draft[field] : undefined;
  };

  const getCountdownTextForRow = (launchAt) => {
    return getCountdownText(launchAt, now);
  };

  return (
    <div className='overflow-auto rounded-2xl border bg-white dark:bg-gray-800 shadow max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-170px)] lg:max-h-[calc(100vh-200px)]'>
      <table className='w-full text-sm'>
        <TableHeader
          sortConfig={sortConfig}
          requestSort={requestSort}
          getSortIcon={getSortIcon}
          showHighestPrice={showHighestPrice}
        />
        <tbody>
          {sortedRows.map((row, idx) => (
            <TableRow
              key={idx}
              row={row}
              index={idx}
              isEditing={isEditing}
              getDraftField={getDraftField}
              onStartEdit={handleStartEdit}
              onDelete={handleDelete}
              showHighestPrice={showHighestPrice}
              getActualIndex={getActualIndex}
              setRowDrafts={setRowDrafts}
              getCountdownText={getCountdownTextForRow}
              sortedRows={sortedRows}
              rows={rows}
            />
          ))}
          {sortedRows.length === 0 && (
            <tr>
              <td
                colSpan={
                  TABLE_HEADERS.filter((h) => {
                    if (h === 'API ID') return false;
                    if (h === 'Highest Price' && !showHighestPrice)
                      return false;
                    return true;
                  }).length
                }
                className='px-3 py-6 text-center text-gray-500 dark:text-gray-400 text-sm'
              >
                No data. Click Add Row or Paste from Sheet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <EditModal
        editingModal={editingModal}
        rowDrafts={rowDrafts}
        setRowDrafts={setRowDrafts}
        setEditingModal={setEditingModal}
        saveRow={handleSaveRow}
      />

      <DeleteModal
        deleteModal={deleteModal}
        setDeleteModal={setDeleteModal}
        confirmDelete={handleConfirmDelete}
        rowDrafts={rowDrafts}
        rows={rows}
      />
    </div>
  );
}
