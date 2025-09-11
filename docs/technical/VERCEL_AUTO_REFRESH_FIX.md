# 🔧 Khắc phục vấn đề Auto-Refresh trên Vercel

## 🚨 Vấn đề
Auto-refresh price không hoạt động trên Vercel production nhưng hoạt động bình thường trên localhost.

## 🔍 Nguyên nhân đã xác định

### 1. **Page Visibility API Issues**
- Trên localhost: Tab luôn được coi là "visible"
- Trên Vercel production: Tab có thể bị coi là "hidden" do browser optimizations
- Code cũ dừng auto-refresh khi `isPageVisible = false`

### 2. **Console Logging Issues**
- Console logs bị ẩn trên production build
- Khó debug và theo dõi trạng thái auto-refresh

### 3. **Environment Differences**
- `process.env.NODE_ENV` khác nhau giữa dev và production
- Một số logic chỉ hoạt động trong development mode

## ✅ Giải pháp đã triển khai

### 1. **Production Fallback cho Page Visibility**
```javascript
// Production fallback: Always run auto-refresh regardless of page visibility
const shouldRunRefresh = isPageVisible || process.env.NODE_ENV === 'production';
```

### 2. **Enhanced Error Handling**
```javascript
try {
  airdropRefreshDataRef.current();
  airdropRefreshStatscardRef.current();
} catch (error) {
  console.error('Error in Airdrop refresh:', error);
}
```

### 3. **Debug Component**
- Tạo `AutoRefreshDebug` component để theo dõi trạng thái
- Hiển thị trong development hoặc khi enable manually
- Có nút "Force Restart" để khởi động lại auto-refresh

### 4. **Force Restart Mechanism**
```javascript
const forceRestartAutoRefresh = useCallback(() => {
  // Clear existing intervals
  // Reset state
  // Trigger immediate refresh
}, [manualRefresh]);
```

## 🧪 Cách test và debug

### 1. **Enable Debug Panel trên Production**
```javascript
// Mở Developer Console và chạy:
localStorage.setItem('showAutoRefreshDebug', 'true');
// Reload trang để thấy debug panel
```

### 2. **Kiểm tra Console Logs**
- Mở Developer Console
- Tìm logs có format: `🔄 [timestamp] Centralized auto refresh...`
- Nếu không thấy logs, auto-refresh đã bị dừng

### 3. **Manual Testing**
- Click nút "Force Restart" trong debug panel
- Kiểm tra xem auto-refresh có hoạt động lại không
- Monitor countdown timer

### 4. **Network Tab**
- Kiểm tra API calls đến CoinGecko
- Xem có lỗi CORS hoặc rate limiting không
- Verify response data

## 🔧 Troubleshooting Steps

### Bước 1: Kiểm tra Debug Panel
1. Enable debug panel: `localStorage.setItem('showAutoRefreshDebug', 'true')`
2. Reload trang
3. Kiểm tra status trong debug panel

### Bước 2: Force Restart
1. Click "Force Restart" button
2. Monitor countdown timer
3. Kiểm tra console logs

### Bước 3: Kiểm tra Network
1. Mở Network tab
2. Filter by "coingecko"
3. Xem có API calls không

### Bước 4: Kiểm tra Environment Variables
1. Verify `VITE_NEON_DATABASE_URL` được set đúng
2. Kiểm tra không có CORS issues
3. Test API endpoints manually

## 📊 Monitoring

### Debug Panel hiển thị:
- **Status**: 🟢 Enabled / 🔴 Disabled
- **Countdown**: Thời gian còn lại đến refresh tiếp theo
- **Errors**: Số lỗi đã xảy ra
- **Last Refresh**: Thời gian refresh cuối cùng
- **Environment**: development / production

### Console Logs để theo dõi:
```
🔄 [timestamp] Centralized auto refresh: refreshing both Airdrop and TGE...
🔄 [timestamp] Refreshing Airdrop data...
🔄 [timestamp] Refreshing TGE data...
```

## 🚀 Deployment Checklist

- [ ] Code đã được commit và push
- [ ] Vercel deployment thành công
- [ ] Environment variables được set đúng
- [ ] Test auto-refresh trên production
- [ ] Enable debug panel để monitor
- [ ] Verify API calls hoạt động
- [ ] Test manual refresh button

## 🔄 Rollback Plan

Nếu có vấn đề, có thể rollback bằng cách:
1. Revert changes trong `AutoRefreshContext.jsx`
2. Remove `AutoRefreshDebug` component
3. Deploy lại version cũ

## 📝 Notes

- Debug panel chỉ hiển thị trong development hoặc khi enable manually
- Force restart sẽ clear tất cả intervals và restart lại
- Enhanced logging giúp debug trên production
- Production fallback đảm bảo auto-refresh luôn chạy trên Vercel
