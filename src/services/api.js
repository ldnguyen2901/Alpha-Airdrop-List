export async function fetchCryptoPrices(ids, currency = 'usd') {
  console.log('🌐 fetchCryptoPrices called with:', { ids, currency });
  if (!ids.length) return {};
  
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=${encodeURIComponent(currency)}`;
  console.log('🌐 API URL:', url);
  
  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API lỗi ${res.status}`);
    }
    
    const data = await res.json();
    console.log('🌐 API response:', data);
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
