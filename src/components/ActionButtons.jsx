import PasteButton from './PasteButton';

export default function ActionButtons({
  onAddRow,
  onPasteText,
  onExportCSV,
  onClearAll,
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
          className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md'
        >
          ➕ Add Row
        </button>
        <PasteButton onPasteText={onPasteText} />
        <button
          onClick={onImportExcel}
          className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md'
        >
          📊 Import Excel
        </button>
        <button
          onClick={onExportCSV}
          className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md'
        >
          ⬇️ Export CSV
        </button>
        <button
          onClick={onClearAll}
          className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md'
        >
          🗑️ Clear All
        </button>
        <div className='w-full sm:w-auto'>
          <input
            type='text'
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            className='mt-1 sm:mt-0 sm:ml-2 w-full sm:w-40 md:w-52 lg:w-64 border rounded-2xl px-3 py-2 bg-white dark:bg-gray-800 text-sm dark:text-white transition-all duration-300 ease-in-out focus:scale-105 focus:shadow-md'
            placeholder='Search token name...'
            title='Search token name'
          />
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <label className='flex items-center gap-2 text-sm transition-colors duration-300'>
          <input
            type='checkbox'
            checked={showHighestPrice}
            onChange={(e) => setShowHighestPrice(e.target.checked)}
            className='rounded transition-all duration-300 ease-in-out'
          />
          Show Highest Price
        </label>
        <button
          onClick={onRefresh}
          className='hidden sm:inline-flex px-3 py-2 rounded-2xl bg-black dark:bg-white dark:text-black text-white shadow hover:opacity-90 text-sm transition-all duration-300 ease-in-out hover:scale-105'
          title='Refresh now'
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="spin">🔄</span>
              Updating...
            </span>
          ) : (
            'Refresh'
          )}
        </button>
      </div>
    </div>
  );
}
