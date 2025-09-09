import { formatAmount, formatPrice, formatDateTime, isRecentlyListed, parseDate } from '../../../utils';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoIcon from '@mui/icons-material/Info';
import BlockIcon from '@mui/icons-material/Block';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PriceTrackingInfo from '../PriceTrackingInfo';

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
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  const tokenTooltipRef = useRef(null);
  const tokenCellRef = useRef(null);
  const [tokenTooltipPosition, setTokenTooltipPosition] = useState({ top: 0, left: 0 });
  const [showPriceInfo, setShowPriceInfo] = useState(false);
  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [priceChangeColor, setPriceChangeColor] = useState('');
  const [previousPrice, setPreviousPrice] = useState(null);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

  // Calculate token tooltip position when showing
  useEffect(() => {
    if (showTokenInfo && tokenCellRef.current) {
      const rect = tokenCellRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setTokenTooltipPosition({
        top: index < 5 
          ? rect.bottom + scrollTop + 8
          : rect.top + scrollTop - 8,
        left: rect.left + scrollLeft
      });
    }
  }, [showTokenInfo, index]);

  // Calculate price tooltip position when showing
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
      if (tokenTooltipRef.current && !tokenTooltipRef.current.contains(event.target) && 
          tokenCellRef.current && !tokenCellRef.current.contains(event.target)) {
        setShowTokenInfo(false);
      }
      if (tooltipRef.current && !tooltipRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowPriceInfo(false);
      }
    };

    if (showTokenInfo || showPriceInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTokenInfo, showPriceInfo]);

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

  // Render token tooltip using portal
  const renderTokenTooltip = () => {
    if (!showTokenInfo) return null;

    return createPortal(
      <div 
        ref={tokenTooltipRef}
        className="fixed bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-xl p-3 min-w-[500px] max-w-[700px] pointer-events-auto"
        style={{ 
          zIndex: 999999,
          top: tokenTooltipPosition.top,
          left: tokenTooltipPosition.left,
          transform: index < 5 ? 'none' : 'translateY(-100%)'
        }}
      >
        <div className={`absolute left-8 w-0 h-0 border-l-4 border-r-4 ${
          index < 5 
            ? 'top-0 -translate-y-1 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-800'
            : 'bottom-0 translate-y-1 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800'
        }`}></div>
        
        {/* Token Header */}
        <div className="font-semibold text-blue-300 mb-3 text-center text-[12px]">
          {(row.symbol || row.name || 'Unknown').toUpperCase()}
        </div>
        
        {/* 3 Column Table Structure - No scroll */}
        <div className="overflow-hidden rounded border border-gray-600">
          <table className="w-full text-[10px]">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-center text-blue-300 font-semibold border-r border-gray-600">🏢 Exchanges</th>
                <th className="px-3 py-2 text-center text-green-300 font-semibold border-r border-gray-600">⛓️ Chains</th>
                <th className="px-3 py-2 text-center text-purple-300 font-semibold">📂 Categories</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800">
              <tr>
                {/* Exchanges Column */}
                <td className="px-3 py-2 text-gray-100 border-r border-gray-600 align-top">
                  <div className="max-h-none">
                    {row.exchanges && row.exchanges.length > 0 ? (
                      row.exchanges.map((exchange, idx) => (
                        <div key={idx} className="text-[9px] leading-relaxed mb-1">
                          • {exchange}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-[9px]">-</div>
                    )}
                  </div>
                </td>
                
                {/* Chains Column */}
                <td className="px-3 py-2 text-gray-100 border-r border-gray-600 align-top">
                  <div className="max-h-none">
                    {row.chains && row.chains.length > 0 ? (
                      row.chains.map((chain, idx) => (
                        <div key={idx} className="text-[9px] leading-relaxed mb-1">
                          • {chain}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-[9px]">-</div>
                    )}
                  </div>
                </td>
                
                {/* Categories Column */}
                <td className="px-3 py-2 text-gray-100 align-top">
                  <div className="max-h-none">
                    {row.categories && row.categories.length > 0 ? (
                      row.categories.map((category, idx) => (
                        <div key={idx} className="text-[9px] leading-relaxed mb-1">
                          • {category}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-[9px]">-</div>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>,
      document.body
    );
  };

  // Render price tooltip using portal
  const renderPriceTooltip = () => {
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
      style={{ position: 'relative' }}
    >
      {/* Token Name - Fixed alignment */}
      <td 
        ref={tokenCellRef}
        className='px-3 py-3 text-left cursor-pointer' 
        style={{ position: 'relative' }}
        onMouseEnter={() => setShowTokenInfo(true)}
        onMouseLeave={() => setShowTokenInfo(false)}
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
            {(row.symbol || row.name || 'Unknown').toUpperCase() || row.apiId || 'Unknown'}
            {isRecentlyListed(row) && (
              <span className="text-blue-500 font-bold text-xs relative -top-1 ml-0.5" title="Token đã listing trong vòng 30 ngày gần nhất">
                *
              </span>
            )}
          </span>
        </div>
      </td>

      {/* Listing Time */}
      <td className='px-3 py-3 text-center'>
        <span className="text-sm dark:text-white">
          {formatDateTime(row.launchAt) || ''}
        </span>
      </td>

      {/* Point */}
      <td className='px-3 py-3 text-center'>
        <span className="text-sm dark:text-white">
          {row.point ? (
            row.point
          ) : (
            <BlockIcon sx={{ fontSize: 16 }} className="text-gray-300 dark:text-gray-600" />
          )}
        </span>
      </td>

      {/* Type */}
      <td className='px-3 py-3 text-center'>
        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
          row.type === 'Pre-TGE' 
            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' 
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
        }`}>
          {row.type || 'TGE'}
        </span>
      </td>

      {/* Price */}
      <td className='px-3 py-3 text-center tabular-nums text-sm dark:text-white'>
        {(() => {
          const cd = getCountdownText(row.launchAt, Date.now(), false);
          const priceNum = Number(row.price) || 0;
          
          if (priceNum > 0) {
            return (
              <span 
                className={`transition-colors duration-500 ${priceChangeColor || 'text-gray-900 dark:text-white'}`}
              >
                ${formatPrice(priceNum)}
              </span>
            );
          }
          
          if (cd) {
            return (
              <div className="flex items-center justify-center gap-1">
                <span 
                  className="px-2 py-1 bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <HourglassEmptyIcon sx={{ fontSize: 12 }} className="hourglass-blink" />
                  <span dangerouslySetInnerHTML={{ __html: cd }} />
                </span>
              </div>
            );
          }
          
          // Check if token is already listed (launch date has passed)
          const isTokenListed = () => {
            if (!row.launchAt) return false;
            
            const launchDate = parseDate(row.launchAt);
            if (!launchDate) return false;
            
            const now = new Date();
            return launchDate.getTime() <= now.getTime();
          };
          
          return <span>{isTokenListed() ? 'N/A' : `$${formatPrice(0)}`}</span>;
        })()}
      </td>

      {/* ATH */}
      {showATH && (
        <td className='px-3 py-3 text-center tabular-nums text-sm dark:text-white'>
          <span>{(() => {
            // Check if token is already listed (launch date has passed)
            const isTokenListed = () => {
              if (!row.launchAt) return false;
              
              const launchDate = parseDate(row.launchAt);
              if (!launchDate) return false;
              
              const now = new Date();
              return launchDate.getTime() <= now.getTime();
            };
            
            return isTokenListed() && (row.ath || 0) === 0 ? 'N/A' : `$${formatPrice(row.ath || 0)}`;
          })()}</span>
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
    {renderTokenTooltip()}
    {renderPriceTooltip()}
    </>
  );
}
