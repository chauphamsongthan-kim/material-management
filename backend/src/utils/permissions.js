// =========================================
// LOGIC PHÂN QUYỀN DÙNG CHUNG
// =========================================

/**
 * Kiểm tra user có quyền Thêm/Sửa/Xóa thiết bị thuộc một department cụ thể không.
 *
 * Quy tắc (đã chốt trong tài liệu):
 * - ADMIN: toàn quyền với mọi ban (department_id = NULL).
 * - HEAD: chỉ được Thêm/Sửa/Xóa thiết bị của đúng ban mình (user.department_id === deviceDepartmentId).
 *   Với ban khác, HEAD chỉ được Xem/Mượn/Xem lịch sử. HEAD KHÔNG được Trả thiết bị
 *   của ban khác (đã chốt, được kiểm tra trong returnController).
 */
function canManageDepartment(user, departmentId) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'HEAD') {
    return Number(user.department_id) === Number(departmentId);
  }
  return false;
}

/**
 * Admin cấp 2: Admin gốc, DUY NHẤT một tài khoản. Là người duy nhất được vào
 * trang Quản lý tài khoản (tạo/xóa/đặt lại mật khẩu HEAD, GUEST và Admin cấp 1).
 * Không thể tạo thêm Admin cấp 2 và không thể xóa Admin cấp 2.
 * Admin cấp 1: đủ chức năng thiết bị và gửi thông báo,
 * nhưng KHÔNG được quản lý tài khoản nào.
 */
function isSuperAdmin(user) {
  return !!user && user.role === 'ADMIN' && Number(user.admin_level) === 2;
}

module.exports = { canManageDepartment, isSuperAdmin };
