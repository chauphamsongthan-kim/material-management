// =========================================
// KẾT NỐI MYSQL (connection pool)
// =========================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // trả DATE dạng 'YYYY-MM-DD' thay vì object Date
  charset: 'utf8mb4',
});

// Kiểm tra kết nối khi khởi động server
async function testConnection() {
  try {
    const conn = await pool.getConnection();

    const [rows] = await conn.query(`
      SELECT
        DATABASE() AS database_name,
        @@hostname AS mysql_host,
        @@port AS mysql_port
    `);

    const [tables] = await conn.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'notifications'
    `);

    console.log('✅ Kết nối MySQL thành công.');
    console.log('📌 Database:', rows[0].database_name);
    console.log('📌 MySQL host:', rows[0].mysql_host);
    console.log('📌 MySQL port:', rows[0].mysql_port);
    console.log('📌 Bảng notifications:', tables.length > 0 ? 'Tồn tại' : 'Không tồn tại');

    conn.release();
  } catch (err) {
    console.error('❌ Kết nối MySQL thất bại:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
