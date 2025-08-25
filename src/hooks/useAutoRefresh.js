import { useEffect, useRef } from 'react';

export const useAutoRefresh = (
  refreshData,
  isPageVisible,
  setIsPageVisible,
  timerRef,
  refreshSec = 60
) => {
  const refreshDataRef = useRef(refreshData);
  const isInitializedRef = useRef(false);
  const refreshSecRef = useRef(refreshSec);

  // Update refs when props change
  useEffect(() => {
    refreshDataRef.current = refreshData;
    refreshSecRef.current = refreshSec;
  }, [refreshData, refreshSec]);



  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      
      if (isVisible) {
        // Page became visible, refresh data immediately only if not initial load
        if (isInitializedRef.current) {
          refreshDataRef.current();
        }
        
        // Restart timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
          refreshDataRef.current();
        }, refreshSecRef.current * 1000);
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

    // Initial setup - only start timer, don't refresh immediately
    if (isPageVisible && !isInitializedRef.current) {
      isInitializedRef.current = true;
      // Start timer if page is visible
      timerRef.current = setInterval(() => {
        refreshDataRef.current();
      }, refreshSecRef.current * 1000);
    }

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPageVisible, setIsPageVisible, timerRef]); // Remove refreshSec dependency to prevent timer restart
};
