import ThemeToggle from './ThemeToggle';

export default function Header({ loading, onRefresh, syncing }) {
  return (
    <header className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-4'>
      <h1 className='text-xl sm:text-3xl font-bold dark:text-white transition-all duration-300 ease-in-out'>
        Binance Alpha Airdrop
      </h1>
      <div className='flex flex-wrap items-center gap-2'>
        {/* Status text moved to StatsCards */}
        {/* Mobile-only Refresh; desktop version is in ActionButtons next to checkbox */}
        <button
          onClick={onRefresh}
          className='inline-flex sm:hidden px-3 py-2 rounded-2xl bg-black dark:bg-white dark:text-black text-white shadow hover:opacity-90 text-sm w-full transition-all duration-300 ease-in-out hover:scale-105'
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
        <ThemeToggle />
      </div>
    </header>
  );
}
