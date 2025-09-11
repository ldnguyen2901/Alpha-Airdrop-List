import React, { useEffect, lazy, Suspense } from 'react';
import { 
  ActionButtons, 
  SortableTable, 
  ExcelUpload
} from './tge';
import Header from './Header';
import StatsCards from './StatsCards';


// Lazy load modals for better performance
const AddRowModal = lazy(() => import('./tge/modals/AddRowModal'));
const DuplicatesModal = lazy(() => import('./tge/modals/DuplicatesModal'));

// Custom hooks
import {
  useTgeAppState,
  useTgeDataOperations,
  useTgeApiOperations,
  useTgeNeonSync,
  useTgeImportExport,
  useDuplicateCheck,
  useResponsive,
  useTgeModalOperations,
  useStatscardPrices,
  useGlobalPriceSync
} from '../hooks';
import { useAutoRefreshContext, useGlobalPriceContext } from '../contexts';

/**
 * React TGE Alpha Tracker
 * - Dữ liệu các cột khớp Google Sheet: A..H
 * - Tự động fetch giá từ CoinGecko qua Api Id (cột D)
 * - G = Token Price (từ API) | H = B x G
 * - Hỗ trợ thêm dòng nhanh, dán dữ liệu từ Sheet (CSV/TSV), export CSV
 * - Tùy chỉnh chu kỳ làm mới
 */

