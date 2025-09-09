import { useEffect, useCallback, useRef } from 'react';
import { initializeDatabase, subscribeTgeWorkspace, loadTgeWorkspaceDataOnce, saveTgeWorkspaceData } from '../services/neon';
import { filterMainTokensFromRows, removePriceFromTgeRows } from '../utils/helpers';

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
      isInitializedRef.current = true;
    } catch (error) {
      console.error('Failed to initialize TGE Neon connection:', error);
    }
  }, []);

  // Load initial data from Neon
  const loadInitialData = useCallback(async () => {
    if (syncing || !isInitializedRef.current) return;
    
    console.log('TGE: Starting to load initial data from Neon...');
    setSyncing(true);
    try {
      const result = await loadTgeWorkspaceDataOnce(workspaceId);
      console.log('TGE: Neon load result:', result);
      
      if (result.data && result.data.length > 0) {
        // Always load from Neon if it has data, regardless of localStorage
        console.log(`TGE: Loaded ${result.data.length} rows from Neon`);
        console.log('TGE: First row from Neon:', result.data[0]);
        setRows(result.data);
      } else {
        console.log('TGE: No data found in Neon, keeping empty array');
      }
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('TGE: Failed to load data from Neon:', error);
      console.log('TGE: Keeping empty array due to error');
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
      // Filter out main tokens and price field before saving
      const filteredRows = filterMainTokensFromRows(data);
      const rowsWithoutPrice = removePriceFromTgeRows(filteredRows);
      await saveTgeWorkspaceData(workspaceId, rowsWithoutPrice);
      lastRowsHashRef.current = currentHash;
      console.log(`TGE: Saved ${rowsWithoutPrice.length} rows to Neon (price field excluded)`);
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
    const initAndLoad = async () => {
      await initializeNeon();
      await loadInitialData();
    };
    
    initAndLoad();
  }, []); // Empty dependency array

  // Remove the separate loadInitialData useEffect since it's now handled above

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
