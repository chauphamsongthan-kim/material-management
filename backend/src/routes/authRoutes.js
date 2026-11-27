const express = require('express');
const router = express.Router();

const {
  login,
  changePassword,
} = require('../controllers/authController');

const {
  getEmailStatus,
  requestEmailLink,
  verifyEmailLink,
  unlinkEmail,
  forgotPassword,
  resetPassword,
} = require('../controllers/emailController');

const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/permissionMiddleware');

// POST /api/auth/login
router.post('/login', login);

// PUT /api/auth/change-password
router.put(
  '/change-password',
  authMiddleware,
  changePassword
);

// Quên mật khẩu bằng Gmail đã liên kết (không cần đăng nhập)
// POST /api/auth/forgot-password  { username }
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password  { username, code, new_password }
router.post('/reset-password', resetPassword);

// Liên kết Gmail (Admin cấp 1 và cấp 2)
// GET    /api/auth/email
router.get('/email', authMiddleware, requireAdmin, getEmailStatus);

// POST   /api/auth/email/request  { email }
router.post('/email/request', authMiddleware, requireAdmin, requestEmailLink);

// POST   /api/auth/email/verify   { email, code }
router.post('/email/verify', authMiddleware, requireAdmin, verifyEmailLink);

// DELETE /api/auth/email          { password }
router.delete('/email', authMiddleware, requireAdmin, unlinkEmail);

module.exports = router;
