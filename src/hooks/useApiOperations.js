import { useCallback, useMemo, useRef } from 'react';
import { fetchCryptoPrices, fetchTokenLogos, fetchTokenInfo, saveStatscardPrices } from '../services';
import { loadTokenLogoFromDatabase, saveTokenLogoToDatabase } from '../services/neon';
import { usePriceTracking } from './usePriceTracking';
import { isMainToken, MAIN_TOKENS } from '../utils';

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
  
  // Cache for loaded logos to avoid reloading
  const loadedLogosCache = useRef(new Set());

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
      
      // Get current tokenLogos to avoid reloading existing logos
      const currentTokenLogos = await new Promise(resolve => {
        setTokenLogos(current => {
          resolve(current);
          return current;
        });
      });
      
      // Load logos from actual database for each token (only if not already loaded)
      const tokenIds = rows
        .filter(r => r && r !== null && !isMainToken(r.apiId) && r.apiId)
        .map(r => r.apiId);
      
      // Only load logos for tokens that don't already have logos and haven't been loaded before
      const tokensNeedingLogos = tokenIds.filter(tokenId => 
        (!currentTokenLogos[tokenId] || !currentTokenLogos[tokenId].logo) && 
        !loadedLogosCache.current.has(tokenId)
      );
      
      if (tokensNeedingLogos.length > 0) {
        for (const tokenId of tokensNeedingLogos) {
          try {
            const logoData = await loadTokenLogoFromDatabase(tokenId);
            if (logoData && logoData.logo) {
              logosFromDB[tokenId] = {
                logo: logoData.logo,
                symbol: logoData.symbol || '',
                name: logoData.name || ''
              };
              // Mark as loaded in cache
              loadedLogosCache.current.add(tokenId);
            }
          } catch (error) {
            console.error(`Error loading logo for ${tokenId}:`, error);
          }
        }
      }
      
      // Merge with existing logos
      Object.assign(logosFromDB, currentTokenLogos);
      
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
    if (invalidInputs.some(char => apiId && apiId.includes(char))) {
      return;
    }

    try {
      const tokenInfo = await fetchTokenInfo(apiId.trim());
      if (tokenInfo) {
        // Save logo to database
        if (tokenInfo.logo) {
          try {
            await saveTokenLogoToDatabase(apiId.trim(), tokenInfo);
          } catch (error) {
            console.error(`Error saving logo to database for ${apiId.trim()}:`, error);
          }
        }
        
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
      console.log('🔄 Starting data refresh with optimized API strategy...');
      
      // Step 1: Optimized token data fetching strategy - exclude main tokens
      const filteredIds = ids.filter(id => !isMainToken(id));
      
      if (filteredIds.length > 0) {
        // Ensure rows is an array before processing
        if (!Array.isArray(rows)) {
          console.warn('rows is not an array in refreshData:', rows);
          return;
        }

        // Classify tokens by completion status - exclude main tokens
        // Incomplete tokens: missing basic info (name, symbol, logo)
        const incompleteTokens = rows.filter(r => r && r !== null && !isMainToken(r.apiId) && (!r.name || !r.symbol || !r.logo));
        // Complete tokens: have basic info but may need price update
        const completeTokens = rows.filter(r => r && r !== null && !isMainToken(r.apiId) && r.name && r.symbol && r.logo);
        // Price-only tokens: have basic info but need price fetch
        const priceOnlyTokens = rows.filter(r => r && r !== null && !isMainToken(r.apiId) && r.name && r.symbol && (!r.price || r.price === 0));
        
        console.log(`📊 Refresh Status: ${incompleteTokens.length} incomplete, ${completeTokens.length} complete, ${priceOnlyTokens.length} price-only tokens (excluding main tokens)`);

        // Step 1a: Fetch full data for incomplete tokens (priority)
        if (incompleteTokens.length > 0) {
          console.log(`🔄 Step 1: Fetching full data for ${incompleteTokens.length} incomplete tokens...`);
          for (const token of incompleteTokens) {
            try {
              console.log(`📥 Fetching full info for: ${token.apiId}`);
              const tokenInfo = await fetchTokenInfo(token.apiId);
              if (tokenInfo) {
                const currentPrice = tokenInfo.current_price;
                
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
                
                // Save logo to database
                if (tokenInfo.logo) {
                  try {
                    await saveTokenLogoToDatabase(token.apiId, tokenInfo);
                  } catch (error) {
                    console.error(`Error saving logo to database for ${token.apiId}:`, error);
                  }
                }
                
                // Update row with complete data
                const rowIndex = rows.findIndex(r => r && r !== null && r.apiId === token.apiId);
                if (rowIndex !== -1) {
                  updateRow(rowIndex, {
                    name: tokenInfo.name || '',
                    symbol: tokenInfo.symbol || '',
                    logo: tokenInfo.logo || '',
                    price: currentPrice,
                    ath: tokenInfo.ath || 0,
                    ...(trackingResult.priceChanged && trackingResult.highestPrice && { highestPrice: trackingResult.highestPrice })
                  });
                  
                  // Price updated successfully (no log needed)
                }
              } else {
                console.warn(`⚠️ No data received for token: ${token.apiId}`);
              }
            } catch (error) {
              console.error(`❌ Error fetching token info for ${token.apiId}:`, error);
            }
          }
          
          console.log(`✅ Step 1 completed: ${incompleteTokens.length} incomplete tokens processed`);
        }

        // Step 1b: Fetch prices for price-only tokens
        if (priceOnlyTokens.length > 0) {
          console.log(`💰 Step 1b: Fetching prices for ${priceOnlyTokens.length} price-only tokens...`);
          const priceOnlyApiIds = priceOnlyTokens.map(t => t.apiId);
          
          const tokenPrices = await fetchCryptoPrices(priceOnlyApiIds);
          console.log(`📊 Received prices for ${Object.keys(tokenPrices).length} price-only tokens`);
          
          let updatedCount = 0;
          priceOnlyTokens.forEach((token) => {
            if (token.apiId && tokenPrices[token.apiId]) {
              const currentPrice = tokenPrices[token.apiId].usd;
              
              // Use optimized price tracking algorithm
              const trackingResult = trackPriceChange(
                token.apiId, 
                currentPrice, 
                token.price || 0, 
                token.highestPrice || 0
              );
              
              // Update row with new price data
              const rowIndex = rows.findIndex(r => r && r !== null && r.apiId === token.apiId);
              if (rowIndex !== -1) {
                updateRow(rowIndex, {
                  price: currentPrice,
                  ...(trackingResult.priceChanged && trackingResult.highestPrice && { highestPrice: trackingResult.highestPrice })
                });
                
                updatedCount++;
                // Price updated successfully (no log needed)
              }
            } else {
              console.warn(`⚠️ No price data for price-only token: ${token.apiId}`);
            }
          });
          
          console.log(`✅ Step 1b completed: ${updatedCount}/${priceOnlyTokens.length} price-only tokens updated`);
        }

        // Step 2: Update prices for complete tokens (efficient) - exclude price-only tokens to avoid duplicates
        const completeTokensWithPrice = completeTokens.filter(token => token.price && token.price > 0);
        if (completeTokensWithPrice.length > 0) {
          console.log(`💰 Step 2: Updating prices for ${completeTokensWithPrice.length} complete tokens with existing prices...`);
          const completeApiIds = completeTokensWithPrice.map(t => t.apiId);
          console.log(`📦 Fetching prices for ${completeApiIds.length} complete tokens...`);
          
          const tokenPrices = await fetchCryptoPrices(completeApiIds);
          console.log(`📊 Received prices for ${Object.keys(tokenPrices).length} tokens`);
          
          let updatedCount = 0;
          completeTokensWithPrice.forEach((token) => {
            if (token.apiId && tokenPrices[token.apiId]) {
              const currentPrice = tokenPrices[token.apiId].usd;
              
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
              
              // Update row with new price data (keep existing name, symbol, logo, ath)
              const rowIndex = rows.findIndex(r => r && r !== null && r.apiId === token.apiId);
              if (rowIndex !== -1) {
                updateRow(rowIndex, {
                  price: currentPrice,
                  ...(trackingResult.priceChanged && trackingResult.highestPrice && { highestPrice: trackingResult.highestPrice })
                });
                
                updatedCount++;
                // Price updated successfully (no log needed)
              }
            } else {
              console.warn(`⚠️ No price data for token: ${token.apiId}`);
            }
          });
          
          console.log(`✅ Step 2 completed: ${updatedCount}/${completeTokensWithPrice.length} prices updated`);
        }
      } else {
        console.log('ℹ️ No tokens to refresh (all are main tokens or empty)');
      }

      setLastUpdated(new Date());
      console.log('🎉 Data refresh completed successfully!');
      
    } catch (error) {
      console.error('❌ Error in refreshData:', error);
    } finally {
      setLoading(false);
    }
  }, [ids, rows, updateRow, setLastUpdated, setLoading, trackPriceChange, getPriceStats, analyzeTrend]);

  // Refresh single token data
  const refreshSingleToken = useCallback(async (apiId) => {
    if (!apiId || !apiId.trim()) return;
    
    try {
      // Prevent updating main tokens (BTC, ETH, BNB)
      if (isMainToken(apiId.trim())) {
        console.log('Skipping main token refresh:', apiId);
        return;
      }
      
      // Fetch token info and update
      const tokenInfo = await fetchTokenInfo(apiId);
      if (tokenInfo) {
        const currentPrice = tokenInfo.current_price;
        
        // Save logo to database
        if (tokenInfo.logo) {
          try {
            await saveTokenLogoToDatabase(apiId, tokenInfo);
          } catch (error) {
            console.error(`Error saving logo to database for ${apiId}:`, error);
          }
        }
        
        // Find the row with this API ID
        const rowIndex = rows.findIndex(r => r && r !== null && r.apiId === apiId);
        if (rowIndex !== -1) {
          const token = rows[rowIndex];
          const reward = currentPrice * (token.amount || 0);
          
          // Use price tracking
          const trackingResult = trackPriceChange(
            apiId, 
            currentPrice, 
            token.price || 0, 
            token.highestPrice || 0
          );
          
          // Update row with new data
          updateRow(rowIndex, {
            name: tokenInfo.name || token.name || '',
            symbol: tokenInfo.symbol || token.symbol || '',
            logo: tokenInfo.logo || token.logo || '',
            price: currentPrice,
            reward,
            ath: tokenInfo.ath || token.ath || 0,
            ...(trackingResult.priceChanged && trackingResult.highestPrice && { highestPrice: trackingResult.highestPrice })
          });
        }
      }
    } catch (error) {
      console.error(`Error refreshing single token ${apiId}:`, error);
      throw error;
    }
  }, [rows, updateRow, trackPriceChange]);

  // Check if any tokens are missing prices and refresh if needed
  const checkAndRefreshMissingPrices = useCallback(async () => {
    try {
      // Ensure rows is an array before processing
      if (!Array.isArray(rows)) {
        console.warn('rows is not an array in checkAndRefreshMissingPrices:', rows);
        return false;
      }

      // Check for tokens that have API ID but no price
      const tokensWithoutPrice = rows.filter(r => 
        r && r !== null && 
        r.apiId && r.apiId.trim() && 
        (!r.price || r.price === 0) &&
        !isMainToken(r.apiId)
      );

      if (tokensWithoutPrice.length > 0) {
        console.log(`🔍 Found ${tokensWithoutPrice.length} tokens without prices, refreshing...`);
        await refreshData();
        return true;
      }

      console.log('✅ All tokens have prices, no refresh needed');
      return false;
    } catch (error) {
      console.error('Error checking missing prices:', error);
      return false;
    }
  }, [rows, refreshData]);

  return {
    ids,
    loadLogosFromDatabase,
    fetchAndUpdateTokenInfo,
    refreshData,
    refreshStatscardPrices,
    refreshSingleToken,
    checkAndRefreshMissingPrices,
  };
};
