export async function fetchCryptoPrices(ids, currency = 'usd') {
  if (!ids.length) return {};
  
  // Sử dụng API mới: /coins/markets thay vì /simple/price
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${encodeURIComponent(currency)}&ids=${encodeURIComponent(ids.join(","))}&order=market_cap_desc&per_page=250&page=1&sparkline=false`;

  try {
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API lỗi ${res.status}`);
    }
    
    const data = await res.json();
    
    // Chuyển đổi format từ array sang object với key là coin id
    const result = {};
    data.forEach(coin => {
      result[coin.id] = {
        usd: coin.current_price,
        ath: coin.ath,
        image: coin.image,
        symbol: coin.symbol,
        name: coin.name
      };
    });

    return result;
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
    // Sử dụng API mới: /coins/markets thay vì /coins/{id}
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
    return {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      logo: coin.image,
      ath: coin.ath,
      current_price: coin.current_price
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}
