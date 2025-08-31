# 🚀 Alpha Airdrop Tracker

Ứng dụng theo dõi giá tiền điện tử sử dụng CoinGecko API, được thiết kế đặc biệt cho việc quản lý airdrop alpha.

## ✨ Tính năng chính

- 📊 **Real-time price tracking**: Theo dõi giá BTC, ETH, BNB và các token khác
- 🔄 **Auto refresh**: Tự động cập nhật giá mỗi 15 phút
- 📱 **Responsive design**: Hoạt động tốt trên mobile và desktop
- 🎨 **Dark/Light theme**: Chế độ tối/sáng
- 📋 **Data management**: Thêm, sửa, xóa, import/export dữ liệu
- 🔍 **Search & filter**: Tìm kiếm và lọc token
- 📈 **Price tracking**: Theo dõi giá cao nhất và ATH
- ⚡ **Neon sync**: Đồng bộ dữ liệu đám mây qua Neon PostgreSQL
- 🔔 **Notifications**: Hệ thống thông báo thông minh
- 📊 **Statistics**: Thống kê chi tiết về portfolio

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + Material-UI
- **Database**: Neon PostgreSQL (serverless)
- **API**: CoinGecko API
- **State Management**: React Hooks
- **Build Tool**: Vite

## 🚀 Cài đặt

### Yêu cầu hệ thống
- Node.js 16+ 
- npm hoặc yarn

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd Alpha-Airdrop-List
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình environment
Tạo file `.env` trong thư mục gốc:

```env
# Neon Database Configuration
VITE_NEON_DATABASE_URL=postgresql://username:password@host/database

# Optional: Custom API endpoints
VITE_COINGECKO_API_URL=https://api.coingecko.com/api/v3
```

### Bước 4: Chạy ứng dụng
```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:5173`

## 📊 Cấu trúc dữ liệu

### Token Data Structure
```javascript
{
  name: '',           // Tên token
  amount: 0,          // Số lượng
  launchAt: '',       // Thời gian listing
  apiId: '',          // CoinGecko API ID
  pointPriority: '',  // Điểm ưu tiên
  pointFCFS: '',      // Điểm FCFS
  price: 0,           // Giá hiện tại
  reward: 0,          // Phần thưởng (Amount × Price)
  ath: 0,             // All-time high
  logo: '',           // Logo URL
  symbol: ''          // Ký hiệu token
}
```

## 🔧 Tính năng chi tiết

### 1. Price Tracking
- Tự động fetch giá từ CoinGecko API
- Cache thông minh để giảm API calls
- Theo dõi ATH và giá cao nhất
- Real-time updates

### 2. Data Management
- **Thêm token**: Nhập thông tin token mới
- **Import CSV/Excel**: Import dữ liệu từ file
- **Export data**: Xuất dữ liệu ra CSV
- **Duplicate detection**: Phát hiện token trùng lặp
- **Bulk operations**: Thao tác hàng loạt

### 3. Neon Database Integration
- **Cloud sync**: Đồng bộ dữ liệu đám mây
- **Real-time updates**: Cập nhật real-time
- **Data persistence**: Lưu trữ bền vững
- **Multi-device sync**: Đồng bộ đa thiết bị

### 4. User Experience
- **Responsive design**: Tương thích mọi thiết bị
- **Dark/Light theme**: Chế độ tối/sáng
- **Keyboard shortcuts**: Phím tắt
- **Loading states**: Trạng thái loading
- **Error handling**: Xử lý lỗi thông minh

## 📱 Responsive Design

Ứng dụng được thiết kế responsive với:
- **Mobile**: Tối ưu cho màn hình nhỏ
- **Tablet**: Layout trung bình
- **Desktop**: Layout đầy đủ tính năng

## 🎨 Theme System

- **Light theme**: Giao diện sáng
- **Dark theme**: Giao diện tối
- **Auto-detect**: Tự động theo hệ thống
- **Manual toggle**: Chuyển đổi thủ công

## 🔔 Notification System

- **Success notifications**: Thông báo thành công
- **Error notifications**: Thông báo lỗi
- **Warning notifications**: Cảnh báo
- **Info notifications**: Thông tin

## 📊 Performance Optimization

- **Lazy loading**: Tải component theo nhu cầu
- **Memoization**: Cache kết quả tính toán
- **Debouncing**: Giảm số lần gọi API
- **Virtual scrolling**: Tối ưu hiển thị danh sách lớn

## 🔒 Security

- **Environment variables**: Bảo vệ thông tin nhạy cảm
- **Input validation**: Kiểm tra dữ liệu đầu vào
- **XSS protection**: Bảo vệ khỏi XSS
- **CSRF protection**: Bảo vệ khỏi CSRF

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📦 Build & Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🌐 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically

### Netlify
1. Connect repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Manual Deployment
1. Build project: `npm run build`
2. Upload `dist` folder to web server
3. Configure environment variables

## 📈 Monitoring & Analytics

- **Error tracking**: Theo dõi lỗi
- **Performance monitoring**: Giám sát hiệu suất
- **User analytics**: Phân tích người dùng
- **API usage**: Theo dõi sử dụng API

## 🔧 Troubleshooting

### Common Issues

1. **API Rate Limiting**
   - Giảm tần suất fetch
   - Sử dụng cache
   - Implement retry logic

2. **Database Connection Issues**
   - Kiểm tra connection string
   - Verify database credentials
   - Check network connectivity

3. **Build Errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Clear cache: `npm run clean`
   - Check Node.js version

### Performance Issues

1. **Slow Loading**
   - Enable lazy loading
   - Optimize images
   - Use CDN

2. **High Memory Usage**
   - Implement virtual scrolling
   - Optimize re-renders
   - Use memoization

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [CoinGecko](https://coingecko.com) - Crypto price data
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [React](https://reactjs.org) - UI framework
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [Material-UI](https://mui.com) - React components

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: your-email@example.com

---

**Made with ❤️ for the crypto community**
