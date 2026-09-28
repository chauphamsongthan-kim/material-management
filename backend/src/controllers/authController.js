// =========================================
// CONTROLLER: AUTHENTICATION
// =========================================

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { signToken } = require('../utils/jwt');

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

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sai tên đăng nhập hoặc mật khẩu.',
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Sai tên đăng nhập hoặc mật khẩu.',
      });
    }

    const tokenPayload = {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      department_id: user.department_id,
      department_name: user.department_name,
    };

    const token = signToken(tokenPayload);

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

    if (current_password === new_password) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
      });
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
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác.',
      });
    }

    const newPasswordHash = await bcrypt.hash(
      new_password,
      10
    );

    await pool.query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [newPasswordHash, userId]
    );

    return res.json({
      success: true,
      message: 'Đổi mật khẩu thành công.',
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


