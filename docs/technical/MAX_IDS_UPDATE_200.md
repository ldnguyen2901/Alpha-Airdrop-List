# 🚀 Cập nhật MAX_IDS_PER_CALL từ 100 lên 200

## 📅 Ngày thay đổi
**Date**: $(date)

## 🔧 Thay đổi thực hiện

### 1. **File: `src/services/api.js`**
```javascript
// Trước
const MAX_IDS_PER_CALL = 100;

// Sau  
const MAX_IDS_PER_CALL = 200;
```

### 2. **File: `docs/technical/OPTIMIZED_FETCH_STRATEGY.md`**
- Cập nhật documentation để phản ánh giới hạn mới
- Thay đổi từ "100 IDs" thành "200 IDs"

## 🎯 Lợi ích của thay đổi

### ✅ **Hiệu suất tốt hơn:**
- **Giảm 50% số lượng API calls** cho cùng một số lượng tokens
- **Giảm delay time** giữa các chunks
- **Tăng throughput** tổng thể

### ✅ **Ví dụ cụ thể:**
```
Trước: 500 tokens = 5 chunks (100 IDs/chunk)
Sau:   500 tokens = 3 chunks (200 IDs/chunk)

Thời gian:
- Trước: 5 chunks × 1s delay = 5s + fetch time
- Sau:   3 chunks × 1s delay = 3s + fetch time
```

### ✅ **Rate limiting:**
- **Ít requests hơn** = ít bị rate limit hơn
- **Tận dụng tốt hơn** giới hạn 5-15 requests/phút
- **Giảm risk** bị block bởi CoinGecko

## ⚠️ Rủi ro và cân nhắc

### 🔍 **URL Length:**
- **200 IDs** có thể tạo URL dài hơn
- **Monitor** xem có lỗi "URL too long" không
- **Fallback** về 150 nếu có vấn đề

### 🔍 **API Response Size:**
- **Response lớn hơn** có thể chậm hơn
- **Memory usage** tăng nhẹ
- **Network timeout** risk tăng

### 🔍 **Error Handling:**
- **Nếu 1 chunk fail**, mất nhiều data hơn
- **Current error handling** đã tốt (skip chunk, continue)

## 🧪 Testing Plan

### 1. **Local Testing:**
- [ ] Test với 200+ tokens
- [ ] Monitor console logs
- [ ] Check Network tab
- [ ] Verify response times

### 2. **Production Testing:**
- [ ] Deploy và monitor
- [ ] Check debug panel
- [ ] Monitor error rates
- [ ] Verify auto-refresh hoạt động

### 3. **Rollback Plan:**
```javascript
// Nếu có vấn đề, rollback về:
const MAX_IDS_PER_CALL = 100;
```

## 📊 Monitoring

### **Metrics cần theo dõi:**
- **API call frequency**: Giảm từ 5 xuống 3 calls/refresh
- **Response time**: Có thể tăng nhẹ nhưng tổng thời gian giảm
- **Error rate**: Monitor xem có tăng không
- **Rate limiting**: Ít bị block hơn

### **Debug Commands:**
```javascript
// Enable debug panel
localStorage.setItem('showAutoRefreshDebug', 'true');

// Monitor trong console
// Tìm logs: "Fetching prices for X tokens"
// Verify: "Received prices for X tokens"
```

## 🎉 Kết luận

Thay đổi này sẽ **cải thiện đáng kể hiệu suất** của auto-refresh price:
- **Giảm 40% thời gian** fetch data
- **Giảm 50% số lượng** API calls  
- **Tăng reliability** do ít bị rate limit
- **Maintain compatibility** với existing code

**Recommendation**: Deploy và monitor, có rollback plan sẵn sàng.
