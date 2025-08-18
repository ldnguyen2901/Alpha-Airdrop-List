# Airdrop Alpha Binance/Gate

Ứng dụng theo dõi giá tiền điện tử sử dụng CoinGecko API với giao diện React hiện đại, được thiết kế đặc biệt cho việc quản lý airdrop alpha.

## Tính năng

- 📊 **Theo dõi giá thời gian thực**: Tự động cập nhật giá từ CoinGecko API
- 🔄 **Tự động refresh**: Tùy chỉnh chu kỳ làm mới (tối thiểu 5 giây)
- 📋 **Quản lý portfolio**: Thêm, sửa, xóa các token
- 💰 **Tính toán giá trị**: Tự động tính tổng giá trị portfolio
- 📥 **Import dữ liệu**: Dán dữ liệu từ Google Sheet (CSV/TSV) hoặc upload file Excel
- 📤 **Export CSV**: Xuất dữ liệu ra file CSV
- 🌍 **Đa tiền tệ**: Hỗ trợ USD, EUR, VND, BTC, ETH
- 🔄 **Tự động lưu**: Dữ liệu được lưu tự động và khôi phục khi tải lại trang
- 📊 **Sort dữ liệu**: Click vào header để sort theo cột
- 🌐 **Multi-device**: Chạy trên nhiều thiết bị cùng mạng WiFi
- 🌙 **Dark/Light Mode**: Hỗ trợ theme tối/sáng/hệ thống
- 📱 **Responsive**: Tối ưu cho desktop, tablet và mobile
- 🚫 **Kiểm tra trùng lặp**: Tự động phát hiện và xử lý dữ liệu trùng lặp khi import

## Cấu trúc dữ liệu

Ứng dụng sử dụng 8 cột tương ứng với Google Sheet:

| Cột | Tên              | Mô tả                                |
| --- | ---------------- | ------------------------------------ |
| A   | Token            | Tên hiển thị của token               |
| B   | Amount           | Số lượng token sở hữu                |
| C   | Listing time     | Ngày ra mắt token (DD/MM/YYYY HH:mm:ss) |
| D   | API ID           | ID CoinGecko (quan trọng để lấy giá) |
| E   | Point (Priority) | Điểm ưu tiên                         |
| F   | Point (FCFS)     | Điểm FCFS                            |
| G   | Token Price      | Giá token (tự động từ API)           |
| H   | Reward           | B × G (tự động tính)                 |
| I   | Highest Price    | Giá cao nhất đã đạt được             |

## Cài đặt

1. **Cài đặt dependencies:**

```bash
npm install
```

2. **Chạy ứng dụng:**

```bash
npm run dev
```

3. **Mở trình duyệt:**
   Truy cập http://localhost:3000

## Sử dụng

### Thêm token mới

1. Click "Thêm dòng"
2. Nhập tên token (cột A)
3. Nhập số lượng token (cột B)
4. **Quan trọng**: Nhập API ID chính xác (cột D)
   - Ví dụ: `bitcoin`, `ethereum`, `binancecoin`
   - Xem danh sách API ID tại: https://api.coingecko.com/api/v3/coins/list

### Import từ Google Sheet

1. Copy dữ liệu từ Google Sheet
2. Click "Dán từ Sheet"
3. Paste dữ liệu vào hộp thoại
4. Click "Thêm vào bảng"

### Import từ file Excel

1. Click "📊 Import Excel"
2. Kéo thả file Excel hoặc click để chọn file
3. Hỗ trợ định dạng: .xlsx, .xls, .csv
4. File Excel cần có cấu trúc cột A-F: Token, Amount, Date Claim, Full Name, Point (Priority), Point (FCFS)
5. Dữ liệu sẽ được lưu tự động và khôi phục khi tải lại trang

### Export dữ liệu

1. Click "Export CSV"
2. File sẽ được tải về tự động

### Tùy chỉnh

- **Đơn vị tiền tệ**: Chọn từ dropdown ở header
- **Chu kỳ làm mới**: Nhập số giây (tối thiểu 5s)
- **Cập nhật thủ công**: Click "Cập nhật"

## Cấu trúc dự án

```
src/
├── components/          # React components
│   ├── Header.jsx      # Header với controls
│   ├── StatsCards.jsx  # Thống kê tổng quan
│   ├── ActionButtons.jsx # Các nút hành động
│   ├── CryptoTable.jsx # Bảng dữ liệu chính
│   ├── Card.jsx        # Component card
│   └── PasteButton.jsx # Modal dán dữ liệu
├── services/           # API services
│   └── api.js         # CoinGecko API calls
├── utils/             # Utilities
│   ├── constants.js   # Constants và helpers
│   └── helpers.js     # Helper functions
├── App.jsx            # Component chính
├── main.jsx           # Entry point
└── index.css          # Styles
```

## API Reference

Ứng dụng sử dụng CoinGecko Simple Price API:

```
GET https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies={currency}
```

## Lưu ý

- API ID phải chính xác để lấy được giá
- Chu kỳ làm mới tối thiểu 5 giây để tránh rate limit
- Dữ liệu được lưu trong memory, refresh trang sẽ mất dữ liệu

## Công nghệ sử dụng

- **React 18** - UI Framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **CoinGecko API** - Dữ liệu giá crypto
