import { ThemeToggle, RouteToggle } from './index';

export default function Header({ loading, onRefresh, syncing, isPageVisible, title = "Binance Alpha Airdrop", mobileTitle = "Airdrop" }) {
  return (
    <header className='flex items-center justify-between mb-4 sm:mb-6 gap-4'>
      {/* Left side - Title */}
      <div className='flex items-center flex-1 min-w-0'>
        <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold dark:text-white transition-all duration-300 ease-in-out truncate'>
          <span className='sm:hidden'>{mobileTitle}</span>
          <span className='hidden sm:inline'>{title}</span>
        </h1>
      </div>
      
      {/* Right side - Route Toggle and Theme Toggle */}
      <div className='flex items-center gap-2 flex-shrink-0'>
        <RouteToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
