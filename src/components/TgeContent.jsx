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
  useApiOperations,
  useTgeNeonSync,
  useTgeImportExport,
  useDuplicateCheck,
  useResponsive,
  useAutoRefresh,
  useTgeModalOperations,
  useStatscardPrices
} from '../hooks';

/**
 * React TGE Alpha Tracker
 * - Dữ liệu các cột khớp Google Sheet: A..H
 * - Tự động fetch giá từ CoinGecko qua Api Id (cột D)
 * - G = Token Price (từ API) | H = B x G
 * - Hỗ trợ thêm dòng nhanh, dán dữ liệu từ Sheet (CSV/TSV), export CSV
 * - Tùy chỉnh chu kỳ làm mới
 */

export default function TgeContent() {
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
  const apiOps = useApiOperations(
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
  
  // Auto refresh - separate intervals for table data and statscard prices
  useAutoRefresh(
    apiOps.refreshData,
    apiOps.refreshStatscardPrices,
    state.isPageVisible,
    state.setIsPageVisible,
    state.timerRef
  );
  
  // Modal operations
  const modalOps = useTgeModalOperations(
    state,
    dataOps,
    apiOps,
    importExportOps,
    duplicateOps
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
    document.title = "Binance Alpha TGE";
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
        console.error('TGE: Error in initial data loading:', error);
        // Fallback: load data anyway
        apiOps.loadLogosFromDatabase();
        statscardOps.initializeStatscardPrices();
        apiOps.refreshData();
        apiOps.refreshStatscardPrices();
      }
    };

    loadDataFromDatabase();
  }, []); // Remove apiOps dependency to prevent infinite loop

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
  }, [state.isPageVisible, state.syncing]); // Remove neonSyncOps dependency

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
          onPasteText={modalOps.handlePasteText}
          onExportExcel={modalOps.handleExportExcel}
          onImportExcel={() => {
            state.setShowExcelUpload(true);
          }}
          onRefresh={modalOps.handleRefresh}
          onCheckDuplicates={modalOps.handleCheckDuplicates}
          onClearAll={modalOps.handleClearAll}
          loading={state.loading}
          showATH={state.showATH}
          setShowATH={state.setShowATH}
          searchToken={state.searchToken}
          setSearchToken={state.setSearchToken}
        />

        <SortableTable
          rows={state.rows}
          onUpdateRow={dataOps.updateRow}
          onRemoveRow={dataOps.removeRow}
          searchToken={state.searchToken}
          tokenLogos={state.tokenLogos}
          onRefresh={apiOps.refreshData}
          onRefreshToken={apiOps.refreshSingleToken}
          loading={state.loading}
          showATH={state.showATH}
          ref={state.highlightRowRef}
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
