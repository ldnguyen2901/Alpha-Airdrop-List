import { formatAmount } from '../../utils/helpers';
import { useState } from 'react';

export default function DeleteModal({
  deleteModal,
  setDeleteModal,
  confirmDelete,
  rowDrafts,
  rows
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!deleteModal || !deleteModal.open || deleteModal.idx === -1) {
    return null;
  }

  const row = rowDrafts[deleteModal.idx] || rows[deleteModal.idx] || {};

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4'>
      <div className='bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-xl'>
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
            className='text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100'
          >
            ✕
          </button>
        </div>

        <div className='space-y-3'>
          <p className='text-sm text-gray-700 dark:text-gray-300'>
            You're about to delete this token. Review the details below and
            confirm to proceed.
          </p>

          <div className='grid grid-cols-1 gap-2'>
            <input
              value={row.name || ''}
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
              value={row.launchAt || ''}
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
               className='px-3 py-2 rounded-xl border dark:border-gray-600 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md'
             >
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
              className={`px-3 py-2 rounded-xl bg-rose-600 text-white text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md ${
                isDeleting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="spin">🔄</span>
                  Deleting...
                </span>
              ) : (
                'Confirm Delete'
              )}
            </button>
           </div>
        </div>
      </div>
    </div>
  );
}
