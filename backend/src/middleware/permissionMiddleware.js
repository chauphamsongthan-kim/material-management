// =========================================
// MIDDLEWARE: PHÂN QUYỀN ADMIN / HEAD
// =========================================

const { canManageDepartment, isSuperAdmin } = require('../utils/permissions');

// Chỉ cho phép ADMIN và HEAD
function requireStaff(req, res, next) {
  if (
    req.user &&
    (req.user.role === 'ADMIN' || req.user.role === 'HEAD')
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'GUEST không có quyền thực hiện thao tác này.',
  });
}


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

// Chỉ cho phép Admin cấp 2
function requireSuperAdmin(req, res, next) {
  if (isSuperAdmin(req.user)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Chỉ Admin cấp 2 mới có quyền thực hiện thao tác này.',
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
  requireSuperAdmin,
  requireStaff,
  requireManageDepartmentFromParams,
};
