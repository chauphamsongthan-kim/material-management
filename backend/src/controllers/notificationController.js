
// =========================================
// CONTROLLER: NOTIFICATIONS (Thông báo)
// =========================================

const { pool } = require('../config/database');

// GET /api/notifications
// Lấy danh sách thông báo của tài khoản đang đăng nhập
async function getNotifications(req, res) {
  try {
    const userId = req.user.user_id;

    const [rows] = await pool.query(
      `SELECT
          notification_id,
          recipient_id,
          device_id,
          borrower_name,
          device_name,
          borrowed_quantity,
          message,
          is_read,
          created_at
       FROM notifications
       WHERE recipient_id = ?
       ORDER BY created_at DESC, notification_id DESC`,
      [userId]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE recipient_id = ? AND is_read = FALSE`,
      [userId]
    );

    return res.json({
      success: true,
      data: rows,
      unread_count: countRows[0].unread_count,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Không thể tải thông báo.',
    });
  }
}

// PATCH /api/notifications/:id/read
// Đánh dấu một thông báo là đã đọc
async function markNotificationRead(req, res) {
  try {
    const userId = req.user.user_id;
    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ.',
      });
    }

    const [result] = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE notification_id = ? AND recipient_id = ?`,
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo.',
      });
    }

    return res.json({
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc.',
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thông báo.',
    });
  }
}

  // DELETE /api/notifications/:id
  // Xóa một thông báo của tài khoản đang đăng nhập
  async function deleteNotification(req, res) {
    try {
      const userId = req.user.user_id;
      const notificationId = Number(req.params.id);

      if (!Number.isInteger(notificationId) || notificationId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID thông báo không hợp lệ.',
        });
      }

      const [result] = await pool.query(
        `DELETE FROM notifications
        WHERE notification_id = ? AND recipient_id = ?`,
        [notificationId, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo.',
        });
      }

      return res.json({
        success: true,
        message: 'Đã xóa thông báo.',
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: 'Không thể xóa thông báo.',
      });
    }
  }

module.exports = {
  getNotifications,
  markNotificationRead,
  deleteNotification,
};