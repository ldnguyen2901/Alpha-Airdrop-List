import { MainCard as Card } from './index';
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
  lastSyncTime,
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
    <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6'>
      <Card className="card-hover">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300 flex items-center gap-2'>
          {tokenLogos.bitcoin?.logo ? (
            <img 
              src={tokenLogos.bitcoin.logo} 
              alt={tokenLogos.bitcoin?.symbol || 'BTC'} 
              className="w-4 h-4 rounded-full"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold" style={{ display: 'flex' }}>
              ₿
            </div>
          )}
          <span className="hidden sm:inline">{tokenLogos.bitcoin?.symbol || 'BTC'} Price</span>
          <span className="sm:hidden">{tokenLogos.bitcoin?.symbol || 'BTC'}</span>
        </div>
        <div
          className='text-lg sm:text-xl lg:text-2xl font-semibold transition-all duration-300 ease-in-out'
          style={{ color: 'rgb(247, 147, 26)' }}
        >
          {(loading || isRefreshing) ? (
            <span className="flex items-center gap-2">
              <span>{formatNumber(btcPrice)} <span className="text-xs" style={{ color: 'rgb(247, 147, 26)' }}>USD</span></span>
              <AutorenewIcon sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} className="refresh-spin" />
            </span>
          ) : (
            <span>{formatNumber(btcPrice)} <span className="text-xs" style={{ color: 'rgb(247, 147, 26)' }}>USD</span></span>
          )}
        </div>
      </Card>
      <Card className="card-hover">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300 flex items-center gap-2'>
          {tokenLogos.ethereum?.logo ? (
            <img 
              src={tokenLogos.ethereum.logo} 
              alt={tokenLogos.ethereum?.symbol || 'ETH'} 
              className="w-4 h-4 rounded-full"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold" style={{ display: 'flex' }}>
              Ξ
            </div>
          )}
          <span className="hidden sm:inline">{tokenLogos.ethereum?.symbol || 'ETH'} Price</span>
          <span className="sm:hidden">{tokenLogos.ethereum?.symbol || 'ETH'}</span>
        </div>
        <div
          className='text-lg sm:text-xl lg:text-2xl font-semibold transition-all duration-300 ease-in-out'
          style={{ color: 'rgb(140,140,140)' }}
        >
          {(loading || isRefreshing) ? (
            <span className="flex items-center gap-2">
              <span>{formatNumber(ethPrice)} <span className="text-xs" style={{ color: 'rgb(140,140,140)' }}>USD</span></span>
              <AutorenewIcon sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} className="refresh-spin" />
            </span>
          ) : (
            <span>{formatNumber(ethPrice)} <span className="text-xs" style={{ color: 'rgb(140,140,140)' }}>USD</span></span>
          )}
        </div>
      </Card>
      <Card className="card-hover">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300 flex items-center gap-2'>
          {tokenLogos.binancecoin?.logo ? (
            <img 
              src={tokenLogos.binancecoin.logo} 
              alt={tokenLogos.binancecoin?.symbol || 'BNB'} 
              className="w-4 h-4 rounded-full"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold" style={{ display: 'flex' }}>
              B
            </div>
          )}
          <span className="hidden sm:inline">{tokenLogos.binancecoin?.symbol || 'BNB'} Price</span>
          <span className="sm:hidden">{tokenLogos.binancecoin?.symbol || 'BNB'}</span>
        </div>
        <div
          className='text-lg sm:text-xl lg:text-2xl font-semibold transition-all duration-300 ease-in-out'
          style={{ color: 'rgb(240,185,11)' }}
        >
          {(loading || isRefreshing) ? (
            <span className="flex items-center gap-2">
              <span>{formatNumber(bnbPrice)} <span className="text-xs" style={{ color: 'rgb(240,185,11)' }}>USD</span></span>
              <AutorenewIcon sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} className="refresh-spin" />
            </span>
          ) : (
            <span>{formatNumber(bnbPrice)} <span className="text-xs" style={{ color: 'rgb(240,185,11)' }}>USD</span></span>
          )}
        </div>
      </Card>
      <Card className="card-hover">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300 flex items-center gap-2'>
          <span className="text-purple-500">⚡</span>
          <span className="hidden sm:inline">Alpha Projects</span>
          <span className="sm:hidden">Projects</span>
        </div>
        <div className='text-lg sm:text-xl lg:text-2xl font-semibold transition-all duration-300 ease-in-out text-purple-600'>{rowsCount}</div>
        <div className='mt-1 text-[10px] sm:text-[11px] text-gray-500 transition-colors duration-300'>
          {(loading || isRefreshing) ? (
            <span className="flex items-center gap-2">
              <AutorenewIcon sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} className="refresh-spin" />
              <span className="hidden sm:inline">Updating…</span>
              <span className="sm:hidden">Updating</span>
            </span>
          ) : lastUpdated ? (
            <span className="hidden sm:inline">Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
          ) : (
            <span className="hidden sm:inline">Last sync: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}</span>
          )}
        </div>
      </Card>

      <Card className="card-hover">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300 flex items-center gap-2'>
          <span className="text-blue-500">🔄</span>
          <span className="hidden sm:inline">Database Sync</span>
          <span className="sm:hidden">Sync</span>
        </div>
        <div
          className={`text-lg sm:text-xl lg:text-2xl font-semibold transition-all duration-300 ease-in-out ${
            syncing ? 'text-blue-500' : !isPageVisible ? 'text-yellow-500' : 'text-emerald-600'
          }`}
        >
          {syncing ? (
            <span className="flex items-center gap-2">
              <AutorenewIcon sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} className="refresh-spin" />
              <span className="hidden sm:inline">Syncing...</span>
              <span className="sm:hidden">Sync</span>
            </span>
          ) : !isPageVisible ? (
            <span className="flex items-center gap-2">
              <span className="hidden sm:inline">Background</span>
              <span className="sm:hidden">BG</span>
            </span>
          ) : (
            <>
              <span className="hidden sm:inline">Synced</span>
              <span className="sm:hidden">OK</span>
            </>
          )}
        </div>
        <div className='mt-1 text-[10px] sm:text-[11px] text-gray-500 transition-colors duration-300'>
          {syncing ? (
            <span className="hidden sm:inline">Saving to Neon DB...</span>
          ) : !isPageVisible ? (
            <span className="hidden sm:inline">Auto-refresh paused</span>
          ) : (
            <span className="hidden sm:inline"></span>
          )}
        </div>
        <div className='mt-1 text-[9px] sm:text-[10px] text-gray-400 transition-colors duration-300'>
          {lastSyncTime ? (
            <span className="hidden sm:inline">Last sync: {new Date(lastSyncTime).toLocaleTimeString()}</span>
          ) : (
            <span className="hidden sm:inline">Ready to sync</span>
          )}
        </div>
      </Card>
    </div>
  );
}
