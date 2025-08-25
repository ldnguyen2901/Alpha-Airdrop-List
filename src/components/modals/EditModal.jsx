import { normalizeDateTime } from '../../utils';
import { useState, useEffect } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import AutorenewIcon from '@mui/icons-material/Autorenew';


export default function EditModal({
  editingModal,
  rowDrafts,
  setRowDrafts,
  setEditingModal,
  saveRow,
  modalPosition
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isSaving && !isRefreshing) {
      setIsRefreshing(true);
    }
  }, [isSaving]);

  useEffect(() => {
    if (!isSaving && isRefreshing) {
      // Ensure animation completes full rotation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  }, [isSaving, isRefreshing]);

  // Validate edit form
  const validateEditForm = (form) => {
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

    // Check if either launchAt (legacy) or launchDate (new) is provided
    const hasLegacyLaunchAt = form.launchAt && String(form.launchAt).trim();
    const hasNewLaunchDate = form.launchDate && String(form.launchDate).trim();
    
    if (!hasLegacyLaunchAt && !hasNewLaunchDate) {
      errs.launchAt = 'Listing date is required';
    } else if (hasLegacyLaunchAt && !hasNewLaunchDate) {
      // Only validate legacy format if using legacy input (not new date picker)
      const regexDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const regexDateTime = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/;
      const val = String(form.launchAt).trim();
      if (!(regexDate.test(val) || regexDateTime.test(val))) {
        errs.launchAt = 'Listing time must be DD/MM/YYYY or DD/MM/YYYY HH:mm';
      }
    }
    // If using new date picker (hasNewLaunchDate), no additional validation needed

    if (form.amount !== undefined && String(form.amount).trim() !== '') {
      const n = Number(form.amount);
      if (isNaN(n) || n < 0)
        errs.amount = 'Amount (B) must be a non-negative number';
    }

    return errs;
  };

  
  if (!editingModal || !editingModal.open || editingModal.idx === -1) {
    return null;
  }

  const handleNameChange = (e) => {
    setRowDrafts((p) => ({
      ...p,
      [editingModal.idx]: {
        ...p[editingModal.idx],
        name: e.target.value.toUpperCase(),
      },
    }));
  };



  // API ID change handler - auto fetch token info
  const handleApiIdChange = async (e) => {
    const apiId = e.target.value;
    setRowDrafts((p) => ({
      ...p,
      [editingModal.idx]: {
        ...p[editingModal.idx],
        apiId,
        name: apiId.trim() || '' // Set API ID as temporary token name
      },
    }));
    
    // Auto fetch token info if API ID is valid
    if (apiId && apiId.trim() && apiId.trim().length > 2) {
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
        // For hidden tokens, keep the API ID as the name
        setRowDrafts((p) => ({
          ...p,
          [editingModal.idx]: {
            ...p[editingModal.idx],
            name: apiId.trim(),
            apiId: apiId.trim()
          },
        }));
        return;
      }
      
      try {
        const { fetchTokenInfo } = await import('../../services/api');
        const tokenInfo = await fetchTokenInfo(apiId.trim());
        if (tokenInfo) {
          setRowDrafts((p) => ({
            ...p,
            [editingModal.idx]: {
              ...p[editingModal.idx],
              name: tokenInfo.symbol || tokenInfo.name,
              apiId: tokenInfo.id, // Use the correct ID from API
              logo: tokenInfo.logo,
              symbol: tokenInfo.symbol
            },
          }));
        }
      } catch (error) {
        console.error('Failed to fetch token info:', error);
        // Keep API ID as token name if fetch fails
      }
    }
  };





  const isMobile = window.innerWidth < 768;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className='fixed inset-0 z-50 bg-black/60' 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setEditingModal({ open: false, idx: -1 });
            setRowDrafts((prev) => {
              const next = { ...prev };
              delete next[editingModal.idx];
              return next;
            });
          }
        }}
      />
      
      {/* Modal */}
      <div 
        className={`fixed z-[99999] bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-xl ${
          isMobile ? '' : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
        }`}
        style={isMobile && modalPosition ? {
          top: `${modalPosition.top}px`,
          left: `${modalPosition.left}px`,
          maxWidth: '384px',
          maxHeight: '90vh',
          overflowY: 'auto'
        } : isMobile ? {
          top: '60px', // Fallback position
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '384px',
          maxHeight: '90vh',
          overflowY: 'auto'
        } : {
          maxWidth: '384px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold dark:text-white'>
            Edit Row
          </h3>
          <button
            onClick={() => {
              setEditingModal({ open: false, idx: -1 });
              // Xóa draft để thoát hoàn toàn khỏi chế độ edit
              setRowDrafts((prev) => {
                const next = { ...prev };
                delete next[editingModal.idx];
                return next;
              });
            }}
            className='w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-all duration-200 hover:scale-105'
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </button>
        </div>

        <div className='grid grid-cols-1 gap-3'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Token symbol/name (auto-filled from API)
            </label>
            <input
              value={rowDrafts[editingModal.idx].name}
              onChange={handleNameChange}
              placeholder='Will be auto-filled from API ID'
              className='border rounded px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 w-full cursor-not-allowed'
              disabled
            />
          </div>

                      <input
              value={rowDrafts[editingModal.idx].amount}
              onChange={(e) =>
                setRowDrafts((p) => ({
                  ...p,
                  [editingModal.idx]: {
                    ...p[editingModal.idx],
                    amount: e.target.value,
                  },
                }))
              }
              className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
              placeholder='Amount'
              type='number'
              step='0.000001'
            />
            {editErrors.amount && (
              <div className='text-yellow-800 bg-yellow-50 px-2 py-1 rounded text-sm mt-1'>
                {editErrors.amount}
              </div>
            )}

                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Listing date (required) & time (optional)
            </label>
            <div className='flex gap-2'>
              <input
                type='date'
                value={rowDrafts[editingModal.idx]?.launchDate || ''}
                onChange={(e) => {
                  setRowDrafts((p) => ({
                    ...p,
                    [editingModal.idx]: {
                      ...p[editingModal.idx],
                      launchDate: e.target.value,
                    },
                  }));
                }}
                className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white flex-1'
              />
              <input
                type='time'
                value={rowDrafts[editingModal.idx]?.launchTime || ''}
                onChange={(e) => {
                  setRowDrafts((p) => ({
                    ...p,
                    [editingModal.idx]: {
                      ...p[editingModal.idx],
                      launchTime: e.target.value,
                    },
                  }));
                }}
                className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white flex-1'
              />
            </div>
            {editErrors.launchAt && (
              <div className='text-yellow-800 bg-yellow-50 px-2 py-1 rounded text-sm mt-1'>
                {editErrors.launchAt}
              </div>
            )}

          <div>
            <input
              value={rowDrafts[editingModal.idx].apiId}
              onChange={handleApiIdChange}
              placeholder='API ID (required) - e.g., bitcoin, ethereum'
              className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
            />
            {editErrors.apiId && (
              <div className='text-yellow-800 bg-yellow-50 px-2 py-1 rounded text-sm mt-1'>
                {editErrors.apiId}
              </div>
            )}
          </div>

          <input
            value={rowDrafts[editingModal.idx].pointPriority}
            onChange={(e) =>
              setRowDrafts((p) => ({
                ...p,
                [editingModal.idx]: {
                  ...p[editingModal.idx],
                  pointPriority: e.target.value,
                },
              }))
            }
            className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
            placeholder='Point (Priority)'
          />

          <input
            value={rowDrafts[editingModal.idx].pointFCFS}
            onChange={(e) =>
              setRowDrafts((p) => ({
                ...p,
                [editingModal.idx]: {
                  ...p[editingModal.idx],
                  pointFCFS: e.target.value,
                },
              }))
            }
            className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
            placeholder='Point (FCFS)'
          />

                     <div className='flex justify-end gap-2 mt-2'>
                           <button
                onClick={() => {
                  setEditingModal({ open: false, idx: -1 });
                  // Xóa draft để thoát hoàn toàn khỏi chế độ edit
                  setRowDrafts((prev) => {
                    const next = { ...prev };
                    delete next[editingModal.idx];
                    return next;
                  });
                }}
                className='px-3 py-2 rounded-xl border dark:border-gray-600 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
              >
                <CloseIcon sx={{ fontSize: 16 }} />
                Cancel
              </button>
                         <button
              onClick={async () => {
                // Validate form before saving
                const currentForm = rowDrafts[editingModal.idx];
                const errs = validateEditForm(currentForm);
                setEditErrors(errs);
                
                if (Object.keys(errs).length > 0) {
                  return; // Don't save if there are validation errors
                }
                
                setIsSaving(true);
                try {
                  await saveRow(editingModal.idx);
                  // Add success animation
                  const button = event.target;
                  button.classList.add('button-success');
                  setTimeout(() => {
                    button.classList.remove('button-success');
                  }, 800);
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className={`px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2 ${
                isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {(isSaving || isRefreshing) ? (
                <span className="flex items-center gap-2">
                  <AutorenewIcon sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} className="refresh-spin" />
                  Saving...
                </span>
              ) : (
                <>
                                  <CheckIcon sx={{ fontSize: 16 }} />
                Save changes
                </>
              )}
            </button>
           </div>
        </div>
      </div>
    </>
  );
}
