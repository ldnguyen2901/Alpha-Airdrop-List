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
      } else {
        // Load from local storage as fallback
        const localData = localStorage.getItem('airdrop-data');
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            isRemoteUpdateRef.current = true;
            setRows(parsedData);
            isRemoteUpdateRef.current = false;
          } catch (e) {
            // Set sample data if local storage is corrupted
            const sampleData = [
              {
                name: 'Bitcoin',
                amount: 1000,
                launchAt: '31/12/2024 15:30',
                apiId: 'bitcoin',
                pointPriority: '100',
                pointFCFS: '50',
                price: 45000,
                reward: 45000000,
                highestPrice: 50000,
                logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
                symbol: 'BTC',
                id: 'bitcoin-2'
              },
              {
                name: 'Ethereum',
                amount: 500,
                launchAt: '01/01/2025 10:00',
                apiId: 'ethereum',
                pointPriority: '80',
                pointFCFS: '40',
                price: 3000,
                reward: 1500000,
                highestPrice: 3500,
                logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
                symbol: 'ETH',
                id: 'ethereum-2'
              }
            ];
            isRemoteUpdateRef.current = true;
            setRows(sampleData);
            isRemoteUpdateRef.current = false;
          }
        } else {
          // Set sample data if no local data
          const sampleData = [
            {
              name: 'Bitcoin',
              amount: 1000,
              launchAt: '31/12/2024 15:30',
              apiId: 'bitcoin',
              pointPriority: '100',
              pointFCFS: '50',
              price: 45000,
              reward: 45000000,
              highestPrice: 50000,
              logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
              symbol: 'BTC',
              id: 'bitcoin-1'
            },
            {
              name: 'Ethereum',
              amount: 500,
              launchAt: '01/01/2025 10:00',
              apiId: 'ethereum',
              pointPriority: '80',
              pointFCFS: '40',
              price: 3000,
              reward: 1500000,
              highestPrice: 3500,
              logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
              symbol: 'ETH',
              id: 'ethereum-1'
            }
          ];
          isRemoteUpdateRef.current = true;
          setRows(sampleData);
          isRemoteUpdateRef.current = false;
        }
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
      
      // Load from local storage as fallback
      const localData = localStorage.getItem('airdrop-data');
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);
          isRemoteUpdateRef.current = true;
          setRows(parsedData);
          isRemoteUpdateRef.current = false;
        } catch (e) {
          // Set sample data if local storage is corrupted
          const sampleData = [
            {
              name: 'Bitcoin',
              amount: 1000,
              launchAt: '31/12/2024 15:30',
              apiId: 'bitcoin',
              pointPriority: '100',
              pointFCFS: '50',
              price: 45000,
              reward: 45000000,
              highestPrice: 50000,
              logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
              symbol: 'BTC',
              id: 'bitcoin-3'
            },
            {
              name: 'Ethereum',
              amount: 500,
              launchAt: '01/01/2025 10:00',
              apiId: 'ethereum',
              pointPriority: '80',
              pointFCFS: '40',
              price: 3000,
              reward: 1500000,
              highestPrice: 3500,
              logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
              symbol: 'ETH',
              id: 'ethereum-3'
            }
          ];
          isRemoteUpdateRef.current = true;
          setRows(sampleData);
          isRemoteUpdateRef.current = false;
        }
      } else {
        // Set sample data if no local data
        const sampleData = [
          {
            name: 'Bitcoin',
            amount: 1000,
            launchAt: '31/12/2024 15:30',
            apiId: 'bitcoin',
            pointPriority: '100',
            pointFCFS: '50',
            price: 45000,
            reward: 45000000,
            highestPrice: 50000,
            logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
            symbol: 'BTC',
            id: 'bitcoin-4'
          },
          {
            name: 'Ethereum',
            amount: 500,
            launchAt: '01/01/2025 10:00',
            apiId: 'ethereum',
            pointPriority: '80',
            pointFCFS: '40',
            price: 3000,
            reward: 1500000,
            highestPrice: 3500,
            logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
            symbol: 'ETH',
            id: 'ethereum-4'
          }
        ];
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

  return {
    initializeFirebaseSync,
    cleanupFirebaseSync,
  };
};
