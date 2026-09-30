// =========================================
// ROUTES: NOTIFICATIONS
// =========================================

const express = require('express');
const router = express.Router();

const {
  getNotifications,
  markNotificationRead,
  deleteNotification,
} = require('../controllers/notificationController');

const authMiddleware = require('../middleware/authMiddleware');

// GET /api/notifications
// Lấy thông báo của tài khoản đang đăng nhập
router.get('/', authMiddleware, getNotifications);

// PATCH /api/notifications/:id/read
// Đánh dấu thông báo đã đọc
router.patch('/:id/read', authMiddleware, markNotificationRead);

// DELETE /api/notifications/:id
// Xóa một thông báo của tài khoản đang đăng nhập
router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router;