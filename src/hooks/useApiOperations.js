import { useCallback, useMemo } from 'react';
import { fetchCryptoPrices, fetchTokenLogos, fetchTokenInfo } from '../services/api';
import { saveTokenLogoToDatabase, saveStatscardPrices } from '../services/firebase';
import { usePriceTracking } from './usePriceTracking';

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
      
      // Load logos from database (rows)
      rows.filter(r => r && r !== null).forEach(row => {
        if (row.apiId && row.logo) {
          logosFromDB[row.apiId] = {
            logo: row.logo,
            symbol: row.symbol || '',
            name: row.name || ''
          };
        }
      });
      
      // Fetch missing logos for main tokens (BTC, ETH, BNB)
      const mainTokens = ['bitcoin', 'ethereum', 'binancecoin'];
      const missingMainTokens = mainTokens.filter(id => !logosFromDB[id] || !logosFromDB[id].logo);
      
      if (missingMainTokens.length > 0) {
        try {
          const fetchedLogos = await fetchTokenLogos(missingMainTokens);
          
          // Update database with fetched logos for main tokens
          for (const tokenId of missingMainTokens) {
            if (fetchedLogos[tokenId]) {
              // Update row if it exists in table
              const rowIndex = rows.findIndex(row => row && row !== null && row.apiId === tokenId);
              if (rowIndex !== -1) {
                updateRow(rowIndex, {
                  logo: fetchedLogos[tokenId].logo,
                  symbol: fetchedLogos[tokenId].symbol,
                  name: fetchedLogos[tokenId].name
                });
              }
              
              // Always save to database even if not in table
              await saveTokenLogoToDatabase(tokenId, fetchedLogos[tokenId]);
            }
          }
          
          // Merge fetched logos into logosFromDB
          Object.assign(logosFromDB, fetchedLogos);
        } catch (error) {
          console.error('Failed to fetch main token logos:', error);
        }
      }
      
      setTokenLogos(logosFromDB);
    } catch (e) {
      console.error('loadLogosFromDatabase error', e);
    }
  }, [rows, updateRow, setTokenLogos]);

  // Auto fetch token info when API ID is entered
  const fetchAndUpdateTokenInfo = useCallback(async (apiId, rowIndex) => {
    if (!apiId || !apiId.trim()) return;
    
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

  // Refresh data function with optimized strategy
  const refreshData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Step 1: Fetch main crypto prices for statscard (separate from table data)
      const prices = await fetchCryptoPrices(['bitcoin', 'ethereum', 'binancecoin']);
      
      // Update statscard prices (these are managed separately)
      const btcPrice = prices.bitcoin?.usd || 0;
      const ethPrice = prices.ethereum?.usd || 0;
      const bnbPrice = prices.binancecoin?.usd || 0;
      
      setBtcPrice(btcPrice);
      setEthPrice(ethPrice);
      setBnbPrice(bnbPrice);
      
      // Update statscard prices in Firebase
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
        console.log('Statscard prices updated in Firebase');
      } catch (error) {
        console.error('Error updating statscard prices in Firebase:', error);
      }

      // Step 2: Optimized token data fetching strategy
      if (ids.length > 0) {
        // Ensure rows is an array before processing
        if (!Array.isArray(rows)) {
          console.warn('rows is not an array in refreshData:', rows);
          return;
        }

        // Classify tokens by completion status
        const incompleteTokens = rows.filter(r => r && r !== null && (!r.symbol || !r.logo));
        const completeTokens = rows.filter(r => r && r !== null && r.symbol && r.logo);
        
        console.log(`📊 Status: ${incompleteTokens.length} incomplete, ${completeTokens.length} complete tokens`);

        // Step 2a: Fetch full data for incomplete tokens (priority)
        if (incompleteTokens.length > 0) {
          console.log(' Step 1: Fetching full data for incomplete tokens...');
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

        // Step 2b: Update prices for complete tokens (efficient)
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
              
              // Update row with only price data (efficient)
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
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [ids, setBtcPrice, setEthPrice, setBnbPrice, updateRow, setLoading, setLastUpdated, trackPriceChange, getPriceStats, analyzeTrend, rows]);

  return {
    ids,
    loadLogosFromDatabase,
    fetchAndUpdateTokenInfo,
    refreshData,
  };
};
