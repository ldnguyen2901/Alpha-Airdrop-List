// Helper function to chunk array into smaller arrays
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Maximum IDs per API call
const MAX_IDS_PER_CALL = 100;

export async function fetchCryptoPrices(ids, currency = 'usd') {
  if (!ids.length) return {};
  
  try {
    const result = {};
    
    // Chunk IDs into groups of MAX_IDS_PER_CALL
    const idChunks = chunkArray(ids, MAX_IDS_PER_CALL);
    
    // Fetch prices for each chunk using /simple/price API with delay
    for (let i = 0; i < idChunks.length; i++) {
      const idChunk = idChunks[i];
      try {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(idChunk.join(","))}&vs_currencies=${encodeURIComponent(currency)}`;
        
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`API error ${res.status} for chunk ${i + 1}, skipping...`);
          continue; // Skip this chunk instead of throwing error
        }
        
        const data = await res.json();
        Object.assign(result, data);
        
        // Add delay between chunks to avoid rate limiting
        if (i < idChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.warn(`Error fetching chunk ${i + 1}, skipping...`, error);
        continue; // Skip this chunk instead of throwing error
      }
    }
    
    // Transform format to match existing structure
    const transformedResult = {};
    Object.keys(result).forEach(coinId => {
      transformedResult[coinId] = {
        usd: result[coinId][currency] || 0
      };
    });
    
    return transformedResult;
  } catch (error) {
    console.error('🌐 Error in fetchCryptoPrices:', error);
    return {}; // Return empty object instead of throwing error
  }
}

// Cache for token logos to avoid unnecessary API calls
const logoCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for token full info (exchanges, chains, categories)
const tokenInfoCache = new Map();
const TOKEN_INFO_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Function to clear logo cache
export function clearLogoCache() {
  logoCache.clear();
}

// Function to clear token info cache for specific token
export function clearTokenInfoCacheForToken(apiId) {
  if (apiId) {
    tokenInfoCache.delete(apiId);
    console.log(`Cleared cache for token: ${apiId}`);
  }
}

// Function to clear all caches
export function clearAllCaches() {
  logoCache.clear();
  tokenInfoCache.clear();
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
  
  try {
    const result = {};
    
    // Chunk uncached IDs into groups of MAX_IDS_PER_CALL
    const idChunks = chunkArray(uncachedIds, MAX_IDS_PER_CALL);
    
    // Fetch logos for each chunk using /coins/markets API
    const fetchPromises = idChunks.map(async (idChunk) => {
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(idChunk.join(","))}&order=market_cap_desc&per_page=250&page=1&sparkline=false&locale=en`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`API lỗi ${res.status}`);
      }
      
      const data = await res.json();
      return data;
    });
    
    // Wait for all chunks to complete
    const chunkResults = await Promise.all(fetchPromises);
    
    // Process all results
    chunkResults.forEach(chunkData => {
      chunkData.forEach(coin => {
        if (!coin || !coin.symbol) {
          console.warn('Invalid coin data received:', coin);
          return;
        }
        
        const logoData = {
          logo: coin.image || '',
          symbol: String(coin.symbol || '').toUpperCase(),
          name: coin.name || ''
        };
        
        result[coin.id] = logoData;
        // Cache the logo data
        logoCache.set(coin.id, {
          data: logoData,
          timestamp: now
        });
      });
    });
    
    // Add cached logos for IDs that weren't fetched
    ids.forEach(id => {
      if (!result[id]) {
        const cached = logoCache.get(id);
        if (cached) {
          result[id] = cached.data;
        }
      }
    });
    
    return result;
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
    // Sử dụng API /coins/markets cho single token
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(apiId.trim())}&order=market_cap_desc&per_page=1&page=1&sparkline=false`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API lỗi ${res.status}`);
    }
    
    const data = await res.json();
    
    if (data.length === 0) {
      return null;
    }
    
    const coin = data[0];
    if (!coin || !coin.symbol) {
      console.warn('Invalid coin data received:', coin);
      return null;
    }
    
    return {
      id: coin.id || '',
      name: coin.name || '',
      symbol: String(coin.symbol || '').toUpperCase(),
      logo: coin.image || '',
      ath: coin.ath || 0,
      current_price: coin.current_price || 0
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}

