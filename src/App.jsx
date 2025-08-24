import React, { useEffect, useMemo, useRef, useState } from 'react';
import { newRow, CSV_HEADERS } from './utils/constants';
import { splitCSV, normalizeDateTime } from './utils/helpers';
import { fetchCryptoPrices, fetchTokenLogos, clearLogoCache, fetchTokenInfo } from './services/api';
import { saveDataToStorage, loadDataFromStorage } from './utils/storage';
import {
  ensureAnonymousLogin,
  saveWorkspaceData,
  loadWorkspaceDataOnce,
  subscribeWorkspace,
} from './services/firebase';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import ActionButtons from './components/ActionButtons';
import SortableTable from './components/SortableTable';
import ExcelUpload from './components/ExcelUpload';
import AddRowModal from './components/modals/AddRowModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * React Airdrop Alpha Tracker
 * - Dữ liệu các cột khớp Google Sheet: A..H
 * - Tự động fetch giá từ CoinGecko qua Api Id (cột D)
 * - G = Token Price (từ API) | H = B x G
 * - Hỗ trợ thêm dòng nhanh, dán dữ liệu từ Sheet (CSV/TSV), export CSV
 * - Tùy chỉnh chu kỳ làm mới
 */

export default function App() {
  const [rows, setRows] = useState(() => {
    // Load dữ liệu từ localStorage khi khởi tạo
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
  // Refs and state used throughout the component (some were accidentally removed)
  const timerRef = useRef(null);
  const unsubRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);
  const fetchPendingRef = useRef(null);

  // refresh interval fixed to 60 seconds (user control removed)
  const refreshSec = 60;
  const [workspaceId, setWorkspaceId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPageVisible, setIsPageVisible] = useState(true);

  const [btcPrice, setBtcPrice] = useState(0);
  const [ethPrice, setEthPrice] = useState(0);
  const [bnbPrice, setBnbPrice] = useState(0);
  const [tokenLogos, setTokenLogos] = useState({});

  const [showHighestPrice, setShowHighestPrice] = useState(() => {
    // Default to true for mobile, false for desktop
    const isMobileInitial = window.innerWidth < 768;
    console.log('🚀 Initial state:', isMobileInitial ? 'Mobile' : 'Desktop', 'showHighestPrice:', isMobileInitial);
    return isMobileInitial;
  });
  const [isMobile, setIsMobile] = useState(() => {
    const mobileInitial = window.innerWidth < 768;
    console.log('📱 Initial isMobile:', mobileInitial);
    return mobileInitial;
  });
  const [searchToken, setSearchToken] = useState('');
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const highlightRowRef = useRef(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalPosition, setAddModalPosition] = useState(null);

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

  // derived list of api ids for fetching prices (unique, non-empty)
  const ids = useMemo(() => {
    return Array.from(
      new Set(rows.map((r) => (r.apiId || '').trim()).filter(Boolean)),
    );
  }, [rows]);



  // Load logos from database and fetch missing ones for main tokens
  async function loadLogosFromDatabase() {
    try {
      const logosFromDB = {};
      
      // Load logos from database (rows)
      rows.forEach(row => {
        if (row.apiId && row.logo) {
          logosFromDB[row.apiId] = {
            logo: row.logo,
            symbol: row.symbol || '',
            name: row.name || ''
          };
        }
      });
      
             // Fetch missing logos for main tokens (BTC, ETH, BNB)
       const mainTokens = ['bitcoin', 'ethereum', 'binancecoin'];
       const missingMainTokens = mainTokens.filter(id => !logosFromDB[id] || !logosFromDB[id].logo);
       
       if (missingMainTokens.length > 0) {
         try {
           const fetchedLogos = await fetchTokenLogos(missingMainTokens);
           
           // Update database with fetched logos for main tokens
           for (const tokenId of missingMainTokens) {
             if (fetchedLogos[tokenId]) {
               // Update row if it exists in table
               const rowIndex = rows.findIndex(row => row.apiId === tokenId);
               if (rowIndex !== -1) {
                 updateRow(rowIndex, {
                   logo: fetchedLogos[tokenId].logo,
                   symbol: fetchedLogos[tokenId].symbol,
                   name: fetchedLogos[tokenId].name
                 });
               }
               
               // Always save to database even if not in table
               await saveTokenLogoToDatabase(tokenId, fetchedLogos[tokenId]);
             }
           }
           
           // Merge fetched logos into logosFromDB
           Object.assign(logosFromDB, fetchedLogos);
         } catch (error) {
           console.error('Failed to fetch main token logos:', error);
         }
       }
      
      setTokenLogos(logosFromDB);
    } catch (e) {
      console.error('loadLogosFromDatabase error', e);
    }
  }

    // Auto fetch token info when API ID is entered
  async function fetchAndUpdateTokenInfo(apiId, rowIndex) {
    if (!apiId || !apiId.trim()) return;
    
    // Validate API ID format - allow alphanumeric, hyphens, underscores, and question mark for hidden tokens
    const validApiIdPattern = /^[a-zA-Z0-9_\-?]+$/;
    if (!validApiIdPattern.test(apiId.trim())) {
      console.log('🔍 Invalid API ID format, skipping fetch:', apiId);
      return;
    }
    
    // Additional validation - prevent common invalid inputs (but allow ? for hidden tokens)
    const invalidInputs = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', '[', ']', '{', '}', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '/'];
    if (invalidInputs.some(char => apiId.includes(char))) {
      console.log('🔍 Invalid characters in API ID, skipping fetch:', apiId);
      return;
    }
    
    // Special handling for hidden tokens (containing ?)
    if (apiId.includes('?')) {
      console.log('🔍 Hidden token detected, skipping API fetch:', apiId);
      return; // Don't fetch API for hidden tokens
    }
    
    try {
      const tokenInfo = await fetchTokenInfo(apiId.trim());
      if (tokenInfo) {
        const currentRow = rows[rowIndex];
        const updates = {};
        
        // Always update name with official symbol from API, fallback to API ID
        updates.name = tokenInfo.symbol || tokenInfo.name || apiId;
        
        // Always update symbol if available
        if (tokenInfo.symbol) {
          updates.symbol = tokenInfo.symbol;
        }
        // Only update logo if it exists and is valid
        if (tokenInfo.logo && tokenInfo.logo.trim()) {
          updates.logo = tokenInfo.logo;
        }
        
        // Update the row if there are changes
        if (Object.keys(updates).length > 0) {
          updateRow(rowIndex, updates);
        }
        
        // Always save to database for future use
        await saveTokenLogoToDatabase(apiId.trim(), tokenInfo);
        
        // Also update tokenLogos state for immediate display
        setTokenLogos(prev => ({
          ...prev,
          [apiId.trim()]: {
            logo: tokenInfo.logo,
            symbol: tokenInfo.symbol,
            name: tokenInfo.name
          }
        }));
        
        toast.success(`Token info loaded: ${tokenInfo.name}`);
      }
    } catch (e) {
      console.error('fetchAndUpdateTokenInfo error', e);
      toast.error('Failed to fetch token info');
    }
  }

  // Function to save token logo to database
  async function saveTokenLogoToDatabase(apiId, tokenInfo) {
    try {
      // Save to localStorage
      const existingLogos = JSON.parse(localStorage.getItem('tokenLogos') || '{}');
      existingLogos[apiId] = {
        logo: tokenInfo.logo,
        symbol: tokenInfo.symbol,
        name: tokenInfo.name
      };
      localStorage.setItem('tokenLogos', JSON.stringify(existingLogos));
      
      // Save to Firebase if available
      if (typeof window !== 'undefined' && window.firebase) {
        const db = window.firebase.firestore();
        await db.collection('tokenLogos').doc(apiId).set({
          logo: tokenInfo.logo,
          symbol: tokenInfo.symbol,
          name: tokenInfo.name,
          updatedAt: new Date()
        });
      }
      
      console.log(`Saved token logo to database: ${apiId}`);
    } catch (e) {
      console.error('saveTokenLogoToDatabase error', e);
    }
  }

  // Function to check for duplicate logos and token names
  async function checkDuplicateLogosAndNames() {
    console.log('🔍 === CHECKING DUPLICATES ===');
    
    const duplicates = {
      logos: {},
      names: {},
      symbols: {},
      apiIds: {}
    };
    
    // Check for duplicates
    rows.forEach((row, index) => {
      // Check logo duplicates
      if (row.logo && row.logo.trim()) {
        if (!duplicates.logos[row.logo]) {
          duplicates.logos[row.logo] = [];
        }
        duplicates.logos[row.logo].push({
          index,
          apiId: row.apiId,
          name: row.name,
          symbol: row.symbol
        });
      }
      
      // Check name duplicates
      if (row.name && row.name.trim()) {
        if (!duplicates.names[row.name]) {
          duplicates.names[row.name] = [];
        }
        duplicates.names[row.name].push({
          index,
          apiId: row.apiId,
          name: row.name,
          symbol: row.symbol,
          logo: row.logo
        });
      }
      
      // Check symbol duplicates
      if (row.symbol && row.symbol.trim()) {
        if (!duplicates.symbols[row.symbol]) {
          duplicates.symbols[row.symbol] = [];
        }
        duplicates.symbols[row.symbol].push({
          index,
          apiId: row.apiId,
          name: row.name,
          symbol: row.symbol,
          logo: row.logo
        });
      }
      
      // Check API ID duplicates
      if (row.apiId && row.apiId.trim()) {
        if (!duplicates.apiIds[row.apiId]) {
          duplicates.apiIds[row.apiId] = [];
        }
        duplicates.apiIds[row.apiId].push({
          index,
          apiId: row.apiId,
          name: row.name,
          symbol: row.symbol,
          logo: row.logo
        });
      }
    });
    
    // Filter only actual duplicates (more than 1 occurrence)
    const actualDuplicates = {
      logos: Object.entries(duplicates.logos).filter(([logo, items]) => items.length > 1),
      names: Object.entries(duplicates.names).filter(([name, items]) => items.length > 1),
      symbols: Object.entries(duplicates.symbols).filter(([symbol, items]) => items.length > 1),
      apiIds: Object.entries(duplicates.apiIds).filter(([apiId, items]) => items.length > 1)
    };
    
    // Log results
    console.log('🔍 Duplicate Analysis Results:');
    
    if (actualDuplicates.logos.length > 0) {
      console.log('⚠️ DUPLICATE LOGOS:', actualDuplicates.logos);
      actualDuplicates.logos.forEach(([logo, items]) => {
        console.log(`   Logo "${logo}" used by ${items.length} tokens:`);
        items.forEach(item => {
          console.log(`     - Row ${item.index + 1}: ${item.name || item.symbol || item.apiId} (API: ${item.apiId})`);
        });
      });
    }
    
    if (actualDuplicates.names.length > 0) {
      console.log('⚠️ DUPLICATE NAMES:', actualDuplicates.names);
      actualDuplicates.names.forEach(([name, items]) => {
        console.log(`   Name "${name}" used by ${items.length} tokens:`);
        items.forEach(item => {
          console.log(`     - Row ${item.index + 1}: API ${item.apiId} (Symbol: ${item.symbol})`);
        });
      });
    }
    
    if (actualDuplicates.symbols.length > 0) {
      console.log('⚠️ DUPLICATE SYMBOLS:', actualDuplicates.symbols);
      actualDuplicates.symbols.forEach(([symbol, items]) => {
        console.log(`   Symbol "${symbol}" used by ${items.length} tokens:`);
        items.forEach(item => {
          console.log(`     - Row ${item.index + 1}: ${item.name} (API: ${item.apiId})`);
        });
      });
    }
    
    if (actualDuplicates.apiIds.length > 0) {
      console.log('⚠️ DUPLICATE API IDs:', actualDuplicates.apiIds);
      actualDuplicates.apiIds.forEach(([apiId, items]) => {
        console.log(`   API ID "${apiId}" used by ${items.length} tokens:`);
        items.forEach(item => {
          console.log(`     - Row ${item.index + 1}: ${item.name || item.symbol}`);
        });
      });
    }
    
    const totalDuplicates = actualDuplicates.logos.length + 
                           actualDuplicates.names.length + 
                           actualDuplicates.symbols.length + 
                           actualDuplicates.apiIds.length;
    
    if (totalDuplicates === 0) {
      console.log('✅ No duplicates found! All tokens have unique data.');
      toast.success('No duplicates found! All tokens have unique data.', {
        autoClose: 3000
      });
      return actualDuplicates;
    }
    
    console.log(`⚠️ Found ${totalDuplicates} types of duplicates!`);
    toast.info(`Found ${totalDuplicates} types of duplicates! Fetching fresh data for duplicate rows...`, {
      autoClose: 3000
    });
    
    // Collect all unique API IDs from duplicate rows
    const duplicateApiIds = new Set();
    
    // Add API IDs from all duplicate types
    actualDuplicates.logos.forEach(([logo, items]) => {
      items.forEach(item => {
        if (item.apiId && item.apiId.trim() && !item.apiId.includes('?')) {
          duplicateApiIds.add(item.apiId);
        }
      });
    });
    
    actualDuplicates.names.forEach(([name, items]) => {
      items.forEach(item => {
        if (item.apiId && item.apiId.trim() && !item.apiId.includes('?')) {
          duplicateApiIds.add(item.apiId);
        }
      });
    });
    
    actualDuplicates.symbols.forEach(([symbol, items]) => {
      items.forEach(item => {
        if (item.apiId && item.apiId.trim() && !item.apiId.includes('?')) {
          duplicateApiIds.add(item.apiId);
        }
      });
    });
    
    actualDuplicates.apiIds.forEach(([apiId, items]) => {
      items.forEach(item => {
        if (item.apiId && item.apiId.trim() && !item.apiId.includes('?')) {
          duplicateApiIds.add(item.apiId);
        }
      });
    });
    
    const uniqueApiIds = Array.from(duplicateApiIds);
    
    if (uniqueApiIds.length > 0) {
      console.log(`🔄 Fetching fresh data for ${uniqueApiIds.length} duplicate API IDs:`, uniqueApiIds);
      
      try {
        // Fetch fresh data for all duplicate API IDs
        const { fetchTokenLogos } = await import('./services/api.js');
        const freshData = await fetchTokenLogos(uniqueApiIds);
        
        console.log('📥 Fresh data received:', freshData);
        
        // Update rows with fresh data
        const updatedRows = [...rows];
        let updateCount = 0;
        
        updatedRows.forEach((row, index) => {
          if (row.apiId && uniqueApiIds.includes(row.apiId)) {
            const freshToken = freshData[row.apiId]; // Use object key instead of find()
            if (freshToken) {
              const oldName = row.name;
              const oldSymbol = row.symbol;
              const oldLogo = row.logo;
              
              // Update with fresh data
              updatedRows[index] = {
                ...row,
                name: freshToken.symbol || freshToken.name || row.apiId,
                symbol: freshToken.symbol || row.symbol,
                logo: freshToken.logo || row.logo // Use freshToken.logo instead of freshToken.image
              };
              
              const newName = updatedRows[index].name;
              const newSymbol = updatedRows[index].symbol;
              const newLogo = updatedRows[index].logo;
              
              // Log changes
              if (oldName !== newName || oldSymbol !== newSymbol || oldLogo !== newLogo) {
                console.log(`🔄 Updated Row ${index + 1} (${row.apiId}):`);
                if (oldName !== newName) console.log(`   Name: "${oldName}" → "${newName}"`);
                if (oldSymbol !== newSymbol) console.log(`   Symbol: "${oldSymbol}" → "${newSymbol}"`);
                if (oldLogo !== newLogo) console.log(`   Logo: "${oldLogo}" → "${newLogo}"`);
                updateCount++;
              }
            }
          }
        });
        
        // Update state
        setRows(updatedRows);
        
        // Save to storage
        localStorage.setItem('airdropData', JSON.stringify(updatedRows));
        
        // Sync to Firebase
        if (firebaseInitialized) {
          try {
            await updateDoc(doc(db, 'airdrops', 'main'), {
              data: updatedRows,
              lastUpdated: serverTimestamp()
            });
            console.log('✅ Duplicate data synced to Firebase');
          } catch (error) {
            console.error('❌ Error syncing duplicate data to Firebase:', error);
          }
        }
        
        console.log(`✅ Successfully updated ${updateCount} rows with fresh data`);
        toast.success(`✅ Updated ${updateCount} duplicate rows with fresh data!`, {
          autoClose: 4000
        });
        
        // Run duplicate check again to verify fixes
        setTimeout(() => {
          console.log('🔍 Running duplicate check again to verify fixes...');
          checkDuplicateLogosAndNames();
        }, 2000);
        
      } catch (error) {
        console.error('❌ Error fetching fresh data for duplicates:', error);
        toast.error('Failed to fetch fresh data for duplicates. Please try again.', {
          autoClose: 4000
        });
      }
    } else {
      console.log('⚠️ No valid API IDs found in duplicates to fetch');
      toast.warning('No valid API IDs found in duplicates to fetch.', {
        autoClose: 3000
      });
    }
    
    console.log('🔍 === END DUPLICATE CHECK ===');
    
    return actualDuplicates;
  }

  // Function to check and update all tokens missing logos
  async function checkAndUpdateMissingLogos(showToast = true) {
    try {
      const rowsToUpdate = rows.filter(row => {
        if (!row.apiId || !row.apiId.trim()) return false;
        
        // Validate API ID format
        const validApiIdPattern = /^[a-zA-Z0-9_\-?]+$/;
        if (!validApiIdPattern.test(row.apiId.trim())) {
          console.log('🔍 Skipping invalid API ID format:', row.apiId);
          return false;
        }
        
        // Check for invalid characters (but allow ? for hidden tokens)
        const invalidInputs = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', '[', ']', '{', '}', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '/'];
        if (invalidInputs.some(char => row.apiId.includes(char))) {
          console.log('🔍 Skipping API ID with invalid characters:', row.apiId);
          return false;
        }
        
        // Skip hidden tokens (containing ?) from logo refresh
        if (row.apiId.includes('?')) {
          console.log('🔍 Skipping hidden token from logo refresh:', row.apiId);
          return false;
        }
        
        return (!row.logo || !row.name || row.name.trim() === '');
      });
      
      if (rowsToUpdate.length > 0) {
        let updatedCount = 0;
        for (const row of rowsToUpdate) {
          const rowIndex = rows.findIndex(r => r === row);
          if (rowIndex !== -1) {
            try {
              await fetchAndUpdateTokenInfo(row.apiId, rowIndex);
              updatedCount++;
            } catch (error) {
              console.error(`Failed to update token info for ${row.apiId}:`, error);
            }
          }
        }
        
      if (showToast) {
          if (updatedCount > 0) {
            toast.success(`Updated ${updatedCount} token(s) with missing logos!`);
          } else {
            toast.success('All tokens already have logos!');
          }
        }
        return updatedCount;
      } else if (showToast) {
        toast.success('All tokens already have logos!');
      }
      return 0;
    } catch (e) {
      console.error('checkAndUpdateMissingLogos error', e);
      if (showToast) {
        toast.error('Failed to check missing logos');
      }
      return 0;
    }
  }

  // Refresh function that fetches both prices and missing token info
  async function refreshData(showToast = true) {
    try {
      // First fetch prices
      await fetchPrices();
      
      // Then fetch missing token info for rows that have API ID but no logo/name
      const rowsToUpdate = rows.filter(row => 
        row.apiId && row.apiId.trim() && 
        (!row.logo || !row.name || row.name.trim() === '')
      );
      
      if (rowsToUpdate.length > 0) {
        let updatedCount = 0;
        for (const row of rowsToUpdate) {
          const rowIndex = rows.findIndex(r => r === row);
          if (rowIndex !== -1) {
            try {
              await fetchAndUpdateTokenInfo(row.apiId, rowIndex);
              updatedCount++;
            } catch (error) {
              console.error(`Failed to update token info for ${row.apiId}:`, error);
            }
          }
        }
        
        if (showToast) {
          if (updatedCount > 0) {
            toast.success(`Refreshed prices and updated ${updatedCount} token(s) info!`);
          } else {
            toast.success('Prices refreshed successfully!');
          }
        }
      } else if (showToast) {
        toast.success('Prices refreshed successfully!');
      }
    } catch (e) {
      console.error('refreshData error', e);
      if (showToast) {
        toast.error('Failed to refresh data');
      }
    }
  }



  // Fetch prices and update rows' price/value/highestPrice
  async function fetchPrices() {
    // Always include common coins so BTC/ETH/BNB cards show even when table ids missing
    const idsToFetch = Array.from(
      new Set([...(ids || []), 'bitcoin', 'ethereum', 'binancecoin']),
    );
    if (!idsToFetch.length) return;
    
    // Log background fetch if tab is not visible
    if (!isPageVisible) {
      console.log('🔄 Background fetch: Updating prices while tab is not active');
    }
    
    // Add 1 second delay to show loading animation (only when tab is visible)
    if (isPageVisible) {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    try {
      // Only fetch prices, not logos
      const priceMap = await fetchCryptoPrices(idsToFetch, 'usd');

      setRows((prev) =>
        prev.map((r) => {
          const id = (r.apiId || '').trim();
          const priceRaw =
            id && priceMap[id] && priceMap[id].usd
              ? priceMap[id].usd
              : r.price || 0;
          const price = Number(priceRaw) || 0;
          const amount = Number(r.amount) || 0;
          const highest = Math.max(Number(r.highestPrice) || 0, price || 0);
          return { ...r, price, value: amount * price, highestPrice: highest };
        }),
      );

      // record last updated time once prices have been applied
      setLastUpdated(new Date());

      // small convenience: set common coin displays if present; fallback to any existing row prices
      if (priceMap.bitcoin && priceMap.bitcoin.usd)
        setBtcPrice(Number(priceMap.bitcoin.usd) || 0);
      else
        setBtcPrice(
          (
            rows.find(
              (r) => (r.apiId || '').trim().toLowerCase() === 'bitcoin',
            ) || {}
          ).price || 0,
        );

      if (priceMap.ethereum && priceMap.ethereum.usd)
        setEthPrice(Number(priceMap.ethereum.usd) || 0);
      else
        setEthPrice(
          (
            rows.find(
              (r) => (r.apiId || '').trim().toLowerCase() === 'ethereum',
            ) || {}
          ).price || 0,
        );

      if (priceMap.binancecoin && priceMap.binancecoin.usd)
        setBnbPrice(Number(priceMap.binancecoin.usd) || 0);
      else
        setBnbPrice(
          (
            rows.find(
              (r) => (r.apiId || '').trim().toLowerCase() === 'binancecoin',
            ) || {}
          ).price || 0,
        );
    } catch (e) {
      console.error('fetchPrices error', e);
    } finally {
      if (isPageVisible) {
      setLoading(false);
      }
    }
  }

  // Debounced trigger to fetch prices to coalesce multiple rapid changes
  function requestFetchPrices(delayMs = 150) {
    if (fetchPendingRef.current) {
      clearTimeout(fetchPendingRef.current);
    }
    fetchPendingRef.current = setTimeout(() => {
      fetchPendingRef.current = null;
      fetchPrices();
    }, delayMs);
  }

  // Form submit wrapper used by the Add Row modal form (form object passed)
  function handleAddRowSubmit(form) {
    // Add safety check for form
    if (!form) {
      console.error('form is undefined or null');
      toast.error('Form data is invalid. Please try again.');
      return;
    }

    // validate and insert immediately (mirror addRowFromForm behavior)
    const errs = validateAddForm(form);
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) {
      setAddForm(form);
      return;
    }

    // normalize launchAt: date-only -> DD/MM/YYYY 00:00:00, keep time if provided
    const normalizedLaunch = form.launchAt
      ? (function (v) {
          const n = normalizeDateTime(v);
          // If normalizeDateTime returned date-only (no time), append 00:00:00
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(n)) return n + ' 00:00:00';
          return n;
        })(form.launchAt)
      : '';

    try {
    const nr = newRow({
        name: String(form.name || form.apiId || '')
        .trim()
        .toUpperCase(),
      amount: Number(form.amount) || 0,
      launchAt: normalizedLaunch || '',
      apiId: form.apiId || '',
      pointPriority: form.pointPriority || '',
      pointFCFS: form.pointFCFS || '',
        logo: form.logo || '',
        symbol: form.symbol || '',
    });

    setRows((prev) => {
      const newRows = [nr, ...prev];
      saveDataToStorage(newRows);
      if (!isRemoteUpdateRef.current) {
        setSyncing(true);
        saveWorkspaceData('global', newRows)
          .catch((e) => {
            console.error('Save cloud failed:', e);
            toast.error('Failed to sync data to cloud. Please try again.');
          })
          .finally(() => setSyncing(false));
      }
      return newRows;
    });

    setShowAddModal(false);
    setAddForm({
      name: '',
      amount: '',
      launchAt: '',
        launchDate: '',
        launchTime: '',
      apiId: '',
      pointPriority: '',
      pointFCFS: '',
    });
    setAddErrors({});
    toast.success(`New ${nr.name || 'token'} added successfully!`);
      
      // Auto fetch token info if API ID is provided
      if (nr.apiId && nr.apiId.trim()) {
        fetchAndUpdateTokenInfo(nr.apiId, 0); // 0 is the index of newly added row
      }
    
    // Highlight the newly added row
    if (highlightRowRef.current) {
      highlightRowRef.current(rows.length); // Highlight the last row (newly added)
      }
    } catch (error) {
      console.error('Error creating new row:', error);
      toast.error('Failed to create new row. Please check your input and try again.');
    }
  }

  // Tự động refresh - Always run even when tab is not active
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      // Always fetch prices regardless of page visibility
      fetchPrices();
    }, 60 * 1000);
    
          // Trigger an immediate debounced fetch when ids set changes so prices show up right away
      requestFetchPrices(100);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      console.log('📏 Screen size check:', window.innerWidth, 'Mobile:', mobile);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set showHighestPrice based on device type - only when isMobile changes
  useEffect(() => {
    console.log('🔄 Device changed:', isMobile ? 'Mobile' : 'Desktop');
    if (isMobile) {
      console.log('📱 Setting showHighestPrice to true for mobile');
      setShowHighestPrice(true); // Enable on mobile
    } else {
      console.log('🖥️ Setting showHighestPrice to false for desktop');
      setShowHighestPrice(false); // Disable on desktop
    }
  }, [isMobile]); // Only depend on isMobile, not showHighestPrice

  // Page Visibility API - Keep app running even when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      const wasVisible = isPageVisible;
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      
      // Show notification when user returns to tab
      if (!wasVisible && isVisible) {
        toast.info('Welcome back! Data has been updated in the background.', {
          autoClose: 3000,
          position: 'top-right'
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPageVisible]);

  // Fetch lần đầu
  useEffect(() => {
    fetchPrices();
    // Load logos from database and check for missing logos
    loadLogosFromDatabase();
    // Check and update missing logos after a short delay
    setTimeout(() => {
      checkAndUpdateMissingLogos(false); // Don't show toast for initial check
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đọc workspaceId từ query param (?ws=...) nếu có
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ws = params.get('ws');
    if (ws && ws !== workspaceId) {
      setWorkspaceId(ws);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth then subscribe to a single global workspace document
  useEffect(() => {
    let cleanup = () => {};
    (async () => {
      try {
        await ensureAnonymousLogin();

        // cleanup previous
        if (unsubRef.current) {
          unsubRef.current();
          unsubRef.current = null;
        }

        const GLOBAL_WS = 'global';

        // bootstrap if empty
        try {
          const cloudRows = await loadWorkspaceDataOnce(GLOBAL_WS);
          if (Array.isArray(cloudRows) && cloudRows.length > 0) {
            isRemoteUpdateRef.current = true;
            setRows(cloudRows);
            saveDataToStorage(cloudRows);
            setTimeout(() => (isRemoteUpdateRef.current = false), 0);
            // After cloud rows loaded, fetch prices (debounced)
            requestFetchPrices(50);
          } else if (!cloudRows || cloudRows.length === 0) {
            // ensure document exists so other devices can subscribe immediately
            await saveWorkspaceData(GLOBAL_WS, []);
          }
        } catch (e) {
          console.warn('Bootstrap workspace failed:', e);
        }

        unsubRef.current = subscribeWorkspace(GLOBAL_WS, (cloudRows) => {
          isRemoteUpdateRef.current = true;
          setRows(cloudRows);
          saveDataToStorage(cloudRows);
          setTimeout(() => (isRemoteUpdateRef.current = false), 0);
          // Fetch latest prices when cloud data changes (debounced)
          requestFetchPrices(100);
        });

        cleanup = () => {
          if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
          }
        };
      } catch (e) {
        console.error('Auth/subscribe error:', e);
        toast.error(
          'Failed to connect to cloud sync. Please refresh the page.',
        );
      }
    })();
    return cleanup;
  }, []);

  function updateRow(idx, patch) {
    setRows((prev) => {
      const normalizedPatch = { ...patch };
      if (normalizedPatch.name !== undefined) {
        normalizedPatch.name = String(normalizedPatch.name || '')
          .trim()
          .toUpperCase();
      }
      const newRows = prev.map((r, i) =>
        i === idx ? { ...r, ...normalizedPatch } : r,
      );
      saveDataToStorage(newRows);
      if (!isRemoteUpdateRef.current) {
        setSyncing(true);
        saveWorkspaceData('global', newRows)
          .catch((e) => {
            console.error('Save cloud failed:', e);
            toast.error('Failed to sync data to cloud. Please try again.');
          })
          .finally(() => setSyncing(false));
      }
      // notify user which token was updated
      try {
        const updatedName = (newRows[idx] && newRows[idx].name) || 'token';
        toast.success(`Updated ${updatedName} successfully!`);
      } catch (e) {
        /* ignore */
      }
      return newRows;
    });
  }

  function openAddRowModal(formData = null) {
    if (formData) {
      // Handle inline form submission from mobile
      const errs = validateAddForm(formData);
      if (Object.keys(errs).length > 0) {
        // Return errors to be handled by the inline form
        return { success: false, errors: errs };
      }

      const normalizedLaunch = formData.launchAt
        ? (function (v) {
            const n = normalizeDateTime(v);
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(n)) return n + ' 00:00:00';
            return n;
          })(formData.launchAt)
        : '';

      const nr = newRow({
        name: String(formData.name || '')
          .trim()
          .toUpperCase(),
        amount: Number(formData.amount) || 0,
        launchAt: normalizedLaunch || '',
        apiId: formData.apiId || '',
        pointPriority: formData.pointPriority || '',
        pointFCFS: formData.pointFCFS || '',
      });

      setRows((prev) => {
        const newRows = [nr, ...prev];
        saveDataToStorage(newRows);
        if (!isRemoteUpdateRef.current) {
          setSyncing(true);
          saveWorkspaceData('global', newRows)
            .catch((e) => {
              console.error('Save cloud failed:', e);
              toast.error('Failed to sync data to cloud. Please try again.');
            })
            .finally(() => setSyncing(false));
        }
        return newRows;
      });

      // Fetch logos for new token if it has API ID
      if (nr.apiId && nr.apiId.trim()) {
        fetchAndUpdateTokenInfo(nr.apiId, 0); // 0 is the index of newly added row
      }
      
      toast.success('New row added successfully!');
      return { success: true };
    } else {
      // Desktop: open modal
      setShowAddModal(true);
    }
  }

  function validateAddForm(form) {
    const errs = {};
    
    // API ID is required
    const hasApiId = form.apiId && String(form.apiId).trim();
    if (!hasApiId) {
      errs.apiId = 'API ID is required';
    } else {
      // Validate API ID format
      const validApiIdPattern = /^[a-zA-Z0-9_\-?]+$/;
      if (!validApiIdPattern.test(form.apiId.trim())) {
        errs.apiId = 'API ID can only contain letters, numbers, hyphens, underscores, and ? for hidden tokens';
      }
      
      // Check for invalid characters (but allow ? for hidden tokens)
      const invalidInputs = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', '[', ']', '{', '}', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '/'];
      if (invalidInputs.some(char => form.apiId.includes(char))) {
        errs.apiId = 'API ID contains invalid characters';
      }
    }

    // Check if launchDate is provided
    const hasLaunchDate = form.launchDate && String(form.launchDate).trim();
    
    if (!hasLaunchDate) {
      errs.launchDate = 'Listing date is required';
    }
    // No additional validation needed for date picker

    if (form.amount !== undefined && String(form.amount).trim() !== '') {
      const n = Number(form.amount);
      if (isNaN(n) || n < 0)
        errs.amount = 'Amount (B) must be a non-negative number';
    }

    return errs;
  }

  function addRowFromForm() {
    // Add safety check for addForm
    if (!addForm) {
      console.error('addForm is undefined or null');
      toast.error('Form data is invalid. Please try again.');
      return;
    }

    const errs = validateAddForm(addForm);
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const normalizedLaunch = addForm.launchAt
      ? (function (v) {
          const n = normalizeDateTime(v);
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(n)) return n + ' 00:00:00';
          return n;
        })(addForm.launchAt)
      : addForm.launchDate
      ? (function() {
          // Convert YYYY-MM-DD to DD/MM/YYYY
          const formattedDate = addForm.launchDate.split('-').reverse().join('/');
          return formattedDate + (addForm.launchTime ? ` ${addForm.launchTime}` : ' 00:00');
        })()
      : '';

    try {
    const nr = newRow({
        name: String(addForm.name || addForm.apiId || '')
        .trim()
        .toUpperCase(),
      amount: Number(addForm.amount) || 0,
      launchAt: normalizedLaunch || '',
      apiId: addForm.apiId || '',
      pointPriority: addForm.pointPriority || '',
      pointFCFS: addForm.pointFCFS || '',
        logo: addForm.logo || '',
        symbol: addForm.symbol || '',
    });

      // Auto fetch token info if API ID is provided
      if (nr.apiId && nr.apiId.trim()) {
        fetchAndUpdateTokenInfo(nr.apiId, 0); // 0 is the index of newly added row
      }

    setRows((prev) => {
      const newRows = [nr, ...prev];
      saveDataToStorage(newRows);
      if (!isRemoteUpdateRef.current) {
        setSyncing(true);
        saveWorkspaceData('global', newRows)
          .catch((e) => {
            console.error('Save cloud failed:', e);
            toast.error('Failed to sync data to cloud. Please try again.');
          })
          .finally(() => setSyncing(false));
      }
      return newRows;
    });

    setShowAddModal(false);
    setAddForm({
      name: '',
      amount: '',
      launchAt: '',
        launchDate: '',
        launchTime: '',
      apiId: '',
      pointPriority: '',
      pointFCFS: '',
    });
    setAddErrors({});
      toast.success(`New ${nr.name || 'token'} added successfully!`);
    } catch (error) {
      console.error('Error creating new row:', error);
      toast.error('Failed to create new row. Please check your input and try again.');
    }
  }

  function removeRow(idx) {
    setRows((prev) => {
      const removed = prev[idx];
      const newRows = prev.filter((_, i) => i !== idx);
      saveDataToStorage(newRows);
      if (!isRemoteUpdateRef.current) {
        setSyncing(true);
        saveWorkspaceData('global', newRows)
          .catch((e) => {
            console.error('Save cloud failed:', e);
            toast.error('Failed to sync data to cloud. Please try again.');
          })
          .finally(() => setSyncing(false));
      }
      try {
        const name = (removed && removed.name) || 'token';
        toast.success(`Deleted ${name} successfully!`);
      } catch (e) {
        /* ignore */
      }
      return newRows;
    });
  }



  function checkDuplicates(newRows, existingRows) {
    const duplicates = [];
    const existingApiIds = new Set(
      existingRows.map((r) => r.apiId.trim().toLowerCase()).filter(Boolean),
    );

    newRows.forEach((row, index) => {
      if (
        row.apiId.trim() &&
        existingApiIds.has(row.apiId.trim().toLowerCase())
      ) {
        duplicates.push({ ...row, originalIndex: index });
      }
    });

    return duplicates;
  }

  function handleDuplicateImport(duplicates, newRows) {
    const duplicateNames = duplicates.map((d) => d.name || d.apiId).join(', ');
    const shouldImport = confirm(
      `Found ${duplicates.length} duplicate(s): ${duplicateNames}\n\n` +
        'Do you want to import all data (duplicates will be skipped) or cancel?',
    );

    if (shouldImport) {
      // Filter out duplicates
      const filteredNewRows = newRows.filter((row, index) => {
        return !duplicates.some((d) => d.originalIndex === index);
      });

      setRows((prev) => {
        const newRows = [...prev, ...filteredNewRows];
        saveDataToStorage(newRows);
        return newRows;
      });

      toast.success(
        `Imported ${filteredNewRows.length} rows successfully! ${duplicates.length} duplicates skipped.`,
      );
    }
  }

  function exportCSV() {
    if (rows.length === 0) {
      toast.warning('No data to export. Please add some data first.');
      return;
    }

    const lines = rows.map((r) =>
      [
        r.symbol || r.name,
        r.amount,
        r.launchAt,
        r.apiId,
        r.pointPriority,
        r.pointFCFS,
        r.price,
        r.value,
        r.highestPrice,
        r.logo,
        r.symbol,
      ]
        .map((v) => String(v ?? '').replaceAll('"', '""'))
        .map((v) => `"${v}"`)
        .join(','),
    );
    const csv = [CSV_HEADERS.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto-tracker-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${rows.length} rows to CSV successfully!`);
  }

  function handlePaste(text) {
    // Hỗ trợ dán từ Google Sheet: nhận TSV hoặc CSV
    const rowsText = text.trim().split(/\r?\n/);
    const errors = [];
    const parsedRows = [];

    // Validate each pasted line: only columns A-F allowed (indices 0..5)
    rowsText.forEach((line, idx) => {
      const parts = line.includes('\t') ? line.split('\t') : splitCSV(line);

      // If extra columns beyond F (index >=6) contain non-empty values -> reject
      if (parts.length > 6) {
        const extras = parts
          .slice(6)
          .some((v) => String(v || '').trim() !== '');
        if (extras) {
          errors.push(
            `Row ${
              idx + 1
            }: contains columns beyond F. Only columns A-F are allowed.`,
          );
          return;
        }
      }

      const [
        name = '',
        amount = '',
        launchAt = '',
        apiId = '',
        pPri = '',
        pFcfs = '',
      ] = parts;

      // Basic field validation
      const rowErrors = [];
      if (!String(name || '').trim()) rowErrors.push('name (A) is required');
      const amountNum = Number(amount);
      if (amount !== '' && (isNaN(amountNum) || amountNum < 0))
        rowErrors.push('amount (B) must be a non-negative number');
      if (launchAt && launchAt.trim()) {
        const regex =
          /^(\d{1,2})\/(\d{1,2})\/(\d{4})(\s+\d{1,2}:\d{1,2}:\d{1,2})?$/;
        if (!regex.test(launchAt.trim()))
          rowErrors.push(
            'listing time (C) should be DD/MM/YYYY or DD/MM/YYYY HH:mm',
          );
      }

      if (rowErrors.length) {
        errors.push(`Row ${idx + 1}: ${rowErrors.join('; ')}`);
        return;
      }

      parsedRows.push(
        newRow({
          name: String(name || '')
            .trim()
            .toUpperCase(),
          amount: Number(amount) || 0,
          launchAt: launchAt?.trim(),
          apiId: apiId?.trim(),
          pointPriority: pPri?.trim(),
          pointFCFS: pFcfs?.trim(),
        }),
      );
    });

    if (errors.length) {
      toast.error(`Paste failed:\n${errors.join('\n')}`, { autoClose: 5000 });
      return;
    }

    // Kiểm tra trùng lặp
    const duplicates = checkDuplicates(parsedRows, rows);
    if (duplicates.length > 0) {
      handleDuplicateImport(duplicates, parsedRows);
    } else {
      setRows((prev) => {
        const newRows = [...prev, ...parsedRows];
        saveDataToStorage(newRows);
        if (!isRemoteUpdateRef.current) {
          setSyncing(true);
          saveWorkspaceData('global', newRows)
            .catch((e) => {
              console.error('Save cloud failed:', e);
              toast.error('Failed to sync data to cloud. Please try again.');
            })
            .finally(() => setSyncing(false));
        }
        return newRows;
      });
      toast.success(
        `Imported ${parsedRows.length} rows from clipboard successfully!`,
      );
    }
  }

  function handleImportExcel(data) {
    const parsedData = data.map((item) =>
      newRow({
        ...item,
        name: String(item.name || '')
          .trim()
          .toUpperCase(),
      }),
    );

    // Kiểm tra trùng lặp
    const duplicates = checkDuplicates(parsedData, rows);
    if (duplicates.length > 0) {
      handleDuplicateImport(duplicates, parsedData);
    } else {
      setRows((prev) => {
        const newRows = [...prev, ...parsedData];
        saveDataToStorage(newRows);
        if (!isRemoteUpdateRef.current) {
          setSyncing(true);
          saveWorkspaceData('global', newRows)
            .catch((e) => {
              console.error('Save cloud failed:', e);
              toast.error('Failed to sync data to cloud. Please try again.');
            })
            .finally(() => setSyncing(false));
        }
        return newRows;
      });
      toast.success(
        `Imported ${parsedData.length} rows from Excel successfully!`,
      );
    }
    setShowExcelUpload(false);
  }

  // Removed legacy backup/restore UI

  return (
    <ThemeProvider>
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 sm:p-6'>
        <div className='max-w-full mx-auto'>
          <Header loading={loading} onRefresh={refreshData} syncing={syncing} isPageVisible={isPageVisible} />

          <StatsCards
            rowsCount={rows.length}
            loading={loading}
            btcPrice={btcPrice}
            ethPrice={ethPrice}
            bnbPrice={bnbPrice}
            syncing={syncing}
            lastUpdated={lastUpdated}
            tokenLogos={tokenLogos}
          />

                    <ActionButtons
            onAddRow={openAddRowModal}
            onPasteText={handlePaste}
            onExportCSV={exportCSV}
            onImportExcel={() => setShowExcelUpload(true)}
            onRefresh={refreshData}
            onCheckDuplicates={checkDuplicateLogosAndNames}

            loading={loading}
            showHighestPrice={showHighestPrice}
            setShowHighestPrice={setShowHighestPrice}
            searchToken={searchToken}
            setSearchToken={setSearchToken}
          />

          <SortableTable
            rows={rows}
            onUpdateRow={updateRow}
            onRemoveRow={removeRow}
            showHighestPrice={showHighestPrice}
            setShowHighestPrice={setShowHighestPrice}
            searchToken={searchToken}
            tokenLogos={tokenLogos}
            onRefresh={refreshData}
            loading={loading}
            ref={highlightRowRef}
          />
        </div>

        {/* Excel Upload Modal */}
        {showExcelUpload && (
          <div className='fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl p-6 shadow-xl'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold dark:text-white'>
                  Import from Excel file
                </h3>
                <button
                  onClick={() => setShowExcelUpload(false)}
                  className='text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100'
                >
                  ✕
                </button>
              </div>
              <ExcelUpload onImportData={handleImportExcel} />
              <div className='mt-4 text-xs text-gray-500 dark:text-gray-400'>
                <p>
                  <strong>Note:</strong> Excel file should have columns A-F as
                  follows:
                </p>
                <p>
                  A: Token | B: Amount | C: Date Claim | D: Full Name | E: Point
                  (Priority) | F: Point (FCFS)
                </p>
              </div>
            </div>
          </div>
        )}

        <AddRowModal
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          addForm={addForm}
          setAddForm={setAddForm}
          addErrors={addErrors}
          handleAddRowSubmit={handleAddRowSubmit}
        />
        <footer className='mt-2 text-center text-xs text-gray-500 dark:text-gray-400'>
          <div className='py-1'>
            <div className='inline-block px-3 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 border dark:border-gray-700 shadow-sm'>
              © 2025 ~ <span className='font-semibold'>Nguyenwolf</span>
            </div>
          </div>
        </footer>

        {/* Toast Container */}
        <ToastContainer
          position='bottom-right'
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme='colored'
          limit={3}
        />
      </div>
    </ThemeProvider>
  );
}
