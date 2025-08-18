import PasteButton from './PasteButton';

export default function ActionButtons({
  onAddRow,
  onPasteText,
  onExportCSV,
  onClearAll,
  onImportExcel,
  showApiId,
  setShowApiId,
  showHighestPrice,
  setShowHighestPrice,
  searchToken,
  setSearchToken,
}) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 md:gap-3 lg:gap-4 mb-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <button
          onClick={onAddRow}
          className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white'
        >
          ➕ Add Row
        </button>
        <PasteButton onPasteText={onPasteText} />
        <button
          onClick={onImportExcel}
          className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white'
        >
          📊 Import Excel
        </button>
        <button
          onClick={onExportCSV}
          className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white'
        >
          ⬇️ Export CSV
        </button>
        <button
          onClick={onClearAll}
          className='px-3 py-2 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white'
        >
          🗑️ Clear All
        </button>
        <input
          type='text'
          value={searchToken}
          onChange={(e) => setSearchToken(e.target.value)}
          className='ml-2 w-40 md:w-52 lg:w-64 border rounded-2xl px-3 py-2 bg-white dark:bg-gray-800 text-sm dark:text-white'
          placeholder='Search token name...'
          title='Search token name'
        />
      </div>
      <div className='flex items-center gap-4'>
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={showApiId}
            onChange={(e) => setShowApiId(e.target.checked)}
            className='rounded'
          />
          Show API ID
        </label>
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={showHighestPrice}
            onChange={(e) => setShowHighestPrice(e.target.checked)}
            className='rounded'
          />
          Show Highest Price
        </label>
      </div>
    </div>
  );
}