// Fetch full token info by API ID (including exchanges, chains, categories)
export async function fetchTokenFullInfo(apiId) {
  if (!apiId || !apiId.trim()) return null;
  
  const now = Date.now();
  const cached = tokenInfoCache.get(apiId);
  
  // Return cached data if fresh
  if (cached && (now - cached.timestamp) < TOKEN_INFO_CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    // Sử dụng API /coins/{id} để lấy thông tin đầy đủ
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(apiId.trim())}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API lỗi ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data || !data.symbol) {
      console.warn('Invalid coin data received:', data);
      return null;
    }
    
    // Extract exchanges from tickers
    const exchanges = [];
    if (data.tickers && Array.isArray(data.tickers)) {
      const exchangeSet = new Set();
      data.tickers.forEach(ticker => {
        if (ticker.market && ticker.market.name) {
          exchangeSet.add(ticker.market.name);
        }
      });
      exchanges.push(...Array.from(exchangeSet));
    }
    
    // Extract chains from platforms
    const chains = [];
    if (data.platforms && typeof data.platforms === 'object') {
      chains.push(...Object.keys(data.platforms));
    }
    
    // Extract categories
    const categories = data.categories || [];
    
    const result = {
      id: data.id || '',
      name: data.name || '',
      symbol: String(data.symbol || '').toUpperCase(),
      logo: data.image?.small || '',
      ath: data.market_data?.ath?.usd || 0,
      current_price: data.market_data?.current_price?.usd || 0,
      exchanges: exchanges,
      chains: chains,
      categories: categories
    };
    
    // Cache the result
    tokenInfoCache.set(apiId, {
      data: result,
      timestamp: now
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching token full info:', error);
    // Return cached data if available, even if expired
    if (cached) {
      return cached.data;
    }
    return null;
  }
}

// Fetch token exchanges by API ID
export async function fetchTokenExchanges(apiId) {
  if (!apiId || !apiId.trim()) return [];
  
  const now = Date.now();
  const cached = tokenInfoCache.get(apiId);
  
  // Return cached exchanges if fresh
  if (cached && (now - cached.timestamp) < TOKEN_INFO_CACHE_DURATION && cached.data.exchanges) {
    return cached.data.exchanges;
  }
  
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(apiId.trim())}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API lỗi ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data || !data.tickers) {
      return [];
    }
    
    // Extract exchanges from tickers
    const exchangeSet = new Set();
    data.tickers.forEach(ticker => {
      if (ticker.market && ticker.market.name) {
        exchangeSet.add(ticker.market.name);
      }
    });
    
    const exchanges = Array.from(exchangeSet);
    
    // Update cache if we have cached data
    if (cached) {
      cached.data.exchanges = exchanges;
      cached.timestamp = now;
    }
    
    return exchanges;
  } catch (error) {
    console.error('Error fetching token exchanges:', error);
    // Return cached exchanges if available
    if (cached && cached.data.exchanges) {
      return cached.data.exchanges;
    }
    return [];
  }
}

// Fetch token chains by API ID
export async function fetchTokenChains(apiId) {
  if (!apiId || !apiId.trim()) return [];
  
  const now = Date.now();
  const cached = tokenInfoCache.get(apiId);
  
  // Return cached chains if fresh
  if (cached && (now - cached.timestamp) < TOKEN_INFO_CACHE_DURATION && cached.data.chains) {
    return cached.data.chains;
  }
  
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(apiId.trim())}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API lỗi ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data || !data.platforms) {
      return [];
    }
    
    // Extract chains from platforms
    const chains = Object.keys(data.platforms);
    
    // Update cache if we have cached data
    if (cached) {
      cached.data.chains = chains;
      cached.timestamp = now;
    }
    
    return chains;
  } catch (error) {
    console.error('Error fetching token chains:', error);
    // Return cached chains if available
    if (cached && cached.data.chains) {
      return cached.data.chains;
    }
    return [];
  }
}

// Fetch token categories by API ID
export async function fetchTokenCategories(apiId) {
  if (!apiId || !apiId.trim()) return [];
  
  const now = Date.now();
  const cached = tokenInfoCache.get(apiId);
  
  // Return cached categories if fresh
  if (cached && (now - cached.timestamp) < TOKEN_INFO_CACHE_DURATION && cached.data.categories) {
    return cached.data.categories;
  }
  
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(apiId.trim())}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API lỗi ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data || !data.categories) {
      return [];
    }
    
    const categories = data.categories || [];
    
    // Update cache if we have cached data
    if (cached) {
      cached.data.categories = categories;
      cached.timestamp = now;
    }
    
    return categories;
  } catch (error) {
    console.error('Error fetching token categories:', error);
    // Return cached categories if available
    if (cached && cached.data.categories) {
      return cached.data.categories;
    }
    return [];
  }
}

