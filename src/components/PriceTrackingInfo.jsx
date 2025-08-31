import React from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import WarningIcon from '@mui/icons-material/Warning';
import { usePriceTracking } from '../hooks';

const PriceTrackingInfo = ({ apiId, currentPrice, highestPrice, showDetails = false, onMouseLeave }) => {
  const { getPriceStats, analyzeTrend, getPriceAlerts } = usePriceTracking();
  
  if (!apiId || !currentPrice) return null;
  
  const priceStats = getPriceStats(apiId);
  const trend = analyzeTrend(apiId);
  const alerts = getPriceAlerts(apiId);
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'bullish':
        return <TrendingUpIcon className="text-green-500" sx={{ fontSize: 16 }} />;
      case 'bearish':
        return <TrendingDownIcon className="text-red-500" sx={{ fontSize: 16 }} />;
      default:
        return <TrendingFlatIcon className="text-gray-500" sx={{ fontSize: 16 }} />;
    }
  };
  
  const getTrendColor = () => {
    switch (trend) {
      case 'bullish':
        return 'text-green-600 dark:text-green-400';
      case 'bearish':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };
  
  const getTrendText = () => {
    switch (trend) {
      case 'bullish':
        return 'Bullish';
      case 'bearish':
        return 'Bearish';
      default:
        return 'Neutral';
    }
  };
  
  const priceChangePercent = highestPrice > 0 ? ((currentPrice - highestPrice) / highestPrice) * 100 : 0;
  const isNearHigh = priceChangePercent >= -5 && priceChangePercent <= 5;
  
  return (
    <div 
      className="space-y-2"
      onMouseLeave={onMouseLeave}
    >
      {/* Basic Price Info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">Current:</span>
        <span className="font-medium text-gray-900 dark:text-white">
          ${currentPrice.toFixed(6)}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">Highest:</span>
        <span className="font-medium text-green-600 dark:text-green-400">
          ${highestPrice.toFixed(6)}
        </span>
      </div>
      
      {/* Trend Indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">Trend:</span>
        <div className="flex items-center gap-1">
          {getTrendIcon()}
          <span className={`font-medium ${getTrendColor()}`}>
            {getTrendText()}
          </span>
        </div>
      </div>
      
      {/* Price Change from High */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">From High:</span>
        <span className={`font-medium ${priceChangePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
        </span>
      </div>
      
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 text-xs">
            <WarningIcon sx={{ fontSize: 14 }} />
            <span className="font-medium">Price Alert</span>
          </div>
          {alerts.map((alert, index) => (
            <div key={index} className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
              {alert.message}
            </div>
          ))}
        </div>
      )}
      
      {/* Detailed Stats (if showDetails is true) */}
      {showDetails && priceStats && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Price Statistics
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Min:</span>
              <span className="ml-1 text-gray-900 dark:text-white">
                ${priceStats.min.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Max:</span>
              <span className="ml-1 text-gray-900 dark:text-white">
                ${priceStats.max.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Avg:</span>
              <span className="ml-1 text-gray-900 dark:text-white">
                ${priceStats.average.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Volatility:</span>
              <span className="ml-1 text-gray-900 dark:text-white">
                {priceStats.volatility.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Data points: {priceStats.dataPoints}
          </div>
        </div>
      )}
      
      {/* Near High Warning */}
      {isNearHigh && currentPrice < highestPrice && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-blue-800 dark:text-blue-200 text-xs">
            ⚠️ Near all-time high ({Math.abs(priceChangePercent).toFixed(1)}% below)
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceTrackingInfo;
