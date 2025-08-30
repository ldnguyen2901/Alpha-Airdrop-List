# 📢 Các Loại Thông Báo trong Hệ Thống

## 🎯 Tổng Quan
Hệ thống thông báo hỗ trợ 4 loại chính với màu sắc và icon khác nhau:

### 1. ✅ **SUCCESS** (Thành công)
- **Màu**: Xanh lá (#10B981)
- **Icon**: ✅ 🔔 📊 🎯
- **Mục đích**: Thông báo các thao tác thành công

#### Ví dụ:
- `✅ Thao tác thành công!` - Khi thêm, sửa, xóa token
- `📊 Export Excel thành công` - Khi xuất file Excel
- `🎯 Đã tìm thấy 5 tokens phù hợp` - Kết quả tìm kiếm
- `🔔 Hệ thống thông báo đã được kích hoạt!` - Khởi tạo hệ thống

### 2. 📈 **INFO** (Thông tin)
- **Màu**: Xanh dương (#3B82F6)
- **Icon**: 📈 🔄 💾
- **Mục đích**: Thông báo trạng thái, cập nhật dữ liệu

#### Ví dụ:
- `📈 Giá token đã được cập nhật` - Khi refresh giá
- `🔄 Đang đồng bộ dữ liệu...` - Trạng thái đồng bộ
- `💾 Dữ liệu đã được lưu tự động` - Auto-save
- `📈 Giá Bitcoin đã tăng 5% trong 24h qua` - Thống kê giá

### 3. ⚠️ **WARNING** (Cảnh báo)
- **Màu**: Vàng (#F59E0B)
- **Icon**: ⚠️
- **Mục đích**: Cảnh báo về các vấn đề cần chú ý

#### Ví dụ:
- `⚠️ Token sắp hết thời gian listing` - Cảnh báo thời gian
- `⚠️ Phát hiện token trùng lặp` - Token trùng lặp
- `⚠️ Giá token thay đổi đột ngột (+20%)` - Biến động giá lớn
- `⚠️ Token ABC sắp hết thời gian listing (còn 30 phút)` - Cảnh báo cụ thể

### 4. ❌ **ERROR** (Lỗi)
- **Màu**: Đỏ (#EF4444)
- **Icon**: ❌
- **Mục đích**: Thông báo lỗi cần xử lý

#### Ví dụ:
- `❌ Lỗi kết nối API` - Không thể kết nối API
- `❌ Không thể import file Excel` - Lỗi import
- `❌ Không thể xóa token này` - Lỗi xóa
- `❌ Không thể kết nối đến CoinGecko API` - Lỗi cụ thể

## 🔧 Cách Sử Dụng

### Trong Code:
```javascript
// Thêm thông báo thành công
addNotification('✅ Token đã được thêm thành công!', 'success');

// Thông báo thông tin
addNotification('📈 Giá đã được cập nhật', 'info');

// Cảnh báo
addNotification('⚠️ Token sắp hết thời gian', 'warning');

// Lỗi
addNotification('❌ Không thể kết nối API', 'error');
```

### Trong Hooks:
```javascript
// useDataOperations.js
if (addNotification) {
  addNotification('Token added successfully!', 'success');
}

// useImportExport.js
if (addNotification) {
  addNotification('Excel file exported successfully!', 'success');
}
```

## 🎨 Giao Diện

### Icon Chuông:
- **Bình thường**: Icon chuông màu xám
- **Có thông báo**: Badge đỏ với số lượng thông báo chưa đọc
- **Animation**: Nhấp nháy khi có thông báo mới

### Dropdown:
- **Header**: "Thông báo" + "Đánh dấu đã đọc tất cả"
- **List**: Danh sách thông báo với icon và màu tương ứng
- **Footer**: "Xem tất cả thông báo"

### Màu Sắc:
- **Success**: Xanh lá (#10B981)
- **Info**: Xanh dương (#3B82F6)
- **Warning**: Vàng (#F59E0B)
- **Error**: Đỏ (#EF4444)

## 📱 Responsive
- **Desktop**: Dropdown rộng 320px
- **Mobile**: Tự động điều chỉnh kích thước
- **Dark Mode**: Hỗ trợ đầy đủ

## 💾 Lưu Trữ
- **LocalStorage**: Tự động lưu thông báo
- **Giới hạn**: Tối đa 50 thông báo gần nhất
- **Persistence**: Duy trì qua các lần refresh

## 🧪 Testing
Sử dụng component `NotificationTester` để test các loại thông báo:
- Vị trí: Góc dưới bên trái màn hình
- Chức năng: Click để tạo thông báo test
- Mục đích: Kiểm tra giao diện và chức năng
