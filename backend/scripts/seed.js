// =========================================
// SCRIPT: TẠO TÀI KHOẢN ADMIN BAN ĐẦU
// Chạy: npm run seed
// =========================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');

async function seed() {
  try {
    const username = 'admin';
    const plainPassword = 'admin123'; // ĐỔI MẬT KHẨU NÀY SAU KHI ĐĂNG NHẬP LẦN ĐẦU
    const fullName = 'Administrator';

    const [existing] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (existing.length > 0) {
      console.log('⚠️  Tài khoản admin đã tồn tại, bỏ qua.');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await pool.query(
      `INSERT INTO users (full_name, username, password_hash, role, department_id)
       VALUES (?, ?, ?, 'ADMIN', NULL)`,
      [fullName, username, passwordHash]
    );

    console.log('✅ Đã tạo tài khoản Admin:');
    console.log(`   username: ${username}`);
    console.log(`   password: ${plainPassword}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khi tạo tài khoản admin:', err.message);
    process.exit(1);
  }
}

seed();
