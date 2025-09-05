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
export const STATSCARD_REFRESH_INTERVAL = 120; // 2 minutes for statscard prices (same as table interval)

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

// ===== TGE-SPECIFIC CONSTANTS =====

// Kiểu dữ liệu một dòng TGE
export function newTgeRow(partial = {}) {
  return {
    name: '', // Token name (từ API: name)
    launchAt: '', // Thời gian listing (user nhập Date + Time)
    apiId: '', // API ID (user nhập - REQUIRED)
    point: '', // Point (user nhập - optional)
    type: 'TGE', // Type: TGE hoặc Pre-TGE
    price: 0, // Giá hiện tại (từ API: current_price)
    ath: 0, // ATH (từ API: ath)
    logo: '', // Logo URL (từ API: image)
    symbol: '', // Ký hiệu token (từ API: symbol)
    _forceTop: false, // temporary pin to top until saved
    ...partial,
  };
}

// TGE Table Headers
export const TGE_TABLE_HEADERS = [
  'Token', // Hiển thị Symbol/Name
  'Subscription time', // Thời gian subscription
  'API ID', // API ID (ẩn trong table)
  'Point', // Điểm
  'Type', // Loại: TGE hoặc Pre-TGE
  'Token Price', // Giá token
  'ATH', // All-time high
  '', // Actions column
];

// TGE CSV Headers
export const TGE_CSV_HEADERS = [
  'Token',
  'Subscription time',
  'API ID',
  'Point',
  'Type',
  'Token Price',
  'ATH',
  'Logo',
  'Symbol',
];
