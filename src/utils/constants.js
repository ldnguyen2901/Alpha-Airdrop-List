// Kiểu dữ liệu một dòng
export function newRow(partial = {}) {
  return {
    name: '', // Token name (will be normalized by caller/newRow merging)
    amount: 0, // Amount
    launchAt: '', // Listing time
    apiId: '', // API ID (CoinGecko id)
    pointPriority: '', // Point (Priority)
    pointFCFS: '', // Point (FCFS)
    price: 0, // Current price
    reward: 0, // Reward
    value: 0, // Value = Amount x Price
    highestPrice: 0, // Highest price reached (tracked locally)
    ath: 0, // All-Time High price (from CoinGecko)
    contractAddress: '', // Smart contract address
    logo: '', // Token logo URL
    symbol: '', // Token symbol
    _forceTop: false, // temporary pin to top until saved
    ...partial,
  };
}

export const TABLE_HEADERS = [
  'Token', // Will be displayed as "Symbol" in TableHeader
  'Amount',
  'Listing time',
  'API ID',
  'Point (Priority)',
  'Point (FCFS)',
  'Token Price',
  'Reward',
  'Highest Price',
  'ATH',
  'Contract Address',
  '',
];

export const CSV_HEADERS = [
  'Token',
  'Amount',
  'Listing time',
  'API ID',
  'Point (Priority)',
  'Point (FCFS)',
  'Token Price',
  'Reward',
  'Highest Price',
  'ATH',
  'Contract Address',
  'Logo',
  'Symbol',
];
