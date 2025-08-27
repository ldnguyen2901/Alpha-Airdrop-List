import { formatAmount, formatPrice, formatDateTime, copyContractAddress } from '../../utils';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoIcon from '@mui/icons-material/Info';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PriceTrackingInfo from '../PriceTrackingInfo';
import { useNotifications } from '../../contexts/NotificationContext';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function TableRow({
  row,
  index,
  onStartEdit,
  onDelete,
  showHighestPrice,
  getCountdownText,
  isHighlighted,
  tokenLogos,
  onRetryContract
}) {
  const { addNotification } = useNotifications();
  const deleteButtonRef = useRef(null);
  const [showPriceInfo, setShowPriceInfo] = useState(false);
  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [priceChangeColor, setPriceChangeColor] = useState('');
  const [previousPrice, setPreviousPrice] = useState(null);

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
            ${formatPrice(row.value)}
          </td>
        </>
      );
    }

    if (cd) {
      return (
        <>
          <td className='px-3 py-3 text-center text-sm dark:text-white font-medium'>
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 mx-auto">
              <HourglassEmptyIcon sx={{ fontSize: 14 }} className="hourglass-blink" />
              <span className="tabular-nums" dangerouslySetInnerHTML={{ __html: cd }} />
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
                     <span className="text-sm dark:text-white font-medium">
            {row.symbol || row.name || row.apiId}
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
          {row.pointPriority}
        </span>
      </td>

      {/* Point FCFS */}
      <td className='px-3 py-3 text-center'>
        <span className="text-sm dark:text-white">
          {row.pointFCFS}
        </span>
      </td>

      {/* Price and Reward */}
      {renderPriceAndReward()}

      {/* Highest Price */}
      {showHighestPrice && (
        <td className='px-1 py-2 text-center tabular-nums text-[11px] sm:text-sm dark:text-white relative group'>
          <div className="flex items-center justify-center gap-1">
            <span>${formatPrice(row.highestPrice)}</span>
            {row.price > 0 && (
              <button
                ref={buttonRef}
                onClick={() => setShowPriceInfo(!showPriceInfo)}
                onBlur={() => setTimeout(() => setShowPriceInfo(false), 100)}
                onMouseEnter={() => {
                  setShowPriceInfo(true);
                }}
                onMouseLeave={() => {
                  setShowPriceInfo(false);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                title="View price tracking info"
              >
                <InfoIcon sx={{ fontSize: 12 }} className="text-gray-400 hover:text-blue-500" />
              </button>
            )}
          </div>
        </td>
      )}

      {/* ATH */}
      {showHighestPrice && (
        <td className='px-3 py-3 text-center tabular-nums text-sm dark:text-white'>
          {row.ath && row.ath > 0 ? `$${formatPrice(row.ath)}` : 'N/A'}
        </td>
      )}

      {/* Contract Address */}
      <td className='px-3 py-3 text-left text-xs dark:text-white font-mono max-w-[200px] truncate'>
        {row.contractAddress ? (
          <span 
            className="truncate cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors" 
            title="Click to copy contract address"
            onClick={() => copyContractAddress(row.contractAddress)}
          >
            {row.contractAddress.slice(0, 8)}...{row.contractAddress.slice(-6)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>

      {/* Actions */}
       <td className='px-3 py-3 text-right sticky right-0 z-10 actions-column' style={{ backgroundColor: 'inherit' }}>
         <div className='flex items-center justify-end gap-2'>
           <button
             onClick={() => onStartEdit(index)}
             className='inline-flex items-center px-3 py-2 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white shadow-sm text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md gap-2'
             title='Edit'
           >
             <EditIcon sx={{ fontSize: 16 }} />
             Edit
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
             className='inline-flex items-center px-3 py-2 rounded-2xl bg-red-500 hover:bg-red-600 text-white shadow-sm text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md gap-2'
             title='Delete'
           >
             <DeleteIcon sx={{ fontSize: 16 }} />
             Delete
           </button>
         </div>
       </td>
    </tr>
    {renderTooltip()}
    </>
  );
}
