import { useEffect, useRef } from 'react';

export const useAutoRefresh = (
  refreshData,
  isPageVisible,
  setIsPageVisible,
  timerRef,
  refreshSec = 60
) => {
  const refreshDataRef = useRef(refreshData);

  // Update ref when refreshData changes
  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      
      if (isVisible) {
        // Page became visible, refresh data immediately
        refreshDataRef.current();
        
        // Restart timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
          refreshDataRef.current();
        }, refreshSec * 1000);
      } else {
        // Page became hidden, clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial setup
    if (isPageVisible) {
      // Start timer if page is visible
      timerRef.current = setInterval(() => {
        refreshDataRef.current();
      }, refreshSec * 1000);
    }

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPageVisible, setIsPageVisible, timerRef, refreshSec]);
};
