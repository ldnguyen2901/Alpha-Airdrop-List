import { useCallback, useMemo } from 'react';
import { fetchCryptoPrices, fetchTokenLogos, fetchTokenInfo, fetchContractAddresses } from '../services/api';
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
  
      return;
    }
    
    // Additional validation - prevent common invalid inputs (but allow ? for hidden tokens)
    const invalidInputs = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', '[', ']', '{', '}', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '/'];
    if (invalidInputs.some(char => apiId.includes(char))) {
  
      return;
    }

    try {
      // Fetch both token info and contract address in parallel
      const [tokenInfo, contractData] = await Promise.all([
        fetchTokenInfo(apiId.trim()),
        fetchContractAddresses([apiId.trim()])
      ]);
      
      const updateData = {};
      const updateMessages = [];
      
      // Update token info if available
      if (tokenInfo) {
        if (tokenInfo.name) {
          updateData.name = tokenInfo.name;
          updateMessages.push('name');
        }
        if (tokenInfo.symbol) {
          updateData.symbol = tokenInfo.symbol;
          updateMessages.push('symbol');
        }
        if (tokenInfo.logo) {
          updateData.logo = tokenInfo.logo;
          updateMessages.push('logo');
        }
      }
      
      // Update contract address if available
      if (contractData[apiId.trim()] && contractData[apiId.trim()].contractAddress) {
        updateData.contractAddress = contractData[apiId.trim()].contractAddress;
        updateMessages.push('contract address');
      }
      
      // Only update if we have data to update
      if (Object.keys(updateData).length > 0) {
        updateRow(rowIndex, updateData);
        
        // Show notification for updates
        if (addNotification && updateMessages.length > 0) {
          const tokenName = updateData.symbol || updateData.name || apiId;
          const message = `Updated ${updateMessages.join(', ')} for ${tokenName}`;
          addNotification(message, 'success');
        }
      }
    } catch (error) {
      console.error('Error fetching token info:', error);
    }
  }, [updateRow, addNotification]);

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
        
        // Fetch missing data (logos, symbols, contract addresses) for tokens that need them
        const tokensNeedingData = rows.filter(row => 
          row.apiId && (
            !row.logo || 
            !row.symbol || 
            !row.contractAddress ||
            !row.name
          )
        );
        const missingDataIds = tokensNeedingData.map(row => row.apiId);
        let contractData = {};
        let logoData = {};
        
        if (missingDataIds.length > 0) {
          try {
            // Fetch contract addresses for tokens that don't have them
            const tokensWithoutContract = missingDataIds.filter(id => 
              !rows.find(row => row.apiId === id)?.contractAddress
            );
            if (tokensWithoutContract.length > 0) {
              console.log(`🔍 Fetching contracts for ${tokensWithoutContract.length} tokens...`);
              contractData = await fetchContractAddresses(tokensWithoutContract);
            }
            
            // Fetch logos and symbols for tokens that don't have them
            const tokensWithoutLogo = missingDataIds.filter(id => {
              const row = rows.find(row => row.apiId === id);
              return !row?.logo || !row?.symbol || !row?.name;
            });
            if (tokensWithoutLogo.length > 0) {
              console.log(`🖼️ Fetching logos for ${tokensWithoutLogo.length} tokens...`);
              logoData = await fetchTokenLogos(tokensWithoutLogo);
            }
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
              name: false
            };
            
            // Add missing data if available and not already set
            if (!row.contractAddress && contractData[row.apiId]) {
              updateData.contractAddress = contractData[row.apiId].contractAddress || '';
              tokenUpdates.contract = true;
            }
            
            // Add missing logo, symbol, and name if available
            if (logoData[row.apiId]) {
              if (!row.logo) {
                updateData.logo = logoData[row.apiId].logo || '';
                tokenUpdates.logo = true;
              }
              if (!row.symbol) {
                updateData.symbol = logoData[row.apiId].symbol || '';
                tokenUpdates.symbol = true;
              }
              if (!row.name) {
                updateData.name = logoData[row.apiId].name || '';
                tokenUpdates.name = true;
              }
            }
            
            // Add to updated tokens list if any metadata was updated
            if (tokenUpdates.logo || tokenUpdates.symbol || tokenUpdates.contract || tokenUpdates.name) {
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
            
            if (updateMessages.length > 0) {
              const message = `Updated ${updateMessages.join(', ')} for ${token.symbol}`;
              addNotification(message, 'success');
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
  }, [ids, setBtcPrice, setEthPrice, setBnbPrice, updateRow, setLoading, setLastUpdated, trackPriceChange, getPriceStats, analyzeTrend]); // Remove 'rows' from dependencies to prevent infinite loop

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
      } else {
        if (addNotification) {
          const tokenName = rows[rowIndex]?.symbol || rows[rowIndex]?.name || apiId;
          addNotification(`No contract address found for ${tokenName}`, 'warning');
        }
      }
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
