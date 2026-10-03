// =========================================
// KHỞI TẠO EXPRESS APP
// =========================================

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

const userRoutes = require('./routes/userRoutes');

const notificationRoutes = require('./routes/notificationRoutes');

const pushRoutes = require('./routes/pushRoutes');

const { UPLOAD_DIR } = require('./utils/imageStorage');

const app = express();



app.use(cors());
app.use(express.json());

// Phục vụ ảnh thiết bị đã tải lên
app.use('/uploads', express.static(UPLOAD_DIR, {
  index: false,
  dotfiles: 'deny',
  maxAge: '7d',
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
