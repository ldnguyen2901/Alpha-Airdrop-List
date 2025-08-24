import PasteButton from './PasteButton';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import AddIcon from '@mui/icons-material/Add';
import TableChartIcon from '@mui/icons-material/TableChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useRef } from 'react';

export default function ActionButtons({
  onAddRow,
  onPasteText,
  onExportCSV,
  onImportExcel,
  onRefresh,
  onCheckDuplicates,

  loading,
  showHighestPrice,
  setShowHighestPrice,
  searchToken,
  setSearchToken,
}) {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    amount: '',
    launchAt: '',
    apiId: '',
    pointPriority: '',
    pointFCFS: '',
  });
  const [addErrors, setAddErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formPosition, setFormPosition] = useState({ top: 60, left: 16 });
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const addRowButtonRef = useRef(null);


  const handleAddRowClick = () => {
    // Mobile: show modal form
    if (window.innerWidth < 768) {
      // Calculate button position relative to document
      if (addRowButtonRef.current) {
        const rect = addRowButtonRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        setFormPosition({
          top: rect.bottom + scrollTop + 8,
          left: Math.max(16, Math.min(rect.left, window.innerWidth - 384 - 16))
        });
      }
      setShowInlineForm(true);
    } else {
      // Desktop: use original modal
      onAddRow();
    }
  };

  const handleCheckDuplicates = async () => {
    setIsCheckingDuplicates(true);
    try {
      await onCheckDuplicates();
    } finally {
      // Stop spinning after 2 seconds regardless of completion
      setTimeout(() => {
        setIsCheckingDuplicates(false);
      }, 2000);
    }
  };

  const handleInlineSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form
      const errors = {};
              if (!addForm.name.trim()) errors.name = 'Token symbol/name is required';
      if (!addForm.launchAt.trim()) errors.launchAt = 'Launch date is required';
      
      if (Object.keys(errors).length > 0) {
        setAddErrors(errors);
        setIsSubmitting(false);
        return;
      }

      // Call original onAddRow with form data
      const result = await onAddRow(addForm);
      
      if (result && result.success) {
        // Reset form
        setAddForm({
          name: '',
          amount: '',
          launchAt: '',
          apiId: '',
          pointPriority: '',
          pointFCFS: '',
        });
        setAddErrors({});
        setShowInlineForm(false);
      } else if (result && result.errors) {
        // Handle validation errors
        setAddErrors(result.errors);
      }
    } catch (error) {
      console.error('Error adding row:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameChange = (e) => {
    setAddForm(prev => ({ ...prev, name: e.target.value.toUpperCase() }));
    if (addErrors.name) setAddErrors(prev => ({ ...prev, name: '' }));
  };

  const handleLaunchAtChange = (e) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^0-9/\s:]/g, '');
    setAddForm(prev => ({ ...prev, launchAt: sanitizedValue }));
    if (addErrors.launchAt) setAddErrors(prev => ({ ...prev, launchAt: '' }));
  };

  return (
    <>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 lg:gap-4 mb-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <button
            ref={addRowButtonRef}
            onClick={handleAddRowClick}
            className='px-3 py-2 rounded-2xl bg-green-500 hover:bg-green-600 text-white shadow-sm text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
          >
            <AddIcon sx={{ fontSize: 16 }} />
            Add Row
          </button>
          <PasteButton onPasteText={onPasteText} />
          <button
            onClick={onImportExcel}
            className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
          >
            <TableChartIcon sx={{ fontSize: 16 }} />
            Import Excel
          </button>
          <button
            onClick={onExportCSV}
            className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
          >
            <FileDownloadIcon sx={{ fontSize: 16 }} />
            Export CSV
          </button>
          <button
            onClick={handleCheckDuplicates}
            className='px-3 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-sm text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
            title='Check for duplicate logos and token names'
          >
            <SyncProblemIcon 
              sx={{ 
                fontSize: 16,
                animation: isCheckingDuplicates ? 'spin 1s linear infinite' : 'none'
              }} 
            />
            Check Duplicates
          </button>
          <div className='w-full sm:w-auto relative'>
            <input
              type='text'
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className='mt-1 sm:mt-0 sm:ml-2 w-full sm:w-40 md:w-52 lg:w-64 border rounded-2xl pl-10 pr-3 py-2 bg-white dark:bg-gray-800 text-sm dark:text-white transition-all duration-300 ease-in-out focus:scale-105 focus:shadow-md'
              placeholder='Search token name...'
              title='Search token name'
            />
            <div className='absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500'>
              <SearchIcon sx={{ fontSize: 16 }} />
            </div>
          </div>
        </div>
        <div className='flex items-center justify-between gap-2 sm:gap-4'>
          {/* Show Highest Price button - only on desktop */}
          <button
            onClick={() => setShowHighestPrice(!showHighestPrice)}
            className='hidden sm:flex px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
          >
            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ease-in-out flex items-center justify-center ${
              showHighestPrice 
                ? 'bg-blue-500 border-blue-500' 
                : 'bg-transparent border-gray-400 dark:border-gray-500'
            }`}>
              {showHighestPrice && (
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              )}
            </div>
            Highest Price
          </button>

          <button
            onClick={onRefresh}
            className='hidden sm:flex px-3 py-2 rounded-2xl bg-black dark:bg-white dark:text-black text-white shadow hover:opacity-90 text-sm transition-all duration-300 ease-in-out hover:scale-105 flex-shrink-0 sm:flex-shrink flex items-center gap-2'
            title='Refresh prices and token info'
          >
            <AutorenewIcon 
              className={`${loading ? 'animate-spin' : ''}`}
              sx={{ fontSize: 16 }}
            />
            Refresh
          </button>

        </div>
      </div>

      {/* Mobile Modal Add Row Form */}
      {showInlineForm && (
        <>
          {/* Backdrop */}
          <div 
            className="sm:hidden fixed inset-0 bg-black/60 z-[99998]"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setShowInlineForm(false)}
          />
          
          {/* Form */}
          <div 
            className="sm:hidden bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-4 shadow-2xl fixed" 
            style={{ 
              zIndex: 99999,
              top: `${formPosition.top}px`,
              left: `${formPosition.left}px`,
              right: `${formPosition.left}px`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Add New Token</h3>
              <button
                onClick={() => setShowInlineForm(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-all duration-200 hover:scale-105"
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          
            <form onSubmit={handleInlineSubmit} className="space-y-3">
              <div>
                <input
                  name="name"
                  value={addForm.name}
                  onChange={handleNameChange}
                  placeholder="Token (required)"
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white text-sm"
                />
                {addErrors.name && (
                  <div className="text-red-500 text-xs mt-1">{addErrors.name}</div>
                )}
              </div>

              <div>
                <input
                  name="amount"
                  value={addForm.amount}
                  onChange={(e) => setAddForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Amount"
                  type="number"
                  step="0.000001"
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>

              <div>
                <input
                  name="launchAt"
                  value={addForm.launchAt}
                  onChange={handleLaunchAtChange}
                  placeholder="Listing time (required): DD/MM/YYYY or DD/MM/YYYY HH:mm"
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white text-sm"
                />
                {addErrors.launchAt && (
                  <div className="text-red-500 text-xs mt-1">{addErrors.launchAt}</div>
                )}
              </div>

              <div>
                <input
                  name="apiId"
                  value={addForm.apiId}
                  onChange={(e) => setAddForm(prev => ({ ...prev, apiId: e.target.value }))}
                  placeholder="API ID"
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>

              <div>
                <input
                  name="pointPriority"
                  value={addForm.pointPriority}
                  onChange={(e) => setAddForm(prev => ({ ...prev, pointPriority: e.target.value }))}
                  placeholder="Point (Priority)"
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>

              <div>
                <input
                  name="pointFCFS"
                  value={addForm.pointFCFS}
                  onChange={(e) => setAddForm(prev => ({ ...prev, pointFCFS: e.target.value }))}
                  placeholder="Point (FCFS)"
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInlineForm(false)}
                  className="flex-1 px-3 py-2 rounded-xl border dark:border-gray-600 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center justify-center gap-2 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <AutorenewIcon className="animate-spin" sx={{ fontSize: 16 }} />
                      Adding...
                    </>
                  ) : (
                    <>
                      <AddIcon sx={{ fontSize: 16 }} />
                      Add Token
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}

// Add CSS animation for spinning
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
document.head.appendChild(style);
