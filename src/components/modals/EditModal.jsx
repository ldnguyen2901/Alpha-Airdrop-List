import { normalizeDateTime } from '../../utils/helpers';
import { useState } from 'react';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

export default function EditModal({
  editingModal,
  rowDrafts,
  setRowDrafts,
  setEditingModal,
  saveRow
}) {
  const [isSaving, setIsSaving] = useState(false);
  
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

  const handleLaunchAtChange = (e) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^0-9/\s:]/g, '');
    setRowDrafts((p) => ({
      ...p,
      [editingModal.idx]: {
        ...p[editingModal.idx],
        launchAt: sanitizedValue,
      },
    }));
  };

  const handleLaunchAtBlur = (e) => {
    const value = e.target.value.trim();
    if (value) {
      const normalized = normalizeDateTime(value);
      if (normalized && normalized !== value) {
        setRowDrafts((p) => ({
          ...p,
          [editingModal.idx]: {
            ...p[editingModal.idx],
            launchAt: normalized,
          },
        }));
      }
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4'>
      <div className='bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-xl'>
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
          <input
            value={rowDrafts[editingModal.idx].name}
            onChange={handleNameChange}
            className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
            placeholder='Token (required)'
          />

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

          <input
            value={rowDrafts[editingModal.idx].launchAt}
            onChange={handleLaunchAtChange}
            onBlur={handleLaunchAtBlur}
            className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
            placeholder='Listing time (required): DD/MM/YYYY or DD/MM/YYYY HH:mm:ss'
          />

          <input
            value={rowDrafts[editingModal.idx].apiId}
            onChange={(e) =>
              setRowDrafts((p) => ({
                ...p,
                [editingModal.idx]: {
                  ...p[editingModal.idx],
                  apiId: e.target.value,
                },
              }))
            }
            className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
            placeholder='API ID'
          />

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
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <AutorenewIcon className="animate-spin" sx={{ fontSize: 16 }} />
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
    </div>
  );
}
