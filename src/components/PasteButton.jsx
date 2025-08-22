import { useState } from 'react';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

export default function PasteButton({ onPasteText }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  return (
    <>
      <button
        id='paste-open'
        onClick={() => setOpen(true)}
        className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white flex items-center gap-2'
      >
        <ContentPasteIcon sx={{ fontSize: 16 }} />
        Paste from Sheet
      </button>

      {open && (
        <div className='fixed inset-0 bg-black/30 flex items-center justify-center p-2 sm:p-4 z-50'>
          <div className='bg-white dark:bg-gray-800 w-full max-w-full sm:max-w-4xl rounded-2xl p-3 sm:p-4 shadow-xl z-50'>
            <div className='font-semibold mb-2 dark:text-white'>
              Paste data (CSV or TSV)
              <span className='ml-2 text-xs text-gray-500 dark:text-gray-400'>
                Column order: A..H
              </span>
            </div>
            <textarea
              className='w-full h-60 sm:h-64 md:h-80 lg:h-96 border dark:border-gray-600 rounded-xl p-3 mb-3 bg-white dark:bg-gray-700 dark:text-white'
              placeholder={`Example row:\nBitcoin,1.5,01/01/2025 12:00:00,bitcoin,100,50,0,0`}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className='flex justify-end gap-2'>
              <button
                className='px-3 py-2 rounded-xl border dark:border-gray-600 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
                onClick={() => setOpen(false)}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
                Close
              </button>
              <button
                className='px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
                onClick={() => {
                  onPasteText?.(text);
                  setText('');
                  setOpen(false);
                }}
              >
                <AddIcon sx={{ fontSize: 16 }} />
                Add to table
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
