const express = require('express');
const router = express.Router();

const {
  getDepartments,
  getDevicesByDepartment,
} = require('../controllers/departmentController');
const { addDevice } = require('../controllers/deviceController');

const authMiddleware = require('../middleware/authMiddleware');
const {
  requireManageDepartmentFromParams,
} = require('../middleware/permissionMiddleware');

// GET /api/departments -> Lấy 6 ban (cần đăng nhập)
router.get('/', authMiddleware, getDepartments);

// GET /api/departments/:id/devices -> Lấy thiết bị theo ban (mọi user đã đăng nhập đều xem được)
router.get('/:id/devices', authMiddleware, getDevicesByDepartment);

// POST /api/departments/:id/devices -> Thêm thiết bị (chỉ ADMIN hoặc HEAD đúng ban)
router.post('/:id/devices', authMiddleware, requireManageDepartmentFromParams, addDevice);

module.exports = router;
