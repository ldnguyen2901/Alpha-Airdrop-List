# Binance Alpha Airdrop

Ứng dụng theo dõi giá tiền điện tử sử dụng CoinGecko API với giao diện React hiện đại, được thiết kế đặc biệt cho việc quản lý airdrop alpha.

## Tính năng

- 📊 **Theo dõi giá thời gian thực**: Tự động cập nhật giá từ CoinGecko API mỗi 60 giây
- 🔄 **Refresh thủ công**: Nút Refresh với icon xoay khi loading
- 📋 **Quản lý portfolio**: Thêm, sửa, xóa các token với giao diện modal
- 💰 **Tính toán giá trị**: Tự động tính Reward = Amount × Price
- 📥 **Import dữ liệu**: Dán dữ liệu từ Google Sheet (CSV/TSV) hoặc upload file Excel
- 📤 **Export CSV**: Xuất dữ liệu ra file CSV với đầy đủ thông tin
- 🌍 **Đa tiền tệ**: Hỗ trợ USD (hiện tại)
- 🔄 **Tự động lưu**: Dữ liệu được lưu tự động và khôi phục khi tải lại trang
- 📊 **Sort dữ liệu**: Click vào header để sort theo cột với icon chỉ thị
- 🌐 **Multi-device**: Chạy trên nhiều thiết bị cùng mạng WiFi
- 🌙 **Dark/Light Mode**: Hỗ trợ theme tối/sáng với toggle đẹp mắt
- 📱 **Responsive**: Tối ưu cho desktop, tablet và mobile với giao diện card view
- 🚫 **Kiểm tra trùng lặp**: Tự động phát hiện và xử lý dữ liệu trùng lặp khi import
- ⏰ **Countdown timer**: Hiển thị thời gian còn lại đến ngày listing
- 📈 **Highest Price tracking**: Theo dõi giá cao nhất đã đạt được (mặc định bật trên mobile)
- 🔍 **Tìm kiếm**: Tìm kiếm token theo tên
- 🎨 **Token logos**: Hiển thị logo token từ CoinGecko API
- 📄 **Pagination**: Phân trang cho bảng dữ liệu
- 🔥 **Firebase sync**: Đồng bộ dữ liệu đám mây qua Firebase Firestore

## Cấu trúc dữ liệu

Ứng dụng sử dụng 9 cột tương ứng với Google Sheet:

| Cột | Tên              | Mô tả                                   |
| --- | ---------------- | --------------------------------------- |
| A   | Token            | Tên hiển thị của token                  |
| B   | Amount           | Số lượng token sở hữu                   |
| C   | Listing time     | Ngày ra mắt token (DD/MM/YYYY HH:mm) |
| D   | API ID           | ID CoinGecko (quan trọng để lấy giá)    |
| E   | Point (Priority) | Điểm ưu tiên                            |
| F   | Point (FCFS)     | Điểm FCFS                               |
| G   | Token Price      | Giá token (tự động từ API)              |
| H   | Reward           | B × G (tự động tính)                    |
| I   | Highest Price    | Giá cao nhất đã đạt được                |

## Cài đặt

### Local Development

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

### Production Deployment (Vercel)

1. **Deploy lên Vercel:**

```bash
npm install -g vercel
vercel --prod
```

2. **Set Environment Variables trong Vercel Dashboard:**

