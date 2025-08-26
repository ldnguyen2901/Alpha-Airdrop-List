# 🚀 Vercel Cron Jobs Setup

## 📋 **Tổng quan:**
Website sẽ hoạt động 24/7 với Vercel Cron Jobs để tự động cập nhật:
- **Prices**: Mỗi 5 phút
- **Contract Addresses**: Mỗi giờ

## 🔧 **Setup Instructions:**

### **1. Deploy lên Vercel:**

#### **Option A: Deploy từ GitHub (Recommended)**
1. Push code lên GitHub
2. Kết nối GitHub repository với Vercel
3. Vercel sẽ tự động deploy khi có push mới

#### **Option B: Deploy từ CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### **2. Set Environment Variables:**
Trong Vercel Dashboard → Project Settings → Environment Variables:

```
CRON_SECRET=your-secret-key-here
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=airdrop-alpha-b59cf
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### **3. Cron Jobs sẽ tự động chạy:**
- **Price Updates**: `/api/cron/update-prices` - Mỗi 5 phút
- **Contract Fetch**: `/api/cron/fetch-contracts` - Mỗi giờ

## 📊 **Monitoring:**

### **Xem logs:**
```bash
# Vercel logs
vercel logs

# Hoặc trong Vercel Dashboard
```

### **Test manually:**
```bash
# Test price update
curl -X POST https://your-domain.vercel.app/api/cron/update-prices \
  -H "Authorization: Bearer your-secret-key"

# Test contract fetch
curl -X POST https://your-domain.vercel.app/api/cron/fetch-contracts \
  -H "Authorization: Bearer your-secret-key"
```

## 🎯 **Lợi ích:**
- ✅ **Hoạt động 24/7** kể cả khi không có user online
- ✅ **Tự động cập nhật** prices và contract addresses
- ✅ **Real-time sync** với Firebase
- ✅ **Free tier** của Vercel
- ✅ **Không cần upgrade** Firebase plan

## 🔍 **Troubleshooting:**

### **Nếu cron jobs không chạy:**
1. Kiểm tra environment variables
2. Kiểm tra Vercel logs
3. Test API endpoints manually
4. Đảm bảo CRON_SECRET được set đúng

### **Nếu có lỗi Firebase:**
1. Kiểm tra Firebase config
2. Đảm bảo Firestore rules cho phép write
3. Kiểm tra project ID đúng

## 📈 **Performance:**
- **Free tier**: 100 cron executions/ngày
- **Với 5 phút/lần**: ~288 executions/ngày
- **Cần upgrade** nếu vượt quá free tier
