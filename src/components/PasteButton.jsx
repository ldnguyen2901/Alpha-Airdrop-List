import { useState } from 'react';

export default function PasteButton({ onPasteText }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  return (
    <>
      <button
        id='paste-open'
        onClick={() => setOpen(true)}
        className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white'
      >
        📋 Paste from Sheet
      </button>

      {open && (
        <div className='fixed inset-0 bg-black/30 flex items-center justify-center p-4'>
          <div className='bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl p-4 shadow-xl'>
            <div className='font-semibold mb-2 dark:text-white'>
              Paste data (CSV or TSV)
              <span className='ml-2 text-xs text-gray-500 dark:text-gray-400'>
                Column order: A..H
              </span>
            </div>
            <textarea
              className='w-full h-64 md:h-80 lg:h-96 border dark:border-gray-600 rounded-xl p-3 mb-3 bg-white dark:bg-gray-700 dark:text-white'
              placeholder={`Example row:\nBitcoin,1.5,01/01/2025 12:00:00,bitcoin,100,50,0,0`}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className='flex justify-end gap-2'>
              <button
                className='px-3 py-2 rounded-xl border dark:border-gray-600 text-sm dark:text-white'
                onClick={() => setOpen(false)}
              >
                Close
              </button>
              <button
                className='px-3 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-sm'
                onClick={() => {
                  onPasteText?.(text);
                  setText('');
                  setOpen(false);
                }}
              >
                Add to table
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
