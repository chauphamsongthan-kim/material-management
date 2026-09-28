const express = require('express');
const router = express.Router();

const {
  getUsers,
  createUser,
  updateUserPassword,
  deleteUser,
} = require('../controllers/userController');

const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/permissionMiddleware');

// Tất cả API quản lý tài khoản đều yêu cầu:
// 1. Đăng nhập
// 2. Role ADMIN

// GET /api/users
router.get(
  '/',
  authMiddleware,
  requireAdmin,
  getUsers
);

// POST /api/users
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  createUser
);

// PUT /api/users/:id/password
router.put(
  '/:id/password',
  authMiddleware,
  requireAdmin,
  updateUserPassword
);

// DELETE /api/users/:id
router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  deleteUser
);

module.exports = router;