import { useState, useRef } from 'react';
import { newRow, loadDataFromStorage, validateAndFixStorageData } from '../utils';

export const useAppState = () => {
  // Main data state
  const [rows, setRows] = useState(() => {
    // First try to validate and fix any corrupted data
    const validatedData = validateAndFixStorageData();
    if (validatedData && Array.isArray(validatedData) && validatedData.length > 0) {
      return validatedData;
    }
    
    // If no valid data, try normal load
    const savedData = loadDataFromStorage();
    if (savedData && Array.isArray(savedData)) {
      return savedData;
    }
    
    // If savedData is not an array, return empty array (statscard tokens are managed separately)
    console.warn('Invalid saved data format, using empty array:', savedData);
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
    contractAddress: '',
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
  };
};
