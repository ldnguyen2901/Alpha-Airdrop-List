import ThemeToggle from './ThemeToggle';

export default function Header({ loading, onRefresh, syncing }) {
  return (
    <header className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-4'>
      <h1 className='text-xl sm:text-3xl font-bold dark:text-white'>
        Binance Alpha Airdrop
      </h1>
      <div className='flex flex-wrap items-center gap-2'>
        {/* Status text moved to StatsCards */}
        <button
          onClick={onRefresh}
          className='px-3 py-2 rounded-2xl bg-black dark:bg-white dark:text-black text-white shadow hover:opacity-90 text-sm w-full sm:w-auto'
          title='Refresh now'
        >
          {loading ? 'Updating...' : 'Refresh'}
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