// Fetch multiple tokens full info (batch processing)
export async function fetchMultipleTokensFullInfo(ids) {
  if (!ids.length) return {};
  
  try {
    const result = {};
    
    // Chunk IDs into groups of MAX_IDS_PER_CALL
    const idChunks = chunkArray(ids, MAX_IDS_PER_CALL);
    
    // Fetch full info for each chunk
    const fetchPromises = idChunks.map(async (idChunk) => {
      const chunkResult = {};
      
      // Process each ID in the chunk
      const tokenPromises = idChunk.map(async (id) => {
        try {
          const tokenInfo = await fetchTokenFullInfo(id);
          if (tokenInfo) {
            chunkResult[id] = tokenInfo;
          }
        } catch (error) {
          console.error(`Error fetching full info for ${id}:`, error);
        }
      });
      
      await Promise.all(tokenPromises);
      return chunkResult;
    });
    
    // Wait for all chunks to complete
    const chunkResults = await Promise.all(fetchPromises);
    
    // Merge all results
    chunkResults.forEach(chunkData => {
      Object.assign(result, chunkData);
    });
    
    return result;
  } catch (error) {
    console.error('Error in fetchMultipleTokensFullInfo:', error);
    throw error;
  }
}

// ===== CONTRACT ADDRESS FUNCTIONS =====

// Fetch token info by contract address
export async function fetchTokenInfoByContract(contractAddress, platform = 'ethereum') {
  if (!contractAddress || !contractAddress.trim()) return null;
  
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${platform}/contract/${encodeURIComponent(contractAddress.trim())}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API lỗi ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data || !data.symbol) {
      console.warn('Invalid contract data received:', data);
      return null;
    }
    
    // Extract exchanges from tickers
    const exchanges = [];
    if (data.tickers && Array.isArray(data.tickers)) {
      const exchangeSet = new Set();
      data.tickers.forEach(ticker => {
        if (ticker.market && ticker.market.name) {
          exchangeSet.add(ticker.market.name);
        }
      });
      exchanges.push(...Array.from(exchangeSet));
    }
    
    // Extract chains from platforms
    const chains = [];
    if (data.platforms && typeof data.platforms === 'object') {
      chains.push(...Object.keys(data.platforms));
    }
    
    // Extract categories
    const categories = data.categories || [];
    
    return {
      id: data.id || '',
      name: data.name || '',
      symbol: String(data.symbol || '').toUpperCase(),
      logo: data.image?.small || '',
      ath: data.market_data?.ath?.usd || 0,
      current_price: data.market_data?.current_price?.usd || 0,
      exchanges: exchanges,
      chains: chains,
      categories: categories,
      contract_address: contractAddress,
      platform: platform
    };
  } catch (error) {
    console.error('Error fetching token info by contract:', error);
    return null;
  }
}

// Fetch multiple tokens info by contract addresses
export async function fetchMultipleTokensByContracts(contracts, platform = 'ethereum') {
  if (!contracts.length) return {};
  
  try {
    const result = {};
    
    // Process each contract individually (CoinGecko contract API doesn't support batch)
    const fetchPromises = contracts.map(async (contract) => {
      try {
        const tokenInfo = await fetchTokenInfoByContract(contract, platform);
        if (tokenInfo) {
          result[contract] = tokenInfo;
        }
      } catch (error) {
        console.error(`Error fetching contract ${contract}:`, error);
      }
    });
    
    await Promise.all(fetchPromises);
    return result;
  } catch (error) {
    console.error('Error in fetchMultipleTokensByContracts:', error);
    throw error;
  }
}

// Fetch token prices by contract addresses
export async function fetchTokenPricesByContracts(contracts, platform = 'ethereum', currency = 'usd') {
  if (!contracts.length) return {};
  
  try {
    const result = {};
    
    // Chunk contracts into groups of MAX_IDS_PER_CALL
    const contractChunks = chunkArray(contracts, MAX_IDS_PER_CALL);
    
    // Fetch prices for each chunk
    const fetchPromises = contractChunks.map(async (contractChunk) => {
      const contractAddresses = contractChunk.join(',');
      const url = `https://api.coingecko.com/api/v3/simple/token_price/${platform}?contract_addresses=${encodeURIComponent(contractAddresses)}&vs_currencies=${encodeURIComponent(currency)}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`API lỗi ${res.status}`);
      }
      
      const data = await res.json();
      return data;
    });
    
    // Wait for all chunks to complete
    const chunkResults = await Promise.all(fetchPromises);
    
    // Merge all results
    chunkResults.forEach(chunkData => {
      Object.assign(result, chunkData);
    });
    
    return result;
  } catch (error) {
    console.error('Error in fetchTokenPricesByContracts:', error);
    throw error;
  }
}
