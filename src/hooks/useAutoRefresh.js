import { useEffect, useRef } from 'react';
import { AUTO_REFRESH_INTERVAL, STATSCARD_REFRESH_INTERVAL } from '../utils/constants';

// Convert seconds to milliseconds
const TABLE_REFRESH_INTERVAL_MS = AUTO_REFRESH_INTERVAL * 1000;
const STATSCARD_REFRESH_INTERVAL_MS = STATSCARD_REFRESH_INTERVAL * 1000;

export const useAutoRefresh = (
  refreshData,
  refreshStatscardPrices,
  isPageVisible,
  setIsPageVisible,
  timerRef
) => {
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

  // Auto refresh for table data (30 seconds)
  useEffect(() => {
    if (!isPageVisible) {
      return;
    }

    const interval = setInterval(() => {
      console.log('Auto refreshing table data...');
      refreshData();
    }, TABLE_REFRESH_INTERVAL_MS);

    timerRef.current = interval;

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [refreshData, isPageVisible, timerRef]);

  // Auto refresh for statscard prices (5 minutes)
  useEffect(() => {
    if (!isPageVisible) {
      return;
    }

    const statscardInterval = setInterval(() => {
      console.log('Auto refreshing statscard prices...');
      refreshStatscardPrices();
    }, STATSCARD_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(statscardInterval);
    };
  }, [refreshStatscardPrices, isPageVisible]);
};
