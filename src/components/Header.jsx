import ThemeToggle from './ThemeToggle';

export default function Header({ loading, onRefresh, syncing }) {
  return (
    <header className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-4'>
      <div className='flex items-center justify-between w-full sm:w-auto'>
        <h1 className='text-xl sm:text-3xl font-bold dark:text-white transition-all duration-300 ease-in-out'>
          Binance Alpha Airdrop
        </h1>
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
