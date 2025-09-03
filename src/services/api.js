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
    
    // Fetch prices for each chunk using /simple/price API
    const fetchPromises = idChunks.map(async (idChunk) => {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(idChunk.join(","))}&vs_currencies=${encodeURIComponent(currency)}`;
      
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
