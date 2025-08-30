// Cache management utilities
import { loadWorkspaceDataOnce, loadStatscardPrices, SHARED_WORKSPACE_ID, STATSCARD_WORKSPACE_ID } from '../services/firebase';

// Check if local cache is out of sync with Firebase
export const checkCacheSync = async () => {
  try {
    // Get Firebase data
    const firebaseData = await loadWorkspaceDataOnce(SHARED_WORKSPACE_ID);
    
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
    
    // If Firebase is empty but local has data, clear local cache
    if (firebaseData && Array.isArray(firebaseData) && firebaseData.length === 0) {
      if (parsedLocalData && Array.isArray(parsedLocalData) && parsedLocalData.length > 0) {
        console.log('Firebase is empty but local cache has data. Clearing local cache...');
        localStorage.removeItem('airdrop-alpha-data');
        return { shouldClearCache: true, reason: 'firebase_empty_local_has_data' };
      }
    }
    
    // If Firebase has data but local is empty, this is normal
    if (firebaseData && Array.isArray(firebaseData) && firebaseData.length > 0) {
      if (!parsedLocalData || !Array.isArray(parsedLocalData) || parsedLocalData.length === 0) {
        console.log('Firebase has data but local cache is empty. This is normal.');
        return { shouldClearCache: false, reason: 'firebase_has_data_local_empty' };
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

// Force sync with Firebase (clear local cache and return Firebase data)
export const forceSyncWithFirebase = async () => {
  try {
    console.log('Forcing sync with Firebase...');
    
    // Clear local cache
    clearAllCache();
    
    // Reload from Firebase
    const firebaseData = await loadWorkspaceDataOnce(SHARED_WORKSPACE_ID);
    
    if (firebaseData && Array.isArray(firebaseData)) {
      console.log('Successfully synced with Firebase, data length:', firebaseData.length);
      return { success: true, data: firebaseData };
    } else {
      console.log('Firebase data is empty or invalid');
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error('Error forcing sync with Firebase:', error);
    return { success: false, error };
  }
};
