import { useState, useRef } from 'react';
import { newRow, loadDataFromStorage } from '../utils';

export const useAppState = () => {
  // Main data state
  const [rows, setRows] = useState(() => {
    const savedData = loadDataFromStorage();
    if (savedData) {
      return savedData;
    }
    return [
      newRow({ 
        name: 'Bitcoin', 
        amount: 0.01, 
        apiId: 'bitcoin',
        logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        symbol: 'BTC'
      }),
      newRow({ 
        name: 'Ethereum', 
        amount: 0.2, 
        apiId: 'ethereum',
        logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        symbol: 'ETH'
      }),
      newRow({ 
        name: 'BNB', 
        amount: 0.5, 
        apiId: 'binancecoin',
        logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
        symbol: 'BNB'
      }),
    ];
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
  const [showHighestPrice, setShowHighestPrice] = useState(() => {
    const isMobileInitial = window.innerWidth < 768;
  
    return isMobileInitial;
  });
  const [isMobile, setIsMobile] = useState(() => {
    const mobileInitial = window.innerWidth < 768;
  
    return mobileInitial;
  });
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
    showHighestPrice,
    setShowHighestPrice,
    isMobile,
    setIsMobile,
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
