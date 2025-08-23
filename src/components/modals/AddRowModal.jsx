import { normalizeDateTime } from '../../utils/helpers';
import { useState } from 'react';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { fetchTokenInfo } from '../../services/api';

export default function AddRowModal({
  showAddModal,
  setShowAddModal,
  addForm,
  setAddForm,
  addErrors,
  handleAddRowSubmit
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  
  if (!showAddModal) {
    return null;
  }

  const handleNameChange = (e) => {
    setAddForm((p) => ({ ...p, name: e.target.value.toUpperCase() }));
  };

  const handleLaunchAtChange = (e) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^0-9/\s:]/g, '');
    setAddForm((p) => ({ ...p, launchAt: sanitizedValue }));
  };

  const handleLaunchAtBlur = (e) => {
    const value = e.target.value.trim();
    if (value) {
      const normalized = normalizeDateTime(value);
      if (normalized && normalized !== value) {
        setAddForm((p) => ({ ...p, launchAt: normalized }));
      }
    }
  };

  // Auto fetch token info when API ID is entered
  const handleApiIdChange = async (e) => {
    const apiId = e.target.value;
    setAddForm((p) => ({ ...p, apiId }));
    
    // Auto fetch token info if API ID is valid
    if (apiId && apiId.trim() && apiId.trim().length > 2) {
      setIsFetchingToken(true);
      try {
        const tokenInfo = await fetchTokenInfo(apiId.trim());
        if (tokenInfo) {
          setAddForm((p) => ({
            ...p,
            name: tokenInfo.name,
            apiId: tokenInfo.id // Use the correct ID from API
          }));
        }
      } catch (error) {
        console.error('Failed to fetch token info:', error);
      } finally {
        setIsFetchingToken(false);
      }
    }
  };

  // Check if token name is auto-filled from API
  const isTokenNameFromAPI = addForm.apiId && addForm.name && addForm.apiId.trim().length > 2 && addForm.name.trim().length > 0;

  const isMobile = window.innerWidth < 768;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className='fixed inset-0 bg-black/60 z-50' 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddModal(false);
          }
        }}
      />
      
      {/* Modal */}
      <div 
        className={`fixed z-[99999] bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-xl ${
          isMobile ? '' : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
        }`}
        style={isMobile ? {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '384px'
        } : {}}
      >
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold dark:text-white'>
            Add Row
          </h3>
          <button
            onClick={() => setShowAddModal(false)}
            className='w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-all duration-200 hover:scale-105'
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            try {
              await handleAddRowSubmit(addForm);
              // Add success animation
              const form = e.target;
              form.classList.add('modal-success');
              setTimeout(() => {
                form.classList.remove('modal-success');
              }, 500);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className='grid grid-cols-1 gap-3'>
            <div>
              <input
                name='name'
                value={addForm.name}
                onChange={handleNameChange}
                placeholder={isTokenNameFromAPI ? 'Symbol (auto-filled from API)' : 'Token symbol/name (or provide API ID)'}
                className={`border rounded px-3 py-2 w-full ${
                  isTokenNameFromAPI 
                    ? 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed' 
                    : 'bg-white dark:bg-gray-700 dark:text-white'
                }`}
                disabled={isTokenNameFromAPI}
              />
              {isTokenNameFromAPI && (
                <div className='text-green-600 dark:text-green-400 text-sm mt-1 flex items-center gap-2'>
                  ✓ Auto-filled from API
                </div>
              )}
              {addErrors.name && (
                <div className='text-yellow-800 bg-yellow-50 px-2 py-1 rounded text-sm mt-1'>
                  {addErrors.name}
                </div>
              )}
            </div>

            <div>
              <input
                name='amount'
                value={addForm.amount}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, amount: e.target.value }))
                }
                placeholder='Amount'
                type='number'
                step='0.000001'
                className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
              />
              {addErrors.amount && (
                <div className='text-yellow-800 bg-yellow-50 px-2 py-1 rounded text-sm mt-1'>
                  {addErrors.amount}
                </div>
              )}
            </div>

            <div>
              <input
                name='launchAt'
                value={addForm.launchAt}
                onChange={handleLaunchAtChange}
                onBlur={handleLaunchAtBlur}
                placeholder='Listing time (required): DD/MM/YYYY or DD/MM/YYYY HH:mm:ss'
                className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
              />
              {addErrors.launchAt && (
                <div className='text-yellow-800 bg-yellow-50 px-2 py-1 rounded text-sm mt-1'>
                  {addErrors.launchAt}
                </div>
              )}
            </div>

            <div>
              <input
                name='apiId'
                value={addForm.apiId}
                onChange={handleApiIdChange}
                placeholder={isTokenNameFromAPI ? 'API ID (auto-filled)' : 'API ID (e.g., bitcoin, ethereum)'}
                className={`border rounded px-3 py-2 w-full ${
                  isTokenNameFromAPI 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                    : 'bg-white dark:bg-gray-700 dark:text-white'
                }`}
                disabled={isFetchingToken}
              />
              {isFetchingToken && (
                <div className='text-blue-600 dark:text-blue-400 text-sm mt-1 flex items-center gap-2'>
                  <AutorenewIcon className="animate-spin" sx={{ fontSize: 16 }} />
                  Fetching token info...
                </div>
              )}
              {isTokenNameFromAPI && (
                <div className='text-green-600 dark:text-green-400 text-sm mt-1 flex items-center gap-2'>
                  ✓ API ID provided - Token name auto-filled
                </div>
              )}
            </div>

            <div>
              <input
                name='pointPriority'
                value={addForm.pointPriority}
                onChange={(e) =>
                  setAddForm((p) => ({
                    ...p,
                    pointPriority: e.target.value,
                  }))
                }
                placeholder='Point (Priority)'
                className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
              />
            </div>

            <div>
              <input
                name='pointFCFS'
                value={addForm.pointFCFS}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, pointFCFS: e.target.value }))
                }
                placeholder='Point (FCFS)'
                className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
              />
            </div>
          </div>

                     <div className='mt-4 flex justify-end gap-2'>
             <button
               type='button'
               onClick={() => setShowAddModal(false)}
               className='px-3 py-2 rounded-xl border dark:border-gray-600 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
             >
                               <CloseIcon sx={{ fontSize: 16 }} />
                Cancel
             </button>
                           <button
                type='submit'
                disabled={isSubmitting}
                className={`px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <AutorenewIcon className="animate-spin" sx={{ fontSize: 16 }} />
                    Adding...
                  </span>
                ) : (
                  <>
                                    <AddIcon sx={{ fontSize: 16 }} />
                Add to table
                  </>
                )}
              </button>
           </div>
        </form>
      </div>
    </>
  );
}
