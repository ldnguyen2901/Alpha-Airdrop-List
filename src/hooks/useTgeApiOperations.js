import { useCallback, useMemo, useRef, useEffect } from 'react';
import { fetchCryptoPrices, fetchTokenLogos, fetchTokenFullInfo, saveStatscardPrices, clearTokenInfoCacheForToken } from '../services';
import { loadTokenLogoFromDatabase, saveTokenLogoToDatabase } from '../services/neon';
import { usePriceTracking } from './usePriceTracking';
import { isMainToken, MAIN_TOKENS } from '../utils';

export const useTgeApiOperations = (
  rows, 
  setBtcPrice, 
  setEthPrice, 
  setBnbPrice, 
  setTokenLogos, 
  updateRow,
  setLoading,
  setLastUpdated
) => {
  // Cache for loaded logos to avoid reloading (TGE specific)
  const loadedLogosCache = useRef(new Set());
  
  // Track loading state to prevent multiple simultaneous refreshes
  const isLoadingRef = useRef(false);
  
  // Initialize price tracking hook for TGE
  const { trackPriceChange, getPriceStats, analyzeTrend } = usePriceTracking();

  // Derived list of api ids for fetching prices (unique, non-empty)
  const ids = useMemo(() => {
    // Ensure rows is an array
    if (!Array.isArray(rows)) {
      console.warn('TGE: rows is not an array:', rows);
      return [];
    }
    
    return Array.from(
      new Set(rows.filter(r => r && r !== null).map((r) => (r.apiId || '').trim()).filter(Boolean)),
    );
  }, [rows]);

  // Load logos from database and fetch missing ones for main tokens
  const loadLogosFromDatabase = useCallback(async () => {
    try {
      const logosFromDB = {};
      
      // Ensure rows is an array
      if (!Array.isArray(rows)) {
        console.warn('TGE: rows is not an array in loadLogosFromDatabase:', rows);
        setTokenLogos(logosFromDB);
        return;
      }
      
      // Get current tokenLogos to avoid reloading existing logos
      const currentTokenLogos = await new Promise(resolve => {
        setTokenLogos(current => {
          resolve(current || {});
          return current || {};
        });
      });
      
      // Load logos for main tokens first
      for (const token of MAIN_TOKENS) {
        if (currentTokenLogos[token.apiId]) {
          logosFromDB[token.apiId] = currentTokenLogos[token.apiId];
          continue;
        }
        
        try {
          const logoData = await loadTokenLogoFromDatabase(token.apiId);
          if (logoData && logoData.logo) {
            logosFromDB[token.apiId] = logoData.logo;
            console.log(`TGE: Loaded logo for ${token.apiId} from database`);
          }
        } catch (error) {
          console.warn(`TGE: Failed to load logo for ${token.apiId} from database:`, error);
        }
      }
      
      // Load logos for other tokens
      for (const row of rows) {
        if (!row || !row.apiId || isMainToken(row.apiId)) continue;
        
        if (currentTokenLogos[row.apiId]) {
          logosFromDB[row.apiId] = currentTokenLogos[row.apiId];
          continue;
        }
        
        try {
          const logoData = await loadTokenLogoFromDatabase(row.apiId);
          if (logoData && logoData.logo) {
            logosFromDB[row.apiId] = logoData.logo;
            console.log(`TGE: Loaded logo for ${row.apiId} from database`);
          }
        } catch (error) {
          console.warn(`TGE: Failed to load logo for ${row.apiId} from database:`, error);
        }
      }
      
      setTokenLogos(logosFromDB);
      console.log(`TGE: Loaded ${Object.keys(logosFromDB).length} logos from database`);
    } catch (error) {
      console.error('TGE: Error loading logos from database:', error);
    }
  }, [rows, setTokenLogos]);

  // Fetch logos for tokens that don't have them
  const fetchMissingLogos = useCallback(async () => {
    try {
      // Ensure rows is an array
      if (!Array.isArray(rows)) {
        console.warn('TGE: rows is not an array in fetchMissingLogos:', rows);
        return;
      }
      
      // Get current tokenLogos
      const currentTokenLogos = await new Promise(resolve => {
        setTokenLogos(current => {
          resolve(current || {});
          return current || {};
        });
      });
      
      // Find tokens without logos
      const tokensWithoutLogos = rows.filter(row => 
        row && 
        row.apiId && 
        !isMainToken(row.apiId) && 
        !currentTokenLogos[row.apiId] &&
        !loadedLogosCache.current.has(row.apiId)
      );
      
      if (tokensWithoutLogos.length === 0) {
        console.log('TGE: All tokens have logos, skipping fetch');
        return;
      }
      
      console.log(`TGE: Fetching logos for ${tokensWithoutLogos.length} tokens`);
      
      // Fetch logos in batches
      const batchSize = 10;
      for (let i = 0; i < tokensWithoutLogos.length; i += batchSize) {
        const batch = tokensWithoutLogos.slice(i, i + batchSize);
        const batchIds = batch.map(row => row.apiId);
        
        try {
          const logos = await fetchTokenLogos(batchIds);
          
          // Update tokenLogos state
          setTokenLogos(prevLogos => {
            const newLogos = { ...prevLogos };
            Object.entries(logos).forEach(([apiId, logo]) => {
              if (logo) {
                newLogos[apiId] = logo;
                loadedLogosCache.current.add(apiId);
                
                // Save to database
                saveTokenLogoToDatabase(apiId, { logo, symbol: batch.find(r => r.apiId === apiId)?.symbol || '', name: batch.find(r => r.apiId === apiId)?.name || '' });
              }
            });
            return newLogos;
          });
          
          console.log(`TGE: Fetched logos for batch ${Math.floor(i / batchSize) + 1}`);
        } catch (error) {
          console.error(`TGE: Error fetching logos for batch ${Math.floor(i / batchSize) + 1}:`, error);
        }
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < tokensWithoutLogos.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('TGE: Error in fetchMissingLogos:', error);
    }
  }, [rows, setTokenLogos]);

  // Refresh statscard prices (BTC, ETH, BNB)
  const refreshStatscardPrices = useCallback(async () => {
    try {
      console.log('TGE: Refreshing statscard prices...');
      const prices = await fetchCryptoPrices(['bitcoin', 'ethereum', 'binancecoin']);
      
      if (prices.bitcoin) {
        setBtcPrice(prices.bitcoin.usd);
        trackPriceChange('bitcoin', prices.bitcoin.usd);
      }
      if (prices.ethereum) {
        setEthPrice(prices.ethereum.usd);
        trackPriceChange('ethereum', prices.ethereum.usd);
      }
      if (prices.binancecoin) {
        setBnbPrice(prices.binancecoin.usd);
        trackPriceChange('binancecoin', prices.binancecoin.usd);
      }
      
      // Save to database
      await saveStatscardPrices(prices);
      
      console.log('TGE: Statscard prices refreshed');
    } catch (error) {
      console.error('TGE: Error refreshing statscard prices:', error);
    }
  }, [setBtcPrice, setEthPrice, setBnbPrice, trackPriceChange]);

  // Refresh single token data
  const refreshSingleToken = useCallback(async (apiId) => {
    if (!apiId) return;
    
    try {
      console.log(`TGE: Refreshing single token: ${apiId}`);
      
      // Fetch full token info including exchanges, chains, categories
      const tokenInfo = await fetchTokenFullInfo(apiId);
      
      if (tokenInfo) {
        // Debug logging for single token refresh
        console.log(`🔍 TGE Single token refresh for ${apiId}:`, {
          ath: tokenInfo.ath,
          atl: tokenInfo.atl,
          contract: tokenInfo.contract,
          contractAddresses: tokenInfo.contractAddresses,
          chains: tokenInfo.chains
        });
        
        // Save logo to database
        if (tokenInfo.logo) {
          try {
            await saveTokenLogoToDatabase(apiId, tokenInfo);
          } catch (error) {
            console.error(`Error saving logo to database for ${apiId}:`, error);
          }
        }
        
        // Find the row with this API ID (with retry mechanism for newly added tokens)
        let rowIndex = rows.findIndex(r => r && r !== null && r.apiId === apiId);
        
        // If not found, wait a bit and try again (for newly added tokens)
        if (rowIndex === -1) {
          console.log(`TGE: Token ${apiId} not found immediately, waiting for state update...`);
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
          rowIndex = rows.findIndex(r => r && r !== null && r.apiId === apiId);
        }
        
        if (rowIndex !== -1) {
          const token = rows[rowIndex];
          
          // Update the row with new data
          updateRow(rowIndex, {
            name: tokenInfo.name || token.name || '',
            symbol: tokenInfo.symbol || token.symbol || '',
            logo: tokenInfo.logo || token.logo || '',
            price: tokenInfo.current_price || token.price || 0,
            ath: tokenInfo.ath || token.ath || 0,
            atl: tokenInfo.atl || token.atl || 0, // Thêm ATL
            contract: tokenInfo.contract || token.contract || '', // Thêm contract
            exchanges: tokenInfo.exchanges || token.exchanges || [],
            chains: tokenInfo.chains || token.chains || [],
            categories: tokenInfo.categories || token.categories || [],
            // Keep other fields unchanged
            launchAt: token.launchAt || '',
            point: token.point || '',
            type: token.type || 'TGE'
          });
          
          // Clear cache for this token to ensure fresh data on next fetch
          clearTokenInfoCacheForToken(apiId);
          
          console.log(`TGE: ✅ Refreshed ${apiId} with full info and saved to database`);
        } else {
          console.warn(`TGE: Token ${apiId} not found in rows after retry`);
        }
      } else {
        console.warn(`TGE: No data received for ${apiId}`);
      }
    } catch (error) {
      console.error(`TGE: Error refreshing single token ${apiId}:`, error);
      // Show user-friendly error message
      let errorMessage = `Failed to refresh token "${apiId}". `;
      if (error.message.includes('Rate limit')) {
        errorMessage += 'API rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message.includes('not found')) {
        errorMessage += 'Token not found on CoinGecko. Please check the API ID.';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'Request timed out. Please check your internet connection.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Network error. Please check your internet connection.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      console.error(errorMessage);
    }
  }, [rows, updateRow]);

  // Refresh all token data
  const refreshData = useCallback(async () => {
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log('TGE: No rows to refresh');
      return;
    }
    
    // Prevent multiple simultaneous refreshes
    if (isLoadingRef.current) {
      console.log('TGE: ⏸️ Refresh already in progress, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    try {
      console.log(`TGE: Refreshing data for ${rows.length} tokens...`);
      
      // Get current tokenLogos to avoid reloading existing logos
      const currentTokenLogos = await new Promise(resolve => {
        setTokenLogos(current => {
          resolve(current || {});
          return current || {};
        });
      });
      
      // Find tokens that need price updates
      const tokensNeedingUpdate = rows.filter(row => 
        row && 
        row !== null && 
        row.apiId && 
        !isMainToken(row.apiId)
      );
      
      if (tokensNeedingUpdate.length === 0) {
        console.log('TGE: No tokens need price updates');
        return;
      }
      
      console.log(`TGE: Updating prices for ${tokensNeedingUpdate.length} tokens`);
      
      // Update prices in batches
      const batchSize = 10;
      for (let i = 0; i < tokensNeedingUpdate.length; i += batchSize) {
        const batch = tokensNeedingUpdate.slice(i, i + batchSize);
        const batchIds = batch.map(row => row.apiId);
        
        try {
          const prices = await fetchCryptoPrices(batchIds);
          
          // Update rows with new prices
          let updatedCount = 0;
          batch.forEach(row => {
            const rowIndex = rows.findIndex(r => r && r !== null && r.apiId === row.apiId);
            if (rowIndex !== -1 && prices[row.apiId]) {
              updateRow(rowIndex, {
                price: prices[row.apiId].usd || row.price || 0,
                // Keep other fields unchanged
                name: row.name || '',
                symbol: row.symbol || '',
                logo: row.logo || '',
                ath: row.ath || 0,
                exchanges: row.exchanges || [],
                chains: row.chains || [],
                categories: row.categories || [],
                launchAt: row.launchAt || '',
                point: row.point || '',
                type: row.type || 'TGE'
              });
              updatedCount++;
            }
          });
          
          console.log(`TGE: Updated prices for batch ${Math.floor(i / batchSize) + 1} (${updatedCount}/${batch.length} tokens)`);
        } catch (error) {
          console.warn(`TGE: Error updating prices for batch ${Math.floor(i / batchSize) + 1}, continuing...`, error);
        }
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < tokensNeedingUpdate.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Update last updated timestamp
      setLastUpdated(new Date().toISOString());
      
      console.log('TGE: Data refresh completed');
    } catch (error) {
      console.error('TGE: Error refreshing data:', error);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [rows, updateRow, setLoading, setLastUpdated, setTokenLogos]);

  // Check and refresh missing prices
  const checkAndRefreshMissingPrices = useCallback(async () => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return false;
    }
    
    // Find tokens with missing prices
    const tokensWithMissingPrices = rows.filter(row => 
      row && 
      row !== null && 
      row.apiId && 
      !isMainToken(row.apiId) && 
      (!row.price || row.price === 0)
    );
    
    if (tokensWithMissingPrices.length === 0) {
      console.log('TGE: No tokens with missing prices');
      return false;
    }
    
    console.log(`TGE: Found ${tokensWithMissingPrices.length} tokens with missing prices, refreshing...`);
    await refreshData();
    return true;
  }, [rows, refreshData]);

  // Fetch full info for all tokens with API IDs
  const fetchAllTokensFullInfo = useCallback(async () => {
    setLoading(true);
    try {
      // Ensure rows is an array
      if (!Array.isArray(rows)) {
        console.warn('TGE: rows is not an array in fetchAllTokensFullInfo:', rows);
        return;
      }
      
      // Find tokens that need full info (have API ID but missing exchanges, chains, categories, contract, or atl)
      const tokensNeedingFullInfo = rows.filter(row => {
        if (!row || row === null || !row.apiId || isMainToken(row.apiId)) {
          return false;
        }
        
        // Check if exchanges field exists and has data
        const hasExchanges = row.exchanges && 
          Array.isArray(row.exchanges) && 
          row.exchanges.length > 0 && 
          row.exchanges.some(ex => ex && ex.trim());
        
        // Check if chains field exists and has data  
        const hasChains = row.chains && 
          Array.isArray(row.chains) && 
          row.chains.length > 0 && 
          row.chains.some(chain => chain && chain.trim());
        
        // Check if categories field exists and has data
        const hasCategories = row.categories && 
          Array.isArray(row.categories) && 
          row.categories.length > 0 && 
          row.categories.some(cat => cat && cat.trim());
        
        // Check if contract field exists and has data
        const hasContract = row.contract && row.contract.trim();
        
        // Check if atl field exists and has data (not 0)
        const hasATL = row.atl && row.atl !== 0;
        
        // Debug logging for each token
        console.log(`TGE Token ${row.apiId}: exchanges=${hasExchanges}, chains=${hasChains}, categories=${hasCategories}, contract=${hasContract}, atl=${hasATL}`);
        
        // Include token if it's missing any of the five fields with meaningful data
        return !(hasExchanges && hasChains && hasCategories && hasContract && hasATL);
      });
      
      if (tokensNeedingFullInfo.length === 0) {
        console.log('TGE: All tokens already have complete full info');
        return;
      }
      
      console.log(`TGE: Found ${tokensNeedingFullInfo.length} tokens needing full info`);
      
      // Limit to 10 tokens per manual fetch
      const MAX_TOKENS_PER_FETCH = 10;
      const tokensToFetch = tokensNeedingFullInfo.slice(0, MAX_TOKENS_PER_FETCH);
      const remainingTokens = tokensNeedingFullInfo.length - MAX_TOKENS_PER_FETCH;
      
      console.log(`TGE: Fetching full info for ${tokensToFetch.length} tokens (${remainingTokens} remaining)`);
      
      // Process in batches
      const BATCH_SIZE = 10;
      const batches = [];
      for (let i = 0; i < tokensToFetch.length; i += BATCH_SIZE) {
        batches.push(tokensToFetch.slice(i, i + BATCH_SIZE));
      }
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        const batchPromises = batch.map(async (token) => {
          try {
            const tokenInfo = await fetchTokenFullInfo(token.apiId);
            if (tokenInfo) {
              const rowIndex = rows.findIndex(r => r && r !== null && r.apiId === token.apiId);
              if (rowIndex !== -1) {
                updateRow(rowIndex, {
                  name: tokenInfo.name || token.name || '',
                  symbol: tokenInfo.symbol || token.symbol || '',
                  logo: tokenInfo.logo || token.logo || '',
                  price: tokenInfo.current_price || token.price || 0,
                  ath: tokenInfo.ath || token.ath || 0,
                  atl: tokenInfo.atl || token.atl || 0, // Thêm ATL
                  contract: tokenInfo.contract || token.contract || '', // Thêm contract
                  exchanges: tokenInfo.exchanges || [],
                  chains: tokenInfo.chains || [],
                  categories: tokenInfo.categories || []
                });
                
                // Clear cache for this token to ensure fresh data on next fetch
                clearTokenInfoCacheForToken(token.apiId);
                
                console.log(`TGE: ✅ Updated ${token.apiId} with full info and saved to database`);
              }
            }
          } catch (error) {
            console.error(`TGE: Error fetching full info for ${token.apiId}:`, error);
          }
        });
        
        await Promise.all(batchPromises);
        
        // Add delay between batches
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log(`TGE: Completed fetching full info for ${tokensToFetch.length} tokens`);
      
    } catch (error) {
      console.error('TGE: Error in fetchAllTokensFullInfo:', error);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [rows, updateRow, setLastUpdated, setLoading]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🔄 TGE component unmounting, cleaning up intervals...');
    };
  }, []);

  return {
    ids,
    loadLogosFromDatabase,
    fetchMissingLogos,
    refreshStatscardPrices,
    refreshSingleToken,
    refreshData,
    checkAndRefreshMissingPrices,
    fetchAllTokensFullInfo,
    trackPriceChange,
    getPriceStats,
    analyzeTrend,
  };
};
