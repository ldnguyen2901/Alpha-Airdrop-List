import { filterMainTokensFromRows } from './helpers';

const STORAGE_KEY = 'airdrop-alpha-data';
const TGE_STORAGE_KEY = 'tge-alpha-data';
const SORT_STORAGE_KEY = 'airdrop-alpha-sort';
const TGE_SORT_STORAGE_KEY = 'tge-alpha-sort';
const BACKUP_KEY = 'airdrop-alpha-backup';
const TGE_BACKUP_KEY = 'tge-alpha-backup';
const WORKSPACE_ID_KEY = 'airdrop-alpha-workspace-id';
const TGE_WORKSPACE_ID_KEY = 'tge-alpha-workspace-id';

export function saveDataToStorage(data) {
  try {
    // Filter out main tokens before saving to localStorage
    const filteredData = filterMainTokensFromRows(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredData));

    // Create backup with timestamp
    const backup = {
      data: filteredData,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));

    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}

export function saveTgeDataToStorage(data) {
  try {
    // Filter out main tokens before saving to localStorage
    const filteredData = filterMainTokensFromRows(data);
    localStorage.setItem(TGE_STORAGE_KEY, JSON.stringify(filteredData));

    // Create backup with timestamp
    const backup = {
      data: filteredData,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem(TGE_BACKUP_KEY, JSON.stringify(backup));

    return true;
  } catch (error) {
    console.error('Error saving TGE data:', error);
    return false;
  }
}

export function loadDataFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    if (!Array.isArray(parsedData)) return null;
    
    // Filter out main tokens from loaded data
    const filteredData = filterMainTokensFromRows(parsedData);
    return filteredData;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
}

export function loadTgeDataFromStorage() {
  try {
    const data = localStorage.getItem(TGE_STORAGE_KEY);
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    if (!Array.isArray(parsedData)) return null;
    
    // Don't filter main tokens when loading from localStorage
    // Let the user decide what to keep
    return parsedData;
  } catch (error) {
    console.error('Error loading TGE data:', error);
    return null;
  }
}

export function exportDataToFile(data) {
  try {
    const exportData = {
      data: data,
      timestamp: new Date().toISOString(),
      version: '1.0',
      exportType: 'airdrop-alpha-backup',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airdrop-alpha-backup-${
      new Date().toISOString().split('T')[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error exporting data:', error);
    return false;
  }
}

export function importDataFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);

        // Validate import data
        if (
          importData.exportType === 'airdrop-alpha-backup' &&
          importData.data &&
          Array.isArray(importData.data)
        ) {
          // Filter out main tokens from imported data
          const filteredData = filterMainTokensFromRows(importData.data);
          // Save imported data
          saveDataToStorage(filteredData);
          resolve(filteredData);
        } else {
          reject(new Error('Invalid backup file format'));
        }
      } catch (error) {
        reject(new Error('Failed to parse backup file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function getBackupInfo() {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      const backupData = JSON.parse(backup);
      return {
        timestamp: backupData.timestamp,
        version: backupData.version,
        dataCount: backupData.data?.length || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting backup info:', error);
    return null;
  }
}

export function saveSortConfig(sortConfig) {
  try {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sortConfig));
    return true;
  } catch (error) {
    console.error('Error saving sort config:', error);
    return false;
  }
}

export function loadSortConfig() {
  try {
    const data = localStorage.getItem(SORT_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading sort config:', error);
    return null;
  }
}

export function saveTgeSortConfig(sortConfig) {
  try {
    localStorage.setItem(TGE_SORT_STORAGE_KEY, JSON.stringify(sortConfig));
    return true;
  } catch (error) {
    console.error('Error saving TGE sort config:', error);
    return false;
  }
}

export function loadTgeSortConfig() {
  try {
    const data = localStorage.getItem(TGE_SORT_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading TGE sort config:', error);
    return null;
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SORT_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}

export function saveWorkspaceId(workspaceId) {
  try {
    localStorage.setItem(WORKSPACE_ID_KEY, workspaceId || '');
    return true;
  } catch (error) {
    console.error('Error saving workspace id:', error);
    return false;
  }
}

export function loadWorkspaceId() {
  try {
    return localStorage.getItem(WORKSPACE_ID_KEY) || '';
  } catch (error) {
    console.error('Error loading workspace id:', error);
    return '';
  }
}

export function saveTgeWorkspaceId(workspaceId) {
  try {
    localStorage.setItem(TGE_WORKSPACE_ID_KEY, workspaceId || '');
    return true;
  } catch (error) {
    console.error('Error saving TGE workspace id:', error);
    return false;
  }
}

export function loadTgeWorkspaceId() {
  try {
    return localStorage.getItem(TGE_WORKSPACE_ID_KEY) || '';
  } catch (error) {
    console.error('Error loading TGE workspace id:', error);
    return '';
  }
}

// Price tracking storage functions
export const savePriceHistory = (apiId, priceHistory) => {
  try {
    const key = `price_history_${apiId}`;
    localStorage.setItem(key, JSON.stringify(priceHistory));
  } catch (error) {
    console.error('Error saving price history:', error);
  }
};

export const loadPriceHistory = (apiId) => {
  try {
    const key = `price_history_${apiId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading price history:', error);
    return [];
  }
};

export const saveHighestPrices = (highestPrices) => {
  try {
    localStorage.setItem('highest_prices', JSON.stringify(highestPrices));
  } catch (error) {
    console.error('Error saving highest prices:', error);
  }
};

export const loadHighestPrices = () => {
  try {
    const data = localStorage.getItem('highest_prices');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading highest prices:', error);
    return {};
  }
};

export const clearPriceHistory = (apiId) => {
  try {
    const key = `price_history_${apiId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing price history:', error);
  }
};

export const clearAllPriceHistory = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('price_history_')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem('highest_prices');
  } catch (error) {
    console.error('Error clearing all price history:', error);
  }
};

export function validateAndFixStorageData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      console.log('No data found in storage, creating default data');
      return null;
    }
    
    const parsedData = JSON.parse(data);
    if (!Array.isArray(parsedData)) {
      console.warn('Data in storage is not an array, clearing corrupted data:', parsedData);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    // Validate each row has required structure
    const validRows = parsedData.filter(row => {
      if (!row || typeof row !== 'object') {
        console.warn('Invalid row found:', row);
        return false;
      }
      return true;
    });
    
    if (validRows.length !== parsedData.length) {
      console.warn(`Filtered out ${parsedData.length - validRows.length} invalid rows`);
      saveDataToStorage(validRows);
    }
    
    // Filter out main tokens from validated data
    const filteredData = filterMainTokensFromRows(validRows);
    return filteredData;
  } catch (error) {
    console.error('Error validating storage data:', error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
