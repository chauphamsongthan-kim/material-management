// =========================================
// MIDDLEWARE: PHÂN QUYỀN ADMIN / HEAD
// =========================================

const { canManageDepartment } = require('../utils/permissions');

// Chỉ cho phép ADMIN
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Chỉ Admin mới có quyền thực hiện thao tác này.',
  });
}

// Dùng cho route: POST /api/departments/:id/devices (Thêm thiết bị)
// department_id lấy trực tiếp từ params.
function requireManageDepartmentFromParams(req, res, next) {
  const departmentId = req.params.id;

  if (canManageDepartment(req.user, departmentId)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Bạn không có quyền Thêm thiết bị cho ban này.',
  });
}

module.exports = {
  requireAdmin,
  requireManageDepartmentFromParams,
};
