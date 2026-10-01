// =========================================
// CONTROLLER: QUẢN LÝ TÀI KHOẢN
// Chỉ ADMIN được phép sử dụng
// =========================================

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// =========================================
// GET /api/users
// Lấy danh sách tài khoản
// =========================================

async function getUsers(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.user_id,
        u.full_name,
        u.username,
        u.role,
        u.department_id,
        d.department_name
      FROM users u
      LEFT JOIN departments d
        ON u.department_id = d.department_id
      ORDER BY u.user_id ASC
    `);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error('Lỗi lấy danh sách tài khoản:', err);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách tài khoản.',
    });
  }
}

// =========================================
// POST /api/users
// Tạo tài khoản mới
// =========================================

async function createUser(req, res) {
  try {
    const {
      full_name,
      username,
      password,
      role,
      department_id,
    } = req.body;

    // Kiểm tra thông tin bắt buộc
    if (!full_name || !username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin tài khoản.',
      });
    }

    // Chỉ cho phép các role hợp lệ
    const allowedRoles = ['ADMIN', 'HEAD', 'GUEST'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ.',
      });
    }

    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự.',
      });
    }

    // Username không được trùng
    const [existingUser] = await pool.query(
      'SELECT user_id FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Tên đăng nhập đã tồn tại.',
      });
    }

    // =========================================
    // ADMIN
    // Không cần department
    // =========================================

    if (role === 'ADMIN') {
      const passwordHash = await bcrypt.hash(password, 10);

      const [result] = await pool.query(
        `INSERT INTO users
          (full_name, username, password_hash, role, department_id)
         VALUES (?, ?, ?, 'ADMIN', NULL)`,
        [full_name, username, passwordHash]
      );

      return res.status(201).json({
        success: true,
        message: 'Đã tạo tài khoản ADMIN thành công.',
        data: {
          user_id: result.insertId,
          full_name,
          username,
          role: 'ADMIN',
          department_id: null,
        },
      });
    }

    // =========================================
// GUEST
// Không thuộc Ban, chỉ xem và mượn thiết bị
// =========================================

    if (role === 'GUEST') {
      const passwordHash = await bcrypt.hash(password, 10);

      const [result] = await pool.query(
        `INSERT INTO users
          (full_name, username, password_hash, role, department_id)
        VALUES (?, ?, ?, 'GUEST', NULL)`,
        [full_name, username, passwordHash]
      );

      return res.status(201).json({
        success: true,
        message: 'Đã tạo tài khoản GUEST thành công.',
        data: {
          user_id: result.insertId,
          full_name,
          username,
          role: 'GUEST',
          department_id: null,
        },
      });
    }


    // =========================================
    // HEAD
    // Bắt buộc phải có department
    // =========================================

    if (!department_id) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản HEAD phải thuộc một Ban.',
      });
    }

    // Kiểm tra Ban có tồn tại không
    const [departmentRows] = await pool.query(
      'SELECT department_id, department_name FROM departments WHERE department_id = ? LIMIT 1',
      [department_id]
    );

    if (departmentRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ban không tồn tại.',
      });
    }

    // Mỗi Ban chỉ có tối đa 1 HEAD
    const [existingHead] = await pool.query(
      `SELECT user_id, username
       FROM users
       WHERE role = 'HEAD'
         AND department_id = ?
       LIMIT 1`,
      [department_id]
    );

    if (existingHead.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ban này đã có HEAD.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users
        (full_name, username, password_hash, role, department_id)
       VALUES (?, ?, ?, 'HEAD', ?)`,
      [full_name, username, passwordHash, department_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Đã tạo tài khoản HEAD thành công.',
      data: {
        user_id: result.insertId,
        full_name,
        username,
        role: 'HEAD',
        department_id: Number(department_id),
        department_name: departmentRows[0].department_name,
      },
    });
  } catch (err) {
    console.error('Lỗi tạo tài khoản:', err);

    return res.status(500).json({
      success: false,
      message: 'Không thể tạo tài khoản.',
    });
  }
}

// =========================================
// PUT /api/users/:id/password
// ADMIN đổi/reset mật khẩu tài khoản
// =========================================

async function updateUserPassword(req, res) {
  try {
    const userId = Number(req.params.id);
    const { new_password } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID tài khoản không hợp lệ.',
      });
    }

    if (!new_password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu mới.',
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự.',
      });
    }

    const [users] = await pool.query(
      'SELECT user_id, username FROM users WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản.',
      });
    }

    const passwordHash = await bcrypt.hash(new_password, 10);

    await pool.query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [passwordHash, userId]
    );

    return res.json({
      success: true,
      message: 'Đã thay đổi mật khẩu tài khoản thành công.',
    });
  } catch (err) {
    console.error('Lỗi thay đổi mật khẩu tài khoản:', err);

    return res.status(500).json({
      success: false,
      message: 'Không thể thay đổi mật khẩu.',
    });
  }
}

// =========================================
// DELETE /api/users/:id
// ADMIN xóa tài khoản
// =========================================

async function deleteUser(req, res) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID tài khoản không hợp lệ.',
      });
    }

    // Không cho ADMIN tự xóa chính mình
    if (Number(req.user.user_id) === userId) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự xóa tài khoản của mình.',
      });
    }

    const [users] = await pool.query(
      'SELECT user_id, username, role FROM users WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản.',
      });
    }

    await pool.query(
      'DELETE FROM users WHERE user_id = ?',
      [userId]
    );

    return res.json({
      success: true,
      message: `Đã xóa tài khoản ${users[0].username}.`,
    });
  } catch (err) {
    console.error('Lỗi xóa tài khoản:', err);

    return res.status(500).json({
      success: false,
      message: 'Không thể xóa tài khoản.',
    });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUserPassword,
  deleteUser,
};