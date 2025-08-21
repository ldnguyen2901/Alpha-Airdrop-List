import { useState, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TABLE_HEADERS } from '../utils/constants';
import { getCountdownText } from '../utils/dateTimeUtils';
import { useTableSort } from '../hooks/useTableSort';
import { useTableEditing } from '../hooks/useTableEditing';
import TableHeader from './table/TableHeader';
import TableRow from './table/TableRow';
import EditModal from './modals/EditModal';
import DeleteModal from './modals/DeleteModal';
import Pagination from './Pagination';

const SortableTable = forwardRef(({
  rows,
  onUpdateRow,
  onRemoveRow,
  showHighestPrice: showHighestPriceProp,
  searchToken,
  tokenLogos,
}, ref) => {
  const showHighestPrice = !!showHighestPriceProp;
  const [now, setNow] = useState(Date.now());
  const [highlightedRows, setHighlightedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  
  // Responsive items per page: 15 for mobile, 10 for desktop
  const itemsPerPage = isMobile ? 15 : 10;
  
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

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sortedRows = useMemo(() => {
    return sortRows(rows, searchToken);
  }, [rows, sortConfig, searchToken, sortRows]);

  // Pagination logic
  const totalPages = Math.ceil(sortedRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = sortedRows.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchToken]);

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
    <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg'>
      <div className='table-container overflow-auto max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-220px)] lg:max-h-[calc(100vh-180px)]'>
        <table className='w-full text-sm lg:min-w-0'>
          <TableHeader
            sortConfig={sortConfig}
            requestSort={requestSort}
            getSortIcon={getSortIcon}
            showHighestPrice={showHighestPrice}
          />
        <tbody>
            {currentRows.map((row, idx) => (
              <TableRow
                key={startIndex + idx}
                row={row}
                index={startIndex + idx}
                onStartEdit={handleStartEdit}
                onDelete={handleDelete}
                showHighestPrice={showHighestPrice}
                getCountdownText={getCountdownTextForRow}
                isHighlighted={highlightedRows.has(startIndex + idx)}
                tokenLogos={tokenLogos}
              />
            ))}
            {currentRows.length === 0 && (
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
            </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={sortedRows.length}
        itemsPerPage={itemsPerPage}
      />

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
