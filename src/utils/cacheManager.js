// Cache management utilities
import { loadWorkspaceDataOnce, loadStatscardPrices, SHARED_WORKSPACE_ID, STATSCARD_WORKSPACE_ID } from '../services';

// Check if local cache is out of sync with Neon
export const checkCacheSync = async () => {
  try {
    // Get Neon data
    const neonData = await loadWorkspaceDataOnce(SHARED_WORKSPACE_ID);
    
    // Get local data
    const localData = localStorage.getItem('airdrop-alpha-data');
    let parsedLocalData = null;
    
    if (localData) {
      try {
        parsedLocalData = JSON.parse(localData);
      } catch (e) {
        console.warn('Failed to parse local data:', e);
        parsedLocalData = null;
      }
    }
    
    // If Neon is empty but local has data, clear local cache
    if (neonData && Array.isArray(neonData) && neonData.length === 0) {
      if (parsedLocalData && Array.isArray(parsedLocalData) && parsedLocalData.length > 0) {
        console.log('Neon is empty but local cache has data. Clearing local cache...');
        localStorage.removeItem('airdrop-alpha-data');
        return { shouldClearCache: true, reason: 'neon_empty_local_has_data' };
      }
    }
    
    // If Neon has data but local is empty, this is normal
    if (neonData && Array.isArray(neonData) && neonData.length > 0) {
      if (!parsedLocalData || !Array.isArray(parsedLocalData) || parsedLocalData.length === 0) {
        console.log('Neon has data but local cache is empty. This is normal.');
        return { shouldClearCache: false, reason: 'neon_has_data_local_empty' };
      }
    }
    
    return { shouldClearCache: false, reason: 'cache_in_sync' };
  } catch (error) {
    console.error('Error checking cache sync:', error);
    return { shouldClearCache: false, reason: 'error_checking_sync' };
  }
};

// Clear all cache data
export const clearAllCache = () => {
  try {
    // Clear main data
    localStorage.removeItem('airdrop-alpha-data');
    
    // Clear statscard data
    localStorage.removeItem('statscard-prices-data');
    
    // Clear all price history
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('price_history_') || key === 'highest_prices') {
        localStorage.removeItem(key);
        console.log('Removed cache key:', key);
      }
    });
    
    console.log('All cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

// Force sync with Neon (clear local cache and return Neon data)
export const forceSyncWithNeon = async () => {
  try {
    console.log('Forcing sync with Neon...');
    
    // Clear local cache
    clearAllCache();
    
    // Reload from Neon
    const neonData = await loadWorkspaceDataOnce(SHARED_WORKSPACE_ID);
    
    if (neonData && Array.isArray(neonData)) {
      console.log('Successfully synced with Neon, data length:', neonData.length);
      return { success: true, data: neonData };
    } else {
      console.log('Neon data is empty or invalid');
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error('Error forcing sync with Neon:', error);
    return { success: false, error };
  }
};
