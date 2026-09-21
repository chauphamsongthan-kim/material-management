// =========================================
// KHỞI TẠO EXPRESS APP
// =========================================

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Kiểm tra server còn sống
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server đang hoạt động.' });
});

// Gắn các route chính
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/devices', deviceRoutes);

// Xử lý route không tồn tại
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Không tìm thấy đường dẫn API.' });
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Đã xảy ra lỗi máy chủ.' });
});

module.exports = app;
