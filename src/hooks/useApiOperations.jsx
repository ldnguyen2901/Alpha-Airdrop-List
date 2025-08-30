import { useCallback, useMemo } from 'react';
import { fetchCryptoPrices, fetchTokenLogos, fetchTokenInfo, fetchContractAddresses, fetchATH } from '../services/api';
import { saveTokenLogoToDatabase, loadTokenLogosFromDatabase } from '../services/firebase';
import { usePriceTracking } from './usePriceTracking';

export const useApiOperations = (
  rows, 
  setBtcPrice, 
  setEthPrice, 
  setBnbPrice, 
  setTokenLogos, 
  updateRow,
  setLoading,
  setLastUpdated,
  addNotification
) => {
  // Initialize price tracking hook
  const { trackPriceChange, getPriceStats, analyzeTrend } = usePriceTracking();

  // Derived list of api ids for fetching prices (unique, non-empty)
  const ids = useMemo(() => {
    return Array.from(
      new Set(rows.map((r) => (r.apiId || '').trim()).filter(Boolean)),
    );
  }, [rows]);

  // Load logos from database and fetch missing ones for main tokens
  const loadLogosFromDatabase = useCallback(async () => {
    try {
      // Try load from Firestore first (persisted logos)
      const mainTokens = ['bitcoin', 'ethereum', 'binancecoin'];
      const existingIds = Array.from(new Set([...mainTokens, ...rows.map(r => r.apiId).filter(Boolean)]));
      const persisted = await loadTokenLogosFromDatabase(existingIds);
      const logosFromDB = { ...persisted };
      
      // Fetch missing logos for main tokens (BTC, ETH, BNB)
      const missingMainTokens = mainTokens.filter(id => !logosFromDB[id] || !logosFromDB[id].logo);
      
      if (missingMainTokens.length > 0) {
        try {
          const fetchedLogos = await fetchTokenLogos(missingMainTokens);
          
          // Update database with fetched logos for main tokens
          for (const tokenId of missingMainTokens) {
            if (fetchedLogos[tokenId]) {
              // Always save to database even if not in table
              await saveTokenLogoToDatabase(tokenId, fetchedLogos[tokenId]);
              
              // Update local state object
              logosFromDB[tokenId] = fetchedLogos[tokenId];
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
      console.log(`🔄 Fetching token info for: ${apiId.trim()}`);
      
      // Fetch token info (logo, symbol, name)
      const tokenInfo = await fetchTokenInfo(apiId.trim());
      
      if (tokenInfo) {
        // Update row with fetched info
        updateRow(rowIndex, {
          logo: tokenInfo.logo || '',
          symbol: tokenInfo.symbol || '',
          name: tokenInfo.name || ''
        });
        
        // Save to database
        await saveTokenLogoToDatabase(apiId.trim(), tokenInfo);
        
        if (addNotification) {
          addNotification(`Token info fetched for ${tokenInfo.symbol || tokenInfo.name || apiId}!`, 'success');
        }
      }
    } catch (error) {
      console.error('Error fetching token info:', error);
      if (addNotification) {
        addNotification(`Failed to fetch token info for ${apiId}`, 'error');
      }
    }
  }, [updateRow, addNotification]);

  // Refresh data function
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: Fetch main crypto prices (BTC, ETH, BNB) first
      const mainTokens = ['bitcoin', 'ethereum', 'binancecoin'];
      console.log(`🏆 Fetching main crypto prices first: ${mainTokens.join(', ')}`);
      
      const mainPrices = await fetchCryptoPrices(mainTokens);
      
      // Set main crypto prices
      setBtcPrice(mainPrices.bitcoin?.usd || 0);
      setEthPrice(mainPrices.ethereum?.usd || 0);
      setBnbPrice(mainPrices.binancecoin?.usd || 0);
      
      console.log(`✅ Main crypto prices fetched: BTC=${mainPrices.bitcoin?.usd}, ETH=${mainPrices.ethereum?.usd}, BNB=${mainPrices.binancecoin?.usd}`);

      // Step 2: Fetch other token prices (excluding main cryptos)
      const otherTokenIds = ids.filter(id => !mainTokens.includes(id));
      let tokenPrices = {};
      
      if (otherTokenIds.length > 0) {
        console.log(`📦 Fetching other token prices: ${otherTokenIds.length} tokens`);
        const otherPrices = await fetchCryptoPrices(otherTokenIds);
        
        // Combine main prices and other prices
        const allPrices = { ...mainPrices, ...otherPrices };
        
        // Extract token prices (excluding main cryptos)
        ids.forEach(id => {
          if (allPrices[id]) {
            tokenPrices[id] = allPrices[id];
          }
        });
        
        console.log(`✅ Successfully fetched prices for ${Object.keys(tokenPrices).length} tokens`);
      } else {
        console.log(`✅ No other tokens to fetch prices for`);
        // Extract token prices from main prices only
        ids.forEach(id => {
          if (mainPrices[id]) {
            tokenPrices[id] = mainPrices[id];
          }
        });
        console.log(`✅ Successfully fetched prices for ${Object.keys(tokenPrices).length} tokens`);
      }
      
      // Fetch missing data (logos, symbols, contract addresses, ATH) for tokens that need them
      const tokensNeedingData = rows.filter(row => 
        row.apiId && (
          !row.logo || 
          !row.symbol || 
          !row.contractAddress ||
          !row.name ||
          !row.ath
        )
      );
      const missingDataIds = tokensNeedingData.map(row => row.apiId);
      
      if (missingDataIds.length > 0) {
        try {
          console.log(`🔄 Fetching missing data for ${missingDataIds.length} tokens using new wrapper...`);
          
          // Fetch all missing data in parallel using the new wrapper
          const [contractData, logoData, athData] = await Promise.allSettled([
            fetchContractAddresses(missingDataIds),
            fetchTokenLogos(missingDataIds),
            fetchATH(missingDataIds)
          ]);
          
          console.log(`✅ All data fetch completed using new wrapper`);
          
        } catch (error) {
          console.error('Error fetching missing token data:', error);
          if (addNotification) {
            addNotification('Some token data could not be fetched. Check console for details.', 'warning');
          }
        }
      }
      
      // Track updates for notifications
      const updatedTokens = [];
      
      // Update rows with new prices and track highest prices using optimized algorithm
      rows.forEach((row, index) => {
        if (row.apiId && tokenPrices[row.apiId]) {
          const currentPrice = tokenPrices[row.apiId].usd;
          const value = currentPrice * row.amount;
          
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
          
          // Prepare update data
          const updateData = { 
            price: currentPrice, 
            value,
            ...(trackingResult.priceChanged && trackingResult.highestPrice && { highestPrice: trackingResult.highestPrice })
          };
          
          // Track what was updated for notifications
          const tokenUpdates = {
            logo: false,
            symbol: false,
            contract: false,
            name: false,
            ath: false
          };
          
          // Add missing data if available and not already set
          if (contractData.status === 'fulfilled' && contractData.value[row.apiId]) {
            if (!row.contractAddress) {
              updateData.contractAddress = contractData.value[row.apiId].contractAddress || '';
              tokenUpdates.contract = true;
            }
          }
          
          // Add missing logo, symbol, and name if available
          if (logoData.status === 'fulfilled' && logoData.value[row.apiId]) {
            if (!row.logo) {
              updateData.logo = logoData.value[row.apiId].logo || '';
              tokenUpdates.logo = true;
            }
            if (!row.symbol) {
              updateData.symbol = logoData.value[row.apiId].symbol || '';
              tokenUpdates.symbol = true;
            }
            if (!row.name) {
              updateData.name = logoData.value[row.apiId].name || '';
              tokenUpdates.name = true;
            }
          }
          
          // Add missing ATH data if available
          if (athData.status === 'fulfilled' && athData.value[row.apiId]) {
            if (!row.ath) {
              updateData.ath = athData.value[row.apiId];
              tokenUpdates.ath = true;
            }
          }
          
          // Add to updated tokens list if any metadata was updated
          if (tokenUpdates.logo || tokenUpdates.symbol || tokenUpdates.contract || tokenUpdates.name || tokenUpdates.ath) {
            updatedTokens.push({
              symbol: row.symbol || row.name || row.apiId,
              updates: tokenUpdates
            });
          }
          
          updateRow(index, updateData);
        }
      });
      
      // Show notifications for updated tokens
      if (updatedTokens.length > 0 && addNotification) {
        updatedTokens.forEach(token => {
          const updateMessages = [];
          if (token.updates.logo) updateMessages.push('logo');
          if (token.updates.symbol) updateMessages.push('symbol');
          if (token.updates.contract) updateMessages.push('contract address');
          if (token.updates.name) updateMessages.push('name');
          if (token.updates.ath) updateMessages.push('ATH data');
          
          if (updateMessages.length > 0) {
            const message = `Updated ${updateMessages.join(', ')} for ${token.symbol}`;
            addNotification(message, 'success');
          }
        });
      }
      
      setLastUpdated(new Date());
      
      // Thông báo refresh thành công
      if (addNotification) {
        const totalPricesFetched = Object.keys(tokenPrices).length;
        const mainPricesFetched = [mainPrices.bitcoin, mainPrices.ethereum, mainPrices.binancecoin].filter(Boolean).length;
        addNotification(`✅ Refresh successful! Fetched ${mainPricesFetched} main prices + ${totalPricesFetched} token prices`, 'success');
      }

    } catch (error) {
      console.error('Error refreshing data:', error);
      
      // Thông báo refresh thất bại
      if (addNotification) {
        addNotification(`❌ Refresh failed: ${error.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setLoading(false);
    }
}, [ids, rows, setBtcPrice, setEthPrice, setBnbPrice, updateRow, setLoading, setLastUpdated, trackPriceChange, getPriceStats, analyzeTrend, addNotification]);

  // Manual retry function for fetching contract addresses
  const retryFetchContract = useCallback(async (apiId, rowIndex) => {
    if (!apiId || !apiId.trim()) return;
    
    try {
      console.log(`🔄 Retrying contract fetch for ${apiId}...`);
      
      // Clear cache for this specific token
      const { clearContractCache } = await import('../services/api');
      clearContractCache();
      
      // Fetch contract data
      const { fetchContractAddresses } = await import('../services/api');
      const contractData = await fetchContractAddresses([apiId.trim()]);
      
      if (contractData[apiId.trim()] && contractData[apiId.trim()].contractAddress) {
        updateRow(rowIndex, {
          contractAddress: contractData[apiId.trim()].contractAddress
        });
        
        if (addNotification) {
          const tokenName = rows[rowIndex]?.symbol || rows[rowIndex]?.name || apiId;
          addNotification(`Contract address found for ${tokenName}!`, 'success');
        }
      }
      // Loại bỏ thông báo không tìm thấy contract
    } catch (error) {
      console.error('Error retrying contract fetch:', error);
      if (addNotification) {
        addNotification('Failed to retry contract fetch', 'error');
      }
    }
  }, [updateRow, addNotification, rows]);

  return {
    ids,
    loadLogosFromDatabase,
    fetchAndUpdateTokenInfo,
    refreshData,
    retryFetchContract,
  };
};
