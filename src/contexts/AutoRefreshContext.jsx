import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AUTO_REFRESH_INTERVAL } from '../utils/constants';
import { useGlobalPriceContext } from './GlobalPriceContext';

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

  // Get global price context
  const globalPriceContext = useGlobalPriceContext();

  // Refs to store token data from both sections
  const airdropTokensRef = useRef([]);
  const tgeTokensRef = useRef([]);

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

  // Register token data from sections
  const registerAirdropTokens = useCallback((tokens) => {
    const tokenCount = tokens ? tokens.length : 0;
    // Always update tokens to ensure we have the latest data
    airdropTokensRef.current = tokens || [];
    // console.log(`🔄 Registered ${tokenCount} Airdrop tokens`); // Commented out to reduce console spam
  }, []);

  const registerTgeTokens = useCallback((tokens) => {
    const tokenCount = tokens ? tokens.length : 0;
    // Always update tokens to ensure we have the latest data
    tgeTokensRef.current = tokens || [];
    // console.log(`🔄 Registered ${tokenCount} TGE tokens`); // Commented out to reduce console spam
  }, []);

  // Handle page visibility changes - with production fallback
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      
      // Always log for debugging (even in production)
      if (typeof window !== 'undefined') {
        console.log('Page visibility changed:', isVisible ? 'visible' : 'hidden');
      }
    };

    // Initialize page visibility state
    setIsPageVisible(!document.hidden);
    
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

  // Centralized auto refresh effect - refresh all prices in one go
  useEffect(() => {
    if (!isAutoRefreshEnabled) {
      return;
    }

    // Production fallback: Always run auto-refresh regardless of page visibility
    // This ensures auto-refresh works on Vercel production
    const shouldRunRefresh = isPageVisible || process.env.NODE_ENV === 'production';
    
    if (!shouldRunRefresh) {
      return;
    }

    timerRef.current = setInterval(async () => {
      // Enhanced logging for production debugging
      const timestamp = new Date().toISOString();
      console.log(`🔄 [${timestamp}] Unified auto refresh: fetching all prices...`);
      
      try {
        // Get all tokens from both sections
        const allAirdropTokens = airdropTokensRef.current || [];
        const allTgeTokens = tgeTokensRef.current || [];
        
        console.log(`📊 Refreshing prices for ${allAirdropTokens.length} Airdrop + ${allTgeTokens.length} TGE tokens`);
        
        // Use global price context to refresh all prices in one API call
        await globalPriceContext.refreshAllPrices(allAirdropTokens, allTgeTokens);
        
        console.log(`✅ [${timestamp}] Unified auto refresh completed successfully`);
        
        // Reset error count on success
        setErrorCount(0);
        
        // Reset countdown to sync with auto refresh cycle
        setCountdown(AUTO_REFRESH_INTERVAL);
        
      } catch (error) {
        console.error(`❌ [${timestamp}] Error in unified auto refresh:`, error);
        setErrorCount(prev => prev + 1);
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAutoRefreshEnabled, isPageVisible, globalPriceContext]);

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

  const manualRefresh = useCallback(async () => {
    const timestamp = new Date().toISOString();
    console.log(`🔄 [${timestamp}] Manual refresh triggered for all sections...`);
    
    try {
      // Get all tokens from both sections
      const allAirdropTokens = airdropTokensRef.current || [];
      const allTgeTokens = tgeTokensRef.current || [];
      
      console.log(`📊 Manual refresh: ${allAirdropTokens.length} Airdrop + ${allTgeTokens.length} TGE tokens`);
      
      // Use global price context to refresh all prices in one API call
      await globalPriceContext.refreshAllPrices(allAirdropTokens, allTgeTokens);
      
      console.log(`✅ [${timestamp}] Manual refresh completed successfully`);
      
      if (isAutoRefreshEnabled) {
        setCountdown(AUTO_REFRESH_INTERVAL);
      }
      
    } catch (error) {
      console.error(`❌ [${timestamp}] Error in manual refresh:`, error);
      setErrorCount(prev => prev + 1);
    }
  }, [isAutoRefreshEnabled, globalPriceContext]);

  const value = {
    isAutoRefreshEnabled,
    countdown,
    toggleAutoRefresh,
    updateCountdown,
    errorCount,
    incrementErrorCount,
    resetErrorCount,
    registerAirdropTokens,
    registerTgeTokens,
    manualRefresh
  };

  return (
    <AutoRefreshContext.Provider value={value}>
      {children}
    </AutoRefreshContext.Provider>
  );
};
