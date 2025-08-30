import Card from './Card';
import { formatNumber } from '../utils';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { useState, useEffect } from 'react';

export default function StatsCards({
  rowsCount,
  loading,
  btcPrice,
  ethPrice,
  bnbPrice,
  syncing,
  lastUpdated,
  tokenLogos = {},
  isPageVisible = true,
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (loading && !isRefreshing) {
      setIsRefreshing(true);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && isRefreshing) {
      // Ensure animation completes full rotation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  }, [loading, isRefreshing]);
  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6'>
      <Card className="card-hover min-w-0">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300 flex items-center gap-2'>
          {tokenLogos.bitcoin?.logo ? (
            <img 
              src={tokenLogos.bitcoin.logo} 
              alt={tokenLogos.bitcoin?.symbol || 'BTC'} 
              className="w-4 h-4 rounded-full flex-shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ display: 'flex' }}>
              ₿
            </div>
          )}
          <span className="truncate">{tokenLogos.bitcoin?.symbol || 'BTC'} Price</span>
        </div>
        <div
          className='text-lg sm:text-xl lg:text-2xl font-semibold transition-all duration-300 ease-in-out truncate'
          style={{ color: 'rgb(247, 147, 26)' }}
        >
          {(loading || isRefreshing) ? (
            <span className="flex items-center gap-2">
              <span className="truncate">{formatNumber(btcPrice)} <span className="text-xs" style={{ color: 'rgb(247, 147, 26)' }}>USD</span></span>
              <AutorenewIcon sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} className="refresh-spin flex-shrink-0" />
            </span>
          ) : (
            <span className="truncate">{formatNumber(btcPrice)} <span className="text-xs" style={{ color: 'rgb(247, 147, 26)' }}>USD</span></span>
          )}
        </div>
      </Card>
      <Card className="card-hover min-w-0">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300 flex items-center gap-2'>
          {tokenLogos.ethereum?.logo ? (
            <img 
              src={tokenLogos.ethereum.logo} 
              alt={tokenLogos.ethereum?.symbol || 'ETH'} 
              className="w-4 h-4 rounded-full flex-shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ display: 'flex' }}>
              Ξ
            </div>
          )}
          <span className="truncate">{tokenLogos.ethereum?.symbol || 'ETH'} Price</span>
        </div>
        <div
          className='text-lg sm:text-xl lg:text-2xl font-semibold transition-all duration-300 ease-in-out truncate'
          style={{ color: 'rgb(140,140,140)' }}
        >
          {(loading || isRefreshing) ? (
            <span className="flex items-center gap-2">
              <span className="truncate">{formatNumber(ethPrice)} <span className="text-xs" style={{ color: 'rgb(140,140,140)' }}>USD</span></span>
              <AutorenewIcon sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} className="refresh-spin flex-shrink-0" />
            </span>
          ) : (
            <span className="truncate">{formatNumber(ethPrice)} <span className="text-xs" style={{ color: 'rgb(140,140,140)' }}>USD</span></span>
          )}
        </div>
      </Card>
      <Card className="card-hover min-w-0">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300 flex items-center gap-2'>
          {tokenLogos.binancecoin?.logo ? (
            <img 
              src={tokenLogos.binancecoin.logo} 
              alt={tokenLogos.binancecoin?.symbol || 'BNB'} 
              className="w-4 h-4 rounded-full flex-shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ display: 'flex' }}>
              B
            </div>
          )}
          <span className="truncate">{tokenLogos.binancecoin?.symbol || 'BNB'} Price</span>
        </div>
        <div
          className='text-lg sm:text-xl lg:text-2xl font-semibold transition-all duration-300 ease-in-out truncate'
          style={{ color: 'rgb(240,185,11)' }}
        >
          {(loading || isRefreshing) ? (
            <span className="flex items-center gap-2">
              <span className="truncate">{formatNumber(bnbPrice)} <span className="text-xs" style={{ color: 'rgb(240,185,11)' }}>USD</span></span>
              <AutorenewIcon sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} className="refresh-spin flex-shrink-0" />
            </span>
          ) : (
            <span className="truncate">{formatNumber(bnbPrice)} <span className="text-xs" style={{ color: 'rgb(240,185,11)' }}>USD</span></span>
          )}
        </div>
      </Card>
      <Card className="card-hover min-w-0">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300 flex items-center gap-2'>
          <span className="text-purple-500 flex-shrink-0">⚡</span>
          <span className="truncate">Alpha Projects</span>
        </div>
        <div className='text-lg sm:text-xl lg:text-2xl font-semibold transition-all duration-300 ease-in-out text-purple-600 truncate'>{rowsCount}</div>
        <div className='mt-1 text-[11px] text-gray-500 transition-colors duration-300 truncate'>
          {(loading || isRefreshing) ? (
            <span className="flex items-center gap-2">
              <AutorenewIcon sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} className="refresh-spin flex-shrink-0" />
              <span className="truncate">Updating…</span>
            </span>
          ) : lastUpdated ? (
            <span className="truncate">Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
          ) : (
            <span className="truncate">Ready</span>
          )}
        </div>
      </Card>

      <Card className="card-hover min-w-0">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300 flex items-center gap-2'>
          <span className="text-blue-500 flex-shrink-0">🔄</span>
          <span className="truncate">Status</span>
        </div>
        <div
          className={`text-lg sm:text-xl lg:text-2xl font-semibold transition-all duration-300 ease-in-out truncate ${
            syncing ? 'text-blue-500' : !isPageVisible ? 'text-yellow-500' : 'text-emerald-600'
          }`}
        >
          {syncing ? (
            <span className="flex items-center gap-2">
              <AutorenewIcon sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} className="refresh-spin flex-shrink-0" />
              <span className="truncate">Syncing…</span>
            </span>
          ) : !isPageVisible ? (
            <span className="flex items-center gap-2">
              <span className="truncate">Background</span>
            </span>
          ) : (
            <span className="truncate">Synced</span>
          )}
        </div>
      </Card>
    </div>
  );
}
