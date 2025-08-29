import { useCallback, useMemo } from 'react';
import { fetchCryptoPrices, fetchTokenLogos, fetchTokenInfo } from '../services/api';
import { saveTokenLogoToDatabase } from '../services/firebase';
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
    return Array.from(
      new Set(rows.filter(r => r && r !== null).map((r) => (r.apiId || '').trim()).filter(Boolean)),
    );
  }, [rows]);

  // Load logos from database and fetch missing ones for main tokens
  const loadLogosFromDatabase = useCallback(async () => {
    try {
      const logosFromDB = {};
      
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
          logo: tokenInfo.logo || ''
        });
      }
    } catch (error) {
      console.error('Error fetching token info:', error);
    }
  }, [updateRow]);

  // Refresh data function
  const refreshData = useCallback(async () => {
  
    setLoading(true);
    try {
  
      // Fetch main crypto prices
      const prices = await fetchCryptoPrices(['bitcoin', 'ethereum', 'binancecoin']);
      
      setBtcPrice(prices.bitcoin?.usd || 0);
      setEthPrice(prices.ethereum?.usd || 0);
      setBnbPrice(prices.binancecoin?.usd || 0);

      // Fetch token prices for all rows
      if (ids.length > 0) {

        const tokenPrices = await fetchCryptoPrices(ids);
        
        // Update rows with new prices and track highest prices using optimized algorithm
        rows.filter(r => r && r !== null).forEach((row, index) => {
          if (row.apiId && tokenPrices[row.apiId]) {
            const currentPrice = tokenPrices[row.apiId].usd;
            const reward = currentPrice * row.amount;
            
            // Use optimized price tracking algorithm
            const trackingResult = trackPriceChange(
              row.apiId, 
              currentPrice, 
              row.price || 0, 
              row.highestPrice || 0
            );
            
            // Get additional price statistics
            const priceStats = getPriceStats(row.apiId);
            const trend = analyzeTrend(row.apiId);
            
            // Update row with new data
            const updateData = { 
              price: currentPrice, 
              reward,
              ...(trackingResult.priceChanged && trackingResult.highestPrice && { highestPrice: trackingResult.highestPrice })
            };
            
            updateRow(index, updateData);
          }
        });
      }

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [ids, setBtcPrice, setEthPrice, setBnbPrice, updateRow, setLoading, setLastUpdated, trackPriceChange, getPriceStats, analyzeTrend]); // Remove 'rows' from dependencies to prevent infinite loop

  return {
    ids,
    loadLogosFromDatabase,
    fetchAndUpdateTokenInfo,
    refreshData,
  };
};
