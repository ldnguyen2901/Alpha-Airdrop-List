import { useEffect, useRef } from 'react';
import {
  saveWorkspaceData,
  loadWorkspaceDataOnce,
  subscribeWorkspace,
  initializeDatabase
} from '../services/neon';
import { filterMainTokensFromRows } from '../utils/helpers';

export const useNeonSync = (
  rows,
  setRows,
  workspaceId,
  setWorkspaceId,
  syncing,
  setSyncing,
  isRemoteUpdateRef,
  unsubRef,
  timerRef,
  setLastSyncTime
) => {
  const isInitializedRef = useRef(false);

  // Initialize database on first load
  useEffect(() => {
    if (!isInitializedRef.current) {
      initializeDatabase().catch(console.error);
      isInitializedRef.current = true;
    }
  }, []);

  // Load initial data
  const loadInitialData = async () => {
    try {
      setSyncing(true);
      const result = await loadWorkspaceDataOnce(workspaceId);
      if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
        // Filter out main tokens from shared workspace data
        const filteredData = filterMainTokensFromRows(result.data);
        isRemoteUpdateRef.current = true;
        setRows(filteredData);
        
        // Set last sync time from database
        if (result.updatedAt && setLastSyncTime) {
          setLastSyncTime(new Date(result.updatedAt));
        }
        
        console.log('Airdrop: Loaded data from Neon:', filteredData.length, 'rows (excluding main tokens)');
      } else {
        console.log('Airdrop: No data found in Neon, keeping empty array');
      }
    } catch (error) {
      console.error('Airdrop: Error loading initial data from Neon:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Save data to Neon
  const saveData = async (dataToSave = rows) => {
    try {
      // Skip save if this is a remote update to prevent infinite loops
      if (isRemoteUpdateRef.current) {
        console.log('Skipping save - remote update in progress');
        return;
      }

      setSyncing(true);
      // Filter out main tokens before saving to shared workspace
      const filteredData = filterMainTokensFromRows(dataToSave);
      await saveWorkspaceData(workspaceId, filteredData);
      console.log('Saved data to Neon:', filteredData.length, 'rows (excluding main tokens)');
    } catch (error) {
      console.error('Error saving data to Neon:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Subscribe to real-time updates
  const subscribeToUpdates = () => {
    if (unsubRef.current) {
      unsubRef.current();
    }

    unsubRef.current = subscribeWorkspace(workspaceId, (data, updatedAt) => {
      if (data && Array.isArray(data) && data.length > 0) {
        // Filter out main tokens from real-time updates
        const filteredData = filterMainTokensFromRows(data);
        
        // Set remote update flag BEFORE updating rows
        isRemoteUpdateRef.current = true;
        
        // Update rows with new data
        setRows(filteredData);
        
        // Update last sync time from database
        if (updatedAt && setLastSyncTime) {
          setLastSyncTime(new Date(updatedAt));
        }
        
        console.log('🔄 Received real-time update from Neon:', filteredData.length, 'rows (excluding main tokens)');
        
        // Reset remote update flag after a short delay to allow state to settle
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 100);
      }
    });
  };

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Subscribe to updates when workspaceId changes
  useEffect(() => {
    if (workspaceId) {
      subscribeToUpdates();
    }

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, [workspaceId]);

  // Save data when rows change
  useEffect(() => {
    if (rows.length > 0 && !isRemoteUpdateRef.current) {
      // Debounce save to avoid too many database calls
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      timerRef.current = setTimeout(() => {
        // Only save if data has actually changed
        const currentData = JSON.stringify(rows);
        const lastSavedData = localStorage.getItem('last-saved-data');
        
        if (currentData !== lastSavedData) {
          console.log('💾 Saving local changes to Neon...');
          saveData();
          localStorage.setItem('last-saved-data', currentData);
        } else {
          console.log('✅ No local changes detected, skipping save');
        }
      }, 2000); // Increased debounce time to 2 seconds
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [rows]);

  // Force sync function
  const forceSync = async () => {
    try {
      setSyncing(true);
      
      // Load fresh data from database
      const result = await loadWorkspaceDataOnce(workspaceId);
      
      if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
        // Filter out main tokens from fresh data
        const filteredData = filterMainTokensFromRows(result.data);
        isRemoteUpdateRef.current = true;
        setRows(filteredData);
        
        // Update last sync time from database
        if (result.updatedAt && setLastSyncTime) {
          setLastSyncTime(new Date(result.updatedAt));
        }
        
        console.log('Force sync completed with Neon, loaded:', filteredData.length, 'rows (excluding main tokens)');
        return true;
      } else {
        console.log('Force sync completed with Neon, no data found');
        return true;
      }
    } catch (error) {
      console.error('Error during force sync with Neon:', error);
      return false;
    } finally {
      setSyncing(false);
    }
  };

  return {
    saveData,
    loadInitialData,
    forceSync,
    subscribeToUpdates
  };
};
