export async function fetchCryptoPrices(ids, currency = 'usd') {
  if (!ids.length) return {};
  
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=${encodeURIComponent(currency)}`;

  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API lỗi ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('🌐 Error in fetchCryptoPrices:', error);
    throw error;
  }
}

// Cache for token logos to avoid unnecessary API calls
const logoCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to clear logo cache
export function clearLogoCache() {
  logoCache.clear();
}

export async function fetchTokenLogos(ids) {
  if (!ids.length) return {};
  
  const now = Date.now();
  const uncachedIds = ids.filter(id => {
    const cached = logoCache.get(id);
    return !cached || (now - cached.timestamp) > CACHE_DURATION;
  });
  
  // If all IDs are cached and fresh, return from cache
  if (uncachedIds.length === 0) {
    const result = {};
    ids.forEach(id => {
      const cached = logoCache.get(id);
      if (cached) {
        result[id] = cached.data;
      }
    });
    return result;
  }
  
  // Fetch only uncached IDs
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(uncachedIds.join(","))}&order=market_cap_desc&per_page=250&page=1&sparkline=false&locale=en`;
  
  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API lỗi ${res.status}`);
    }
    
    const data = await res.json();
    const logos = {};
    
    data.forEach(coin => {
      const logoData = {
        logo: coin.image,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name
      };
      
      logos[coin.id] = logoData;
      // Cache the logo data
      logoCache.set(coin.id, {
        data: logoData,
        timestamp: now
      });
    });
    
    // Add cached logos for IDs that weren't fetched
    ids.forEach(id => {
      if (!logos[id]) {
        const cached = logoCache.get(id);
        if (cached) {
          logos[id] = cached.data;
        }
      }
    });
    
    return logos;
  } catch (error) {
    console.error('Error fetching logos:', error);
    // Return cached data if available, even if expired
    const result = {};
    ids.forEach(id => {
      const cached = logoCache.get(id);
      if (cached) {
        result[id] = cached.data;
      }
    });
    return result;
  }
}

// Fetch single token info by API ID
export async function fetchTokenInfo(apiId) {
  if (!apiId || !apiId.trim()) return null;
  
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(apiId.trim())}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API lỗi ${res.status}`);
    }
    
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      logo: data.image?.large || data.image?.small || data.image?.thumb
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}

// Cache for contract addresses to avoid unnecessary API calls
const contractCache = new Map();
const CONTRACT_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Function to clear contract cache
export function clearContractCache() {
  contractCache.clear();
}

// Fetch smart contract addresses for multiple tokens
export async function fetchContractAddresses(ids) {
  if (!ids.length) return {};
  
  const now = Date.now();
  const uncachedIds = ids.filter(id => {
    const cached = contractCache.get(id);
    return !cached || (now - cached.timestamp) > CONTRACT_CACHE_DURATION;
  });
  
  // If all IDs are cached and fresh, return from cache
  if (uncachedIds.length === 0) {
    const result = {};
    ids.forEach(id => {
      const cached = contractCache.get(id);
      if (cached) {
        result[id] = cached.data;
      }
    });
    return result;
  }
  
  // Fetch contract addresses for uncached IDs
  const contracts = {};
  
  // Process in batches to avoid overwhelming the API
  const batchSize = 3; // Reduced batch size for better reliability
  for (let i = 0; i < uncachedIds.length; i += batchSize) {
    const batch = uncachedIds.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (id) => {
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}`;
          const res = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; AirdropTracker/1.0)'
            }
          });
          
          if (res.ok) {
            const data = await res.json();
            
            // Get contract address from platforms (Ethereum, BSC, etc.)
            let contractAddress = '';
            let platform = '';
            
            if (data.platforms && Object.keys(data.platforms).length > 0) {
              // Priority: Ethereum > BSC > Polygon > Arbitrum > Optimism > Others
              const priorityPlatforms = ['ethereum', 'binance-smart-chain', 'polygon-pos', 'arbitrum-one', 'optimistic-ethereum'];
              
              // First try priority platforms
              for (const platformName of priorityPlatforms) {
                if (data.platforms[platformName]) {
                  contractAddress = data.platforms[platformName];
                  platform = platformName;
                  break;
                }
              }
              
              // If no priority platform found, take the first available
              if (!contractAddress) {
                const firstPlatform = Object.keys(data.platforms)[0];
                contractAddress = data.platforms[firstPlatform];
                platform = firstPlatform;
              }
            }
            
            const contractData = {
              contractAddress: contractAddress,
              platform: platform
            };
            
            contracts[id] = contractData;
            
            // Cache the contract data (even if empty)
            contractCache.set(id, {
              data: contractData,
              timestamp: now
            });
            
            // Log successful fetch
            if (contractAddress) {
              console.log(`✅ Contract found for ${id}: ${contractAddress} (${platform})`);
            } else {
              console.log(`⚠️ No contract found for ${id} - may be a native token`);
            }
            
            break; // Success, exit retry loop
            
          } else if (res.status === 429) {
            // Rate limit - wait longer
            console.log(`🔄 Rate limited for ${id}, retrying in 3s...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            retryCount++;
          } else if (res.status === 404) {
            // Token not found
            console.log(`❌ Token not found: ${id}`);
            contractCache.set(id, {
              data: { contractAddress: '', platform: '' },
              timestamp: now
            });
            break;
          } else {
            // Other HTTP errors
            console.log(`⚠️ HTTP ${res.status} for ${id}, retrying...`);
            retryCount++;
            if (retryCount <= maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
        } catch (error) {
          console.error(`❌ Error fetching contract for ${id} (attempt ${retryCount + 1}):`, error.message);
          retryCount++;
          
          if (retryCount <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            // Final failure - cache empty result
            contractCache.set(id, {
              data: { contractAddress: '', platform: '' },
              timestamp: now
            });
          }
        }
      }
    }));
    
    // Add delay between batches to be respectful to the API
    if (i + batchSize < uncachedIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  // Add cached contracts for IDs that weren't fetched
  ids.forEach(id => {
    if (!contracts[id]) {
      const cached = contractCache.get(id);
      if (cached) {
        contracts[id] = cached.data;
      }
    }
  });
  
  // Log summary
  const foundCount = Object.values(contracts).filter(c => c.contractAddress).length;
  const totalCount = ids.length;
  console.log(`📊 Contract fetch summary: ${foundCount}/${totalCount} tokens have contracts`);
  
  return contracts;
}

