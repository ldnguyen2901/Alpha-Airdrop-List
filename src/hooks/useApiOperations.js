import { useCallback, useMemo, useRef, useEffect } from 'react';
import { fetchCryptoPrices, fetchTokenLogos, fetchTokenFullInfo, saveStatscardPrices, clearTokenInfoCacheForToken } from '../services';
import { loadTokenLogoFromDatabase, saveTokenLogoToDatabase } from '../services/neon';
import { usePriceTracking } from './usePriceTracking';
import { isMainToken, MAIN_TOKENS, expandAllRowsWithMultipleContracts } from '../utils';

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
  // Cache for loaded logos to avoid reloading
  const loadedLogosCache = useRef(new Set());
  
  // Track loading state to prevent multiple simultaneous refreshes
  const isLoadingRef = useRef(false);
  
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
    if (!apiId || typeof apiId !== 'string' || !apiId.trim()) return;
    
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
      const tokenInfo = await fetchTokenFullInfo(apiId.trim());
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
          ath: tokenInfo.ath || 0,
          atl: tokenInfo.atl || 0, // Thêm ATL
          contract: tokenInfo.contract || '', // Thêm contract
          exchanges: tokenInfo.exchanges || [], // Thêm exchanges
          chains: tokenInfo.chains || [], // Thêm chains
          categories: tokenInfo.categories || [], // Thêm categories
          price: tokenInfo.current_price || 0
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
    // Prevent multiple simultaneous refreshes
    if (isLoadingRef.current) {
      console.log('⏸️ Refresh already in progress, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
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
              const tokenInfo = await fetchTokenFullInfo(token.apiId);
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
                    exchanges: tokenInfo.exchanges || [],
                    chains: tokenInfo.chains || [],
                    categories: tokenInfo.categories || [],
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
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [ids, rows, updateRow, setLastUpdated, setLoading, trackPriceChange, getPriceStats, analyzeTrend]);

  // Fetch full info for all tokens (exchanges, chains, categories)
  const fetchAllTokensFullInfo = useCallback(async () => {
    // Prevent multiple simultaneous refreshes
    if (isLoadingRef.current) {
      console.log('⏸️ Fetch full info already in progress, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    
    try {
      console.log('🔄 Starting full info fetch for all tokens...');
      
      // Get all tokens with API IDs (exclude main tokens)
      const tokensWithApiId = rows.filter(r => r && r !== null && r.apiId && !isMainToken(r.apiId));
      
      if (tokensWithApiId.length === 0) {
        console.log('ℹ️ No tokens to fetch full info for');
        return;
      }
      
      // Filter tokens that need full info (skip those that already have complete data)
      const tokensNeedingFullInfo = tokensWithApiId.filter(token => {
        // Check if exchanges field exists and has data
        const hasExchanges = token.exchanges && 
          Array.isArray(token.exchanges) && 
          token.exchanges.length > 0 && 
          token.exchanges.some(ex => ex && ex.trim());
        
        // Check if chains field exists and has data  
        const hasChains = token.chains && 
          Array.isArray(token.chains) && 
          token.chains.length > 0 && 
          token.chains.some(chain => chain && chain.trim());
        
        // Check if categories field exists and has data
        const hasCategories = token.categories && 
          Array.isArray(token.categories) && 
          token.categories.length > 0 && 
          token.categories.some(cat => cat && cat.trim());
        
        // Check if contract field exists and has data
        const hasContract = token.contract && token.contract.trim();
        
        // Check if atl field exists and has data (not 0)
        const hasATL = token.atl && token.atl !== 0;
        
        // Debug logging for each token
        console.log(`Token ${token.apiId}: exchanges=${hasExchanges}, chains=${hasChains}, categories=${hasCategories}, contract=${hasContract}, atl=${hasATL}`);
        
        // Skip if token already has all five fields with meaningful data
        return !(hasExchanges && hasChains && hasCategories && hasContract && hasATL);
      });
      
      const skippedCount = tokensWithApiId.length - tokensNeedingFullInfo.length;
      
      if (skippedCount > 0) {
        console.log(`⏭️ Skipped ${skippedCount} tokens that already have complete data`);
      }
      
      if (tokensNeedingFullInfo.length === 0) {
        console.log('✅ All tokens already have complete full info data!');
        return;
      }
      
      console.log(`📊 Fetching full info for ${tokensNeedingFullInfo.length} tokens (${skippedCount} skipped)...`);
      
      // Limit to 10 tokens per fetch
      const MAX_TOKENS_PER_FETCH = 10;
      const tokensToFetch = tokensNeedingFullInfo.slice(0, MAX_TOKENS_PER_FETCH);
      const remainingTokens = tokensNeedingFullInfo.length - MAX_TOKENS_PER_FETCH;
      
      if (remainingTokens > 0) {
        console.log(`⚠️ Limiting to ${MAX_TOKENS_PER_FETCH} tokens. ${remainingTokens} tokens remaining for next fetch.`);
      }
      
      console.log(`📊 Fetching full info for ${tokensToFetch.length} tokens (${skippedCount} skipped)...`);
      
      // Process tokens in batches of 10
      const BATCH_SIZE = 10;
      const batches = [];
      for (let i = 0; i < tokensToFetch.length; i += BATCH_SIZE) {
        batches.push(tokensToFetch.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`📦 Processing ${batches.length} batches of ${BATCH_SIZE} tokens each`);
      
      // Process each batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} tokens)...`);
        
        // Process tokens in parallel within each batch
        const batchPromises = batch.map(async (token) => {
          try {
            console.log(`📥 Fetching full info for: ${token.apiId}`);
            const tokenInfo = await fetchTokenFullInfo(token.apiId);
            
            if (tokenInfo) {
              // Find the row index
              const rowIndex = rows.findIndex(r => r && r !== null && r.apiId === token.apiId);
              if (rowIndex !== -1) {
                // Update row with full info including exchanges, chains, categories
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
                
                console.log(`✅ Updated ${token.apiId} with full info and saved to database`);
                return { success: true, tokenId: token.apiId };
              }
            } else {
              console.warn(`⚠️ No full info received for token: ${token.apiId}`);
              return { success: false, tokenId: token.apiId, error: 'No data received' };
            }
          } catch (error) {
            console.error(`❌ Error fetching full info for ${token.apiId}:`, error);
            return { success: false, tokenId: token.apiId, error: error.message };
          }
        });
        
        // Wait for all tokens in this batch to complete
        const batchResults = await Promise.all(batchPromises);
        const successCount = batchResults.filter(r => r.success).length;
        const failureCount = batchResults.filter(r => !r.success).length;
        
        console.log(`✅ Batch ${batchIndex + 1} completed: ${successCount} success, ${failureCount} failed`);
        
        // Add a small delay between batches to respect API rate limits
        if (batchIndex < batches.length - 1) {
          console.log('⏳ Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      setLastUpdated(new Date());
      
      // Log completion with remaining tokens info
      if (remainingTokens > 0) {
        console.log(`🎉 Full info fetch completed! Processed ${tokensToFetch.length} tokens. ${remainingTokens} tokens remaining for next fetch.`);
      } else {
        console.log('🎉 Full info fetch completed successfully!');
      }
      
    } catch (error) {
      console.error('❌ Error in fetchAllTokensFullInfo:', error);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [rows, updateRow, setLastUpdated, setLoading]);


  // Refresh single token data
  const refreshSingleToken = useCallback(async (apiId) => {
    if (!apiId || typeof apiId !== 'string' || !apiId.trim()) return;
    
    try {
      // Prevent updating main tokens (BTC, ETH, BNB)
      if (isMainToken(apiId.trim())) {
        console.log('Skipping main token refresh:', apiId);
        return;
      }
      
      // Fetch full token info including exchanges, chains, categories
      const tokenInfo = await fetchTokenFullInfo(apiId);
      if (tokenInfo) {
        // Debug logging for single token refresh
        console.log(`🔍 Single token refresh for ${apiId}:`, {
          ath: tokenInfo.ath,
          atl: tokenInfo.atl,
          contract: tokenInfo.contract,
          contractAddresses: tokenInfo.contractAddresses,
          chains: tokenInfo.chains
        });
        const currentPrice = tokenInfo.current_price;
        
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
          console.log(`Airdrop: Token ${apiId} not found immediately, waiting for state update...`);
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
          rowIndex = rows.findIndex(r => r && r !== null && r.apiId === apiId);
        }
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
          
          // Update row with new data including exchanges, chains, categories, contract, atl
          updateRow(rowIndex, {
            name: tokenInfo.name || token.name || '',
            symbol: tokenInfo.symbol || token.symbol || '',
            logo: tokenInfo.logo || token.logo || '',
            price: currentPrice,
            reward,
            ath: tokenInfo.ath || token.ath || 0,
            atl: tokenInfo.atl || token.atl || 0, // Thêm ATL
            contract: tokenInfo.contract || token.contract || '', // Thêm contract
            exchanges: tokenInfo.exchanges || token.exchanges || [],
            chains: tokenInfo.chains || token.chains || [],
            categories: tokenInfo.categories || token.categories || [],
            ...(trackingResult.priceChanged && trackingResult.highestPrice && { highestPrice: trackingResult.highestPrice })
          });
          
          console.log(`✅ Refreshed ${apiId} with full info and saved to database`);
        } else {
          console.warn(`Token ${apiId} not found in current rows`);
        }
      } else {
        console.warn(`No data received for token: ${apiId}`);
      }
    } catch (error) {
      console.error(`Error refreshing single token ${apiId}:`, error);
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
        r.apiId && typeof r.apiId === 'string' && r.apiId.trim() && 
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🔄 Airdrop component unmounting, cleaning up intervals...');
    };
  }, []);

  return {
    ids,
    loadLogosFromDatabase,
    fetchAndUpdateTokenInfo,
    refreshData,
    refreshStatscardPrices,
    refreshSingleToken,
    fetchAllTokensFullInfo,
    checkAndRefreshMissingPrices,
  };
};
