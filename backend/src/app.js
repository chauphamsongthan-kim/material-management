// =========================================
// KHỞI TẠO EXPRESS APP
// =========================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

const userRoutes = require('./routes/userRoutes');

const notificationRoutes = require('./routes/notificationRoutes');

const pushRoutes = require('./routes/pushRoutes');

const authMiddleware = require('./middleware/authMiddleware');
const { UPLOAD_DIR } = require('./utils/imageStorage');

const app = express();

// Header bảo mật. Ảnh /uploads được trang frontend (khác tên miền) tải về
// nên phải cho phép cross-origin cho tài nguyên.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS: đặt CORS_ORIGINS trong .env để chỉ cho phép đúng trang web của bạn,
// ví dụ CORS_ORIGINS=https://ten-mien-frontend.com (nhiều địa chỉ cách nhau bằng dấu phẩy).
// Nếu chưa đặt thì giữ nguyên hành vi cũ (cho mọi trang).
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn('⚠️  CORS_ORIGINS chưa được đặt: API đang cho phép mọi trang web gọi tới.');
}

app.use(cors(
  allowedOrigins.length > 0
    ? {
        origin(origin, callback) {
          // Không có Origin (Postman, curl, server-to-server) vẫn được qua
          callback(null, !origin || allowedOrigins.includes(origin));
        },
      }
    : undefined
));

app.use(express.json());

// Phục vụ ảnh thiết bị đã tải lên: chỉ người đã đăng nhập mới xem được
app.use('/uploads', authMiddleware, express.static(UPLOAD_DIR, {
  index: false,
  dotfiles: 'deny',
  maxAge: '7d',
  setHeaders(res) {
    res.setHeader('Cache-Control', 'private, max-age=604800');
  },
}));

// Kiểm tra server còn sống
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server đang hoạt động.' });
});

// Gắn các route chính
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/devices', deviceRoutes);

app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/push', pushRoutes);

// Xử lý route không tồn tại
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Không tìm thấy đường dẫn API.' });
});

// Xử lý lỗi tải ảnh và lỗi chung
app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Ảnh tải lên không được vượt quá 5 MB.',
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu gửi lên không hợp lệ.',
    });
  }

  if (err.code === 'INVALID_IMAGE') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Chỉ được tải lên một ảnh với trường image.',
    });
  }

  if (
    err.message === 'Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.'
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi máy chủ.',
  });
});

module.exports = app;
