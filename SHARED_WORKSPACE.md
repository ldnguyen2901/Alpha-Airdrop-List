# 🌐 Shared Workspace - All Users Sync

## Tổng quan

Tất cả user sẽ sử dụng cùng một workspace ID cố định: `shared-workspace`

## 🔄 Cách hoạt động

```
User A → shared-workspace (dữ liệu chung)
User B → shared-workspace (dữ liệu chung)  
User C → shared-workspace (dữ liệu chung)
```

## 🚀 Tính năng

- ✅ **Real-time sync**: Mọi thay đổi từ bất kỳ user nào sẽ được đồng bộ ngay lập tức
- ✅ **Collaborative editing**: Nhiều user có thể cùng chỉnh sửa dữ liệu
- ✅ **Single workspace**: Tất cả dữ liệu được lưu trong workspace `shared-workspace`
- ✅ **No user isolation**: Không còn workspace riêng cho từng user

## 📊 Cấu trúc Firebase

```javascript
// Collection: workspaces
// Document: shared-workspace
{
  rows: [
    // Array of token data
  ],
  updatedAt: Timestamp,
  lastUpdatedBy: "user_id_or_anonymous"
}
```

## ⚠️ Lưu ý

- **Public data**: Dữ liệu trong shared workspace là public
- **Real-time**: Mọi thay đổi sẽ sync với tất cả user ngay lập tức
- **No conflicts**: User cuối cùng edit sẽ overwrite thay đổi trước đó

## 🔧 Firebase Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/shared-workspace {
      allow read, write: if true; // Public access
    }
  }
}
```