```
CRON_SECRET=your-secret-key-here
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=airdrop-alpha-b59cf
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

3. **Cron Jobs tự động chạy:**
   - **Price Updates**: Mỗi 5 phút
   - **Contract Fetch**: Mỗi giờ

Xem chi tiết setup tại [VERCEL_SETUP.md](./VERCEL_SETUP.md)

## Sử dụng

### Thêm token mới

1. Click "Add Row" (desktop) hoặc "Add Row" (mobile)
2. Nhập tên token (cột A) - bắt buộc
3. Nhập số lượng token (cột B)
4. Nhập ngày listing (cột C) - bắt buộc, định dạng DD/MM/YYYY hoặc DD/MM/YYYY HH:mm
5. **Quan trọng**: Nhập API ID chính xác (cột D)
   - Ví dụ: `bitcoin`, `ethereum`, `binancecoin`
   - Xem danh sách API ID tại: https://api.coingecko.com/api/v3/coins/list
6. Nhập Point Priority và Point FCFS (tùy chọn)

### Import từ Google Sheet

1. Copy dữ liệu từ Google Sheet (chỉ cột A-F)
2. Click "Dán từ Sheet"
3. Paste dữ liệu vào hộp thoại
4. Click "Thêm vào bảng"

### Import từ file Excel

1. Click "Import Excel"
2. Kéo thả file Excel hoặc click để chọn file
3. Hỗ trợ định dạng: .xlsx, .xls, .csv
4. File Excel cần có cấu trúc cột A-F: Token, Amount, Date Claim, Full Name, Point (Priority), Point (FCFS)
5. Dữ liệu sẽ được lưu tự động và khôi phục khi tải lại trang

### Export dữ liệu

1. Click "Export CSV"
2. File sẽ được tải về tự động với tên `crypto-tracker-{timestamp}.csv`

### Tùy chỉnh

- **Show Highest Price**: Toggle để hiển thị/ẩn cột Highest Price (mặc định bật trên mobile)
- **Refresh**: Click nút Refresh để cập nhật giá thủ công
- **Search**: Tìm kiếm token theo tên
- **Sort**: Click vào header cột để sắp xếp dữ liệu

## Responsive Design

### Desktop (≥ 768px)
- Giao diện bảng với sticky columns
- Show Highest Price mặc định tắt
- Modal form cho thêm token
- Nút Refresh hiển thị ở ActionButtons

### Mobile (< 768px)
- Giao diện card view với pagination
- Show Highest Price mặc định bật
- Inline form cho thêm token
- Nút Refresh hiển thị ở header

## Cấu trúc dự án

```
src/
├── components/          # React components
│   ├── Header.jsx      # Header với controls
│   ├── StatsCards.jsx  # Thống kê tổng quan (BTC, ETH, BNB prices)
│   ├── ActionButtons.jsx # Các nút hành động
│   ├── SortableTable.jsx # Bảng dữ liệu chính với sorting
│   ├── CardView.jsx    # Giao diện card cho mobile
│   ├── Card.jsx        # Component card
│   ├── PasteButton.jsx # Modal dán dữ liệu
│   ├── ExcelUpload.jsx # Component upload Excel
│   ├── ThemeToggle.jsx # Toggle dark/light mode
│   ├── Pagination.jsx  # Component phân trang
│   ├── modals/         # Modal components
│   │   ├── AddRowModal.jsx
│   │   ├── EditModal.jsx
│   │   └── DeleteModal.jsx
│   ├── table/          # Table components
│   │   ├── TableHeader.jsx
│   │   └── TableRow.jsx
│   └── SortIcons.jsx   # Icons cho sorting
├── services/           # API services
│   ├── api.js         # CoinGecko API calls
│   └── firebase.js    # Firebase integration
├── utils/             # Utilities
│   ├── constants.js   # Constants và helpers
│   ├── helpers.js     # Helper functions
│   ├── storage.js     # Local storage utilities
│   ├── excel.js       # Excel processing
│   └── dateTimeUtils.js # Date/time utilities
├── hooks/             # Custom hooks
│   ├── useTableSort.js
│   └── useTableEditing.js
├── contexts/          # React contexts
│   └── ThemeContext.jsx
├── App.jsx            # Component chính
├── main.jsx           # Entry point
└── index.css          # Styles
```

## API Reference

Ứng dụng sử dụng CoinGecko API:

### Simple Price API
```
GET https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies={currency}
```

### Coins Markets API (cho logos)
```
GET https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids={ids}
```

## Firebase (Cloud sync)

Ứng dụng hỗ trợ đồng bộ dữ liệu qua Firebase Firestore. Để bật tính năng này:

1. Tạo một project trên Firebase Console và bật Firestore (in test mode hoặc cấu hình rules phù hợp).
2. Trong phần Project settings lấy các biến cấu hình (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
3. Tạo file `.env.local` (hoặc `.env`) ở gốc dự án và thêm các biến bắt đầu bằng `VITE_`:

```
VITE_FIREBASE_API_KEY=AIzA...your_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

4. Khởi động lại dev server nếu đang chạy (`npm run dev`). Ứng dụng sẽ tự động đăng nhập ẩn danh và đồng bộ dữ liệu qua workspace `shared-workspace` cho tất cả user.

**Ghi chú bảo mật**: 
- Không commit file `.env.local` chứa khóa vào git; giữ các khóa an toàn.
- Tất cả user sẽ chia sẻ cùng một workspace `shared-workspace` trên Firebase.
- Dữ liệu được đồng bộ real-time giữa tất cả user.

## Lưu ý

- API ID phải chính xác để lấy được giá và logo
- Chu kỳ làm mới tự động mỗi 60 giây
- Dữ liệu được lưu trong localStorage và Firebase (nếu cấu hình)
- Token logos được cache trong 5 phút để tối ưu performance
- Responsive breakpoint: 768px (md)

## Công nghệ sử dụng

- **React 18** - UI Framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Material-UI Icons** - Icon library
- **CoinGecko API** - Dữ liệu giá crypto
- **Firebase Firestore** - Cloud database
- **XLSX** - Excel file processing
- **React Toastify** - Notifications

## Tác giả

© 2025 ~ **Nguyenwolf**
