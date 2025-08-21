import { useState, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TABLE_HEADERS } from '../utils/constants';
import { getCountdownText } from '../utils/dateTimeUtils';
import { useTableSort } from '../hooks/useTableSort';
import { useTableEditing } from '../hooks/useTableEditing';
import TableHeader from './table/TableHeader';
import TableRow from './table/TableRow';
import EditModal from './modals/EditModal';
import DeleteModal from './modals/DeleteModal';

const SortableTable = forwardRef(({
  rows,
  onUpdateRow,
  onRemoveRow,
  showHighestPrice: showHighestPriceProp,
  searchToken,
}, ref) => {
  const showHighestPrice = !!showHighestPriceProp;
  const [now, setNow] = useState(Date.now());
  const [highlightedRows, setHighlightedRows] = useState(new Set());
  
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
    confirmDelete,
    getActualIndex,
    getDraftField
  } = useTableEditing();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const sortedRows = useMemo(() => {
    return sortRows(rows, searchToken);
  }, [rows, sortConfig, searchToken, sortRows]);

  const handleStartEdit = (index) => {
    startEditRow(index, sortedRows, rows);
  };

  const handleSaveRow = (index) => {
    saveRow(index, rows, onUpdateRow);
  };

  const handleDelete = (index) => {
    handleDeleteRow(index, sortedRows, rows);
  };

  const handleConfirmDelete = () => {
    confirmDelete(onRemoveRow);
  };

  const getCountdownTextForRow = (launchAt) => {
    return getCountdownText(launchAt, now);
  };

  // Function to highlight a row after successful action
  const highlightRow = (rowIndex) => {
    setHighlightedRows(prev => new Set([...prev, rowIndex]));
    setTimeout(() => {
      setHighlightedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(rowIndex);
        return newSet;
      });
    }, 2000);
  };

  // Expose highlightRow function to parent component
  useImperativeHandle(ref, () => ({
    highlightRow
  }));

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
                isEditing={(index) => isEditing(index, sortedRows, rows)}
                getDraftField={(index, field) => getDraftField(index, field, sortedRows, rows)}
                onStartEdit={handleStartEdit}
                onDelete={handleDelete}
                showHighestPrice={showHighestPrice}
                getActualIndex={getActualIndex}
                setRowDrafts={setRowDrafts}
                getCountdownText={getCountdownTextForRow}
                sortedRows={sortedRows}
                rows={rows}
                isHighlighted={highlightedRows.has(idx)}
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
});

export default SortableTable;
