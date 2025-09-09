import { useState, useRef } from 'react';
import { newRow, loadDataFromStorage, validateAndFixStorageData, clearAirdropLocalStorageData } from '../utils';

export const useAppState = () => {
  // Main data state - start with empty array, load from database first
  const [rows, setRows] = useState(() => {
    console.log('Airdrop: Initializing with empty array, will load from database first');
    // Clear localStorage to force database load
    clearAirdropLocalStorageData();
    return [];
  });

  // Refs
  const timerRef = useRef(null);
  const unsubRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);
  const fetchPendingRef = useRef(null);
  const highlightRowRef = useRef(null);

  // Sync and loading states
  const [workspaceId, setWorkspaceId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Price states
  const [btcPrice, setBtcPrice] = useState(0);
  const [ethPrice, setEthPrice] = useState(0);
  const [bnbPrice, setBnbPrice] = useState(0);
  const [tokenLogos, setTokenLogos] = useState({});

  // UI states
  const [isMobile, setIsMobile] = useState(() => {
    const mobileInitial = window.innerWidth < 768;
  
    return mobileInitial;
  });
  const [showATH, setShowATH] = useState(true); // Thêm state cho ATH
  const [searchToken, setSearchToken] = useState('');

  // Modal states
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalPosition, setAddModalPosition] = useState(null);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [duplicatesData, setDuplicatesData] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    amount: '',
    launchAt: '',
    launchDate: '',
    launchTime: '',
    apiId: '',
    pointPriority: '',
    pointFCFS: '',
  });
  const [addErrors, setAddErrors] = useState({});

  return {
    // Data
    rows,
    setRows,
    
    // Refs
    timerRef,
    unsubRef,
    isRemoteUpdateRef,
    fetchPendingRef,
    highlightRowRef,
    
    // Sync states
    workspaceId,
    setWorkspaceId,
    syncing,
    setSyncing,
    loading,
    setLoading,
    lastUpdated,
    setLastUpdated,
    isPageVisible,
    setIsPageVisible,
    
    // Price states
    btcPrice,
    setBtcPrice,
    ethPrice,
    setEthPrice,
    bnbPrice,
    setBnbPrice,
    tokenLogos,
    setTokenLogos,
    
    // UI states
    isMobile,
    setIsMobile,
    showATH,
    setShowATH,
    searchToken,
    setSearchToken,
    
    // Modal states
    showExcelUpload,
    setShowExcelUpload,
    showAddModal,
    setShowAddModal,
    addModalPosition,
    setAddModalPosition,
    showDuplicatesModal,
    setShowDuplicatesModal,
    duplicatesData,
    setDuplicatesData,
    
    // Form states
    addForm,
    setAddForm,
    addErrors,
    setAddErrors,
    
    // Sync time states
    lastSyncTime,
    setLastSyncTime,
  };
};
