// Price cache management functions
const PRICE_CACHE_KEY = 'alpha_airdrop_price_cache';

export const savePriceCache = (prices) => {
  try {
    const cacheData = {
      prices,
      timestamp: Date.now(),
      version: '1.0'
    };
    localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(cacheData));
    console.log(`💾 Saved price cache for ${Object.keys(prices).length} tokens`);
  } catch (error) {
    console.error('Error saving price cache:', error);
  }
};

export const loadPriceCache = () => {
  try {
    const cacheData = localStorage.getItem(PRICE_CACHE_KEY);
    if (!cacheData) return null;
    
    const parsed = JSON.parse(cacheData);
    console.log(`📦 Loaded price cache for ${Object.keys(parsed.prices).length} tokens (age: ${Date.now() - parsed.timestamp}ms)`);
    return parsed;
  } catch (error) {
    console.error('Error loading price cache:', error);
    return null;
  }
};

export const clearPriceCache = () => {
  try {
    localStorage.removeItem(PRICE_CACHE_KEY);
    console.log('🗑️ Cleared price cache');
  } catch (error) {
    console.error('Error clearing price cache:', error);
  }
};

export const getCacheAge = (cacheData) => {
  if (!cacheData || !cacheData.timestamp) return Infinity;
  return Date.now() - cacheData.timestamp;
};

export const isCacheValid = (cacheData) => {
  if (!cacheData) return false;
  const age = getCacheAge(cacheData);
  // Cache is valid if it exists (no time limit, only replaced when new data arrives)
  return age >= 0;
};
