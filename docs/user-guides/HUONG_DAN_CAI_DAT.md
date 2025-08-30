# Hướng dẫn cài đặt và chạy dự án

## Bước 1: Cài đặt Node.js

1. **Tải Node.js:**

   - Truy cập: https://nodejs.org/
   - Tải phiên bản LTS (Long Term Support) - khuyến nghị
   - Hoặc tải phiên bản Current nếu muốn dùng phiên bản mới nhất

2. **Cài đặt Node.js:**

   - Chạy file .msi đã tải về
   - Chọn "Next" qua các bước
   - Đảm bảo tích chọn "Add to PATH"
   - Hoàn tất cài đặt

3. **Kiểm tra cài đặt:**
   - Mở Command Prompt mới
   - Chạy lệnh: `node --version`
   - Chạy lệnh: `npm --version`
   - Nếu hiển thị version là đã cài đặt thành công

## Bước 2: Chạy dự án

1. **Mở Command Prompt:**

   - Nhấn `Win + R`
   - Gõ `cmd` và Enter
   - Di chuyển đến thư mục dự án: `cd C:\Users\Karama\Desktop\AA`

2. **Cài đặt dependencies:**

   ```bash
   npm install
   ```

   **Lưu ý:** Lần đầu cài đặt có thể mất vài phút để tải về các thư viện cần thiết.

3. **Chạy ứng dụng:**

   ```bash
   npm run dev
   ```

4. **Mở trình duyệt:**
   - Truy cập: http://localhost:3000
   - Ứng dụng sẽ tự động mở
   - **Truy cập từ thiết bị khác**: http://[IP_MÁY_CHỦ]:3000

## Cấu trúc dự án đã tạo

```
AA/
├── src/
│   ├── components/          # React components
│   │   ├── Header.jsx      # Header với controls
│   │   ├── StatsCards.jsx  # Thống kê tổng quan
│   │   ├── ActionButtons.jsx # Các nút hành động
│   │   ├── CryptoTable.jsx # Bảng dữ liệu chính
│   │   ├── Card.jsx        # Component card
│   │   └── PasteButton.jsx # Modal dán dữ liệu
│   ├── services/           # API services
│   │   └── api.js         # CoinGecko API calls
│   ├── utils/             # Utilities
│   │   ├── constants.js   # Constants và helpers
│   │   └── helpers.js     # Helper functions
│   ├── App.jsx            # Component chính
│   ├── main.jsx           # Entry point
│   └── index.css          # Styles
├── package.json           # Dependencies và scripts
├── vite.config.js         # Cấu hình Vite
├── tailwind.config.js     # Cấu hình Tailwind CSS
├── postcss.config.js      # Cấu hình PostCSS
├── index.html             # File HTML chính
├── README.md              # Hướng dẫn sử dụng
└── HUONG_DAN_CAI_DAT.md   # File này
```

## Lệnh hữu ích

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build

## Troubleshooting

### Lỗi "npm không được nhận diện"

- Đảm bảo Node.js đã cài đặt đúng
- Restart Command Prompt
- Kiểm tra PATH environment variable

### Lỗi port 3000 đã được sử dụng

- Thay đổi port trong `vite.config.js`
- Hoặc tắt ứng dụng khác đang chạy trên port 3000

### Lỗi network khi fetch API

- Kiểm tra kết nối internet
- CoinGecko API có thể bị rate limit, thử lại sau

## Liên hệ hỗ trợ

Nếu gặp vấn đề, hãy:

1. Kiểm tra lại các bước cài đặt
2. Đảm bảo Node.js version >= 16
3. Thử restart máy tính
4. Kiểm tra firewall/antivirus
