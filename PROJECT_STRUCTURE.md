# 📁 Cấu trúc dự án Alpha Airdrop

## 🎯 Tổng quan

Dự án được tổ chức theo cấu trúc React + Vite với documentation được sắp xếp hợp lý.

## 📂 Cấu trúc thư mục

```
Alpha-Airdrop-List/
├── 📁 docs/                          # 📚 Documentation
│   ├── 📄 README.md                  # Index documentation
│   ├── 📁 technical/                 # 🔧 Tài liệu kỹ thuật
│   │   ├── OPTIMIZED_FETCH_STRATEGY.md
│   │   ├── PRICE_TRACKING_ALGORITHM.md
│   │   ├── SYNC_ISSUES.md
│   │   └── NOTIFICATION_TYPES.md
│   └── 📁 user-guides/               # 📖 Hướng dẫn người dùng
│       ├── HUONG_DAN_CAI_DAT.md
│       └── SHARED_WORKSPACE.md
├── 📁 src/                           # 🚀 Source code
│   ├── 📁 components/                # 🧩 React components
│   │   ├── 📁 card/                  # Card view components
│   │   ├── 📁 modals/                # Modal components
│   │   └── 📁 table/                 # Table components
│   ├── 📁 contexts/                  # 🔄 React contexts
│   ├── 📁 hooks/                     # 🎣 Custom hooks
│   ├── 📁 services/                  # 🌐 API services
│   ├── 📁 utils/                     # 🛠️ Utility functions
│   ├── App.jsx                       # Main app component
│   ├── main.jsx                      # Entry point
│   └── index.css                     # Global styles
├── 📄 README.md                      # 📋 Project overview
├── 📄 PROJECT_STRUCTURE.md           # 📁 This file
├── 📄 package.json                   # 📦 Dependencies
├── 📄 vite.config.js                 # ⚡ Vite config
├── 📄 tailwind.config.js             # 🎨 Tailwind config
├── 📄 index.html                     # 🌐 HTML template
└── 📄 .gitignore                     # 🚫 Git ignore rules
```

## 🎯 Mục đích từng thư mục

### **📚 docs/**
- **technical/**: Tài liệu kỹ thuật cho developers
- **user-guides/**: Hướng dẫn sử dụng cho người dùng cuối

### **🚀 src/**
- **components/**: React components được tổ chức theo chức năng
- **contexts/**: React contexts cho state management
- **hooks/**: Custom hooks cho logic tái sử dụng
- **services/**: API calls và external services
- **utils/**: Helper functions và utilities

### **📄 Root files**
- **README.md**: Tổng quan dự án và hướng dẫn nhanh
- **PROJECT_STRUCTURE.md**: File này - mô tả cấu trúc
- **package.json**: Dependencies và scripts
- **vite.config.js**: Cấu hình build tool

## 🔄 Workflow

1. **Development**: Làm việc trong `src/`
2. **Documentation**: Cập nhật trong `docs/`
3. **Configuration**: Chỉnh sửa files ở root
4. **Build**: Output vào `dist/` (tự động)

## 📝 Best Practices

- **Components**: Tổ chức theo chức năng, không theo type
- **Documentation**: Phân loại rõ ràng technical vs user guides
- **Naming**: Sử dụng kebab-case cho files, PascalCase cho components
- **Structure**: Giữ root directory sạch sẽ, chỉ có files cần thiết
