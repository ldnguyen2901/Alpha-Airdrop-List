// Cache management utilities
import { loadWorkspaceDataOnce, loadStatscardPrices, SHARED_WORKSPACE_ID, STATSCARD_WORKSPACE_ID } from '../services';
import { filterMainTokensFromRows } from './helpers';


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
    
    // Reload from Neon - filter out main tokens
    const neonData = await loadWorkspaceDataOnce(SHARED_WORKSPACE_ID);
    const filteredNeonData = filterMainTokensFromRows(neonData || []);
    
    if (filteredNeonData && Array.isArray(filteredNeonData)) {
      console.log('Successfully synced with Neon, data length:', filteredNeonData.length, '(excluding main tokens)');
      return { success: true, data: filteredNeonData };
    } else {
      console.log('Neon data is empty or invalid');
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error('Error forcing sync with Neon:', error);
    return { success: false, error };
  }
};
