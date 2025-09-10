import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AUTO_REFRESH_INTERVAL } from '../utils/constants';

const AutoRefreshContext = createContext();

export const useAutoRefreshContext = () => {
  const context = useContext(AutoRefreshContext);
  if (!context) {
    throw new Error('useAutoRefreshContext must be used within an AutoRefreshProvider');
  }
  return context;
};

export const AutoRefreshProvider = ({ children }) => {
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL);
  const [errorCount, setErrorCount] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Refs to store refresh functions from both sections
  const airdropRefreshDataRef = useRef(null);
  const airdropRefreshStatscardRef = useRef(null);
  const tgeRefreshDataRef = useRef(null);
  const tgeRefreshStatscardRef = useRef(null);

  // Timer refs
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // Convert seconds to milliseconds
  const REFRESH_INTERVAL_MS = AUTO_REFRESH_INTERVAL * 1000;

  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(prev => !prev);
    console.log('Auto-refresh toggled:', !isAutoRefreshEnabled);
  };

  const updateCountdown = (newCountdown) => {
    setCountdown(newCountdown);
  };

  const incrementErrorCount = () => {
    setErrorCount(prev => prev + 1);
  };

  const resetErrorCount = () => {
    setErrorCount(0);
  };

  // Register refresh functions from sections
  const registerAirdropRefresh = useCallback((refreshData, refreshStatscard) => {
    airdropRefreshDataRef.current = refreshData;
    airdropRefreshStatscardRef.current = refreshStatscard;
    console.log('🔄 Registered Airdrop refresh functions');
  }, []);

  const registerTgeRefresh = useCallback((refreshData, refreshStatscard) => {
    tgeRefreshDataRef.current = refreshData;
    tgeRefreshStatscardRef.current = refreshStatscard;
    console.log('🔄 Registered TGE refresh functions');
  }, []);

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
  }, []);

  // Countdown effect
  useEffect(() => {
    if (!isAutoRefreshEnabled || !isPageVisible) {
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
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
  }, [isAutoRefreshEnabled, isPageVisible]);

  // Centralized auto refresh effect - refresh both sections
  useEffect(() => {
    if (!isAutoRefreshEnabled || !isPageVisible) {
      return;
    }

    timerRef.current = setInterval(() => {
      console.log('🔄 Centralized auto refresh: refreshing both Airdrop and TGE...');
      
      // Refresh Airdrop if functions are registered
      if (airdropRefreshDataRef.current && airdropRefreshStatscardRef.current) {
        console.log('🔄 Refreshing Airdrop data...');
        airdropRefreshDataRef.current();
        airdropRefreshStatscardRef.current();
      }
      
      // Refresh TGE if functions are registered
      if (tgeRefreshDataRef.current && tgeRefreshStatscardRef.current) {
        console.log('🔄 Refreshing TGE data...');
        tgeRefreshDataRef.current();
        tgeRefreshStatscardRef.current();
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAutoRefreshEnabled, isPageVisible]);

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
    console.log('🔄 Manual refresh triggered for both sections...');
    
    // Refresh Airdrop if functions are registered
    if (airdropRefreshDataRef.current && airdropRefreshStatscardRef.current) {
      console.log('🔄 Manual refresh: Airdrop');
      airdropRefreshDataRef.current();
      airdropRefreshStatscardRef.current();
    }
    
    // Refresh TGE if functions are registered
    if (tgeRefreshDataRef.current && tgeRefreshStatscardRef.current) {
      console.log('🔄 Manual refresh: TGE');
      tgeRefreshDataRef.current();
      tgeRefreshStatscardRef.current();
    }
    
    if (isAutoRefreshEnabled) {
      setCountdown(AUTO_REFRESH_INTERVAL);
    }
  }, [isAutoRefreshEnabled]);

  const value = {
    isAutoRefreshEnabled,
    countdown,
    toggleAutoRefresh,
    updateCountdown,
    errorCount,
    incrementErrorCount,
    resetErrorCount,
    registerAirdropRefresh,
    registerTgeRefresh,
    manualRefresh
  };

  return (
    <AutoRefreshContext.Provider value={value}>
      {children}
    </AutoRefreshContext.Provider>
  );
};
