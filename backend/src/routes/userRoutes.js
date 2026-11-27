const express = require('express');
const router = express.Router();

const {
  getUsers,
  createUser,
  updateUserPassword,
  deleteUser,
} = require('../controllers/userController');

const authMiddleware = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/permissionMiddleware');

// Tất cả API quản lý tài khoản đều yêu cầu:
// 1. Đăng nhập
// 2. Admin cấp 2 (Admin cấp 1 không được quản lý tài khoản)

// GET /api/users
router.get(
  '/',
  authMiddleware,
  requireSuperAdmin,
  getUsers
);

// POST /api/users
router.post(
  '/',
  authMiddleware,
  requireSuperAdmin,
  createUser
);

// PUT /api/users/:id/password
router.put(
  '/:id/password',
  authMiddleware,
  requireSuperAdmin,
  updateUserPassword
);

// DELETE /api/users/:id
router.delete(
  '/:id',
  authMiddleware,
  requireSuperAdmin,
  deleteUser
);

module.exports = router;