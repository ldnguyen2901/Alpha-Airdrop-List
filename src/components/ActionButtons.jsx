import PasteButton from './PasteButton';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import AddIcon from '@mui/icons-material/Add';
import TableChartIcon from '@mui/icons-material/TableChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';

export default function ActionButtons({
  onAddRow,
  onPasteText,
  onExportCSV,
  onImportExcel,
  onRefresh,
  loading,
  showHighestPrice,
  setShowHighestPrice,
  searchToken,
  setSearchToken,
}) {
  return (
    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 lg:gap-4 mb-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <button
          onClick={onAddRow}
          className='px-3 py-2 rounded-2xl bg-green-500 hover:bg-green-600 text-white shadow-sm text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
        >
          <AddIcon sx={{ fontSize: 16 }} />
          Add Row
        </button>
        <PasteButton onPasteText={onPasteText} />
        <button
          onClick={onImportExcel}
          className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
        >
          <TableChartIcon sx={{ fontSize: 16 }} />
          Import Excel
        </button>
        <button
          onClick={onExportCSV}
          className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
        >
          <FileDownloadIcon sx={{ fontSize: 16 }} />
          Export CSV
        </button>
        <div className='w-full sm:w-auto relative'>
          <input
            type='text'
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            className='mt-1 sm:mt-0 sm:ml-2 w-full sm:w-40 md:w-52 lg:w-64 border rounded-2xl pl-10 pr-3 py-2 bg-white dark:bg-gray-800 text-sm dark:text-white transition-all duration-300 ease-in-out focus:scale-105 focus:shadow-md'
            placeholder='Search token name...'
            title='Search token name'
          />
          <div className='absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500'>
            <SearchIcon sx={{ fontSize: 16 }} />
          </div>
        </div>
      </div>
      <div className='flex items-center justify-between gap-2 sm:gap-4'>
        <button
          onClick={() => setShowHighestPrice(!showHighestPrice)}
          className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2'
        >
          <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ease-in-out flex items-center justify-center ${
            showHighestPrice 
              ? 'bg-blue-500 border-blue-500' 
              : 'bg-transparent border-gray-400 dark:border-gray-500'
          }`}>
            {showHighestPrice && (
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            )}
          </div>
          Show Highest Price
        </button>
                         <button
          onClick={onRefresh}
          className='px-3 py-2 rounded-2xl bg-black dark:bg-white dark:text-black text-white shadow hover:opacity-90 text-sm transition-all duration-300 ease-in-out hover:scale-105 flex-shrink-0 sm:flex-shrink flex items-center gap-2'
          title='Refresh now'
        >
          Refresh
          {loading && (
            <AutorenewIcon 
              className="animate-spin" 
              sx={{ fontSize: 16 }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
