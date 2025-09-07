import { useEffect, useRef, useCallback } from 'react';
import { AUTO_REFRESH_INTERVAL } from '../utils/constants';
import { useAutoRefreshContext } from '../contexts';

// Convert seconds to milliseconds
const REFRESH_INTERVAL_MS = AUTO_REFRESH_INTERVAL * 1000;

export const useAutoRefresh = (
  refreshActiveTableData,
  refreshStatscardPrices,
  isPageVisible,
  setIsPageVisible
) => {
  const { isAutoRefreshEnabled, countdown, updateCountdown } = useAutoRefreshContext();
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  
  // Use refs to store the latest functions to avoid dependency issues
  const refreshActiveTableDataRef = useRef(refreshActiveTableData);
  const refreshStatscardPricesRef = useRef(refreshStatscardPrices);
  
  // Update refs when functions change
  useEffect(() => {
    refreshActiveTableDataRef.current = refreshActiveTableData;
    refreshStatscardPricesRef.current = refreshStatscardPrices;
  }, [refreshActiveTableData, refreshStatscardPrices]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      
      if (isVisible) {
        console.log('Page became visible, resuming auto refresh');
      } else {
        console.log('Page became hidden, pausing auto refresh');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setIsPageVisible]);

  // Countdown effect
  useEffect(() => {
    if (!isAutoRefreshEnabled || !isPageVisible) {
      return;
    }

    countdownRef.current = setInterval(() => {
      updateCountdown(prev => {
        if (prev <= 1) {
          return AUTO_REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [isAutoRefreshEnabled, isPageVisible, updateCountdown]);

  // Auto refresh effect - only refresh active table
  useEffect(() => {
    if (!isAutoRefreshEnabled || !isPageVisible) {
      return;
    }

    timerRef.current = setInterval(() => {
      console.log('Auto refreshing active table and statscard prices...');
      refreshActiveTableDataRef.current();
      refreshStatscardPricesRef.current();
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAutoRefreshEnabled, isPageVisible]); // Remove function dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const manualRefresh = useCallback(() => {
    console.log('Manual refresh triggered...');
    refreshActiveTableDataRef.current();
    refreshStatscardPricesRef.current();
    if (isAutoRefreshEnabled) {
      updateCountdown(AUTO_REFRESH_INTERVAL);
    }
  }, [isAutoRefreshEnabled, updateCountdown]);

  return {
    manualRefresh
  };
};
