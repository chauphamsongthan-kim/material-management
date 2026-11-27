// =========================================
// CONTROLLER: AUTHENTICATION
// =========================================

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { signToken, passwordVersion } = require('../utils/jwt');
const loginLimiter = require('../utils/loginLimiter');

// Hash giả để vẫn tốn thời gian bcrypt khi tên đăng nhập không tồn tại
const DUMMY_HASH =
  '$2a$10$DZaapVJXarBgga43fnRHEuUBhQwZepHWkkejcCiQZVVDwxgtvXQJK';

function sendLocked(res, seconds) {
  res.set('Retry-After', String(seconds));

  return res.status(429).json({
    success: false,
    message: `Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau ${seconds} giây.`,
  });
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ username và password.',
      });
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Thông tin đăng nhập không hợp lệ.',
      });
    }

    // Đang bị khóa do nhập sai nhiều lần
    const waitSeconds = loginLimiter.getRetryAfterSeconds(username);

    if (waitSeconds > 0) {
      return sendLocked(res, waitSeconds);
    }

    const [rows] = await pool.query(
      `SELECT
        users.*,
        departments.department_name
      FROM users
      LEFT JOIN departments
        ON users.department_id = departments.department_id
      WHERE users.username = ?
      LIMIT 1`,
      [username]
    );

    const user = rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user ? user.password_hash : DUMMY_HASH
    );

    if (!user || !isMatch) {
      const lockSeconds = loginLimiter.recordFailure(username);

      // Lần sai thứ 6 -> bắt đầu khóa 30 giây
      if (lockSeconds > 0) {
        return sendLocked(res, lockSeconds);
      }

      return res.status(401).json({
        success: false,
        message: 'Sai tên đăng nhập hoặc mật khẩu.',
      });
    }

    loginLimiter.reset(username);

    const tokenPayload = {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      admin_level: user.role === 'ADMIN' ? Number(user.admin_level) : null,
      department_id: user.department_id,
      department_name: user.department_name,
    };

    // pwv: gắn token với mật khẩu hiện tại để đổi mật khẩu là token cũ hết hạn
    const token = signToken({
      ...tokenPayload,
      pwv: passwordVersion(user.password_hash),
    });

    return res.json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: {
        token,
        user: tokenPayload,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
}

// =========================================
// PUT /api/auth/change-password
// Người dùng tự đổi mật khẩu
// =========================================

async function changePassword(req, res) {
  try {
    const userId = req.user.user_id;

    const {
      current_password,
      new_password,
    } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.',
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      });
    }

    if (
      typeof current_password !== 'string' ||
      typeof new_password !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin mật khẩu không hợp lệ.',
      });
    }

    if (current_password === new_password) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
      });
    }

    // Chặn dò mật khẩu hiện tại bằng token bị lộ: cũng sai 6 lần thì chờ 30 giây
    const limiterKey = `change-password:${userId}`;
    const waitSeconds = loginLimiter.getRetryAfterSeconds(limiterKey);

    if (waitSeconds > 0) {
      return sendLocked(res, waitSeconds);
    }

    const [rows] = await pool.query(
      'SELECT user_id, password_hash FROM users WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản.',
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(
      current_password,
      user.password_hash
    );

    if (!isMatch) {
      const lockSeconds = loginLimiter.recordFailure(limiterKey);

      if (lockSeconds > 0) {
        return sendLocked(res, lockSeconds);
      }

      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác.',
      });
    }

    loginLimiter.reset(limiterKey);

    const newPasswordHash = await bcrypt.hash(
      new_password,
      10
    );

    await pool.query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [newPasswordHash, userId]
    );

    // Token cũ bị vô hiệu sau khi đổi mật khẩu, nên cấp token mới
    // để người dùng đang đăng nhập không bị văng ra.
    const [updatedRows] = await pool.query(
      `SELECT
         u.user_id, u.username, u.full_name, u.role,
         u.department_id, d.department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.department_id
       WHERE u.user_id = ?
       LIMIT 1`,
      [userId]
    );

    const updatedUser = updatedRows[0];

    const newToken = signToken({
      user_id: updatedUser.user_id,
      username: updatedUser.username,
      full_name: updatedUser.full_name,
      role: updatedUser.role,
      department_id: updatedUser.department_id,
      department_name: updatedUser.department_name,
      pwv: passwordVersion(newPasswordHash),
    });

    return res.json({
      success: true,
      message: 'Đổi mật khẩu thành công.',
      data: { token: newToken },
    });
  } catch (err) {
    console.error('Lỗi đổi mật khẩu:', err);

    return res.status(500).json({
      success: false,
      message: 'Không thể đổi mật khẩu.',
    });
  }
}

module.exports = {
  login,
  changePassword,
};