// Validate token ID format for CoinGecko API
const isValidCoinGeckoId = (id) => {
  // CoinGecko IDs are lowercase, alphanumeric with hyphens
  return /^[a-z0-9-]+$/.test(id) && id.length > 0;
};

// Suggest correct token ID format
const suggestTokenId = (id) => {
  if (!id) return '';
  
  // Convert to lowercase and replace spaces/special chars with hyphens
  let suggested = id.toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
  
  return suggested;
};

// Fetch All-Time High (ATH) prices for multiple tokens
export async function fetchATH(ids) {
  if (!ids.length) return {};
  
  console.log(`🔍 Starting ATH fetch for ${ids.length} tokens:`, ids);
  
  const athData = {};
  
  // Filter out invalid IDs
  const validIds = ids.filter(id => {
    if (!isValidCoinGeckoId(id)) {
      const suggested = suggestTokenId(id);
      if (suggested && suggested !== id) {
        console.log(`⚠️ Invalid CoinGecko ID format: ${id} (suggested: ${suggested})`);
      } else {
        console.log(`⚠️ Invalid CoinGecko ID format: ${id}`);
      }
      return false;
    }
    return true;
  });
  
  if (validIds.length === 0) {
    console.log('⚠️ No valid CoinGecko IDs to fetch ATH for');
    return athData;
  }
  
  console.log(`✅ Valid IDs to fetch ATH:`, validIds);
  
  // Process in batches to avoid overwhelming the API
  const batchSize = 3;
  for (let i = 0; i < validIds.length; i += batchSize) {
    const batch = validIds.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (id) => {
      try {
        const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/ath`;
        console.log(`🌐 Fetching ATH from: ${url}`);
        
        const res = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; AirdropTracker/1.0)'
          }
        });
        
        console.log(`📡 Response for ${id}: ${res.status} ${res.statusText}`);
        
        if (res.ok) {
          const data = await res.json();
          athData[id] = data.usd || 0;
          console.log(`✅ ATH for ${id}: $${data.usd}`);
        } else if (res.status === 429) {
          console.log(`🔄 Rate limited for ATH ${id}, skipping...`);
        } else if (res.status === 404) {
          console.log(`❌ Token not found on CoinGecko: ${id} (404)`);
          // Try to get more info about the error
          try {
            const errorData = await res.text();
            console.log(`📄 Error response for ${id}:`, errorData);
          } catch (e) {
            console.log(`📄 Could not read error response for ${id}`);
          }
        } else {
          console.log(`⚠️ HTTP ${res.status} for ATH ${id}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching ATH for ${id}:`, error.message);
      }
    }));
    
    // Add delay between batches
    if (i + batchSize < validIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  // Log summary
  const foundCount = Object.keys(athData).length;
  const totalCount = validIds.length;
  const invalidCount = ids.length - validIds.length;
  
  if (invalidCount > 0) {
    console.log(`📊 ATH fetch summary: ${foundCount}/${totalCount} valid tokens have ATH data (${invalidCount} invalid IDs skipped)`);
  } else {
    console.log(`📊 ATH fetch summary: ${foundCount}/${totalCount} tokens have ATH data`);
  }
  
  return athData;
}

// Test function to check if CoinGecko ATH API is working
export async function testATHAPI() {
  console.log('🧪 Testing CoinGecko ATH API...');
  
  try {
    // Test with a known token (bitcoin)
    const testUrl = 'https://api.coingecko.com/api/v3/coins/bitcoin/ath';
    console.log(`🌐 Testing URL: ${testUrl}`);
    
    const res = await fetch(testUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; AirdropTracker/1.0)'
      }
    });
    
    console.log(`📡 Test response: ${res.status} ${res.statusText}`);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ ATH API test successful:', data);
      return true;
    } else {
      console.log('❌ ATH API test failed:', res.status, res.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ ATH API test error:', error.message);
    return false;
  }
}
