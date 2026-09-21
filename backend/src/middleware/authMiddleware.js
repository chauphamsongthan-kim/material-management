// =========================================
// MIDDLEWARE: KIỂM TRA ĐĂNG NHẬP (xác thực JWT)
// =========================================

const { verifyToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Chưa đăng nhập hoặc thiếu token xác thực.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    // decoded = { user_id, username, full_name, role, department_id }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn.',
    });
  }
}

module.exports = authMiddleware;
