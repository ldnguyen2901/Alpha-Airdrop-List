import ThemeToggle from './ThemeToggle';

export default function Header({ loading, onRefresh, syncing, isPageVisible }) {
  return (
    <header className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-4'>
      <div className='flex items-center justify-between w-full sm:w-auto'>
        <div className='flex items-center gap-2'>
          <h1 className='text-xl sm:text-3xl font-bold dark:text-white transition-all duration-300 ease-in-out'>
            Binance Alpha Airdrop
          </h1>
          {/* Status Synced - Integrated status indicator */}
          {(syncing || !isPageVisible) && (
            <div className='flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'>
              {syncing && (
                <>
                  <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse'></div>
                  <span className='text-blue-600 dark:text-blue-400'>Syncing</span>
                </>
              )}
              {!isPageVisible && (
                <>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                  <span className='text-green-600 dark:text-green-400'>Background</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className='sm:hidden'>
          <ThemeToggle />
        </div>
      </div>
      <div className='hidden sm:block'>
        <ThemeToggle />
      </div>
    </header>
  );
}
