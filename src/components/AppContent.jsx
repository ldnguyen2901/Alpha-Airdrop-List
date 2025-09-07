import React, { useEffect, lazy, Suspense } from 'react';
import { 
  ActionButtons, 
  SortableTable, 
  ExcelUpload
} from './airdrop';
import Header from './Header';
import StatsCards from './StatsCards';


// Lazy load modals for better performance
const AddRowModal = lazy(() => import('./airdrop/modals/AddRowModal'));
const DuplicatesModal = lazy(() => import('./airdrop/modals/DuplicatesModal'));

// Custom hooks
import {
  useAppState,
  useDataOperations,
  useApiOperations,
  useNeonSync,
  useImportExport,
  useDuplicateCheck,
  useResponsive,
  useAutoRefresh,
  useModalOperations,
  useStatscardPrices
} from '../hooks';
import { useAutoRefreshContext } from '../contexts';

/**
 * React Airdrop Alpha Tracker
 * - Dữ liệu các cột khớp Google Sheet: A..H
 * - Tự động fetch giá từ CoinGecko qua Api Id (cột D)
 * - G = Token Price (từ API) | H = B x G
 * - Hỗ trợ thêm dòng nhanh, dán dữ liệu từ Sheet (CSV/TSV), export CSV
 * - Tùy chỉnh chu kỳ làm mới
 */

export default function AppContent() {
  // Auto-refresh context
  const autoRefreshContext = useAutoRefreshContext();
  
  // Main state management
  const state = useAppState();
  
  // Data operations
  const dataOps = useDataOperations(
    state.rows,
    state.setRows,
    state.workspaceId,
    state.isRemoteUpdateRef,
    state.setLastSyncTime
  );
  
  // API operations
  const apiOps = useApiOperations(
    state.rows,
    state.setBtcPrice,
    state.setEthPrice,
    state.setBnbPrice,
    state.setTokenLogos,
    dataOps.updateRowForAPI,
    state.setLoading,
    state.setLastUpdated
  );
  
  // Neon sync
  const neonSyncOps = useNeonSync(
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
  const importExportOps = useImportExport(
    dataOps.addMultipleRows,
    dataOps.replaceRows
  );
  
  // Duplicate check
  const duplicateOps = useDuplicateCheck(
    state.rows,
    state.setDuplicatesData,
    state.setShowDuplicatesModal
  );
  
  // Responsive design
  useResponsive(state.setIsMobile);
  
  // Auto refresh - only refresh active table (airdrop)
  const autoRefreshOps = useAutoRefresh(
    apiOps.refreshData,
    apiOps.refreshStatscardPrices,
    state.isPageVisible,
    state.setIsPageVisible
  );
  
  // Modal operations
  const modalOps = useModalOperations(
    state.setShowAddModal,
    state.setAddForm,
    state.setAddErrors,
    state.addModalPosition,
    state.setAddModalPosition
  );



  // Statscard prices operations
  const statscardOps = useStatscardPrices(
    state.setBtcPrice,
    state.setEthPrice,
    state.setBnbPrice,
    null, // updateStatscardPrices function will be passed from useApiOperations
    state.setTokenLogos
  );

  // Update document title
  useEffect(() => {
    document.title = "Binance Alpha Airdrop";
  }, []);

  // Initial data loading - ensure proper order
  useEffect(() => {
    // First, load data from Neon database
    const loadDataFromDatabase = async () => {
      try {
        // Wait for Neon sync to complete
        await neonSyncOps.loadInitialData();
        
        // Then load logos and refresh data
        apiOps.loadLogosFromDatabase();
        statscardOps.initializeStatscardPrices();
        apiOps.refreshData();
        apiOps.refreshStatscardPrices();
      } catch (error) {
        console.error('Error in initial data loading:', error);
        // Fallback: load data anyway
        apiOps.loadLogosFromDatabase();
        statscardOps.initializeStatscardPrices();
        apiOps.refreshData();
        apiOps.refreshStatscardPrices();
      }
    };

    loadDataFromDatabase();
  }, []); // Remove apiOps dependency to prevent infinite loop

  // Check for missing prices on initial load and refresh if needed (only once)
  useEffect(() => {
    const checkMissingPrices = async () => {
      console.log('🔍 Checking for tokens with missing prices on initial load...');
      const hasRefreshed = await apiOps.checkAndRefreshMissingPrices();
      if (hasRefreshed) {
        console.log('✅ Refreshed data due to missing prices');
      }
    };

    // Only check after initial data is loaded and only once
    if (state.rows.length > 0) {
      checkMissingPrices();
    }
  }, [state.rows.length]); // Remove apiOps dependency

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
  }, [state.isPageVisible, state.syncing, neonSyncOps]);

  // Handle add row submit
  const handleAddRowSubmit = (form) => {
  
    const result = dataOps.handleAddRowSubmit(form);
  
    if (result.success) {
      modalOps.closeAddRowModal();
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
    const result = await importExportOps.handleImportExcel(file);
    if (result.success) {
      state.setShowExcelUpload(false);
    }
    return result;
  };

  // Export Excel
  const exportExcel = () => {
    importExportOps.exportExcel(state.rows);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-6">
        <Header 
          workspaceId={state.workspaceId}
          syncing={state.syncing}
          isPageVisible={state.isPageVisible}
          loading={state.loading}
          title="Binance Alpha Airdrop"
          mobileTitle="Airdrop"
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
          onAddRow={modalOps.openAddRowModal}
          onPasteText={handlePaste}
          onExportExcel={exportExcel}
          onImportExcel={() => {
            state.setShowExcelUpload(true);
          }}
          onCheckDuplicates={duplicateOps.checkDuplicateLogosAndNames}
          onClearAll={dataOps.clearAllData}
          loading={state.loading}
          showATH={state.showATH}
          setShowATH={state.setShowATH}
          searchToken={state.searchToken}
          setSearchToken={state.setSearchToken}
          countdown={autoRefreshContext.countdown}
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
                  onClick={() => importExportOps.createExcelTemplate()}
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
                <strong>Required Excel format:</strong> Columns A-K as follows:
              </p>
              <p>
                A: Token Name (optional) | B: Amount (optional) | C: Listing Date (optional) | D: API ID (required) | E: Point (Priority) (optional) | F: Point (FCFS) (optional) | G: Token Price (optional) | H: Reward (optional) | I: ATH (optional) | J: Logo (optional) | K: Symbol (optional)
              </p>

              <p className='mt-1'>
                <strong>Required fields:</strong> Only API ID (D) is mandatory. All other fields are optional and will be preserved if provided.
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
