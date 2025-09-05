import React, { useState, useEffect, useRef } from 'react';
import MobileHeader from './card/MobileHeader';
import TokenCard from './card/TokenCard';
import MobilePagination from './card/MobilePagination';

export default function CardView({
  rows,
  onEditRow,
  onDeleteRow,
  onRefreshToken,
  searchToken,
  tokenLogos,
  highlightRowRef,
  onRefresh,
  loading,
  sortConfig,
  requestSort,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [editButtonPosition, setEditButtonPosition] = useState({ top: 0, left: 0 });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const editButtonRefs = useRef({});
  const deleteButtonRefs = useRef({});
  const sortButtonRef = useRef(null);
  const itemsPerPage = 6;
  
  // Handle sort change
  const handleSortChange = (sortKey) => {
    if (sortKey && requestSort) {
      // Keep current direction if same key, otherwise use desc as default
      const newDirection = (sortConfig?.key === sortKey) ? sortConfig.direction : 'desc';
      requestSort(sortKey, newDirection);
    }
    // Don't close menu - let user continue selecting
  };

  // Handle direction change
  const handleDirectionChange = (direction) => {
    if (sortConfig?.key && requestSort) {
      requestSort(sortConfig.key, direction);
    }
    // Don't close menu - let user continue selecting
  };

  // Toggle sort direction
  const toggleSortDirection = () => {
    if (sortConfig?.key && requestSort) {
      const newDirection = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      requestSort(sortConfig.key, newDirection);
    }
  };
  
  const filteredRows = rows.filter((row) => row && row !== null && (row.symbol || row.name || row.apiId).toLowerCase().includes(searchToken.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search token changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchToken]);

  return (
    <div>
                           {/* Mobile Header with Sort Options */}
      <MobileHeader
        onRefresh={onRefresh}
        loading={loading}
        showSortMenu={showSortMenu}
        setShowSortMenu={setShowSortMenu}
        sortConfig={sortConfig}
        handleSortChange={handleSortChange}
        sortButtonRef={sortButtonRef}
      />

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {paginatedRows.map((row, index) => (
          <TokenCard
            key={index}
            row={row}
            index={startIndex + index}
            tokenLogos={tokenLogos}
            showHighestPrice={false} // Removed showHighestPrice prop
            onEditRow={onEditRow}
            onDeleteRow={onDeleteRow}
            onRefreshToken={onRefreshToken}
            editButtonRefs={editButtonRefs}
            deleteButtonRefs={deleteButtonRefs}
            setEditButtonPosition={setEditButtonPosition}
          />
        ))}
          </div>

      {/* Empty States */}
      {paginatedRows.length === 0 && filteredRows.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No tokens on this page.
        </div>
      )}

      {filteredRows.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No tokens found matching "{searchToken}"
        </div>
      )}

      {/* Mobile Pagination */}
      <MobilePagination
        currentPage={currentPage}
        totalPages={totalPages}
        filteredRows={filteredRows}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}
