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

// Admin cấp 1/cấp 2
async function ensureAdminLevels(conn) {
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
}

module.exports = { ensureAdminLevels };
