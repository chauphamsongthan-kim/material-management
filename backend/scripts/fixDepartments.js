// =========================================
// SCRIPT: SỬA TÊN 6 BAN TRÊN DATABASE
// =========================================

require('dotenv').config();

const { pool } = require('../src/config/database');

const correctDepartments = [
  {
    id: 1,
    name: 'Ban Hậu Cần',
  },
  {
    id: 2,
    name: 'Ban Kỹ Thuật',
  },
  {
    id: 3,
    name: 'Ban Truyền Thông',
  },
  {
    id: 4,
    name: 'Ban Thư Ký',
  },
  {
    id: 5,
    name: 'Ban Y Tế',
  },
  {
    id: 6,
    name: 'Ban Điều Phối',
  },
];

async function fixDepartments() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    console.log('🔧 Bắt đầu sửa tên 6 Ban...');

    for (const department of correctDepartments) {
      await connection.query(
        `
        UPDATE departments
        SET department_name = ?
        WHERE department_id = ?
        `,
        [department.name, department.id]
      );

      console.log(
        `✅ #${department.id} -> ${department.name}`
      );
    }

    await connection.commit();

    console.log('');
    console.log('🎉 Đã sửa xong 6 tên Ban.');

    const [rows] = await connection.query(
      `
      SELECT
        department_id,
        department_name,
        HEX(department_name) AS hex
      FROM departments
      ORDER BY department_id
      `
    );

    console.log('');
    console.table(rows);
  } catch (error) {
    await connection.rollback();

    console.error('❌ Không thể sửa dữ liệu:', error.message);

    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

fixDepartments();