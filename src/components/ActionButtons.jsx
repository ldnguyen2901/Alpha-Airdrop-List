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
  handleAddRowSubmit,
  onPasteText,
  onExportExcel,
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
    contractAddress: '',
  });
  const [addErrors, setAddErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formPosition, setFormPosition] = useState({ top: 60, left: 16 });
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const addRowButtonRef = useRef(null);


  const handleAddRowClick = () => {
    // Always use modal form for both mobile and desktop
    onAddRow();
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

      // Call handleAddRowSubmit with form data
      const result = await handleAddRowSubmit(addForm);
      
      if (result && result.success) {
        // Reset form
        setAddForm({
          name: '',
          amount: '',
          launchAt: '',
          apiId: '',
          pointPriority: '',
          pointFCFS: '',
          contractAddress: '',
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
                              onClick={() => {
                    onImportExcel();
                  }}
            className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
          >
            <TableChartIcon sx={{ fontSize: 16 }} />
            Import Excel
          </button>
          <button
                                                onClick={() => {
                    onExportExcel();
                  }}
                  className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
                >
                  <FileDownloadIcon sx={{ fontSize: 16 }} />
                  Export Excel
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
              className={isCheckingDuplicates ? 'refresh-spin' : ''}
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
            onClick={() => {
              setShowHighestPrice(!showHighestPrice);
            }}
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
            onClick={async () => {
              if (isRefreshing) return;
              try {
                setIsRefreshing(true);
                await onRefresh();
              } finally {
                setIsRefreshing(false);
              }
            }}
            disabled={isRefreshing}
            className={`hidden sm:flex px-3 py-2 rounded-2xl text-sm flex-shrink-0 flex items-center gap-2 shadow transition-all duration-300 ease-in-out ${
              isRefreshing
                ? 'bg-gray-400 cursor-not-allowed opacity-90'
                : 'bg-black dark:bg-white dark:text-black text-white hover:opacity-90 hover:scale-105'
            }`}
            title='Refresh prices and token info'
          >
            <AutorenewIcon 
              sx={{ 
                fontSize: 16,
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }}
              className={isRefreshing ? 'refresh-spin' : ''}
            />
            Refresh
          </button>



        </div>
      </div>

      {/* Mobile Modal Add Row Form */}
      {/* Inline form disabled - using modal for both mobile and desktop */}
    </>
  );
}


