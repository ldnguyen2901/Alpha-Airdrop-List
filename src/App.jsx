import React, { useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { 
  Header, 
  StatsCards, 
  ActionButtons, 
  SortableTable, 
  ExcelUpload,
  AddRowModal,
  DuplicatesModal
} from './components';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Custom hooks
import {
  useAppState,
  useDataOperations,
  useApiOperations,
  useFirebaseSync,
  useImportExport,
  useDuplicateCheck,
  useResponsive,
  useAutoRefresh,
  useModalOperations
} from './hooks';

/**
 * React Airdrop Alpha Tracker
 * - Dữ liệu các cột khớp Google Sheet: A..H
 * - Tự động fetch giá từ CoinGecko qua Api Id (cột D)
 * - G = Token Price (từ API) | H = B x G
 * - Hỗ trợ thêm dòng nhanh, dán dữ liệu từ Sheet (CSV/TSV), export CSV
 * - Tùy chỉnh chu kỳ làm mới
 */

export default function App() {
  // Main state management
  const state = useAppState();
  
  // Data operations
  const dataOps = useDataOperations(
    state.rows,
    state.setRows,
    state.workspaceId,
    state.isRemoteUpdateRef
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
  
  // Firebase sync
  useFirebaseSync(
    state.rows,
    state.setRows,
    state.workspaceId,
    state.setWorkspaceId,
    state.syncing,
    state.setSyncing,
    state.isRemoteUpdateRef,
    state.unsubRef,
    state.timerRef
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
  useResponsive(state.setIsMobile, state.setShowHighestPrice);
  
  // Auto refresh
  useAutoRefresh(
    apiOps.refreshData,
    state.isPageVisible,
    state.setIsPageVisible,
    state.timerRef,
    60
  );
  
  // Modal operations
  const modalOps = useModalOperations(
    state.setShowAddModal,
    state.setAddForm,
    state.setAddErrors,
    state.addModalPosition,
    state.setAddModalPosition
  );

  // Initial data loading
  useEffect(() => {
    apiOps.loadLogosFromDatabase();
    apiOps.refreshData();
  }, []);

  // Handle add row submit
  const handleAddRowSubmit = (form) => {
    console.log('➕ handleAddRowSubmit called from App.jsx with form:', form);
    const result = dataOps.handleAddRowSubmit(form);
    console.log('➕ handleAddRowSubmit result:', result);
    if (result.success) {
      modalOps.closeAddRowModal();
      toast.success('Token added successfully!');
    } else if (result.errors) {
      // Set validation errors to display in the form
      state.setAddErrors(result.errors);
      console.log('❌ Validation errors set:', result.errors);
    }
    return result;
  };

  // Handle paste
  const handlePaste = (text) => {
    const result = importExportOps.handlePaste(text);
    if (result.success) {
      if (result.warning) {
        toast.warning(`Added ${result.count} tokens with warnings: ${result.warning}`);
    } else {
        toast.success(`Added ${result.count} tokens from pasted data!`);
      }
    } else {
      toast.error(result.error || 'Failed to parse pasted data');
    }
    return result;
  };

  // Handle Excel import
  const handleImportExcel = async (file) => {
    const result = await importExportOps.handleImportExcel(file);
    if (result.success) {
      toast.success(`Successfully imported ${result.count} tokens from Excel!`);
      state.setShowExcelUpload(false);
    } else {
      toast.error(result.error || 'Failed to import Excel file');
    }
    return result;
  };

  // Export Excel
  const exportExcel = () => {
    importExportOps.exportExcel(state.rows);
    toast.success('Excel file exported successfully!');
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4 py-6">
          <Header 
            workspaceId={state.workspaceId}
            syncing={state.syncing}
            isPageVisible={state.isPageVisible}
            loading={state.loading}
          />
          <StatsCards
            rowsCount={state.rows.length}
            btcPrice={state.btcPrice}
            ethPrice={state.ethPrice}
            bnbPrice={state.bnbPrice}
            syncing={state.syncing}
            lastUpdated={state.lastUpdated}
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
            onRefresh={() => {
              apiOps.refreshData();
            }}
            onCheckDuplicates={duplicateOps.checkDuplicateLogosAndNames}
            loading={state.loading}
            showHighestPrice={state.showHighestPrice}
            setShowHighestPrice={state.setShowHighestPrice}
            searchToken={state.searchToken}
            setSearchToken={state.setSearchToken}
          />

          <SortableTable
            rows={state.rows}
            onUpdateRow={dataOps.updateRow}
            onRemoveRow={dataOps.removeRow}
            showHighestPrice={state.showHighestPrice}
            setShowHighestPrice={state.setShowHighestPrice}
            searchToken={state.searchToken}
            tokenLogos={state.tokenLogos}
            onRefresh={apiOps.refreshData}
            loading={state.loading}
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
                  <strong>Required Excel format:</strong> Columns A-F as follows:
                </p>
                <p>
                  A: Token Name (optional) | B: Amount (optional) | C: Listing Date (optional) | D: API ID (required) | E: Point (Priority) (optional) | F: Point (FCFS) (optional)
                </p>
                <p className='mt-1'>
                  <strong>Required fields:</strong> Only API ID (D) is mandatory
                </p>
                <p className='mt-1'>
                  <strong>Date format:</strong> DD/MM/YYYY or DD/MM/YYYY HH:mm or Excel date number
                </p>
                <p className='mt-1'>
                  <strong>Supported formats:</strong> Standard (A-F) or simple (API_ID,DATE) or minimal (,API_ID,DATE)
                </p>
                <p className='mt-2'>
                  <strong>Export:</strong> Data will be exported as Excel (.xlsx) file with all columns including prices and metadata.
                </p>
              </div>
            </div>
          </div>
        )}

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
