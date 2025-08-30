# Vấn đề đồng bộ hóa dữ liệu và giải pháp

## Mô tả vấn đề

Khi nhiều thiết bị sử dụng ứng dụng cùng lúc, có thể xảy ra tình trạng dữ liệu không đồng bộ:

### Kịch bản vấn đề:
1. **Thiết bị A** (PC): Người dùng click "Clear All" → Xóa dữ liệu khỏi Firebase
2. **Thiết bị B** (Điện thoại): Vẫn có dữ liệu cũ trong localStorage/cache
3. **Thiết bị B** mở app → Firebase trả về dữ liệu rỗng, nhưng app fallback về localStorage
4. **Thiết bị B** load dữ liệu cũ từ localStorage → Đồng bộ lại vào Firebase
5. **Kết quả**: Dữ liệu đã bị xóa lại xuất hiện trở lại

## Nguyên nhân kỹ thuật

### 1. Logic fallback cũ:
```javascript
// Logic cũ (có vấn đề)
if (firebaseData && Array.isArray(firebaseData) && firebaseData.length > 0) {
  // Sử dụng Firebase data
} else {
  // Fallback về localStorage (VẤN ĐỀ Ở ĐÂY!)
  const localData = localStorage.getItem('airdrop-alpha-data');
  // Load dữ liệu cũ từ localStorage
}
```

### 2. Vấn đề:
- Firebase trả về `[]` (empty array) khi đã xóa
- Logic cũ chỉ kiểm tra `firebaseData.length > 0`
- Khi Firebase trả về `[]`, app fallback về localStorage
- Dữ liệu cũ từ localStorage được load và đồng bộ lại

## Giải pháp đã triển khai

### 1. Sửa logic fallback:
```javascript
// Logic mới (đã sửa)
if (firebaseData && Array.isArray(firebaseData)) {
  // Luôn sử dụng Firebase data, kể cả khi rỗng
  setRows(firebaseData);
  
  // Nếu Firebase rỗng, xóa localStorage để tránh xung đột
  if (firebaseData.length === 0) {
    localStorage.removeItem('airdrop-alpha-data');
  }
} else {
  // Chỉ fallback khi Firebase trả về null/undefined
  // (không phải empty array)
}
```

### 2. Cache Manager:
- **`checkCacheSync()`**: Kiểm tra xem cache có đồng bộ với Firebase không
- **`clearAllCache()`**: Xóa toàn bộ cache local
- **`forceSyncWithFirebase()`**: Force đồng bộ từ Firebase

### 3. Tự động kiểm tra cache:
```javascript
// Trong useFirebaseSync.js
const cacheCheck = await checkCacheSync();
if (cacheCheck.shouldClearCache) {
  console.log('Cache sync check: Clearing local cache due to:', cacheCheck.reason);
}
```

### 4. Real-time sync improvements:
```javascript
// Subscribe callback cũng xử lý empty data
subscribeWorkspace(newWorkspaceId, (data) => {
  if (data && Array.isArray(data)) {
    setRows(data);
    
    // Nếu Firebase rỗng, xóa localStorage
    if (data.length === 0) {
      localStorage.removeItem('airdrop-alpha-data');
    }
  }
});
```

## Cách sử dụng

### 1. Tự động:
- App sẽ tự động kiểm tra và xóa cache khi phát hiện vấn đề
- Không cần can thiệp thủ công

### 2. Thủ công (nút Force Sync):
1. Click nút "Force Sync" (màu xanh dương)
2. App sẽ:
   - Hiển thị thông báo "Đang đồng bộ với database..."
   - Xóa toàn bộ cache local
   - Đồng bộ lại từ Firebase
   - Cập nhật dữ liệu ngầm (không reload trang)
   - Hiển thị thông báo kết quả
3. Dữ liệu sẽ được đồng bộ hoàn toàn mà không làm gián đoạn người dùng

### 3. Debug:
- Mở Developer Tools (F12)
- Xem Console để theo dõi quá trình đồng bộ
- Các log sẽ hiển thị:
  - `"Firebase data is empty, cleared local storage to prevent conflicts"`
  - `"Cache sync check: Clearing local cache due to: firebase_empty_local_has_data"`
  - `"Force syncing with Firebase..."`

## Kiểm tra trạng thái

### 1. Kiểm tra Firebase data:
```javascript
// Trong Console
const firebaseData = await loadWorkspaceDataOnce('shared-workspace');
console.log('Firebase data:', firebaseData);
console.log('Firebase data length:', firebaseData.length);
```

### 2. Kiểm tra localStorage:
```javascript
// Trong Console
const localData = localStorage.getItem('airdrop-alpha-data');
console.log('Local data exists:', !!localData);
if (localData) {
  const parsed = JSON.parse(localData);
  console.log('Local data length:', parsed.length);
}
```

### 3. Kiểm tra cache sync:
```javascript
// Trong Console
import { checkCacheSync } from './src/utils/cacheManager';
const result = await checkCacheSync();
console.log('Cache sync result:', result);
```

## Phòng ngừa

### 1. Luôn sử dụng nút "Clear All" thay vì xóa thủ công
### 2. Nếu gặp vấn đề đồng bộ, sử dụng "Force Sync"
### 3. Kiểm tra Console để theo dõi quá trình đồng bộ
### 4. Đảm bảo tất cả thiết bị đều có kết nối internet ổn định

## Lưu ý quan trọng

- **Không xóa localStorage thủ công** khi app đang chạy
- **Luôn sử dụng nút "Clear All"** để đảm bảo đồng bộ đúng
- **Force Sync hoạt động ngầm** - không làm gián đoạn công việc
- **Kiểm tra Console** nếu gặp vấn đề đồng bộ
