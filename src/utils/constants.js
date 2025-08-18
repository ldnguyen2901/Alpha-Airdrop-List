// Kiểu dữ liệu một dòng
export function newRow(partial = {}) {
  return {
    name: '', // Token name
    amount: 0, // Amount
    launchAt: '', // Listing time
    apiId: '', // API ID (CoinGecko id)
    pointPriority: '', // Point (Priority)
    pointFCFS: '', // Point (FCFS)
    price: 0, // Current price
    value: 0, // Value = Amount x Price
    highestPrice: 0, // Highest price reached
    _forceTop: false, // temporary pin to top until saved
    ...partial,
  };
}

export const TABLE_HEADERS = [
  'Token',
  'Amount',
  'Listing time',
  'API ID',
  'Point (Priority)',
  'Point (FCFS)',
  'Token Price',
  'Reward',
  'Highest Price',
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
];
