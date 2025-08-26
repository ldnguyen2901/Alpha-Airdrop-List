import { useCallback, useEffect } from 'react';
import {
  ensureAnonymousLogin,
  saveWorkspaceData,
  loadWorkspaceDataOnce,
  subscribeWorkspace,
  SHARED_WORKSPACE_ID,
} from '../services/firebase';

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
      
      // Load initial data from Firebase shared workspace
      const firebaseData = await loadWorkspaceDataOnce(newWorkspaceId);
      if (firebaseData && firebaseData.length > 0) {
        isRemoteUpdateRef.current = true;
        setRows(firebaseData);
        isRemoteUpdateRef.current = false;
      }
      
      // Subscribe to real-time updates from shared workspace
      const unsubscribe = subscribeWorkspace(newWorkspaceId, (data) => {
        if (data && data.length > 0) {
          isRemoteUpdateRef.current = true;
          setRows(data);
          isRemoteUpdateRef.current = false;
        } else {
          // Handle empty data case
          isRemoteUpdateRef.current = true;
          setRows([]);
          isRemoteUpdateRef.current = false;
        }
      });
      
      unsubRef.current = unsubscribe;
      setSyncing(false);
    } catch (error) {
      console.error('Firebase sync initialization failed:', error);
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

  return {
    initializeFirebaseSync,
    cleanupFirebaseSync,
  };
};
