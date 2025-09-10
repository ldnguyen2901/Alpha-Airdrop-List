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
    atl: 0, // ATL (từ API: atl) ⭐ (thêm mới)
    logo: '', // Token logo URL (từ API: image) ⭐ (thêm mới)
    symbol: '', // Token symbol (từ API: symbol)
    contract: '', // Contract address (từ API: platforms) ⭐ (thêm mới)
    exchanges: [], // Danh sách sàn giao dịch (từ API: tickers) ⭐ (thêm mới)
    chains: [], // Danh sách chuỗi blockchain (từ API: platforms) ⭐ (thêm mới)
    categories: [], // Danh sách danh mục (từ API: categories) ⭐ (thêm mới)
    _forceTop: false, // temporary pin to top until saved
    ...partial,
  };
}

// Auto refresh configuration
export const AUTO_REFRESH_INTERVAL = 40; // 40 seconds for table data

export const TABLE_HEADERS = [
  'Token', // Will be displayed as "Symbol" in TableHeader
  'Amount',
  'Listing time',
  'API ID',
  'Point', // Gộp Priority và FCFS
  'Token Price',
  'Reward',
  'AT(L-H)', // Gộp ATH và ATL
  'Contract', // ⭐ (thêm mới)
  'Exchanges', // ⭐ (thêm mới)
  'Chains', // ⭐ (thêm mới)
  'Categories', // ⭐ (thêm mới)
  'Actions', // ⭐ (thêm mới)
];

export const CSV_HEADERS = [
  'Token',
  'Amount',
  'Listing time',
  'API ID',
  'Point (Priority)',
  'Point (FCFS)',
  'ATH', // ⭐ (thay thế Highest Price)
  'ATL', // ⭐ (thêm mới)
  'Contract', // ⭐ (thêm mới)
  'Logo',
  'Symbol',
  'Exchanges', // ⭐ (thêm mới)
  'Chains', // ⭐ (thêm mới)
  'Categories', // ⭐ (thêm mới)
];

// ===== TGE-SPECIFIC CONSTANTS =====

// Kiểu dữ liệu một dòng TGE
export function newTgeRow(partial = {}) {
  return {
    name: '', // Token name (từ API: name)
    launchAt: '', // Thời gian listing (user nhập Date + Time)
    apiId: '', // API ID (user nhập - REQUIRED)
    point: '', // Point (user nhập - optional)
    type: 'TGE', // Type: TGE, Pre-TGE, hoặc BC-TGE
    price: 0, // Giá hiện tại (từ API: current_price)
    ath: 0, // ATH (từ API: ath)
    atl: 0, // ATL (từ API: atl) ⭐ (thêm mới)
    logo: '', // Logo URL (từ API: image)
    symbol: '', // Ký hiệu token (từ API: symbol)
    contract: '', // Contract address (từ API: platforms) ⭐ (thêm mới)
    exchanges: [], // Danh sách sàn giao dịch (từ API: tickers) ⭐ (thêm mới)
    chains: [], // Danh sách chuỗi blockchain (từ API: platforms) ⭐ (thêm mới)
    categories: [], // Danh sách danh mục (từ API: categories) ⭐ (thêm mới)
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
  'AT(L-H)', // Gộp ATH và ATL giống Airdrop
  'Contract', // Contract address ⭐ (thêm mới)
  'Exchanges', // ⭐ (thêm mới)
  'Chains', // ⭐ (thêm mới)
  'Categories', // ⭐ (thêm mới)
  'Actions', // ⭐ (thêm mới)
];

// TGE CSV Headers
export const TGE_CSV_HEADERS = [
  'Token',
  'Subscription time',
  'API ID',
  'Point',
  'Type',
  'ATH',
  'ATL', // ⭐ (thêm mới)
  'Contract', // ⭐ (thêm mới)
  'Logo',
  'Symbol',
  'Exchanges', // ⭐ (thêm mới)
  'Chains', // ⭐ (thêm mới)
  'Categories', // ⭐ (thêm mới)
];
