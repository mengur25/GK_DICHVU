# 🎓 React Frontend - University Tuition Payment System

Frontend React hiện đại cho hệ thống thanh toán học phí đại học, được thiết kế theo yêu cầu iBanking.

## ✨ Tính năng chính

### 🔐 **Authentication**
- Đăng nhập với email/password
- JWT token management
- Protected routes

### 💰 **Thanh toán học phí (iBanking Style)**
- **3 phần form** như yêu cầu:
  1. **Người nộp tiền**: Thông tin tự động điền và khóa
  2. **Thông tin học phí**: MSSV, tên sinh viên, số tiền tự động tính
  3. **Thông tin thanh toán**: Số dư, số tiền, điều khoản

### 🔒 **Bảo mật OTP**
- Gửi OTP qua email
- Xác thực 6 số
- Thời hạn 5 phút
- Gửi lại OTP

### 📱 **Responsive Design**
- Giao diện đẹp mắt với Tailwind CSS
- Tương thích mọi thiết bị
- Smooth animations và transitions

## 🛠️ Cài đặt và chạy

### **1. Cài đặt dependencies**
```bash
cd frontend
npm install
```

### **2. Khởi động development server**
```bash
# Cách 1: Sử dụng script
./start_frontend.sh

# Cách 2: Manual
npm start
```

### **3. Build production**
```bash
npm run build
```

## 🏗️ Cấu trúc project

```
frontend/
├── public/                 # Static files
├── src/
│   ├── components/         # React components
│   │   ├── Login.js       # Đăng nhập
│   │   ├── Dashboard.js   # Trang chủ
│   │   └── TuitionPayment.js # Form thanh toán
│   ├── contexts/          # React contexts
│   │   └── AuthContext.js # Authentication context
│   ├── App.js             # Main app component
│   ├── index.js           # Entry point
│   └── index.css          # Global styles
├── package.json           # Dependencies
├── tailwind.config.js     # Tailwind CSS config
└── README.md              # This file
```

## 🎯 Luồng hoạt động

### **1. Đăng nhập**
```
User Input → Login Form → Backend API → JWT Token → Dashboard
```

### **2. Thanh toán học phí**
```
Step 1: Form Input → Validate → Request OTP
Step 2: OTP Verification → Confirm Payment
Step 3: Success → Update Balance → Email Confirmation
```

### **3. Business Rules**
- Số tiền thanh toán ≤ Số dư khả dụng
- Chỉ thanh toán toàn bộ số tiền
- Xác thực OTP bắt buộc
- Tự động điền thông tin người nộp tiền

## 🎨 UI Components

### **Buttons**
- `.btn-primary`: Primary actions
- `.btn-secondary`: Secondary actions
- `.btn-success`: Success actions
- `.btn-danger`: Danger actions

### **Forms**
- `.input-field`: Input fields
- `.form-section`: Form sections
- `.form-section-title`: Section titles

### **Cards**
- `.card`: Basic card container
- `.shadow-soft`: Soft shadow
- `.shadow-medium`: Medium shadow

## 🔧 Configuration

### **API Endpoints**
- **Proxy**: `http://localhost:8000` (backend)
- **Base URL**: Tự động proxy đến backend

### **Environment Variables**
- `REACT_APP_API_URL`: Backend API URL (optional)

### **Tailwind CSS**
- Custom color palette
- Responsive breakpoints
- Custom shadows và animations

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Grid System**
- CSS Grid cho layout
- Flexbox cho components
- Mobile-first approach

## 🚀 Performance

### **Optimizations**
- Lazy loading components
- Efficient state management
- Minimal re-renders
- Optimized images

### **Bundle Size**
- Tree shaking
- Code splitting
- Optimized dependencies

## 🧪 Testing

### **Available Scripts**
```bash
npm test          # Run tests
npm run build     # Build production
npm run eject     # Eject from CRA (not recommended)
```

## 🔒 Security Features

### **Frontend Security**
- Input validation
- XSS protection
- CSRF protection (via backend)
- Secure token storage

### **Authentication Flow**
- JWT token management
- Automatic token refresh
- Secure logout
- Protected routes

## 🎨 Design System

### **Colors**
- **Primary**: Blue shades
- **Success**: Green shades
- **Warning**: Yellow shades
- **Danger**: Red shades

### **Typography**
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Responsive**: Auto-scaling

### **Spacing**
- **Consistent**: 4px base unit
- **Responsive**: Auto-adjusting
- **Accessible**: WCAG compliant

## 📋 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## 🐛 Troubleshooting

### **Common Issues**
1. **Port 3000 in use**: Kill process hoặc change port
2. **Dependencies missing**: Run `npm install`
3. **Backend not running**: Start backend first
4. **CORS issues**: Check backend CORS config

### **Development Tips**
- Use React DevTools
- Check browser console
- Monitor network requests
- Use browser dev tools

## 📈 Future Enhancements

- [ ] Dark mode
- [ ] Internationalization (i18n)
- [ ] PWA support
- [ ] Advanced animations
- [ ] Unit tests
- [ ] E2E tests
- [ ] Performance monitoring
- [ ] Error tracking

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Happy Coding! 🎉**
