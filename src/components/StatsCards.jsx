import Card from './Card';
import { formatNumber } from '../utils/helpers';
import AutorenewIcon from '@mui/icons-material/Autorenew';

export default function StatsCards({
  rowsCount,
  loading,
  btcPrice,
  ethPrice,
  bnbPrice,
  syncing,
  lastUpdated,
  tokenLogos = {},
}) {
  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6'>
      <Card className="card-hover">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300 flex items-center gap-2'>
          {tokenLogos.bitcoin?.logo ? (
            <img 
              src={tokenLogos.bitcoin.logo} 
              alt="BTC" 
              className="w-4 h-4 rounded-full"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold" style={{ display: 'flex' }}>
              ₿
            </div>
          )}
          BTC Price
        </div>
        <div
          className='text-xl sm:text-2xl font-semibold transition-all duration-300 ease-in-out'
          style={{ color: 'rgb(247, 147, 26)' }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span>{formatNumber(btcPrice)} <span className="text-xs" style={{ color: 'rgb(247, 147, 26)' }}>USD</span></span>
              <AutorenewIcon className="animate-spin" sx={{ fontSize: 16 }} />
            </span>
          ) : (
            <span>{formatNumber(btcPrice)} <span className="text-xs" style={{ color: 'rgb(247, 147, 26)' }}>USD</span></span>
          )}
        </div>
      </Card>
      <Card className="card-hover">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300 flex items-center gap-2'>
          {tokenLogos.ethereum?.logo ? (
            <img 
              src={tokenLogos.ethereum.logo} 
              alt="ETH" 
              className="w-4 h-4 rounded-full"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold" style={{ display: 'flex' }}>
              Ξ
            </div>
          )}
          ETH Price
        </div>
        <div
          className='text-xl sm:text-2xl font-semibold transition-all duration-300 ease-in-out'
          style={{ color: 'rgb(140,140,140)' }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span>{formatNumber(ethPrice)} <span className="text-xs" style={{ color: 'rgb(140,140,140)' }}>USD</span></span>
              <AutorenewIcon className="animate-spin" sx={{ fontSize: 16 }} />
            </span>
          ) : (
            <span>{formatNumber(ethPrice)} <span className="text-xs" style={{ color: 'rgb(140,140,140)' }}>USD</span></span>
          )}
        </div>
      </Card>
      <Card className="card-hover">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300 flex items-center gap-2'>
          {tokenLogos.binancecoin?.logo ? (
            <img 
              src={tokenLogos.binancecoin.logo} 
              alt="BNB" 
              className="w-4 h-4 rounded-full"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold" style={{ display: 'flex' }}>
              B
            </div>
          )}
          BNB Price
        </div>
        <div
          className='text-xl sm:text-2xl font-semibold transition-all duration-300 ease-in-out'
          style={{ color: 'rgb(240,185,11)' }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span>{formatNumber(bnbPrice)} <span className="text-xs" style={{ color: 'rgb(240,185,11)' }}>USD</span></span>
              <AutorenewIcon className="animate-spin" sx={{ fontSize: 16 }} />
            </span>
          ) : (
            <span>{formatNumber(bnbPrice)} <span className="text-xs" style={{ color: 'rgb(240,185,11)' }}>USD</span></span>
          )}
        </div>
      </Card>
      <Card className="card-hover">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300'>Status</div>
        <div
          className={`text-2xl font-semibold transition-all duration-300 ease-in-out ${
            syncing ? 'text-blue-500' : 'text-emerald-600'
          }`}
        >
          {syncing ? (
            <span className="flex items-center gap-2">
              <AutorenewIcon className="animate-spin" sx={{ fontSize: 16 }} />
              Syncing…
            </span>
          ) : (
            'Synced'
          )}
        </div>
      </Card>
      <Card className="card-hover">
        <div className='text-xs sm:text-sm text-gray-500 transition-colors duration-300'>Airdrop Alpha Projects</div>
        <div className='text-xl sm:text-2xl font-semibold transition-all duration-300 ease-in-out'>{rowsCount}</div>
        <div className='mt-1 text-[11px] text-gray-500 transition-colors duration-300'>
          {loading ? (
            <span className="flex items-center gap-2">
              <AutorenewIcon className="animate-spin" sx={{ fontSize: 16 }} />
              Updating…
            </span>
          ) : lastUpdated ? (
            `Updated: ${new Date(lastUpdated).toLocaleTimeString()}`
          ) : (
            'Ready'
          )}
        </div>
      </Card>
    </div>
  );
}
