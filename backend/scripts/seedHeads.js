const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');

const HEAD_PASSWORD = 'head123';

const headAccounts = [
  {
    username: 'Truongban_haucan',
    full_name: 'Trưởng ban Hậu Cần',
    department_name: 'Ban Hậu Cần',
  },
  {
    username: 'Truongban_kithuat',
    full_name: 'Trưởng ban Kỹ Thuật',
    department_name: 'Ban Kỹ Thuật',
  },
  {
    username: 'Truongban_truyenthong',
    full_name: 'Trưởng ban Truyền Thông',
    department_name: 'Ban Truyền Thông',
  },
  {
    username: 'Truongban_thuky',
    full_name: 'Trưởng ban Thư Ký',
    department_name: 'Ban Thư Ký',
  },
  {
    username: 'Truongban_yte',
    full_name: 'Trưởng ban Y Tế',
    department_name: 'Ban Y Tế',
  },
  {
    username: 'Truongban_dieuphoi',
    full_name: 'Trưởng ban Điều Phối',
    department_name: 'Ban Điều Phối',
  },
];

async function seedHeads() {
  try {
    console.log('=========================================');
    console.log('TẠO TÀI KHOẢN HEAD');
    console.log('=========================================');

    const passwordHash = await bcrypt.hash(
      HEAD_PASSWORD,
      10
    );

    for (const account of headAccounts) {
      // Tìm Ban
      const [departmentRows] = await pool.query(
        `SELECT department_id
         FROM departments
         WHERE department_name = ?`,
        [account.department_name]
      );

      if (departmentRows.length === 0) {
        console.log(
          `❌ Không tìm thấy Ban: ${account.department_name}`
        );

        continue;
      }

      const departmentId =
        departmentRows[0].department_id;

      // Kiểm tra username đã tồn tại chưa
      const [userRows] = await pool.query(
        `SELECT user_id
         FROM users
         WHERE username = ?`,
        [account.username]
      );

      if (userRows.length > 0) {
        console.log(
          `⚠️  ${account.username} đã tồn tại → bỏ qua.`
        );

        continue;
      }

      // Kiểm tra Ban đã có HEAD chưa
      const [headRows] = await pool.query(
        `SELECT user_id, username
         FROM users
         WHERE role = 'HEAD'
           AND department_id = ?`,
        [departmentId]
      );

      if (headRows.length > 0) {
        console.log(
          `⚠️  ${account.department_name} đã có HEAD (${headRows[0].username}) → bỏ qua.`
        );

        continue;
      }

      // Tạo tài khoản HEAD
      await pool.query(
        `INSERT INTO users
          (
            full_name,
            username,
            password_hash,
            role,
            department_id
          )
         VALUES (?, ?, ?, 'HEAD', ?)`,
        [
          account.full_name,
          account.username,
          passwordHash,
          departmentId,
        ]
      );

      console.log(
        `✅ Đã tạo ${account.username} → ${account.department_name}`
      );
    }

    console.log('');
    console.log('=========================================');
    console.log('HOÀN TẤT');
    console.log('Mật khẩu các tài khoản HEAD: head123');
    console.log('=========================================');
  } catch (error) {
    console.error('❌ Lỗi tạo tài khoản HEAD:', error);
  } finally {
    await pool.end();
  }
}

seedHeads();