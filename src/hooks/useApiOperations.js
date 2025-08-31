import { useCallback, useMemo } from 'react';
import { fetchCryptoPrices, fetchTokenLogos, fetchTokenInfo, saveStatscardPrices } from '../services';
import { usePriceTracking } from './usePriceTracking';
import { MAIN_TOKENS, isMainToken } from '../utils/helpers';

export const useApiOperations = (
  rows, 
  setBtcPrice, 
  setEthPrice, 
  setBnbPrice, 
  setTokenLogos, 
  updateRow,
  setLoading,
  setLastUpdated
) => {
  // Initialize price tracking hook
  const { trackPriceChange, getPriceStats, analyzeTrend } = usePriceTracking();

  // Derived list of api ids for fetching prices (unique, non-empty)
  const ids = useMemo(() => {
    // Ensure rows is an array
    if (!Array.isArray(rows)) {
      console.warn('rows is not an array:', rows);
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
        console.warn('rows is not an array in loadLogosFromDatabase:', rows);
        setTokenLogos(logosFromDB);
        return;
      }
      
      // Load logos from database (rows) - exclude main tokens from table data
      rows.filter(r => r && r !== null && !isMainToken(r.apiId)).forEach(row => {
        if (row.apiId && row.logo) {
          logosFromDB[row.apiId] = {
            logo: row.logo,
            symbol: row.symbol || '',
            name: row.name || ''
          };
        }
      });
      
      // Fetch missing logos for main tokens (BTC, ETH, BNB) - only for statscard display
      const missingMainTokens = MAIN_TOKENS.filter(id => !logosFromDB[id] || !logosFromDB[id].logo);
      
      if (missingMainTokens.length > 0) {
        try {
          const fetchedLogos = await fetchTokenLogos(missingMainTokens);
          
          // Only update logos for statscard display, don't update table rows
          for (const tokenId of missingMainTokens) {
            if (fetchedLogos[tokenId]) {
              // Don't update table rows for main tokens - they should not be in shared-workspace
              // Just add to logos for statscard display
            }
          }
          
          // Merge fetched logos into logosFromDB for statscard display
          Object.assign(logosFromDB, fetchedLogos);
        } catch (error) {
          console.error('Failed to fetch main token logos:', error);
        }
      }
      
      setTokenLogos(logosFromDB);
    } catch (e) {
      console.error('loadLogosFromDatabase error', e);
    }
  }, [rows, setTokenLogos]);

  // Auto fetch token info when API ID is entered
  const fetchAndUpdateTokenInfo = useCallback(async (apiId, rowIndex) => {
    if (!apiId || !apiId.trim()) return;
    
    // Prevent updating main tokens (BTC, ETH, BNB)
    if (isMainToken(apiId.trim())) {
      console.log('Skipping main token update:', apiId);
      return;
    }
    
    // Validate API ID format - allow alphanumeric, hyphens, underscores, and question mark for hidden tokens
    const validApiIdPattern = /^[a-zA-Z0-9_\-?]+$/;
    if (!validApiIdPattern.test(apiId.trim())) {
      return;
    }
    
    // Additional validation - prevent common invalid inputs (but allow ? for hidden tokens)
    const invalidInputs = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', '[', ']', '{', '}', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '/'];
    if (invalidInputs.some(char => apiId.includes(char))) {
      return;
    }

    try {
      const tokenInfo = await fetchTokenInfo(apiId.trim());
      if (tokenInfo) {
        updateRow(rowIndex, {
          name: tokenInfo.name || '',
          symbol: tokenInfo.symbol || '',
          logo: tokenInfo.logo || '',
          ath: tokenInfo.ath || 0, // ⭐ (thêm mới)
          price: tokenInfo.current_price || 0 // ⭐ (thêm mới)
        });
      }
    } catch (error) {
      console.error('Error fetching token info:', error);
    }
  }, [updateRow]);

  // Refresh statscard prices only (BTC, ETH, BNB)
  const refreshStatscardPrices = useCallback(async () => {
    try {
      // Fetch main crypto prices for statscard only
      const prices = await fetchCryptoPrices(MAIN_TOKENS);
      
      // Update statscard prices
      const btcPrice = prices.bitcoin?.usd || 0;
      const ethPrice = prices.ethereum?.usd || 0;
      const bnbPrice = prices.binancecoin?.usd || 0;
      
      setBtcPrice(btcPrice);
      setEthPrice(ethPrice);
      setBnbPrice(bnbPrice);
      
      // Update statscard prices in Neon
      try {
        const updatedStatscardData = [
          {
            apiId: 'bitcoin',
            symbol: 'BTC',
            logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
            current_price: btcPrice
          },
          {
            apiId: 'ethereum',
            symbol: 'ETH',
            logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
            current_price: ethPrice
          },
          {
            apiId: 'binancecoin',
            symbol: 'BNB',
            logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
            current_price: bnbPrice
          }
        ];
        
        await saveStatscardPrices(updatedStatscardData);
        console.log('Statscard prices updated in Neon');
      } catch (error) {
        console.error('Error updating statscard prices in Neon:', error);
      }
    } catch (error) {
      console.error('Error refreshing statscard prices:', error);
    }
  }, [setBtcPrice, setEthPrice, setBnbPrice]);

  // Refresh data function with optimized strategy (table data only, excluding statscard)
  const refreshData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Step 1: Optimized token data fetching strategy - exclude main tokens
      const filteredIds = ids.filter(id => !isMainToken(id));
      
      if (filteredIds.length > 0) {
        // Ensure rows is an array before processing
        if (!Array.isArray(rows)) {
          console.warn('rows is not an array in refreshData:', rows);
          return;
        }

        // Classify tokens by completion status - exclude main tokens
        const incompleteTokens = rows.filter(r => r && r !== null && !isMainToken(r.apiId) && (!r.symbol || !r.logo));
        const completeTokens = rows.filter(r => r && r !== null && !isMainToken(r.apiId) && r.symbol && r.logo);
        
        console.log(`📊 Status: ${incompleteTokens.length} incomplete, ${completeTokens.length} complete tokens (excluding main tokens)`);

        // Step 1a: Fetch full data for incomplete tokens (priority)
        if (incompleteTokens.length > 0) {
          console.log('🔄 Step 1: Fetching full data for incomplete tokens...');
          for (const token of incompleteTokens) {
            try {
              const tokenInfo = await fetchTokenInfo(token.apiId);
              if (tokenInfo) {
                const currentPrice = tokenInfo.current_price;
                const reward = currentPrice * token.amount;
                
                // Use optimized price tracking algorithm
                const trackingResult = trackPriceChange(
                  token.apiId, 
                  currentPrice, 
                  token.price || 0, 
                  token.highestPrice || 0
                );
                
                // Get additional price statistics
                const priceStats = getPriceStats(token.apiId);
                const trend = analyzeTrend(token.apiId);
                
                // Update row with complete data
                const rowIndex = rows.findIndex(r => r && r !== null && r.apiId === token.apiId);
                if (rowIndex !== -1) {
                  updateRow(rowIndex, {
                    name: tokenInfo.name || '',
                    symbol: tokenInfo.symbol || '',
                    logo: tokenInfo.logo || '',
                    price: currentPrice,
                    reward,
                    ath: tokenInfo.ath || 0,
                    ...(trackingResult.priceChanged && trackingResult.highestPrice && { highestPrice: trackingResult.highestPrice })
                  });
                }
              }
            } catch (error) {
              console.error(`Error fetching token info for ${token.apiId}:`, error);
            }
          }
        }

        // Step 1b: Update prices for complete tokens (efficient)
        if (completeTokens.length > 0) {
          console.log('💰 Step 2: Updating prices for complete tokens...');
          const completeApiIds = completeTokens.map(t => t.apiId);
          const tokenPrices = await fetchCryptoPrices(completeApiIds);
          
          completeTokens.forEach((token) => {
            if (token.apiId && tokenPrices[token.apiId]) {
              const currentPrice = tokenPrices[token.apiId].usd;
              const reward = currentPrice * token.amount;
              
              // Use optimized price tracking algorithm
              const trackingResult = trackPriceChange(
                token.apiId, 
                currentPrice, 
                token.price || 0, 
                token.highestPrice || 0
              );
              
              // Get additional price statistics
              const priceStats = getPriceStats(token.apiId);
              const trend = analyzeTrend(token.apiId);
              
              // Update row with new price data and ATH
              const rowIndex = rows.findIndex(r => r && r !== null && r.apiId === token.apiId);
              if (rowIndex !== -1) {
                updateRow(rowIndex, {
                  price: currentPrice,
                  reward,
                  ath: tokenPrices[token.apiId].ath || token.ath || 0,
                  ...(trackingResult.priceChanged && trackingResult.highestPrice && { highestPrice: trackingResult.highestPrice })
                });
              }
            }
          });
        }
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error in refreshData:', error);
    } finally {
      setLoading(false);
    }
  }, [ids, rows, updateRow, setLastUpdated, setLoading, trackPriceChange, getPriceStats, analyzeTrend]);

  return {
    ids,
    loadLogosFromDatabase,
    fetchAndUpdateTokenInfo,
    refreshData,
    refreshStatscardPrices,
  };
};
