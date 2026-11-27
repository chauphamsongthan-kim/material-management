// =========================================
// TỰ ĐỘNG CẬP NHẬT CẤU TRÚC DATABASE KHI KHỞI ĐỘNG
// =========================================
// Chạy an toàn nhiều lần (idempotent): chỉ thêm cái còn thiếu.

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function indexExists(conn, table, indexName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
     LIMIT 1`,
    [table, indexName]
  );
  return rows.length > 0;
}

// Admin cấp 1/cấp 2 + Gmail khôi phục tài khoản
async function ensureAdminLevelsAndEmail(conn) {
  if (!(await columnExists(conn, 'users', 'admin_level'))) {
    await conn.query(
      `ALTER TABLE users
         ADD COLUMN admin_level TINYINT NOT NULL DEFAULT 1 AFTER role`
    );

    // Lần đầu thêm cột: Admin được tạo đầu tiên (tài khoản gốc) thành cấp 2.
    // Các Admin còn lại (nếu có) là cấp 1.
    const [first] = await conn.query(
      `SELECT user_id FROM users WHERE role = 'ADMIN'
       ORDER BY user_id ASC LIMIT 1`
    );
    if (first.length > 0) {
      await conn.query('UPDATE users SET admin_level = 2 WHERE user_id = ?', [
        first[0].user_id,
      ]);
      console.log(
        `✅ Đã đặt tài khoản Admin gốc (user_id=${first[0].user_id}) thành Admin cấp 2.`
      );
    }
  }

  if (!(await columnExists(conn, 'users', 'email'))) {
    await conn.query(
      'ALTER TABLE users ADD COLUMN email VARCHAR(254) NULL AFTER admin_level'
    );
  }

  if (!(await columnExists(conn, 'users', 'email_verified_at'))) {
    await conn.query(
      'ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL AFTER email'
    );
  }

  if (!(await indexExists(conn, 'users', 'uq_users_email'))) {
    await conn.query(
      'ALTER TABLE users ADD UNIQUE KEY uq_users_email (email)'
    );
  }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS email_codes (
      code_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      purpose ENUM('LINK_EMAIL', 'RESET_PASSWORD') NOT NULL,
      email VARCHAR(254) NOT NULL,
      code_hash CHAR(64) NOT NULL,
      attempts TINYINT NOT NULL DEFAULT 0,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email_codes_user_purpose (user_id, purpose),
      CONSTRAINT fk_email_codes_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

module.exports = { ensureAdminLevelsAndEmail };
