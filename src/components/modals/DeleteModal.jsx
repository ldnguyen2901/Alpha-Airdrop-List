import { formatAmount } from '../../utils/helpers';
import { formatDateTime } from '../../utils/dateTimeUtils';
import { useState } from 'react';
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
           top: modalPosition.top,
           left: modalPosition.left,
           maxWidth: '384px'
         } : isMobile ? {
           top: '50%',
           left: '50%',
           transform: 'translate(-50%, -50%)',
           maxWidth: '384px'
         } : {}}
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

        <div className='space-y-3'>
          <p className='text-sm text-gray-700 dark:text-gray-300'>
            You're about to delete this token. Review the details below and
            confirm to proceed.
          </p>

          <div className='grid grid-cols-1 gap-2'>
            <input
                              value={row.symbol || row.name || row.apiId || ''}
              readOnly
              className='border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white w-full'
              placeholder='Token'
            />
            <input
              value={formatAmount(row.amount || '')}
              readOnly
              className='border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white w-full'
              placeholder='Amount'
            />
            <input
              value={formatDateTime(row.launchAt) || ''}
              readOnly
              className='border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white w-full'
              placeholder='Listing time'
            />
            <input
              value={row.apiId || ''}
              readOnly
              className='border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white w-full'
              placeholder='API ID'
            />
            <input
              value={row.pointPriority || ''}
              readOnly
              className='border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white w-full'
              placeholder='Point (Priority)'
            />
            <input
              value={row.pointFCFS || ''}
              readOnly
              className='border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white w-full'
              placeholder='Point (FCFS)'
            />
          </div>

                     <div className='flex justify-end gap-2 mt-2'>
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
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <AutorenewIcon className="animate-spin" sx={{ fontSize: 16 }} />
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
