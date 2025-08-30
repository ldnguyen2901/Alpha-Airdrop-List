# Thuật toán theo dõi giá cao nhất tối ưu hóa

## Tổng quan

Thuật toán theo dõi giá cao nhất đã được tối ưu hóa để cung cấp khả năng theo dõi giá chính xác và thông minh hơn, bao gồm:

- **Theo dõi giá cao nhất tự động**
- **Phân tích xu hướng giá**
- **Phát hiện biến động giá**
- **Lưu trữ lịch sử giá**
- **Cảnh báo khi có thay đổi lớn**

## Các tính năng chính

### 1. Theo dõi giá cao nhất thông minh
- Tự động cập nhật giá cao nhất khi có giá mới cao hơn
- Lưu trữ giá cao nhất vào localStorage để không bị mất khi refresh
- So sánh với giá hiện tại để tính phần trăm thay đổi

### 2. Phân tích xu hướng giá
- **Bullish**: Giá tăng > 3% trong 3 lần cập nhật gần nhất
- **Bearish**: Giá giảm > 3% trong 3 lần cập nhật gần nhất  
- **Neutral**: Giá ổn định trong khoảng ±3%

### 3. Phát hiện biến động giá
- **Thay đổi đáng kể**: ≥ 5% thay đổi
- **Biến động cực đoan**: ≥ 10% thay đổi
- **Cảnh báo cao**: ≥ 20% thay đổi

### 4. Thống kê giá chi tiết
- Giá thấp nhất, cao nhất, trung bình
- Độ biến động (volatility)
- Số điểm dữ liệu đã thu thập

### 5. Lưu trữ lịch sử
- Lưu trữ 24 điểm dữ liệu gần nhất cho mỗi token
- Tự động xóa dữ liệu cũ khi vượt quá giới hạn
- Lưu trữ vào localStorage để bảo toàn dữ liệu

## Cấu hình

```javascript
const config = {
  significantChangeThreshold: 5, // 5% change threshold
  historyLength: 24, // Keep last 24 price points
  alertThreshold: 10, // 10% change for alerts
  volatilityThreshold: 3, // 3% for volatility detection
};
```

## Cách sử dụng

### 1. Hook usePriceTracking
```javascript
import { usePriceTracking } from '../hooks/usePriceTracking';

const { trackPriceChange, getPriceStats, analyzeTrend } = usePriceTracking();

// Theo dõi thay đổi giá
const result = trackPriceChange(apiId, currentPrice, previousPrice, highestPrice);
```

### 2. Component PriceTrackingInfo
```javascript
import PriceTrackingInfo from '../components/PriceTrackingInfo';

<PriceTrackingInfo 
  apiId={row.apiId}
  currentPrice={row.price}
  highestPrice={row.highestPrice}
  showDetails={true}
/>
```

### 3. Lưu trữ dữ liệu
```javascript
import { savePriceHistory, loadPriceHistory } from '../utils/storage';

// Lưu lịch sử giá
savePriceHistory(apiId, priceHistory);

// Tải lịch sử giá
const history = loadPriceHistory(apiId);
```

## Cải tiến so với thuật toán cũ

### Trước đây:
- Chỉ cập nhật `highestPrice` khi giá hiện tại > giá cao nhất
- Không lưu trữ lịch sử giá
- Không phân tích xu hướng
- Không có cảnh báo biến động

### Hiện tại:
- ✅ Theo dõi giá cao nhất thông minh với localStorage
- ✅ Phân tích xu hướng giá (bullish/bearish/neutral)
- ✅ Phát hiện biến động giá với ngưỡng có thể cấu hình
- ✅ Thống kê giá chi tiết (min/max/avg/volatility)
- ✅ Lưu trữ lịch sử 24 điểm dữ liệu
- ✅ Cảnh báo khi có thay đổi lớn
- ✅ Giao diện hiển thị thông tin chi tiết
- ✅ Nút xóa lịch sử giá

## Log và Debug

Thuật toán cung cấp các log chi tiết để debug:

```
📈 New highest price for Bitcoin: 45000 (previous: 44000)
📊 Price stats for Bitcoin: { volatility: 12.5%, trend: 'bullish', dataPoints: 24 }
🚨 Price alerts for Bitcoin: [{ type: 'significant_change', message: 'Significant increase: 8.5%' }]
💾 Saved new highest price for bitcoin: 45000
```

## Tương lai

Có thể mở rộng thêm:
- Biểu đồ giá theo thời gian
- Dự đoán xu hướng giá
- Thông báo push khi có biến động lớn
- Export dữ liệu giá
- So sánh giá giữa các token
