import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { fetchCryptoPrices } from '../services/api';
import { savePriceCache, loadPriceCache, clearPriceCache, isCacheValid } from '../utils';

const GlobalPriceContext = createContext();

export const useGlobalPriceContext = () => {
  const context = useContext(GlobalPriceContext);
  if (!context) {
    throw new Error('useGlobalPriceContext must be used within a GlobalPriceProvider');
  }
  return context;
};

export const GlobalPriceProvider = ({ children }) => {
  // Global price state
  const [globalPrices, setGlobalPrices] = useState({});
  const [statscardPrices, setStatscardPrices] = useState({
    btc: 45000,
    eth: 3000,
    bnb: 300
  });
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refs for tracking
  const refreshCountRef = useRef(0);
  const errorCountRef = useRef(0);

  // Load cached prices on initialization
  useEffect(() => {
    const cachedData = loadPriceCache();
    if (cachedData && isCacheValid(cachedData)) {
      console.log('📦 Loading cached prices on initialization');
      setGlobalPrices(cachedData.prices);
      
      // Update statscard prices from cache
      const cachedStatscardPrices = {
        btc: cachedData.prices.bitcoin?.usd || 45000,
        eth: cachedData.prices.ethereum?.usd || 3000,
        bnb: cachedData.prices.binancecoin?.usd || 300
      };
      setStatscardPrices(cachedStatscardPrices);
      
      // Set last refresh time from cache
      setLastRefreshTime(new Date(cachedData.timestamp).toISOString());
    }
  }, []);

  // Get all unique API IDs from all sections
  const getAllApiIds = useCallback((airdropTokens = [], tgeTokens = []) => {
    const allIds = new Set();
    
    // Add statscard tokens
    allIds.add('bitcoin');
    allIds.add('ethereum');
    allIds.add('binancecoin');
    
    // Add airdrop tokens
    airdropTokens.forEach(token => {
      if (token.apiId && token.apiId.trim()) {
        allIds.add(token.apiId.trim());
      }
    });
    
    // Add TGE tokens
    tgeTokens.forEach(token => {
      if (token.apiId && token.apiId.trim()) {
        allIds.add(token.apiId.trim());
      }
    });
    
    return Array.from(allIds);
  }, []);

  // Unified refresh function - fetch all prices in one go
  const refreshAllPrices = useCallback(async (airdropTokens = [], tgeTokens = []) => {
    if (isRefreshing) {
      console.log('🔄 Refresh already in progress, skipping...');
      return;
    }

    setIsRefreshing(true);
    refreshCountRef.current += 1;
    
    try {
      console.log(`🔄 [${new Date().toISOString()}] Starting unified price refresh (attempt #${refreshCountRef.current})...`);
      
      // Get all unique API IDs
      const allApiIds = getAllApiIds(airdropTokens, tgeTokens);
      console.log(`📊 Fetching prices for ${allApiIds.length} unique tokens...`);
      
      // Fetch all prices in one API call
      const allPrices = await fetchCryptoPrices(allApiIds);
      console.log(`✅ Received prices for ${Object.keys(allPrices).length} tokens`);
      
      // SUCCESS: Clear old cache and save new cache
      if (allPrices && Object.keys(allPrices).length > 0) {
        console.log('🗑️ Clearing old cache and saving new prices');
        clearPriceCache();
        savePriceCache(allPrices);
        
        // Update global prices
        setGlobalPrices(allPrices);
        
        // Update statscard prices
        const newStatscardPrices = {
          btc: allPrices.bitcoin?.usd || statscardPrices.btc,
          eth: allPrices.ethereum?.usd || statscardPrices.eth,
          bnb: allPrices.binancecoin?.usd || statscardPrices.bnb
        };
        setStatscardPrices(newStatscardPrices);
        
        // Update last refresh time
        setLastRefreshTime(new Date().toISOString());
        
        // Reset error count on success
        errorCountRef.current = 0;
        
        console.log(`🎉 Unified price refresh completed successfully!`);
        console.log(`📊 Statscard prices: BTC=$${newStatscardPrices.btc}, ETH=$${newStatscardPrices.eth}, BNB=$${newStatscardPrices.bnb}`);
        
        return allPrices;
      } else {
        throw new Error('No prices received from API');
      }
      
    } catch (error) {
      errorCountRef.current += 1;
      console.error(`❌ Error in unified price refresh (attempt #${refreshCountRef.current}):`, error);
      
      // FAILURE: Use cached prices as fallback
      const cachedData = loadPriceCache();
      if (cachedData && isCacheValid(cachedData)) {
        console.log('📦 Using cached prices due to API failure');
        
        // Update global prices from cache
        setGlobalPrices(cachedData.prices);
        
        // Update statscard prices from cache
        const cachedStatscardPrices = {
          btc: cachedData.prices.bitcoin?.usd || statscardPrices.btc,
          eth: cachedData.prices.ethereum?.usd || statscardPrices.eth,
          bnb: cachedData.prices.binancecoin?.usd || statscardPrices.bnb
        };
        setStatscardPrices(cachedStatscardPrices);
        
        return cachedData.prices;
      } else {
        console.warn('⚠️ No valid cache available, keeping current prices');
        return globalPrices;
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, getAllApiIds, statscardPrices, globalPrices]);

  // Get price for specific token
  const getTokenPrice = useCallback((apiId) => {
    if (!apiId) return 0;
    return globalPrices[apiId]?.usd || 0;
  }, [globalPrices]);

  // Get statscard price
  const getStatscardPrice = useCallback((token) => {
    switch (token) {
      case 'btc':
      case 'bitcoin':
        return statscardPrices.btc;
      case 'eth':
      case 'ethereum':
        return statscardPrices.eth;
      case 'bnb':
      case 'binancecoin':
        return statscardPrices.bnb;
      default:
        return 0;
    }
  }, [statscardPrices]);

  // Check if prices are fresh (less than 2 minutes old)
  const arePricesFresh = useCallback(() => {
    if (!lastRefreshTime) return false;
    const age = Date.now() - new Date(lastRefreshTime).getTime();
    return age < 2 * 60 * 1000; // 2 minutes
  }, [lastRefreshTime]);

  // Get refresh statistics
  const getRefreshStats = useCallback(() => {
    return {
      refreshCount: refreshCountRef.current,
      errorCount: errorCountRef.current,
      lastRefreshTime,
      isRefreshing,
      totalTokens: Object.keys(globalPrices).length,
      arePricesFresh: arePricesFresh()
    };
  }, [lastRefreshTime, isRefreshing, globalPrices, arePricesFresh]);

  const value = {
    // State
    globalPrices,
    statscardPrices,
    lastRefreshTime,
    isRefreshing,
    
    // Actions
    refreshAllPrices,
    getTokenPrice,
    getStatscardPrice,
    arePricesFresh,
    getRefreshStats,
    
    // Setters for external updates
    setGlobalPrices,
    setStatscardPrices
  };

  return (
    <GlobalPriceContext.Provider value={value}>
      {children}
    </GlobalPriceContext.Provider>
  );
};
