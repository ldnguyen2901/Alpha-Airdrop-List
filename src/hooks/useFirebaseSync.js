import { useCallback, useEffect } from 'react';
import {
  ensureAnonymousLogin,
  saveWorkspaceData,
  loadWorkspaceDataOnce,
  subscribeWorkspace,
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
      const { userId, workspaceId: newWorkspaceId } = await ensureAnonymousLogin();
      setWorkspaceId(newWorkspaceId);
      
      // Load initial data from Firebase
      const firebaseData = await loadWorkspaceDataOnce(newWorkspaceId);
      if (firebaseData && firebaseData.length > 0) {
        isRemoteUpdateRef.current = true;
        setRows(firebaseData);
        isRemoteUpdateRef.current = false;
      }
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeWorkspace(newWorkspaceId, (data) => {
        if (data && data.length > 0) {
          isRemoteUpdateRef.current = true;
          setRows(data);
          isRemoteUpdateRef.current = false;
        }
      });
      
      unsubRef.current = unsubscribe;
      setSyncing(false);
    } catch (error) {
      console.error('Firebase sync initialization failed:', error);
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
    initializeFirebaseSync();
    
    return () => {
      cleanupFirebaseSync();
    };
  }, [initializeFirebaseSync, cleanupFirebaseSync]);

  return {
    initializeFirebaseSync,
    cleanupFirebaseSync,
  };
};
