import { useCallback, useEffect } from 'react';
import {
  ensureAnonymousLogin,
  saveWorkspaceData,
  loadWorkspaceDataOnce,
  subscribeWorkspace,
  SHARED_WORKSPACE_ID,
} from '../services/firebase';
import { checkCacheSync, forceSyncWithFirebase } from '../utils/cacheManager';

export const useFirebaseSync = (
  rows,
  setRows,
  workspaceId,
  setWorkspaceId,
  syncing,
  setSyncing,
  isRemoteUpdateRef,
  unsubRef,
  timerRef
) => {
    // Initialize Firebase sync
  const initializeFirebaseSync = useCallback(async () => {
    try {
      setSyncing(true);
      const user = await ensureAnonymousLogin();
      
      // Use shared workspace ID for all users
      const newWorkspaceId = SHARED_WORKSPACE_ID;
      setWorkspaceId(newWorkspaceId);
      
      // Check cache sync before loading data
      const cacheCheck = await checkCacheSync();
      if (cacheCheck.shouldClearCache) {
        console.log('Cache sync check: Clearing local cache due to:', cacheCheck.reason);
        
        // Auto force sync when cache is out of sync
        try {
          console.log('Auto force syncing due to cache sync issues...');
          const syncResult = await forceSyncWithFirebase();
          if (syncResult.success) {
            console.log('Auto force sync completed successfully');
            isRemoteUpdateRef.current = true;
            setRows(syncResult.data);
            isRemoteUpdateRef.current = false;
            return; // Skip normal loading since we already have synced data
          }
        } catch (error) {
          console.error('Auto force sync failed:', error);
        }
      }
      
      // Load initial data from Firebase shared workspace
      const firebaseData = await loadWorkspaceDataOnce(newWorkspaceId);
      
      if (firebaseData && Array.isArray(firebaseData)) {
        // Always use Firebase data, even if it's empty (cleared)
        isRemoteUpdateRef.current = true;
        setRows(firebaseData);
        isRemoteUpdateRef.current = false;
        
        // If Firebase data is empty, also clear local storage to prevent conflicts
        if (firebaseData.length === 0) {
          localStorage.removeItem('airdrop-alpha-data');
          console.log('Firebase data is empty, cleared local storage to prevent conflicts');
        }
      } else {
        // Only fallback to local storage if Firebase data is null/undefined (not empty array)
        console.warn('Firebase data is null/undefined, falling back to local storage');
        const localData = localStorage.getItem('airdrop-alpha-data');
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            if (Array.isArray(parsedData)) {
              isRemoteUpdateRef.current = true;
              setRows(parsedData);
              isRemoteUpdateRef.current = false;
            } else {
              console.warn('Parsed local data is not an array:', parsedData);
              throw new Error('Invalid data format');
            }
          } catch (e) {
            // Set sample data if local storage is corrupted (empty array - statscard tokens are managed separately)
            const sampleData = [];
            isRemoteUpdateRef.current = true;
            setRows(sampleData);
            isRemoteUpdateRef.current = false;
          }
        } else {
          // Set sample data if no local data (empty array - statscard tokens are managed separately)
          const sampleData = [];
          isRemoteUpdateRef.current = true;
          setRows(sampleData);
          isRemoteUpdateRef.current = false;
        }
      }
      
      // Subscribe to real-time updates from shared workspace
      const unsubscribe = subscribeWorkspace(newWorkspaceId, (data) => {
          if (data && Array.isArray(data)) {
          isRemoteUpdateRef.current = true;
          setRows(data);
          isRemoteUpdateRef.current = false;
          
          // If Firebase data is empty, also clear local storage to prevent conflicts
          if (data.length === 0) {
            localStorage.removeItem('airdrop-alpha-data');
            console.log('Real-time update: Firebase data is empty, cleared local storage');
          }
        } else {
          // Handle null/undefined data case
          console.warn('Real-time update: Received null/undefined data from Firebase');
          isRemoteUpdateRef.current = true;
          setRows([]);
          isRemoteUpdateRef.current = false;
        }
      });
      
      unsubRef.current = unsubscribe;
      setSyncing(false);
    } catch (error) {
      console.error('Firebase sync initialization failed:', error);
      
      // Load from local storage as fallback
      const localData = localStorage.getItem('airdrop-alpha-data');
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);
          if (Array.isArray(parsedData)) {
            isRemoteUpdateRef.current = true;
            setRows(parsedData);
            isRemoteUpdateRef.current = false;
          } else {
            console.warn('Parsed local data is not an array in fallback:', parsedData);
            throw new Error('Invalid data format');
          }
        } catch (e) {
          // Set sample data if local storage is corrupted (empty array - statscard tokens are managed separately)
          const sampleData = [];
          isRemoteUpdateRef.current = true;
          setRows(sampleData);
          isRemoteUpdateRef.current = false;
        }
      } else {
        // Set sample data if no local data (empty array - statscard tokens are managed separately)
        const sampleData = [];
        isRemoteUpdateRef.current = true;
        setRows(sampleData);
        isRemoteUpdateRef.current = false;
      }
      
      // Don't throw error, just disable Firebase sync gracefully
      setWorkspaceId(''); // Clear workspaceId to disable Firebase operations
      setSyncing(false);
    }
  }, [setWorkspaceId, setSyncing, setRows, isRemoteUpdateRef, unsubRef]);

  // Cleanup Firebase subscription
  const cleanupFirebaseSync = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [unsubRef, timerRef]);

  // Initialize sync on mount
  useEffect(() => {
    // Only initialize if we don't already have a workspaceId
    if (!workspaceId) {
      initializeFirebaseSync();
    }
    
    return () => {
      cleanupFirebaseSync();
    };
  }, [workspaceId]); // Remove function dependencies to prevent infinite loop

  // Force sync function (for internal use)
  const forceSync = useCallback(async () => {
    try {
      console.log('Force syncing with Firebase...');
      const syncResult = await forceSyncWithFirebase();
      if (syncResult.success) {
        console.log('Force sync completed successfully');
        isRemoteUpdateRef.current = true;
        setRows(syncResult.data);
        isRemoteUpdateRef.current = false;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Force sync failed:', error);
      return false;
    }
  }, [setRows, isRemoteUpdateRef]);

  return {
    initializeFirebaseSync,
    cleanupFirebaseSync,
    forceSync, // Expose force sync function for potential future use
  };
};
