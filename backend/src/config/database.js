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
  let conn;

  try {
    conn = await pool.getConnection();

    const [dbRows] = await conn.query(
      'SELECT DATABASE() AS database_name, @@hostname AS mysql_host'
    );

    console.log('✅ Kết nối MySQL thành công.');
    console.log('📌 Database:', dbRows[0].database_name);
    console.log('📌 MySQL host:', dbRows[0].mysql_host);

    // Tạo bảng notifications nếu bảng chưa tồn tại
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_id INT NOT NULL,
        device_id INT NULL,
        borrower_name VARCHAR(100) NOT NULL,
        device_name VARCHAR(255) NOT NULL,
        borrowed_quantity INT NOT NULL,
        message VARCHAR(500) NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notifications_recipient_id (recipient_id),
        INDEX idx_notifications_device_id (device_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ Đã kiểm tra/tạo bảng notifications.');

    // Liệt kê các bảng sau khi kiểm tra/tạo notifications
    const [tableRows] = await conn.query('SHOW TABLES');

    console.log(
      '📌 Tables:',
      tableRows.map((row) => Object.values(row)[0]).join(', ')
    );
  } catch (err) {
    console.error('❌ Kết nối hoặc kiểm tra MySQL thất bại:', err.message);
    process.exitCode = 1;
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

module.exports = { pool, testConnection };