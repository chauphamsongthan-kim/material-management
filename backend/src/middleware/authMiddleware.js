// =========================================
// MIDDLEWARE: KIỂM TRA ĐĂNG NHẬP (xác thực JWT)
// =========================================
// Ngoài việc kiểm tra chữ ký token, mỗi request còn đối chiếu với DB:
// - Tài khoản đã bị xóa  -> token mất hiệu lực ngay.
// - Mật khẩu đã bị đổi   -> token cũ mất hiệu lực ngay.
// - Role / Ban bị đổi    -> áp dụng theo dữ liệu mới nhất trong DB.

const { verifyToken, passwordVersion } = require('../utils/jwt');
const { pool } = require('../config/database');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Chưa đăng nhập hoặc thiếu token xác thực.',
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded;

  try {
    decoded = verifyToken(token);
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn.',
    });
  }

  try {
    const [rows] = await pool.query(
      `SELECT
         u.user_id,
         u.username,
         u.full_name,
         u.role,
         u.admin_level,
         u.department_id,
         u.password_hash,
         d.department_name
       FROM users u
       LEFT JOIN departments d
         ON u.department_id = d.department_id
       WHERE u.user_id = ?
       LIMIT 1`,
      [decoded.user_id]
    );

    const user = rows[0];

    if (
      !user ||
      !decoded.pwv ||
      decoded.pwv !== passwordVersion(user.password_hash)
    ) {
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.',
      });
    }

    // Dùng dữ liệu mới nhất trong DB thay vì dữ liệu cũ trong token
    req.user = {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      // Cấp Admin lấy từ DB mỗi request (chỉ có ý nghĩa với ADMIN)
      admin_level: user.role === 'ADMIN' ? Number(user.admin_level) : null,
      department_id: user.department_id,
      department_name: user.department_name,
    };

    return next();
  } catch (err) {
    // Lỗi DB không phải lỗi đăng nhập: trả 500 để giao diện không tự đăng xuất
    console.error('Lỗi kiểm tra tài khoản trong authMiddleware:', err);

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ.',
    });
  }
}

module.exports = authMiddleware;
