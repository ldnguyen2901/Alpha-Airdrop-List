import { normalizeDateTime } from '../../../utils';
import { useState, useEffect } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import AutorenewIcon from '@mui/icons-material/Autorenew';


export default function AddRowModal({
  showAddModal,
  setShowAddModal,
  addForm,
  setAddForm,
  addErrors,
  handleAddRowSubmit,
  onRefreshToken // Add this prop for auto fetch full info
}) {

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isSubmitting && !isRefreshing) {
      setIsRefreshing(true);
    }
  }, [isSubmitting]);

  useEffect(() => {
    if (!isSubmitting && isRefreshing) {
      // Ensure animation completes full rotation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  }, [isSubmitting, isRefreshing]);
  
  if (!showAddModal) {
    return null;
  }

  const handleNameChange = (e) => {
    setAddForm((p) => ({ ...p, name: (e.target.value || '').toUpperCase() }));
  };



  // API ID change handler - auto fetch token info
  const handleApiIdChange = async (e) => {
    const apiId = e.target.value.toLowerCase(); // Convert to lowercase
    console.log('🔍 DEBUG TGE AddRowModal - API ID input change:', apiId);
    setAddForm((p) => ({ 
      ...p, 
      apiId,
      name: apiId.trim() || '' // Set API ID as temporary token name
    }));
    
    // Auto fetch token info if API ID is valid
    if (apiId && apiId.trim() && apiId.trim().length > 2) {
      // Validate API ID format - allow alphanumeric, hyphens, underscores, and question mark for hidden tokens
      const validApiIdPattern = /^[a-zA-Z0-9_\-?]+$/;
      if (!validApiIdPattern.test(apiId.trim())) {
        return;
      }
      
      // Additional validation - prevent common invalid inputs (but allow ? for hidden tokens)
      const invalidInputs = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', '[', ']', '{', '}', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '/'];
      if (invalidInputs.some(char => apiId.includes(char))) {
        return;
      }
      
      // Special handling for hidden tokens (containing ?)
      if (apiId.includes('?')) {
        // For hidden tokens, keep the API ID as the name
        setAddForm((p) => ({
          ...p,
          name: apiId.trim(),
          apiId: apiId.trim()
        }));
        return;
      }
      
      try {
        const { fetchTokenFullInfo } = await import('../../../services/api');
        const { saveTokenLogoToDatabase } = await import('../../../services/neon');
        const tokenInfo = await fetchTokenFullInfo(apiId.trim());
        if (tokenInfo) {
          // Save logo to database
          if (tokenInfo.logo) {
            try {
              await saveTokenLogoToDatabase(apiId.trim(), tokenInfo);
            } catch (error) {
              console.error(`Error saving logo to database for ${apiId.trim()}:`, error);
            }
          }
          
          setAddForm((p) => ({
            ...p,
            name: tokenInfo.symbol || tokenInfo.name,
            // Keep original API ID case, don't overwrite with API response
            logo: tokenInfo.logo || '',
            symbol: tokenInfo.symbol || '',
            ath: tokenInfo.ath || 0,
            atl: tokenInfo.atl || 0, // Thêm ATL
            contract: tokenInfo.contract || '', // Thêm contract
            exchanges: tokenInfo.exchanges || [], // Thêm exchanges
            chains: tokenInfo.chains || [], // Thêm chains
            categories: tokenInfo.categories || [], // Thêm categories
            price: tokenInfo.current_price || 0
          }));
        }
      } catch (error) {
        console.error('Failed to fetch token info:', error);
        // Keep API ID as token name if fetch fails
      }
    }
  };




  
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
        className='fixed z-[99999] bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
        style={{
          maxWidth: '384px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
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
            console.log('🔍 DEBUG TGE AddRowModal - Form submit with API ID:', addForm.apiId);
            setIsSubmitting(true);
            try {
          
              const result = await handleAddRowSubmit(addForm);
          
              
              if (result && result.success) {
                // Add success animation
                const form = e.target;
                form.classList.add('modal-success');
                setTimeout(() => {
                  form.classList.remove('modal-success');
                }, 500);
                
                // Auto fetch full info for the newly added token
                if (onRefreshToken && addForm.apiId) {
                  console.log('🔄 TGE Auto fetching full info for newly added token:', addForm.apiId);
                  try {
                    await onRefreshToken(addForm.apiId);
                    console.log('✅ TGE Successfully fetched full info for:', addForm.apiId);
                  } catch (error) {
                    console.error('❌ TGE Failed to fetch full info for:', addForm.apiId, error);
                  }
                }
                
                // Close modal after successful add
                setShowAddModal(false);
              } else if (result && result.errors) {
            
              }
            } catch (error) {
              console.error('Form submission error:', error);
              // Don't show error toast here as handleAddRowSubmit will handle it
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className='grid grid-cols-1 gap-3'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Token symbol/name (auto-filled from API)
              </label>
              <input
                name='name'
                value={addForm.name}
                onChange={handleNameChange}
                placeholder='Will be auto-filled from API ID'
                className='border rounded px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 w-full cursor-not-allowed'
                disabled
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Subscription date & time (optional)
              </label>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                <div>
                  <label className='block text-xs text-gray-500 dark:text-gray-400 mb-1'>Date (optional)</label>
                  <input
                    name='launchDate'
                    type='date'
                    value={addForm.launchDate || ''}
                    onChange={(e) => {
                      setAddForm((p) => ({
                        ...p,
                        launchDate: e.target.value,
                      }));
                    }}
                    className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                  />
                </div>
                <div>
                  <label className='block text-xs text-gray-500 dark:text-gray-400 mb-1'>Time (optional)</label>
                  <input
                    name='launchTime'
                    type='time'
                    value={addForm.launchTime || ''}
                    onChange={(e) => {
                      setAddForm((p) => ({
                        ...p,
                        launchTime: e.target.value,
                      }));
                    }}
                    placeholder='Time (optional)'
                    className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                  />
                </div>
              </div>
              {addErrors.launchDate && (
                <div className='text-yellow-800 bg-yellow-50 px-2 py-1 rounded text-sm mt-1'>
                  {addErrors.launchDate}
                </div>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                API ID <span className='text-red-500'>*</span>
              </label>
              <input
                name='apiId'
                value={addForm.apiId}
                onChange={handleApiIdChange}
                placeholder='API ID (required) - e.g., bitcoin, ethereum'
                className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
              />
              {addErrors.apiId && (
                <div className='text-yellow-800 bg-yellow-50 px-2 py-1 rounded text-sm mt-1'>
                  {addErrors.apiId}
                </div>
              )}
            </div>

            <div>
              <input
                name='point'
                value={addForm.point}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, point: e.target.value }))
                }
                placeholder='Point (optional)'
                className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Type
              </label>
              <select
                name='type'
                value={addForm.type || 'TGE'}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, type: e.target.value }))
                }
                className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
              >
                <option value='TGE'>TGE</option>
                <option value='Pre-TGE'>Pre-TGE</option>
                <option value='BC-TGE'>BC-TGE</option>
              </select>
            </div>
          </div>

          <div className='mt-3 text-xs text-gray-500 dark:text-gray-400'>
            <span className='text-red-500'>*</span> Only API ID is required
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
                {(isSubmitting || isRefreshing) ? (
                  <span className="flex items-center gap-2">
                    <AutorenewIcon sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} className="refresh-spin" />
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
