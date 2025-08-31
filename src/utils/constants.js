// Kiểu dữ liệu một dòng
export function newRow(partial = {}) {
  return {
    name: '', // Token name (từ API: name)
    amount: 0, // Amount (user nhập sau)
    launchAt: '', // Listing time (user nhập Date + Time)
    apiId: '', // API ID (user nhập - required)
    pointPriority: '', // Point (Priority) (user nhập - optional)
    pointFCFS: '', // Point (FCFS) (user nhập - optional)
    price: 0, // Current price (từ API: current_price)
    reward: 0, // Reward (tính = Amount × Price)
    highestPrice: 0, // Highest price reached (tự tracking)
    ath: 0, // ATH (từ API: ath) ⭐ (thêm mới)
    logo: '', // Token logo URL (từ API: image) ⭐ (thêm mới)
    symbol: '', // Token symbol (từ API: symbol)
    _forceTop: false, // temporary pin to top until saved
    ...partial,
  };
}

// Auto refresh configuration
export const AUTO_REFRESH_INTERVAL = 120; // 2 minutes for table data
export const STATSCARD_REFRESH_INTERVAL = 300; // 5 minutes for statscard prices

export const TABLE_HEADERS = [
  'Token', // Will be displayed as "Symbol" in TableHeader
  'Amount',
  'Listing time',
  'API ID',
  'Point (Priority)',
  'Point (FCFS)',
  'Token Price',
  'Reward',
  'ATH', // ⭐ (thay thế Highest Price)
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
  'ATH', // ⭐ (thay thế Highest Price)
  'Logo',
  'Symbol',
];
