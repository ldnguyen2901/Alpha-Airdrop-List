import { useState, useRef, useEffect } from 'react';
import { loadTgeDataFromStorage } from '../utils';

export function useTgeAppState() {
  // Main data state
  const [rows, setRows] = useState([]);
  
  // Workspace ID - TGE specific
  const [workspaceId, setWorkspaceId] = useState('tge-workspace');
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  
  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    launchAt: '',
    launchDate: '',
    launchTime: '',
    apiId: '',
    point: '',
  });
  const [addErrors, setAddErrors] = useState({});
  
  // Modal position for mobile
  const [addModalPosition, setAddModalPosition] = useState({ top: 60, left: 16 });
  
  // Duplicates data
  const [duplicatesData, setDuplicatesData] = useState([]);
  
  // Search and filter states
  const [searchToken, setSearchToken] = useState('');
  const [showATH, setShowATH] = useState(true);
  
  // Price tracking states
  const [btcPrice, setBtcPrice] = useState(0);
  const [ethPrice, setEthPrice] = useState(0);
  const [bnbPrice, setBnbPrice] = useState(0);
  const [tokenLogos, setTokenLogos] = useState({});
  
  // Timestamps
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  // Page visibility
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Refs for cleanup
  const isRemoteUpdateRef = useRef(false);
  const unsubRef = useRef(null);
  const timerRef = useRef(null);
  const highlightRowRef = useRef(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Load initial data from localStorage (only if no data exists)
  useEffect(() => {
    const savedData = loadTgeDataFromStorage();
    if (savedData && Array.isArray(savedData) && savedData.length > 0) {
      setRows(savedData);
      console.log('TGE: Loaded data from localStorage:', savedData.length, 'rows');
      console.log('TGE: First row from localStorage:', savedData[0]);
    } else {
      console.log('TGE: No localStorage data found, will load from Neon');
    }
  }, []);
  
  return {
    // Data
    rows,
    setRows,
    
    // Workspace
    workspaceId,
    setWorkspaceId,
    
    // Loading states
    loading,
    setLoading,
    syncing,
    setSyncing,
    
    // Modals
    showAddModal,
    setShowAddModal,
    showExcelUpload,
    setShowExcelUpload,
    showDuplicatesModal,
    setShowDuplicatesModal,
    
    // Forms
    addForm,
    setAddForm,
    addErrors,
    setAddErrors,
    addModalPosition,
    setAddModalPosition,
    
    // Duplicates
    duplicatesData,
    setDuplicatesData,
    
    // Search and filters
    searchToken,
    setSearchToken,
    showATH,
    setShowATH,
    
    // Prices
    btcPrice,
    setBtcPrice,
    ethPrice,
    setEthPrice,
    bnbPrice,
    setBnbPrice,
    tokenLogos,
    setTokenLogos,
    
    // Timestamps
    lastUpdated,
    setLastUpdated,
    lastSyncTime,
    setLastSyncTime,
    
    // UI states
    isPageVisible,
    setIsPageVisible,
    isMobile,
    setIsMobile,
    
    // Refs
    isRemoteUpdateRef,
    unsubRef,
    timerRef,
    highlightRowRef,
  };
}
