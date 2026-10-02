
// =========================================
// CONTROLLER: NOTIFICATIONS (Thông báo)
// =========================================

const { pool } = require('../config/database');

const { sendPushToUsers } = require('../utils/pushService');

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
          notification_type,
          title,
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
// Đánh dấu một thông báo của tài khoản đang đăng nhập là đã đọc
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

// POST /api/notifications
// ADMIN gửi thông báo đến các tài khoản được chọn
async function sendAdminNotification(req, res) {
  // Kiểm tra quyền lần nữa ở controller
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ Admin mới có quyền gửi thông báo.',
    });
  }

  const title =
    typeof req.body.title === 'string' ? req.body.title.trim() : '';
  const message =
    typeof req.body.message === 'string' ? req.body.message.trim() : '';
  const rawRecipientIds = req.body.recipient_ids;

  if (!title || title.length > 200) {
    return res.status(400).json({
      success: false,
      message: 'Tiêu đề không được để trống và tối đa 200 ký tự.',
    });
  }

  if (!message || message.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Nội dung không được để trống và tối đa 500 ký tự.',
    });
  }

  if (!Array.isArray(rawRecipientIds) || rawRecipientIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng chọn ít nhất một tài khoản nhận thông báo.',
    });
  }

  const recipientIds = [...new Set(rawRecipientIds.map(Number))];

  if (
    recipientIds.some(
      (id) => !Number.isInteger(id) || id <= 0
    )
  ) {
    return res.status(400).json({
      success: false,
      message: 'Danh sách tài khoản nhận không hợp lệ.',
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const placeholders = recipientIds.map(() => '?').join(', ');

    const [users] = await connection.query(
      `SELECT user_id
       FROM users
       WHERE user_id IN (${placeholders})`,
      recipientIds
    );

    const foundIds = new Set(users.map((user) => Number(user.user_id)));
    const missingIds = recipientIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: 'Một hoặc nhiều tài khoản nhận không tồn tại.',
        missing_recipient_ids: missingIds,
      });
    }

    for (const recipientId of recipientIds) {
      await connection.query(
        `INSERT INTO notifications
          (
            recipient_id,
            device_id,
            borrower_name,
            device_name,
            borrowed_quantity,
            notification_type,
            title,
            message
          )
         VALUES (?, NULL, NULL, NULL, NULL, 'ADMIN', ?, ?)`,
        [recipientId, title, message]
      );
    }

  await connection.commit();

    // Gửi Push một lần cho toàn bộ tài khoản được chọn.
    // pushService sẽ gộp các tài khoản dùng chung endpoint,
    // để mỗi thiết bị chỉ nhận tối đa một Push cho sự kiện này.
    // Push lỗi không làm mất thông báo đã lưu trong MySQL.
    try {
      const pushResult = await sendPushToUsers(recipientIds, {
        title,
        body: message,
        url: '/',
      });

      console.log('Kết quả gửi Push:', pushResult);
    } catch (pushError) {
      console.error(
        'Không thể gửi Push thông báo ADMIN:',
        pushError.message || pushError
      );
    }

  return res.status(201).json({
      success: true,
      message: 'Đã gửi thông báo đến các tài khoản được chọn.',
      recipient_count: recipientIds.length,
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Lỗi rollback thông báo:', rollbackError);
      }
    }

    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Không thể gửi thông báo.',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
  deleteNotification,
  sendAdminNotification,
};