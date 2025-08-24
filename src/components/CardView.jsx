import React, { useState, useEffect, useRef } from 'react';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SortIcon from '@mui/icons-material/Sort';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { formatPrice } from '../utils/helpers';
import { formatDateTime } from '../utils/dateTimeUtils';

export default function CardView({
  rows,
  onEditRow,
  onDeleteRow,
  searchToken,
  tokenLogos,
  highlightRowRef,
  showHighestPrice,
  setShowHighestPrice,
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
  
  const filteredRows = rows.filter((row) =>
                (row.symbol || row.name || row.apiId).toLowerCase().includes(searchToken.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search token changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchToken]);

  // Helper function to parse date in DD/MM/YYYY format
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    // Handle DD/MM/YYYY HH:mm:ss format (legacy)
    const match1 = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?$/);
    if (match1) {
      const [, day, month, year, hour = '0', minute = '0', second = '0'] = match1;
      return new Date(year, month - 1, day, hour, minute, second);
    }
    
    // Handle DD/MM/YYYY HH:mm format (new)
    const match2 = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
    if (match2) {
      const [, day, month, year, hour = '0', minute = '0'] = match2;
      return new Date(year, month - 1, day, hour, minute, 0);
    }
    
    // Fallback to standard Date constructor
    return new Date(dateString);
  };

  const getStatusColor = (row) => {
    if (!row.launchAt) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    
    const now = new Date();
    const launchDate = parseDate(row.launchAt);
    
    if (!launchDate || isNaN(launchDate.getTime())) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    
    if (launchDate > now) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Wait for listing
    } else {
      return 'bg-green-100 text-green-800 border-green-200'; // Launched
    }
  };

  const getStatusText = (row) => {
    if (!row.launchAt) return 'No date';
    
    const now = new Date();
    const launchDate = parseDate(row.launchAt);
    
    if (!launchDate || isNaN(launchDate.getTime())) return 'Invalid date';
    
    if (launchDate > now) {
      return 'Wait for listing';
    } else {
      return 'Launched';
    }
  };

  const getCountdown = (row) => {
    if (!row.launchAt) return null;
    
    const now = new Date();
    const launchDate = parseDate(row.launchAt);
    
    if (!launchDate || isNaN(launchDate.getTime())) return null;
    
    if (launchDate > now) {
      const diff = launchDate - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return {
        days,
        hours,
        minutes,
        seconds
      };
    }
    return null;
  };

  return (
    <div>
                           {/* Mobile Header with Sort Options */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onRefresh}
              className='px-3 py-2 rounded-2xl bg-black dark:bg-white dark:text-black text-white shadow hover:opacity-90 text-sm transition-all duration-300 ease-in-out hover:scale-105 flex-shrink-0 sm:flex-shrink flex items-center gap-2'
              title='Refresh prices'
            >
              <AutorenewIcon 
                className={`${loading ? 'animate-spin' : ''}`}
                sx={{ fontSize: 16 }}
              />
              Refresh
            </button>
            <div className="flex items-center gap-2">
              {/* Show Highest Price Toggle for Mobile */}
              <button
                onClick={() => setShowHighestPrice(!showHighestPrice)}
                className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
              >
                <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ease-in-out flex items-center justify-center ${
                  showHighestPrice 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'bg-transparent border-gray-400 dark:border-gray-500'
                }`}>
                  {showHighestPrice && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="text-xs">Highest</span>
              </button>
              <div className="relative">
                <button
                  ref={sortButtonRef}
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md"
                >
                  <SortIcon sx={{ fontSize: 16 }} />
                  <span className="text-xs">
                    {sortConfig?.key === 'name' && 'Name'}
                    {sortConfig?.key === 'amount' && 'Amount'}
                    {sortConfig?.key === 'launchAt' && 'Date'}
                    {sortConfig?.key === 'price' && 'Price'}
                    {sortConfig?.key === 'value' && 'Reward'}
                    {sortConfig?.key === 'highestPrice' && 'High'}
                    {!sortConfig?.key && 'Date'}
                  </span>
                  {sortConfig?.direction === 'asc' ? (
                    <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                  )}
                </button>

                {/* Sort Menu */}
                {showSortMenu && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-[99998]"
                      onClick={() => setShowSortMenu(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-[99999] min-w-[160px]">
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">Sort by:</div>
                        {[
                          { key: 'name', label: 'Name' },
                          { key: 'amount', label: 'Amount' },
                          { key: 'launchAt', label: 'Launch Date' },
                          { key: 'price', label: 'Price' },
                          { key: 'value', label: 'Reward' },
                          { key: 'highestPrice', label: 'Highest Price' }
                        ].map((item) => (
                          <button
                            key={item.key}
                            onClick={() => handleSortChange(item.key)}
                            className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                              sortConfig?.key === item.key ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                        
                        <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
                        
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">Direction:</div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDirectionChange('asc')}
                            className={`flex-1 px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 ${
                              sortConfig?.direction === 'asc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <KeyboardArrowUpIcon sx={{ fontSize: 14 }} />
                            A-Z
                          </button>
                          <button
                            onClick={() => handleDirectionChange('desc')}
                            className={`flex-1 px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 ${
                              sortConfig?.direction === 'desc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />
                            Z-A
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      
              <div className="space-y-4 p-4">
        {paginatedRows.map((row, index) => (
        <div
          key={row.id}
          ref={index === 0 ? highlightRowRef : null}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Header with Amount and Status */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {row.logo ? (
                    <img
                      src={row.logo}
                      alt={row.symbol || row.name || row.apiId}
                      className="w-6 h-6 rounded-full shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : tokenLogos[row.apiId]?.logo ? (
                    <img
                      src={tokenLogos[row.apiId].logo}
                      alt={row.symbol || row.name || row.apiId}
                      className="w-6 h-6 rounded-full shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hidden">
                    {(row.symbol || row.name || row.apiId).charAt(0)}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {row.symbol || row.name || row.apiId}
                  </h3>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${formatPrice(row.price)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm ${getStatusColor(row)}`}>
                  {getStatusText(row)}
                </span>
                {getCountdown(row) && (
                  <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      {getCountdown(row).days > 0 && (
                        <>
                          <span className="font-bold">{getCountdown(row).days}</span>
                          <span className="text-gray-500">d</span>
                        </>
                      )}
                      <span className="font-bold">{getCountdown(row).hours.toString().padStart(2, '0')}</span>
                      <span className="text-gray-500">h</span>
                      <span className="font-bold">{getCountdown(row).minutes.toString().padStart(2, '0')}</span>
                      <span className="text-gray-500">m</span>
                      <span className="font-bold">{getCountdown(row).seconds.toString().padStart(2, '0')}</span>
                      <span className="text-gray-500">s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-4 space-y-3">
            {/* Row 1: Amount | Reward */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {Math.floor(row.amount).toLocaleString()} Token
                </div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Reward:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {row.value && row.value > 0 ? `$${formatPrice(row.value)}` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Divider line */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Row 2: Points Priority | Launch Date */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Points Priority:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {row.pointPriority || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Launch Date:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatDateTime(row.launchAt)}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Points FCFS:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {row.pointFCFS || 'N/A'}
                  </div>
                </div>
                {showHighestPrice && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Highest Price:</span>
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {row.highestPrice && row.highestPrice > 0 ? `$${formatPrice(row.highestPrice)}` : 'N/A'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3">
              <button
                ref={el => editButtonRefs.current[index] = el}
                onClick={(e) => {
                  // Calculate button position for mobile modal
                  let position = null;
                  if (window.innerWidth < 768 && editButtonRefs.current[index]) {
                    const rect = editButtonRefs.current[index].getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    position = {
                      top: rect.bottom + scrollTop + 8,
                      left: Math.max(16, Math.min(rect.left, window.innerWidth - 384 - 16))
                    };
                    setEditButtonPosition(position);
                  }
                  onEditRow(index, position);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl shadow-sm text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md"
              >
                <Edit sx={{ fontSize: 16 }} />
                Edit
              </button>
              <button
                ref={(el) => (deleteButtonRefs.current[index] = el)}
                onClick={() => {
                  const buttonElement = deleteButtonRefs.current[index];
                  if (buttonElement) {
                    const rect = buttonElement.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const position = {
                      top: rect.bottom + scrollTop + 8,
                      left: Math.max(16, Math.min(rect.left, window.innerWidth - 384 - 16))
                    };
                    onDeleteRow(index, position);
                  } else {
                    onDeleteRow(index);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-sm text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md"
              >
                <Delete sx={{ fontSize: 16 }} />
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}

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
      </div>

      {/* Mobile Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages} ({filteredRows.length} tokens)
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
              Prev
            </button>
            
            <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md">
              {currentPage}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
