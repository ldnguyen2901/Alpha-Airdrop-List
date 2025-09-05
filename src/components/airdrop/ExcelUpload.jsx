import { useState, useRef, useEffect } from 'react';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import TableChartIcon from '@mui/icons-material/TableChart';

export default function ExcelUpload({ onImportData }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = useRef(null);



  useEffect(() => {
    if (isLoading && !isRefreshing) {
      setIsRefreshing(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && isRefreshing) {
      // Ensure animation completes full rotation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  }, [isLoading, isRefreshing]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('Airdrop ExcelUpload - file type:', file.constructor.name);
    console.log('Airdrop ExcelUpload - file size:', file.size);
    console.log('Airdrop ExcelUpload - file name:', file.name);

    // Kiểm tra định dạng file
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];

    if (!validTypes.includes(file.type)) {
      setError('Only Excel files (.xlsx, .xls) or CSV are supported');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Airdrop ExcelUpload - calling onImportData with file:', file);
      // Call onImportData with the file - it will handle reading and parsing
      const result = await onImportData(file);
      
      if (result && result.success) {
        setError('');
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else if (result && result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Excel upload error:', err);
      setError(err.message || 'Failed to process Excel file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fakeEvent = { target: { files: [file] } };
      handleFileUpload(fakeEvent);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div className='flex flex-col items-center'>
      <div
        className='w-full max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl p-4 sm:p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer'
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className='text-3xl sm:text-4xl mb-2 flex justify-center'>
          <TableChartIcon sx={{ fontSize: 48 }} />
        </div>
        <div className='text-base sm:text-lg font-medium mb-2 dark:text-white flex items-center justify-center gap-2'>
          {(isLoading || isRefreshing) ? (
            <>
              <AutorenewIcon sx={{ fontSize: 20, animation: 'spin 1s linear infinite' }} className="refresh-spin" />
              Reading file...
            </>
          ) : (
            'Upload Excel file'
          )}
        </div>
        <div className='text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4'>
          Drag & drop file or click to select
        </div>
        <div className='text-[11px] sm:text-xs text-gray-400 dark:text-gray-500'>
          Supported: .xlsx, .xls, .csv
        </div>

        <input
          ref={fileInputRef}
          type='file'
          accept='.xlsx,.xls,.csv'
          onChange={handleFileUpload}
          className='hidden'
        />
      </div>

      {error && (
        <div className='mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg w-full'>
          {error}
        </div>
      )}
    </div>
  );
}
