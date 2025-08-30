import { useEffect, useRef, useState } from 'react';

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
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(() => {
    const saved = localStorage.getItem('autoRefreshEnabled');
    return saved === null ? true : saved === 'true'; // Default to enabled
  });

  // Update refs when props change
  useEffect(() => {
    refreshDataRef.current = refreshData;
    refreshSecRef.current = refreshSec;
  }, [refreshData, refreshSec]);



  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      
      if (isVisible && isAutoRefreshEnabled) {
        // Page became visible, refresh data immediately only if not initial load
        if (isInitializedRef.current) {
          refreshDataRef.current();
        }
        
        // Restart timer only if auto refresh is enabled
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
          refreshDataRef.current();
        }, refreshSecRef.current * 1000);
      } else {
        // Page became hidden or auto refresh disabled, clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial setup - only start timer if auto refresh is enabled
    if (isPageVisible && !isInitializedRef.current && isAutoRefreshEnabled) {
      isInitializedRef.current = true;
      // Start timer if page is visible and auto refresh is enabled
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
}, [isPageVisible, setIsPageVisible, timerRef, isAutoRefreshEnabled]); // Add isAutoRefreshEnabled dependency

// Function to handle auto refresh toggle
const handleAutoRefreshToggle = (enabled) => {
  setIsAutoRefreshEnabled(enabled);
  
  if (enabled && isPageVisible) {
    // Enable auto refresh - start timer if page is visible
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      refreshDataRef.current();
    }, refreshSecRef.current * 1000);
  } else {
    // Disable auto refresh - clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }
};

// Return state and handler
return {
  isAutoRefreshEnabled,
  handleAutoRefreshToggle
};
};
