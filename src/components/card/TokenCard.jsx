import React, { useState, useEffect } from 'react';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { formatPrice, formatDateTime, getCountdownText } from '../../utils';

const TokenCard = ({
  row,
  index,
  tokenLogos,
  showHighestPrice,
  onEditRow,
  onDeleteRow,
  editButtonRefs,
  deleteButtonRefs,
  setEditButtonPosition
}) => {
  const [previousPrice, setPreviousPrice] = useState(row.price || 0);
  const [priceChangeColor, setPriceChangeColor] = useState('');

  // Track price changes and set color
  useEffect(() => {
    if (row.price && row.price !== previousPrice) {
      if (row.price > previousPrice) {
        setPriceChangeColor('text-green-600 dark:text-green-400');
      } else if (row.price < previousPrice) {
        setPriceChangeColor('text-red-600 dark:text-red-400');
      }
      setPreviousPrice(row.price);
      
      // Reset color after 2 seconds
      setTimeout(() => {
        setPriceChangeColor('');
      }, 2000);
    }
  }, [row.price, previousPrice]);

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
    
    const launchDate = parseDate(row.launchAt);
    if (!launchDate) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    
    const now = new Date();
    const timeDiff = launchDate.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    if (daysDiff < 0) {
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    } else if (daysDiff <= 1) {
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
    } else if (daysDiff <= 7) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
    } else {
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
    }
  };

  const getCountdownTextForRow = (row) => {
    return getCountdownText(row.launchAt, Date.now(), true); // Mobile = true
  };

  // Check if token is already listed (launch date has passed)
  const isTokenListed = (row) => {
    if (!row.launchAt) return false;
    
    const launchDate = parseDate(row.launchAt);
    if (!launchDate) return false;
    
    const now = new Date();
    return launchDate.getTime() <= now.getTime();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 ease-in-out hover:scale-[1.02]">
      {/* Header with Logo and Name */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {row.logo ? (
              <img 
                src={row.logo} 
                alt={`${row.name || row.symbol} logo`}
                className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            {(!row.logo || tokenLogos[row.apiId]?.logo !== row.logo) && (
              <div 
                className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium"
                style={{ display: row.logo ? 'none' : 'flex' }}
              >
                {row.symbol ? row.symbol.substring(0, 2).toUpperCase() : '??'}
              </div>
            )}
          </div>
                     <div className="flex-1 min-w-0">
             <div className="flex items-center justify-between">
               <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                 {row.name || row.symbol || 'Unknown Token'}
               </h3>
               <div className={`text-lg font-bold ${priceChangeColor || 'text-gray-900 dark:text-white'} ml-2 transition-colors duration-500`}>
                 {row.price ? `$${formatPrice(row.price)}` : (row.launchAt && !isTokenListed(row) ? (
                   <div className={`px-2 py-1 ${getStatusColor(row)} border rounded-lg text-xs font-medium flex items-center gap-1`}>
                     <HourglassEmptyIcon sx={{ fontSize: 12 }} className="hourglass-blink" />
                     <span dangerouslySetInnerHTML={{ __html: getCountdownTextForRow(row) }} />
                   </div>
                 ) : 'N/A')}
               </div>
             </div>
             <p className="text-sm text-gray-500 dark:text-gray-400 truncate hidden sm:block">
               {row.symbol && row.symbol !== row.name ? row.symbol : row.apiId || 'No API ID'}
             </p>
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Amount and Launch Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-500 dark:text-gray-400 text-sm">Amount:</span>
            <div className="font-medium text-gray-900 dark:text-white">
              {row.amount ? `${row.amount.toLocaleString()} ${row.symbol || ''}` : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 text-sm">Launch Date:</span>
            <div className="font-medium text-gray-900 dark:text-white">
              {row.launchAt ? formatDateTime(row.launchAt) : 'N/A'}
            </div>
          </div>
        </div>

                 {/* Point Priority and Highest Price */}
         <div className="grid grid-cols-2 gap-4">
           <div>
             <span className="text-gray-500 dark:text-gray-400 text-sm">Point Priority:</span>
             <div className="font-medium text-gray-900 dark:text-white">
               {row.pointPriority || 'N/A'}
             </div>
           </div>
           <div>
             <span className="text-gray-500 dark:text-gray-400 text-sm">Highest Price:</span>
             <div className="font-medium text-green-600 dark:text-green-400">
               {row.highestPrice && row.highestPrice > 0 ? `$${formatPrice(row.highestPrice)}` : 'N/A'}
             </div>
           </div>
         </div>

                 {/* Points FCFS and Reward */}
         <div className="grid grid-cols-2 gap-4">
           <div>
             <span className="text-gray-500 dark:text-gray-400 text-sm">Points FCFS:</span>
             <div className="font-medium text-gray-900 dark:text-white">
               {row.pointFCFS || 'N/A'}
             </div>
           </div>
           <div>
             <span className="text-gray-500 dark:text-gray-400 text-sm">Reward:</span>
             <div className="font-medium text-green-600 dark:text-green-400">
               {row.reward ? `$${formatPrice(row.reward)}` : 'N/A'}
             </div>
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
  );
};

export default TokenCard;
