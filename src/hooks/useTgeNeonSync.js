import { useEffect, useCallback, useRef } from 'react';
import { initializeDatabase, subscribeTgeWorkspace, loadTgeWorkspaceDataOnce, saveTgeWorkspaceData } from '../services/neon';
import { filterMainTokensFromRows } from '../utils/helpers';

export function useTgeNeonSync(
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
) {
  // Use refs to prevent infinite loops
  const isInitializedRef = useRef(false);
  const isSubscribedRef = useRef(false);
  const lastRowsHashRef = useRef('');

  // Initialize Neon connection
  const initializeNeon = useCallback(async () => {
    if (isInitializedRef.current) return;
    
    try {
      await initializeDatabase();
      console.log('TGE Neon connection initialized');
      isInitializedRef.current = true;
    } catch (error) {
      console.error('Failed to initialize TGE Neon connection:', error);
    }
  }, []);

  // Load initial data from Neon
  const loadInitialData = useCallback(async () => {
    if (syncing || !isInitializedRef.current) return;
    
    setSyncing(true);
    try {
      const result = await loadTgeWorkspaceDataOnce(workspaceId);
      if (result.data && result.data.length > 0) {
        // Only set data if current rows are empty (to avoid overwriting localStorage data)
        setRows(currentRows => {
          if (currentRows.length === 0) {
            console.log(`TGE: Loaded ${result.data.length} rows from Neon`);
            return result.data;
          } else {
            console.log(`TGE: Current data exists (${currentRows.length} rows), keeping local data`);
            return currentRows;
          }
        });
      } else {
        console.log('TGE: No data found in Neon, keeping current data');
      }
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('TGE: Failed to load data from Neon:', error);
    } finally {
      setSyncing(false);
    }
  }, [workspaceId, setSyncing, setRows, setLastSyncTime]);

  // Save data to Neon
  const saveToNeon = useCallback(async (data) => {
    if (syncing || !isInitializedRef.current) return;
    
    // Check if data actually changed
    const currentHash = JSON.stringify(data);
    if (currentHash === lastRowsHashRef.current) {
      console.log('TGE: Data unchanged, skipping save');
      return;
    }
    
    setSyncing(true);
    try {
      // Filter out main tokens before saving
      const filteredRows = filterMainTokensFromRows(data);
      await saveTgeWorkspaceData(workspaceId, filteredRows);
      lastRowsHashRef.current = currentHash;
      console.log(`TGE: Saved ${filteredRows.length} rows to Neon`);
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('TGE: Failed to save data to Neon:', error);
    } finally {
      setSyncing(false);
    }
  }, [workspaceId, setSyncing, setLastSyncTime]);

  // Subscribe to real-time changes
  const subscribeToNeonChanges = useCallback(async () => {
    if (isSubscribedRef.current || !isInitializedRef.current) return;
    
    try {
      const unsubscribe = await subscribeTgeWorkspace(workspaceId, (data) => {
        // Only update if data is different from current
        setRows(currentRows => {
          const currentHash = JSON.stringify(currentRows);
          const newHash = JSON.stringify(data);
          
          if (currentHash !== newHash) {
            isRemoteUpdateRef.current = true;
            lastRowsHashRef.current = newHash;
            setLastSyncTime(new Date().toISOString());
            console.log('TGE: Received real-time update from Neon');
            
            // Reset the flag after a short delay
            setTimeout(() => {
              isRemoteUpdateRef.current = false;
            }, 100);
            
            return data;
          } else {
            console.log('TGE: Remote data unchanged, skipping update');
            return currentRows;
          }
        });
      });
      
      unsubRef.current = unsubscribe;
      isSubscribedRef.current = true;
      console.log('TGE: Subscribed to Neon real-time changes');
    } catch (error) {
      console.error('TGE: Failed to subscribe to Neon changes:', error);
    }
  }, [workspaceId, setRows, setLastSyncTime, isRemoteUpdateRef, unsubRef]);

  // Force sync
  const forceSync = useCallback(async () => {
    await saveToNeon(rows);
  }, [saveToNeon, rows]);

  // Initialize on mount (only once)
  useEffect(() => {
    initializeNeon();
  }, []); // Empty dependency array

  // Load data when workspace changes (only once after initialization)
  useEffect(() => {
    if (workspaceId && isInitializedRef.current && !isSubscribedRef.current) {
      loadInitialData();
    }
  }, [workspaceId, loadInitialData]);

  // Subscribe to changes when workspace changes (only once)
  useEffect(() => {
    if (workspaceId && isInitializedRef.current && !isSubscribedRef.current) {
      subscribeToNeonChanges();
    }
    
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [workspaceId, subscribeToNeonChanges]);

  // Auto-save when rows change (but not from remote updates) - with debouncing
  useEffect(() => {
    if (!isRemoteUpdateRef.current && rows.length >= 0 && isInitializedRef.current) {
      // Skip auto-save if rows are empty and we haven't loaded from Neon yet
      if (rows.length === 0 && !isSubscribedRef.current) {
        return;
      }
      
      const timeoutId = setTimeout(() => {
        saveToNeon(rows);
      }, 2000); // Increased debounce to 2 seconds
      
      return () => clearTimeout(timeoutId);
    }
  }, [rows, saveToNeon, isRemoteUpdateRef]);

  return {
    loadInitialData,
    saveToNeon,
    forceSync,
  };
}
