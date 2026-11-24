// =========================================
// SCRIPT: TẠO TÀI KHOẢN ADMIN BAN ĐẦU
// Chạy: npm run seed
// =========================================
// Mật khẩu KHÔNG được ghi cứng trong mã nguồn:
// - Đặt SEED_ADMIN_PASSWORD trong .env để tự chọn mật khẩu, hoặc
// - Bỏ trống: script tự sinh mật khẩu ngẫu nhiên và in ra MỘT LẦN duy nhất.
// Hãy lưu mật khẩu này lại và đổi sau khi đăng nhập.

require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');

async function seed() {
  try {
    const username = process.env.SEED_ADMIN_USERNAME || 'admin';
    const fullName = 'Administrator';

    const providedPassword = process.env.SEED_ADMIN_PASSWORD;

    if (providedPassword && providedPassword.length < 8) {
      console.error('❌ SEED_ADMIN_PASSWORD phải có ít nhất 8 ký tự.');
      process.exit(1);
    }

    const plainPassword =
      providedPassword || crypto.randomBytes(12).toString('base64url');

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

    if (providedPassword) {
      console.log('   password: (đúng giá trị SEED_ADMIN_PASSWORD bạn đã đặt)');
    } else {
      console.log(`   password: ${plainPassword}`);
      console.log('   ⚠️  Mật khẩu này chỉ hiện một lần. Hãy lưu lại và đổi sau khi đăng nhập.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khi tạo tài khoản admin:', err.message);
    process.exit(1);
  }
}

seed();
