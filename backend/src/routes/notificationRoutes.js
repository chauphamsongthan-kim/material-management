
const express = require('express');
const router = express.Router();

const {
  getNotifications,
  markNotificationRead,
  deleteNotification,
  sendAdminNotification,
  getNotificationRecipients,
} = require('../controllers/notificationController');

const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/permissionMiddleware');

// Tất cả tài khoản đã đăng nhập đều có thể xem và
// thao tác trên thông báo thuộc về chính mình.
router.get('/', authMiddleware, getNotifications);
router.patch('/:id/read', authMiddleware, markNotificationRead);
router.delete('/:id', authMiddleware, deleteNotification);

// Danh sách tài khoản có thể nhận thông báo (Admin cấp 1 và cấp 2).
// Dùng riêng endpoint này để Admin cấp 1 không cần quyền quản lý tài khoản.
router.get(
  '/recipients',
  authMiddleware,
  requireAdmin,
  getNotificationRecipients
);

// Chỉ ADMIN (cấp 1 và cấp 2) được gửi thông báo đến tài khoản được chọn.
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  sendAdminNotification
);

module.exports = router;