const express = require('express');
const router = express.Router();

const {
  getDeviceById,
  updateDevice,
  deleteDevice,
  searchDevices,
} = require('../controllers/deviceController');

const { borrowDevice, getActiveBorrows } = require('../controllers/borrowController');
const { returnDevice } = require('../controllers/returnController');
const { getDeviceHistory } = require('../controllers/historyController');

const authMiddleware = require('../middleware/authMiddleware');

// Lưu ý: route /search phải khai báo TRƯỚC route /:id
// để tránh Express hiểu nhầm "search" là một device_id.

// GET /api/devices/search?q= -> Tìm kiếm thiết bị
router.get('/search', authMiddleware, searchDevices);

// GET /api/devices/:id -> Chi tiết thiết bị
router.get('/:id', authMiddleware, getDeviceById);

// PUT /api/devices/:id -> Sửa thiết bị (kiểm tra quyền bên trong controller)
router.put('/:id', authMiddleware, updateDevice);

// DELETE /api/devices/:id -> Xóa thiết bị (kiểm tra quyền bên trong controller)
router.delete('/:id', authMiddleware, deleteDevice);

// POST /api/devices/:id/borrow -> Mượn thiết bị (mọi user đã đăng nhập)
router.post('/:id/borrow', authMiddleware, borrowDevice);

// GET /api/devices/:id/active-borrows -> Các đợt mượn chưa trả đủ
router.get('/:id/active-borrows', authMiddleware, getActiveBorrows);

// POST /api/devices/:id/return -> Trả thiết bị (mọi user đã đăng nhập)
router.post('/:id/return', authMiddleware, returnDevice);

// GET /api/devices/:id/history -> Xem lịch sử
router.get('/:id/history', authMiddleware, getDeviceHistory);

module.exports = router;