export default function TgeContent() {
  // Auto-refresh context
  const autoRefreshContext = useAutoRefreshContext();
  
  // Global price context
  const globalPriceContext = useGlobalPriceContext();
  
  // Main state management
  const state = useTgeAppState();
  
  // Data operations
  const dataOps = useTgeDataOperations(
    state.rows,
    state.setRows,
    state.workspaceId,
    state.isRemoteUpdateRef,
    state.setLastSyncTime
  );
  
  // API operations
  const apiOps = useTgeApiOperations(
    state.rows,
    state.setBtcPrice,
    state.setEthPrice,
    state.setBnbPrice,
    state.setTokenLogos,
    dataOps.updateRow,
    state.setLoading,
    state.setLastUpdated
  );
  
  // TGE Neon sync
  const neonSyncOps = useTgeNeonSync(
    state.rows,
    state.setRows,
    state.workspaceId,
    state.setWorkspaceId,
    state.syncing,
    state.setSyncing,
    state.isRemoteUpdateRef,
    state.unsubRef,
    state.timerRef,
    state.setLastSyncTime
  );
  
  // Import/Export operations
  const importExportOps = useTgeImportExport(
    dataOps.addMultipleRows
  );
  
  // Duplicate check
  const duplicateOps = useDuplicateCheck(
    state.rows,
    state.setDuplicatesData,
    state.setShowDuplicatesModal
  );
  
  // Responsive design
  useResponsive(state.setIsMobile);
  
  // Register TGE tokens with centralized auto-refresh (always register current tokens)
  useEffect(() => {
    // Always register current tokens to ensure auto-refresh has latest data
    if (state.rows && state.rows.length > 0) {
      autoRefreshContext.registerTgeTokens(state.rows);
    }
  }, [state.rows, autoRefreshContext]); // Register whenever rows change
  
  // Modal operations
  const modalOps = useTgeModalOperations(
    state,
    dataOps,
    apiOps,
    importExportOps,
    duplicateOps
  );



  // Update statscard prices from global context
  useEffect(() => {
    const statscardPrices = globalPriceContext.statscardPrices;
    state.setBtcPrice(statscardPrices.btc);
    state.setEthPrice(statscardPrices.eth);
    state.setBnbPrice(statscardPrices.bnb);
  }, [globalPriceContext.statscardPrices, state.setBtcPrice, state.setEthPrice, state.setBnbPrice]);

  // Sync global prices to table rows
  useGlobalPriceSync(state.rows, dataOps.updateRowPriceOnly);

  // Update document title
  useEffect(() => {
    document.title = "Binance Alpha TGE";
  }, []);

  // Initial data loading - ensure proper order (same as Airdrop)
  useEffect(() => {
    // First, load data from Neon database
    const loadDataFromDatabase = async () => {
      try {
        // Wait for Neon sync to complete - this will force load from database
        await neonSyncOps.loadInitialData();
        
        // Then load logos and refresh all prices using global context
        apiOps.loadLogosFromDatabase();
        
        // Use global refresh to get all prices in one API call
        await globalPriceContext.refreshAllPrices([], state.rows);
        
      } catch (error) {
        console.error('TGE: Error in initial data loading:', error);
        // Fallback: load data anyway
        apiOps.loadLogosFromDatabase();
        
        // Try global refresh as fallback
        try {
          await globalPriceContext.refreshAllPrices([], state.rows);
        } catch (refreshError) {
          console.error('TGE: Error in fallback global refresh:', refreshError);
        }
      }
    };

    loadDataFromDatabase();
  }, []); // Empty dependency array like Airdrop

  // Check for missing prices on initial load and refresh if needed (only once)
  useEffect(() => {
    const checkMissingPrices = async () => {
      console.log('🔍 Checking for TGE tokens with missing prices on initial load...');
      const hasRefreshed = await apiOps.checkAndRefreshMissingPrices();
      if (hasRefreshed) {
        console.log('✅ Refreshed TGE data due to missing prices');
      }
    };

    // Only check after initial data is loaded and only once
    if (state.rows.length > 0) {
      checkMissingPrices();
    }
  }, [state.rows.length]); // Only depend on rows.length to prevent loops

  // Auto force sync when page becomes visible (if needed)
  useEffect(() => {
    // Auto-force sync every 15 minutes
    const syncInterval = setInterval(() => {
      if (state.isPageVisible && !state.syncing) {
        neonSyncOps.forceSync();
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => {
      clearInterval(syncInterval);
    };
  }, [state.isPageVisible, state.syncing, neonSyncOps]); // Keep neonSyncOps dependency

  // Handle add row submit
  const handleAddRowSubmit = (form) => {
    const result = dataOps.handleAddRowSubmit(form);
    if (result.success) {
      state.setShowAddModal(false);
    } else if (result.errors) {
      // Set validation errors to display in the form
      state.setAddErrors(result.errors);
    }
    return result;
  };

  // Handle paste
  const handlePaste = (text) => {
    const result = importExportOps.handlePaste(text);
    return result;
  };

  // Handle Excel import
  const handleImportExcel = async (file) => {
    console.log('TgeContent handleImportExcel - file type:', typeof file);
    console.log('TgeContent handleImportExcel - file constructor:', file?.constructor?.name);
    console.log('TgeContent handleImportExcel - file instanceof File:', file instanceof File);
    console.log('TgeContent handleImportExcel - file instanceof Blob:', file instanceof Blob);
    console.log('TgeContent handleImportExcel - file:', file);
    
    const result = await importExportOps.handleTgeImportExcel(file);
    if (result.success) {
      state.setShowExcelUpload(false);
    }
    return result;
  };

  // Export Excel
  const exportExcel = () => {
    importExportOps.exportTgeToExcel(state.rows);
  };


  // Fallback render nếu có lỗi
  if (!state || !dataOps || !apiOps) {
    console.error('TgeContent: Missing required dependencies');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-red-500">
            <h1 className="text-2xl font-bold mb-4">TGE Page Error</h1>
            <p>Something went wrong loading the TGE page. Please refresh.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-6">
        <Header 
          workspaceId={state.workspaceId}
          syncing={state.syncing}
          isPageVisible={state.isPageVisible}
          loading={state.loading}
          title="Binance Alpha TGE"
          mobileTitle="TGE"
        />
        <StatsCards
          rowsCount={state.rows.length}
          btcPrice={state.btcPrice}
          ethPrice={state.ethPrice}
          bnbPrice={state.bnbPrice}
          syncing={state.syncing}
          lastUpdated={state.lastUpdated}
          lastSyncTime={state.lastSyncTime}
          tokenLogos={state.tokenLogos}
          loading={state.loading}
          isPageVisible={state.isPageVisible}
        />

        <ActionButtons
          onAddRow={modalOps.handleAddRow}
          onPasteText={handlePaste}
          onExportExcel={modalOps.handleExportExcel}
          onImportExcel={() => {
            state.setShowExcelUpload(true);
          }}
          onCheckDuplicates={duplicateOps.checkDuplicateLogosAndNames}
          onClearAll={dataOps.clearAllData}
          onFetchFullInfo={apiOps.fetchAllTokensFullInfo}
          loading={state.loading}
          showATH={state.showATH}
          setShowATH={state.setShowATH}
          searchToken={state.searchToken}
          setSearchToken={state.setSearchToken}
          countdown={autoRefreshContext.countdown}
          onManualRefresh={autoRefreshContext.manualRefresh}
        />

        <SortableTable
          rows={state.rows}
          onUpdateRow={dataOps.updateRow}
          onRemoveRow={dataOps.removeRow}
          searchToken={state.searchToken}
          tokenLogos={state.tokenLogos}
          onRefreshToken={apiOps.refreshSingleToken}
          loading={state.loading}
          showATH={state.showATH}
          ref={state.highlightRowRef}
          countdown={autoRefreshContext.countdown}
        />
      </div>

      {/* Excel Upload Modal */}
      {state.showExcelUpload && (
        <div className='fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50'>
          <div className='bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl p-6 shadow-xl'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold dark:text-white'>
                Import from Excel file
              </h3>
              <div className='flex items-center gap-2'>
                            <button
                onClick={() => importExportOps.createTgeExcelTemplate()}
                className='px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors'
              >
                Download Template
              </button>
                <button
                  onClick={() => state.setShowExcelUpload(false)}
                className='text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100'
              >
                ✕
              </button>
              </div>
            </div>
            <ExcelUpload onImportData={handleImportExcel} />
            <div className='mt-4 text-xs text-gray-500 dark:text-gray-400'>
              <p>
                <strong>Required Excel format:</strong> Columns A-H as follows:
              </p>
              <p>
                A: Token Name (optional) | B: Listing Date (optional) | C: API ID (required) | D: Point (optional) | E: Token Price (optional) | F: ATH (optional) | G: Logo (optional) | H: Symbol (optional)
              </p>

              <p className='mt-1'>
                <strong>Required fields:</strong> Only API ID (C) is mandatory. All other fields are optional and will be preserved if provided.
              </p>
              <p className='mt-1'>
                <strong>Note:</strong> Import now supports full data preservation - exported files can be imported back with all data intact.
              </p>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={<div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>}>
        <AddRowModal
          showAddModal={state.showAddModal}
          setShowAddModal={state.setShowAddModal}
          addForm={state.addForm}
          setAddForm={state.setAddForm}
          addErrors={state.addErrors}
          handleAddRowSubmit={handleAddRowSubmit}
          onRefreshToken={apiOps.refreshSingleToken}
        />
        
        <DuplicatesModal
          isOpen={state.showDuplicatesModal}
          onClose={() => state.setShowDuplicatesModal(false)}
          duplicates={state.duplicatesData}
        />
      </Suspense>

      <footer className='mt-2 text-center text-xs text-gray-500 dark:text-gray-400'>
        <div className='py-1'>
          <div className='inline-block px-3 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 border dark:border-gray-700 shadow-sm'>
            © 2025 ~ <span className='font-semibold'>Nguyenwolf</span>
          </div>
        </div>
      </footer>

             {/* Notification Tester - For testing different notification types */}
       {/* <SimpleNotificationTester /> */}

      {/* Toast Container - Hidden since we use NotificationContext now */}
      {/* <ToastContainer
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
      /> */}
    </div>
  );
}
