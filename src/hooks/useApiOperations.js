import { useCallback, useMemo } from 'react';
import { fetchCryptoPrices, fetchTokenLogos, fetchTokenInfo } from '../services/api';
import { saveTokenLogoToDatabase } from '../services/firebase';

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
  // Derived list of api ids for fetching prices (unique, non-empty)
  const ids = useMemo(() => {
    return Array.from(
      new Set(rows.map((r) => (r.apiId || '').trim()).filter(Boolean)),
    );
  }, [rows]);

  // Load logos from database and fetch missing ones for main tokens
  const loadLogosFromDatabase = useCallback(async () => {
    try {
      const logosFromDB = {};
      
      // Load logos from database (rows)
      rows.forEach(row => {
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
              const rowIndex = rows.findIndex(row => row.apiId === tokenId);
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
      console.log('🔍 Invalid API ID format, skipping fetch:', apiId);
      return;
    }
    
    // Additional validation - prevent common invalid inputs (but allow ? for hidden tokens)
    const invalidInputs = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', '[', ']', '{', '}', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '/'];
    if (invalidInputs.some(char => apiId.includes(char))) {
      console.log('🔍 Invalid characters in API ID, skipping fetch:', apiId);
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
    console.log('🔄 refreshData called');
    setLoading(true);
    try {
      console.log('🔄 Fetching main crypto prices...');
      // Fetch main crypto prices
      const prices = await fetchCryptoPrices(['bitcoin', 'ethereum', 'binancecoin']);
      console.log('🔄 Setting main crypto prices:', {
        btc: prices.bitcoin?.usd || 0,
        eth: prices.ethereum?.usd || 0,
        bnb: prices.binancecoin?.usd || 0
      });
      setBtcPrice(prices.bitcoin?.usd || 0);
      setEthPrice(prices.ethereum?.usd || 0);
      setBnbPrice(prices.binancecoin?.usd || 0);

      // Fetch token prices for all rows
      if (ids.length > 0) {
        console.log('🔄 Fetching token prices for', ids.length, 'tokens...');
        const tokenPrices = await fetchCryptoPrices(ids);
        
        // Update rows with new prices
        rows.forEach((row, index) => {
          if (row.apiId && tokenPrices[row.apiId]) {
            const price = tokenPrices[row.apiId].usd;
            const value = price * row.amount;
            console.log('🔄 Updating row', index, row.name, 'with price:', price, 'value:', value);
            updateRow(index, { price, value });
          }
        });
      }

      setLastUpdated(new Date());
      console.log('🔄 Refresh completed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [ids, rows, setBtcPrice, setEthPrice, setBnbPrice, updateRow, setLoading, setLastUpdated]);

  return {
    ids,
    loadLogosFromDatabase,
    fetchAndUpdateTokenInfo,
    refreshData,
  };
};
