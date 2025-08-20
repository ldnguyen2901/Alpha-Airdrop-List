import Card from './Card';
import { formatNumber } from '../utils/helpers';

export default function StatsCards({
  rowsCount,
  loading,
  btcPrice,
  ethPrice,
  bnbPrice,
  syncing,
}) {
  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6'>
      <Card>
        <div className='text-xs sm:text-sm text-gray-500'>BTC Price</div>
        <div
          className='text-xl sm:text-2xl font-semibold'
          style={{ color: 'rgb(247, 147, 26)' }}
        >
          {formatNumber(btcPrice)} USD
        </div>
      </Card>
      <Card>
        <div className='text-xs sm:text-sm text-gray-500'>ETH Price</div>
        <div
          className='text-xl sm:text-2xl font-semibold'
          style={{ color: 'rgb(140,140,140)' }}
        >
          {formatNumber(ethPrice)} USD
        </div>
      </Card>
      <Card>
        <div className='text-xs sm:text-sm text-gray-500'>BNB Price</div>
        <div
          className='text-xl sm:text-2xl font-semibold'
          style={{ color: 'rgb(240,185,11)' }}
        >
          {formatNumber(bnbPrice)} USD
        </div>
      </Card>
      <Card>
        <div className='text-xs sm:text-sm text-gray-500'>Status</div>
        <div
          className={`text-2xl font-semibold ${
            syncing ? 'text-blue-500' : 'text-emerald-600'
          }`}
        >
          {syncing ? 'Syncing…' : 'Synced'}
        </div>
      </Card>
      <Card>
        <div className='text-xs sm:text-sm text-gray-500'>Airdrop Alpha Projects</div>
        <div className='text-xl sm:text-2xl font-semibold'>{rowsCount}</div>
      </Card>
    </div>
  );
}
