import { formatAmount, formatDateTime } from '../../../utils';
import { useState, useEffect } from 'react';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

export default function DeleteModal({
  deleteModal,
  setDeleteModal,
  confirmDelete,
  rowDrafts,
  rows,
  modalPosition
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isDeleting && !isRefreshing) {
      setIsRefreshing(true);
    }
  }, [isDeleting]);

  useEffect(() => {
    if (!isDeleting && isRefreshing) {
      // Ensure animation completes full rotation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  }, [isDeleting, isRefreshing]);
  
  if (!deleteModal || !deleteModal.open || deleteModal.idx === -1) {
    return null;
  }

  const row = rowDrafts[deleteModal.idx] || rows[deleteModal.idx] || {};

  const isMobile = window.innerWidth < 768;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className='fixed inset-0 z-50 bg-black/60' 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setDeleteModal({
              open: false,
              idx: -1,
              token: '',
              input: '',
              error: '',
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
            Confirm Delete
          </h3>
          <button
            onClick={() =>
              setDeleteModal({
                open: false,
                idx: -1,
                token: '',
                input: '',
                error: '',
              })
            }
            className='w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-all duration-200 hover:scale-105'
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </button>
        </div>

        <div className='grid grid-cols-1 gap-3'>
          <p className='text-sm text-gray-700 dark:text-gray-300'>
            You're about to delete this token. Review the details below and
            confirm to proceed.
          </p>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Token symbol/name (auto-filled from API)
            </label>
            <input
              value={row.symbol || row.name || row.apiId || ''}
              readOnly
              className='border rounded px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 w-full cursor-not-allowed'
              placeholder='Will be auto-filled from API ID'
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
                   value={row.launchDate || ''}
                   readOnly
                   className='border rounded px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 w-full cursor-not-allowed'
                   placeholder='Date (optional)'
                 />
               </div>
               <div>
                 <label className='block text-xs text-gray-500 dark:text-gray-400 mb-1'>Time (optional)</label>
                 <input
                   value={row.launchTime || ''}
                   readOnly
                   className='border rounded px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 w-full cursor-not-allowed'
                   placeholder='Time (optional)'
                 />
               </div>
             </div>
           </div>

           <div>
             <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
               API ID <span className='text-red-500'>*</span>
             </label>
             <input
               value={row.apiId || ''}
               readOnly
               className='border rounded px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 w-full cursor-not-allowed'
               placeholder='API ID (required) - e.g., bitcoin, ethereum'
             />
           </div>

           <div>
             <input
               value={row.point || ''}
               readOnly
               className='border rounded px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 w-full cursor-not-allowed'
               placeholder='Point (optional)'
             />
           </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Type
            </label>
            <div className='border rounded px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 w-full flex items-center cursor-not-allowed'>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                row.type === 'Pre-TGE' 
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' 
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
              }`}>
                {row.type || 'TGE'}
              </span>
            </div>
          </div>

          <div className='mt-3 text-xs text-gray-500 dark:text-gray-400'>
            <span className='text-red-500'>*</span> Only API ID is required
          </div>

                     <div className='mt-4 flex justify-end gap-2'>
             <button
               onClick={() =>
                 setDeleteModal({
                   open: false,
                   idx: -1,
                   token: '',
                   input: '',
                   error: '',
                 })
               }
               className='px-3 py-2 rounded-xl border dark:border-gray-600 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
             >
                               <CloseIcon sx={{ fontSize: 16 }} />
                Cancel
             </button>
                         <button
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await confirmDelete();
                  // Add success animation
                  const button = event.target;
                  button.classList.add('button-success');
                  setTimeout(() => {
                    button.classList.remove('button-success');
                  }, 800);
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
              className={`px-3 py-2 rounded-xl bg-rose-600 text-white text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2 ${
                isDeleting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {(isDeleting || isRefreshing) ? (
                <span className="flex items-center gap-2">
                  <AutorenewIcon sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} className="refresh-spin" />
                  Deleting...
                </span>
              ) : (
                <>
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                Confirm Delete
                </>
              )}
            </button>
           </div>
        </div>
      </div>
    </>
  );
}
