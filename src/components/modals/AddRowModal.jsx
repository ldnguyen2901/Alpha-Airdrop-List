import { normalizeDateTime } from '../../utils/helpers';
import { useState } from 'react';

export default function AddRowModal({
  showAddModal,
  setShowAddModal,
  addForm,
  setAddForm,
  addErrors,
  handleAddRowSubmit
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  return (
    <div className='fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50'>
      <div className='bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-xl'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold dark:text-white'>
            Add Row
          </h3>
          <button
            onClick={() => setShowAddModal(false)}
            className='text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100'
          >
            ✕
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
                placeholder='Token (required)'
                className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
              />
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
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, apiId: e.target.value }))
                }
                placeholder='API ID'
                className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
              />
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
               className='px-3 py-2 rounded-xl border dark:border-gray-600 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md'
             >
               Cancel
             </button>
                           <button
                type='submit'
                disabled={isSubmitting}
                className={`px-3 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="spin">🔄</span>
                    Adding...
                  </span>
                ) : (
                  'Add to table'
                )}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
