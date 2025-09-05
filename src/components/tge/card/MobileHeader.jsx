import React, { useState } from 'react';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SortIcon from '@mui/icons-material/Sort';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const MobileHeader = ({
  onRefresh,
  loading,
  showSortMenu,
  setShowSortMenu,
  sortConfig,
  handleSortChange,
  sortButtonRef
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    // Ensure animation completes full rotation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={handleRefresh}
          className='px-3 py-2 rounded-2xl bg-black dark:bg-white dark:text-black text-white shadow hover:opacity-90 text-sm transition-all duration-300 ease-in-out hover:scale-105 flex-shrink-0 sm:flex-shrink flex items-center gap-2'
          title='Refresh prices'
        >
          <AutorenewIcon 
            sx={{ 
              fontSize:16,
              animation: (loading || isRefreshing) ? 'spin 1s linear infinite' : 'none'
            }}
            className={(loading || isRefreshing) ? 'refresh-spin' : ''}
          />
          Refresh
        </button>
        <div className="flex items-center gap-2">
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
                {sortConfig?.key === 'point' && 'Point'}
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
                      { key: 'launchAt', label: 'Subscription Time' },
                      { key: 'price', label: 'Price' },
                      { key: 'point', label: 'Point' },
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
                        onClick={() => handleSortChange(sortConfig?.key, 'asc')}
                        className={`flex-1 px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          sortConfig?.direction === 'asc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Asc
                      </button>
                      <button
                        onClick={() => handleSortChange(sortConfig?.key, 'desc')}
                        className={`flex-1 px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          sortConfig?.direction === 'desc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Desc
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
  );
};

export default MobileHeader;
