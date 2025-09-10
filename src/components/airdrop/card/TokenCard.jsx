import React, { useState, useEffect } from 'react';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import BlockIcon from '@mui/icons-material/Block';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';
import { formatPrice, formatDateTime, getCountdownText, isRecentlyListed, parseDate } from '../../../utils';

const TokenCard = ({
  row,
  index,
  tokenLogos,
  showHighestPrice,
  onEditRow,
  onDeleteRow,
  onRefreshToken,
  editButtonRefs,
  deleteButtonRefs,
  setEditButtonPosition
}) => {
  const [previousPrice, setPreviousPrice] = useState(row.price || 0);
  const [priceChangeColor, setPriceChangeColor] = useState('');
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

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

  // Handle refresh token
  const handleRefreshToken = async () => {
    if (!onRefreshToken) return;
    
    setIsRefreshingToken(true);
    try {
      await onRefreshToken(row.apiId || row.id);
    } catch (error) {
      console.error('Error refreshing token:', error);
    } finally {
      // Ensure animation completes
      setTimeout(() => {
        setIsRefreshingToken(false);
      }, 1000);
    }
  };

  // Handle contract copy
  const handleContractCopy = async (contractAddress) => {
    if (!contractAddress || contractAddress === 'N/A') return;
    
    try {
      await navigator.clipboard.writeText(contractAddress);
      console.log('Contract copied to clipboard:', contractAddress);
      
      // Show visual feedback
      const contractElement = document.querySelector(`[data-contract="${contractAddress}"]`);
      if (contractElement) {
        contractElement.style.backgroundColor = '#10B981';
        contractElement.style.color = 'white';
        setTimeout(() => {
          contractElement.style.backgroundColor = '';
          contractElement.style.color = '';
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to copy contract:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = contractAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
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
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate flex items-center">
                    {(row.symbol || '?').toUpperCase()}
                    {isRecentlyListed(row) && (
                      <span className="text-blue-500 font-bold text-xs relative -top-1 ml-0.5" title="Token đã listing trong vòng 30 ngày gần nhất">
                        *
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {row.name && row.name !== row.symbol ? row.name : row.apiId || 'No API ID'}
                  </p>
                </div>
                <div className={`text-lg font-bold ${priceChangeColor || 'text-gray-900 dark:text-white'} ml-2 transition-colors duration-500`}>
                  {row.price ? `$${formatPrice(row.price)}` : (row.launchAt && !isTokenListed(row) ? (
                    <div className={`px-2 py-1 ${getStatusColor(row)} border rounded-lg text-xs font-medium flex items-center gap-1`}>
                      <HourglassEmptyIcon sx={{ fontSize: 12 }} className="hourglass-blink" />
                      <span dangerouslySetInnerHTML={{ __html: getCountdownTextForRow(row) }} />
                    </div>
                  ) : (row.launchAt && isTokenListed(row) ? <ReportGmailerrorredIcon sx={{ fontSize: 16 }} className="text-gray-400" /> : <ReportGmailerrorredIcon sx={{ fontSize: 16 }} className="text-gray-400" />))}
                </div>
              </div>
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
              {row.amount ? `${row.amount.toLocaleString()} ${(row.symbol || 'Unknown').toUpperCase()}` : <ReportGmailerrorredIcon sx={{ fontSize: 16 }} className="text-gray-400" />}
            </div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 text-sm">Launch Date:</span>
            <div className="font-medium text-gray-900 dark:text-white">
              {row.launchAt ? formatDateTime(row.launchAt) : <ReportGmailerrorredIcon sx={{ fontSize: 16 }} className="text-gray-400" />}
            </div>
          </div>
        </div>

                 {/* Point and AT(L-H) */}
         <div className="grid grid-cols-2 gap-4">
           <div>
             <span className="text-gray-500 dark:text-gray-400 text-sm">Point:</span>
             <div className="font-medium text-gray-900 dark:text-white">
               {row.pointPriority || row.pointFCFS ? (
                 <span>
                   {row.pointPriority && (
                     <span className="font-medium">
                       {row.pointPriority}
                     </span>
                   )}
                   {row.pointPriority && row.pointFCFS && (
                     <span className="text-gray-400 mx-1">-</span>
                   )}
                   {row.pointFCFS && (
                     <span className="font-medium">
                       {row.pointFCFS}
                     </span>
                   )}
                 </span>
               ) : (
                 <BlockIcon sx={{ fontSize: 16 }} className="text-gray-300 dark:text-gray-600" />
               )}
             </div>
           </div>
           <div>
             <span className="text-gray-500 dark:text-gray-400 text-sm">AT(L-H):</span>
             <div className="font-medium text-gray-900 dark:text-white">
               {row.atl && row.atl > 0 && row.ath && row.ath > 0 ? (
                 <>
                   <span className="text-red-600 dark:text-red-400 font-medium">
                     ${formatPrice(row.atl)}
                   </span>
                   <span className="text-gray-400 mx-1">-</span>
                   <span className="text-green-600 dark:text-green-400 font-medium">
                     ${formatPrice(row.ath)}
                   </span>
                 </>
               ) : row.atl && row.atl > 0 ? (
                 <span className="text-red-600 dark:text-red-400 font-medium">
                   ${formatPrice(row.atl)}
                 </span>
               ) : row.ath && row.ath > 0 ? (
                 <span className="text-green-600 dark:text-green-400 font-medium">
                   ${formatPrice(row.ath)}
                 </span>
               ) : (
                 <ReportGmailerrorredIcon sx={{ fontSize: 16 }} className="text-gray-400" />
               )}
             </div>
           </div>
         </div>

         {/* Contract and Reward */}
         <div className="grid grid-cols-2 gap-4">
           <div>
             <span className="text-gray-500 dark:text-gray-400 text-sm">Contract:</span>
             <div className="font-medium text-gray-900 dark:text-white text-xs">
               {row.contract ? (
                 <span 
                   className="font-mono cursor-pointer hover:underline transition-colors duration-200 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                   title="Click to copy contract address"
                   onClick={() => handleContractCopy(row.contract)}
                   data-contract={row.contract}
                   style={{ padding: '2px 4px', borderRadius: '4px' }}
                 >
                   {row.contract.length > 20 
                     ? `${row.contract.substring(0, 6)}...${row.contract.substring(row.contract.length - 4)}`
                     : row.contract
                   }
                 </span>
               ) : (
                 <ReportGmailerrorredIcon sx={{ fontSize: 16 }} className="text-gray-400" />
               )}
             </div>
           </div>
           <div>
             <span className="text-gray-500 dark:text-gray-400 text-sm">Reward:</span>
             <div className="font-medium text-yellow-600 dark:text-yellow-400">
               {row.reward ? `$${formatPrice(row.reward)}` : <ReportGmailerrorredIcon sx={{ fontSize: 16 }} className="text-gray-400" />}
             </div>
           </div>
         </div>

        

                          {/* Action Buttons */}
          <div className="flex gap-2 pt-3">
            {/* Refresh Token Button */}
            {onRefreshToken && (
              <button
                onClick={handleRefreshToken}
                disabled={isRefreshingToken}
                className="flex-1 flex items-center justify-center px-2 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded-2xl shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md"
                title="Refresh token data"
              >
                <RefreshIcon 
                  sx={{ 
                    fontSize: 16,
                    animation: isRefreshingToken ? 'spin 1s linear infinite' : 'none'
                  }}
                  className={isRefreshingToken ? 'refresh-spin' : ''}
                />
              </button>
            )}
            
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
              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl shadow-sm text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md"
            >
              <Edit sx={{ fontSize: 16 }} />
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
              className="flex-1 flex items-center justify-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-sm text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md"
            >
              <Delete sx={{ fontSize: 16 }} />
            </button>
          </div>
      </div>
    </div>
  );
};

export default TokenCard;
