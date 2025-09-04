import { formatAmount, formatPrice, formatDateTime, isRecentlyListed } from '../../utils';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoIcon from '@mui/icons-material/Info';
import BlockIcon from '@mui/icons-material/Block';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PriceTrackingInfo } from '../index';

export default function TableRow({
  row,
  index,
  onStartEdit,
  onDelete,
  onRefreshToken,
  showHighestPrice,
  showATH = true,
  getCountdownText,
  isHighlighted,
  tokenLogos
}) {
  const deleteButtonRef = useRef(null);
  const [showPriceInfo, setShowPriceInfo] = useState(false);
  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [priceChangeColor, setPriceChangeColor] = useState('');
  const [previousPrice, setPreviousPrice] = useState(null);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

  // Calculate tooltip position when showing
  useEffect(() => {
    if (showPriceInfo && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + rect.width / 2
      });
    }
  }, [showPriceInfo]);

  // Auto-hide tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowPriceInfo(false);
      }
    };

    if (showPriceInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPriceInfo]);

  // Handle mouse leave from PriceTrackingInfo
  const handlePriceInfoMouseLeave = () => {
    setShowPriceInfo(false);
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

  // Track price changes and update color
  useEffect(() => {
    const currentPrice = Number(row.price) || 0;
    
    if (previousPrice !== null && currentPrice > 0) {
      if (currentPrice > previousPrice) {
        setPriceChangeColor('text-green-600 dark:text-green-400');
      } else if (currentPrice < previousPrice) {
        setPriceChangeColor('text-red-600 dark:text-red-400');
      }
      
      // Reset color after 2 seconds
      setTimeout(() => {
        setPriceChangeColor('');
      }, 2000);
    }
    
    setPreviousPrice(currentPrice);
  }, [row.price, previousPrice]);


    const renderPriceAndReward = () => {
    const cd = getCountdownText(row.launchAt, Date.now(), false); // Desktop = false
    const priceNum = Number(row.price) || 0;
    
    if (priceNum > 0) {
      return (
        <>
          <td className='px-3 py-3 text-center tabular-nums text-sm dark:text-white'>
            <span 
              className={`transition-colors duration-500 ${priceChangeColor || 'text-gray-900 dark:text-white'}`}
            >
              ${formatPrice(priceNum)}
            </span>
          </td>
          <td className='px-3 py-3 text-center tabular-nums font-medium text-sm dark:text-white'>
            ${formatPrice(row.reward)}
          </td>
        </>
      );
    }

    if (cd) {
      return (
        <>
          <td className='px-3 py-3 text-center text-sm dark:text-white font-medium'>
                          <div className="flex items-center justify-center gap-1">
                <span 
                  className="px-2 py-1 bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <HourglassEmptyIcon sx={{ fontSize: 12 }} className="hourglass-blink" />
                  <span dangerouslySetInnerHTML={{ __html: cd }} />
                </span>
              </div>
          </td>
          <td className='px-3 py-3 text-center text-sm dark:text-white font-medium'>
            Wait for listing
          </td>
        </>
      );
    }

    return (
      <>
        <td className='px-3 py-3 text-center tabular-nums text-sm dark:text-white'>
          ${formatPrice(0)}
        </td>
        <td className='px-3 py-3 text-center tabular-nums font-medium text-sm dark:text-white'>
          Wait for listing
        </td>
      </>
    );
  };

  // Render tooltip using portal
  const renderTooltip = () => {
    if (!showPriceInfo || !row.price) return null;

    return createPortal(
      <div 
        ref={tooltipRef}
        className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-3 min-w-[280px]"
        style={{ 
          zIndex: 999999,
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: 'translateX(-50%)',
          pointerEvents: 'auto'
        }}
      >
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-200 dark:border-b-gray-700"></div>
        <PriceTrackingInfo 
          apiId={row.apiId}
          currentPrice={row.price}
          highestPrice={row.highestPrice}
          showDetails={true}
          onMouseLeave={handlePriceInfoMouseLeave}
        />
      </div>,
      document.body
    );
  };

  return (
    <>
      <tr
             className={`group border-b border-gray-100 dark:border-gray-700 transition-all duration-200 ${
         String(row.apiId || '').trim() === ''
           ? 'bg-yellow-50 dark:bg-yellow-900'
           : index % 2 === 0
           ? 'bg-white dark:bg-gray-800'
           : 'bg-gray-50 dark:bg-gray-700'
       } hover:bg-gray-100 dark:hover:bg-gray-600 ${
         isHighlighted ? 'row-highlight' : ''
       }`}
      style={
        typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark') &&
        String(row.apiId || '').trim() === ''
          ? { backgroundColor: '#A29D85' }
          : undefined
      }
    >
      {/* Token Name */}
      <td
        className={`px-3 py-3 sticky left-0`}
        style={{
          position: 'sticky',
          left: 0,
          zIndex: 20,
          backgroundColor: 'inherit',
          boxShadow: '2px 0 8px rgb(0,0,0)',
        }}
      >
                 <div className="flex items-center gap-2">
           {/* Token Logo */}
           {row.logo ? (
             <img
               src={row.logo}
               alt={`${row.symbol || row.name || row.apiId} logo`}
               className="w-6 h-6 rounded-full flex-shrink-0"
               onError={(e) => {
                 e.target.style.display = 'none';
               }}
             />
           ) : row.apiId && tokenLogos[row.apiId] && (
             <img
               src={tokenLogos[row.apiId].logo}
               alt={`${row.symbol || row.name || row.apiId} logo`}
               className="w-6 h-6 rounded-full flex-shrink-0"
               onError={(e) => {
                 e.target.style.display = 'none';
               }}
             />
           )}
                     <span className="text-sm dark:text-white font-medium flex items-center">
            {(row.symbol || row.name || row.apiId).toUpperCase()}
            {isRecentlyListed(row) && (
              <span className="text-blue-500 font-bold text-xs relative -top-1 ml-0.5" title="Token đã listing trong vòng 30 ngày gần nhất">
                *
              </span>
            )}
          </span>
         </div>
      </td>

      {/* Amount */}
      <td className='px-3 py-3 text-left'>
        <span className="text-sm dark:text-white">
          {formatAmount(row.amount)}
        </span>
      </td>

      {/* Listing Time */}
      <td className='px-3 py-3 text-center'>
        <span className="text-sm dark:text-white">
          {formatDateTime(row.launchAt) || ''}
        </span>
      </td>

      {/* Point Priority */}
      <td className='px-3 py-3 text-center'>
        <span className="text-sm dark:text-white">
                          {row.pointPriority ? (
                  row.pointPriority
                ) : (
                  <BlockIcon sx={{ fontSize: 16 }} className="text-gray-300 dark:text-gray-600" />
                )}
        </span>
      </td>

      {/* Point FCFS */}
      <td className='px-3 py-3 text-center'>
        <span className="text-sm dark:text-white">
                          {row.pointFCFS ? (
                  row.pointFCFS
                ) : (
                  <BlockIcon sx={{ fontSize: 16 }} className="text-gray-300 dark:text-gray-600" />
                )}
        </span>
      </td>

      {/* Price and Reward */}
      {renderPriceAndReward()}

      {/* ATH */}
      {showATH && (
        <td className='px-3 py-3 text-center tabular-nums text-sm dark:text-white'>
          <span>${formatPrice(row.ath || 0)}</span>
        </td>
      )}

      {/* Actions */}
       <td className='px-3 py-3 text-right sticky right-0 z-10 actions-column' style={{ backgroundColor: 'inherit' }}>
         <div className='flex items-center justify-end gap-2'>
                       {/* Refresh Token Button */}
            {onRefreshToken && (
              <button
                onClick={handleRefreshToken}
                disabled={isRefreshingToken}
                className='inline-flex items-center justify-center px-2 py-2 rounded-2xl bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md'
                title='Refresh token data'
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
              onClick={() => onStartEdit(index)}
              className='inline-flex items-center justify-center px-2 py-2 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md'
              title='Edit'
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </button>
            <button
              ref={deleteButtonRef}
              onClick={() => {
                const buttonElement = deleteButtonRef.current;
                if (buttonElement) {
                  const rect = buttonElement.getBoundingClientRect();
                  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                  const position = {
                    top: rect.bottom + scrollTop + 8,
                    left: Math.max(16, Math.min(rect.left, window.innerWidth - 384 - 16))
                  };
                  onDelete(index, position);
                } else {
                  onDelete(index);
                }
              }}
              className='inline-flex items-center justify-center px-2 py-2 rounded-2xl bg-red-500 hover:bg-red-600 text-white shadow-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md'
              title='Delete'
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </button>
         </div>
       </td>
    </tr>
    {renderTooltip()}
    </>
  );
}
