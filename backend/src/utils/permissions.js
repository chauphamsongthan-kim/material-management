// =========================================
// LOGIC PHÂN QUYỀN DÙNG CHUNG
// =========================================

/**
 * Kiểm tra user có quyền Thêm/Sửa/Xóa thiết bị thuộc một department cụ thể không.
 *
 * Quy tắc (đã chốt trong tài liệu):
 * - ADMIN: toàn quyền với mọi ban (department_id = NULL).
 * - HEAD: chỉ được Thêm/Sửa/Xóa thiết bị của đúng ban mình (user.department_id === deviceDepartmentId).
 *   Với ban khác, HEAD chỉ được Xem/Mượn/Trả/Xem lịch sử (không được gọi hàm này).
 */
function canManageDepartment(user, departmentId) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'HEAD') {
    return Number(user.department_id) === Number(departmentId);
  }
  return false;
}

module.exports = { canManageDepartment };
