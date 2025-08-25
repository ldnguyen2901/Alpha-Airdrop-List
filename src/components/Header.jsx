import ThemeToggle from './ThemeToggle';

export default function Header({ loading, onRefresh, syncing, isPageVisible }) {
  return (
    <header className='flex items-center justify-between mb-4 sm:mb-6 gap-4'>
      {/* Left side - Title */}
      <div className='flex items-center flex-1 min-w-0'>
        <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold dark:text-white transition-all duration-300 ease-in-out truncate'>
          Binance Alpha Airdrop
        </h1>
      </div>
      
      {/* Right side - Theme Toggle */}
      <div className='flex-shrink-0'>
        <ThemeToggle />
      </div>
    </header>
  );
}
