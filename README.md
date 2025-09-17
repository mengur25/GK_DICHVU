# 🎓 University Management System

Hệ thống quản lý trường đại học với giao diện web hiện đại, hỗ trợ quản lý sinh viên, khóa học, học phí và thanh toán.

## ✨ Tính năng chính

### 👨‍💼 Admin
- **Quản lý sinh viên**: Thêm, sửa, xóa thông tin sinh viên
- **Quản lý khóa học**: Tạo và quản lý các khóa học
- **Quản lý học phí**: Tạo hóa đơn và theo dõi thanh toán
- **Dashboard tổng quan**: Xem thống kê tổng quan hệ thống

### 👨‍🎓 Sinh viên
- **Xem thông tin cá nhân**: Profile và số dư tài khoản
- **Lịch sử thanh toán**: Xem tất cả giao dịch đã thực hiện
- **Đăng ký khóa học**: Thêm khóa học mới (chức năng test)
- **Nạp tiền**: Thêm số dư vào tài khoản (chức năng test)
- **Thanh toán học phí**: Thực hiện thanh toán học phí

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Python 3.13+
- Node.js 18+
- npm hoặc yarn

### Cài đặt

1. **Clone repository**
```bash
git clone <repository-url>
cd fastapi
```

2. **Cài đặt Backend (Python)**
```bash
# Tạo virtual environment
python -m venv venv

# Kích hoạt virtual environment
# Trên macOS/Linux:
source venv/bin/activate
# Trên Windows:
# venv\Scripts\activate

# Cài đặt dependencies
pip install -r requirements.txt
```

3. **Cài đặt Frontend (React)**
```bash
cd frontend
npm install
```

### Chạy ứng dụng

#### Cách 1: Sử dụng script tự động
```bash
# Từ thư mục gốc
./start.sh
```

#### Cách 2: Chạy thủ công

**Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm start
```

## 🌐 Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 👤 Tài khoản mặc định

### Admin
- **Email**: `admin@gmail.com`
- **Password**: `admin123`

### Sinh viên
- **Email**: `student1@test.com`
- **Password**: `test123456`

## 🛠️ Công nghệ sử dụng

### Backend
- **FastAPI**: Web framework hiện đại cho Python
- **SQLAlchemy**: ORM cho database
- **SQLite**: Database
- **JWT**: Xác thực và phân quyền
- **Pydantic**: Validation dữ liệu

### Frontend
- **React**: JavaScript library cho UI
- **React Router**: Điều hướng
- **Axios**: HTTP client
- **Tailwind CSS**: CSS framework
- **Lucide React**: Icon library

## 📁 Cấu trúc dự án

```
fastapi/
├── backend/                 # Backend API
│   ├── routers/            # API routes
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── security.py         # Authentication
│   └── main.py             # FastAPI app
├── frontend/               # Frontend React
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── App.js          # Main app
│   └── package.json
├── requirements.txt        # Python dependencies
├── start.sh               # Startup script
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký

### Students
- `GET /students/` - Lấy danh sách sinh viên
- `GET /students/profile` - Lấy thông tin sinh viên hiện tại
- `POST /students/` - Tạo sinh viên mới

### Courses
- `GET /courses/` - Lấy danh sách khóa học
- `POST /courses/` - Tạo khóa học mới

### Payments
- `GET /payments/by-student/{student_id}` - Lịch sử thanh toán của sinh viên
- `POST /payments/` - Tạo thanh toán mới

### Service Accounts
- `GET /service-accounts/by-student/{student_id}` - Số dư tài khoản
- `PUT /service-accounts/{account_id}` - Cập nhật số dư

## 🎯 Tính năng đặc biệt

### Chức năng Test cho Sinh viên
- **Add Course**: Cho phép sinh viên đăng ký khóa học mới
- **Add Balance**: Cho phép sinh viên nạp tiền vào tài khoản

### Bảo mật
- JWT token authentication
- Role-based access control (Admin/Student)
- CORS enabled cho frontend

### UI/UX
- Responsive design với Tailwind CSS
- Dark/Light mode support
- Modern card-based layout
- Real-time data updates

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **ModuleNotFoundError: No module named 'database'**
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```

2. **Frontend không kết nối được với Backend**
   - Kiểm tra backend đang chạy trên port 8000
   - Kiểm tra CORS settings trong backend

3. **Database errors**
   - Xóa file `backend/university.db` để reset database
   - Restart backend server

## 📝 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📞 Support

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub hoặc liên hệ qua email.

---

**Developed with ❤️ by [Your Name]**