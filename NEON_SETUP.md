# Neon Database Setup Guide

## 1. Tạo Neon Account

1. Truy cập [Neon](https://neon.tech)
2. Đăng ký tài khoản miễn phí
3. Tạo project mới

## 2. Lấy Connection String

1. Vào project dashboard
2. Click "Connection Details"
3. Copy connection string:
   ```
   postgresql://username:password@host/database
   ```

## 3. Setup Environment Variables

Tạo file `.env` trong root directory:

```env
# Neon Database Configuration
VITE_NEON_DATABASE_URL=postgresql://username:password@host/database

# Optional: Custom API endpoints
VITE_COINGECKO_API_URL=https://api.coingecko.com/api/v3
```

## 4. Database Schema

Các bảng sẽ được tạo tự động khi app chạy:

### `workspaces` table
```sql
CREATE TABLE workspaces (
  id VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_updated_by VARCHAR(255)
);
```

### `token_logos` table
```sql
CREATE TABLE token_logos (
  token_id VARCHAR(255) PRIMARY KEY,
  logo TEXT,
  symbol VARCHAR(50),
  name VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### `statscard_prices` table
```sql
CREATE TABLE statscard_prices (
  id VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 5. Migration từ Local Storage

1. Dữ liệu hiện tại sẽ được migrate tự động
2. Update environment variables
3. Restart app

## 6. Benefits

- ✅ **3GB storage** (vs LocalStorage limited)
- ✅ **10GB transfer/tháng** (vs LocalStorage unlimited)
- ✅ **PostgreSQL** (mạnh mẽ hơn LocalStorage)
- ✅ **JSONB support** native
- ✅ **Serverless** - tự động scale
- ✅ **Branching** workflow
- ✅ **Multi-device sync**

## 7. Performance với 1 phút fetch

- **1 phút fetch**: ~180MB transfer/tháng
- **Neon limit**: 10GB transfer/tháng
- **Usage**: 1.8% quota
- **Kết quả**: ✅ **Rất an toàn**

## 8. Troubleshooting

### Connection Error
- Kiểm tra VITE_NEON_DATABASE_URL
- Verify Neon credentials
- Check network connection

### Table Creation Error
- Tables sẽ được tạo tự động
- Kiểm tra database permissions
- Verify JSONB support

### Performance Issues
- Neon có thể handle 10GB+ transfer
- Không cần lo về rate limiting
- Optimize queries nếu cần

## 9. Real-time Features

Neon hỗ trợ real-time với:
- **Polling** (implemented)
- **WebSocket** (có thể upgrade)
- **PostgreSQL LISTEN/NOTIFY** (advanced)

## 10. Monitoring

Kiểm tra usage trong Neon dashboard:
- Storage usage
- Transfer usage
- Connection count
- Query performance

## 11. Data Migration

### Từ LocalStorage sang Neon
1. App sẽ tự động migrate dữ liệu
2. Dữ liệu cũ vẫn được giữ trong LocalStorage
3. Neon sẽ trở thành primary database

### Backup Strategy
- Neon tự động backup
- LocalStorage làm fallback
- Export data định kỳ

## 12. Security

- **Connection string**: Bảo vệ trong .env
- **Database access**: Chỉ app có quyền truy cập
- **Data encryption**: Neon tự động encrypt
- **Network security**: SSL/TLS connection
