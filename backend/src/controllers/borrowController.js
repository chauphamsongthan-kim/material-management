// =========================================
// CONTROLLER: BORROW (Mượn thiết bị)
// =========================================

const crypto = require('crypto');
const { pool } = require('../config/database');

const { sendPushToUsers } = require('../utils/pushService');

function getVietnamDateTime() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

// POST /api/devices/:id/borrow -> Mượn thiết bị
async function borrowDevice(req, res) {
  const connection = await pool.getConnection();

  try {
    const deviceId = req.params.id;

    const { borrower_name, borrowed_quantity } = req.body;

    if (!borrower_name || !borrowed_quantity) {
      return res.status(400).json({
        success: false,
        message:
          'Vui lòng nhập đầy đủ Người mượn, Số lượng mượn.',
      });
    }

    if (
      typeof borrower_name !== 'string' ||
      !borrower_name.trim() ||
      borrower_name.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Tên người mượn không hợp lệ (tối đa 100 ký tự).',
      });
    }

    const qty = Number(borrowed_quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng mượn phải lớn hơn 0.',
      });
    }

    await connection.beginTransaction();

    const [deviceRows] = await connection.query(
      'SELECT * FROM devices WHERE device_id = ? FOR UPDATE',
      [deviceId]
    );

    if (deviceRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thiết bị.',
      });
    }

    const device = deviceRows[0];

    if (qty > device.current_quantity) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          `Số lượng mượn (${qty}) vượt quá số lượng hiện có (${device.current_quantity}).`,
      });
    }

    // =========================================
    // TỰ ĐỘNG GHI NHẬN NGÀY MƯỢN
    // =========================================
    const borrowDate = getVietnamDateTime();

    const borrowId = crypto.randomUUID();

    await connection.query(
      `INSERT INTO device_history
        (
          borrow_id,
          device_id,
          borrower_name,
          returner_name,
          borrowed_quantity,
          returned_quantity,
          borrow_date,
          return_date
        )
       VALUES (?, ?, ?, NULL, ?, 0, ?, NULL)`,
      [
        borrowId,
        deviceId,
        borrower_name.trim(),
        qty,
        borrowDate,
      ]
    );

    await connection.query(
      `UPDATE devices
       SET current_quantity = current_quantity - ?
       WHERE device_id = ?`,
      [qty, deviceId]
    );

    await connection.commit();

    // =========================================
    // THÔNG BÁO CHO HEAD CỦA BAN
    // =========================================
    // Việc mượn đã được lưu (commit) ở trên. Mọi lỗi ở bước thông báo / Push
    // chỉ được ghi log, KHÔNG được làm người dùng thấy lỗi - nếu không họ sẽ
    // tưởng chưa mượn được và bấm mượn lần hai.
    try {
      const [headRows] = await pool.query(
        `SELECT user_id
         FROM users
         WHERE role = 'HEAD' AND department_id = ?`,
        [device.department_id]
      );

      if (headRows.length > 0) {
        const recipientId = headRows[0].user_id;
        const borrowerName = borrower_name.trim();
        const deviceName = device.device_name;
        const message = `${borrowerName} đã mượn ${qty} ${deviceName}`;

        await pool.query(
          `INSERT INTO notifications
            (recipient_id, device_id, borrower_name, device_name, borrowed_quantity, message)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            recipientId,
            deviceId,
            borrowerName,
            deviceName,
            qty,
            message,
          ]
        );

        // Push chỉ gửi cho HEAD của ban sở hữu thiết bị.
        // Lỗi Push không ảnh hưởng đến thông báo đã lưu.
        try {
          const pushResult = await sendPushToUsers([recipientId], {
            title: 'Có lượt mượn thiết bị mới',
            body: message,
            url: `/devices/${deviceId}`,
          });

          if (pushResult.failed > 0) {
            console.error(
              `Gửi Push thất bại trên ${pushResult.failed} thiết bị của HEAD ${recipientId}.`
            );
          }
        } catch (pushError) {
          console.error(
            `Không thể gửi Push đến HEAD ${recipientId}:`,
            pushError.message
          );
        }
      }
    } catch (notifyError) {
      console.error(
        'Đã mượn thành công nhưng không thể ghi thông báo cho HEAD:',
        notifyError
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Mượn thiết bị thành công.',
      data: {
        borrow_id: borrowId,
      },
    });
  } catch (err) {
    await connection.rollback();

    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ.',
    });
  } finally {
    connection.release();
  }
}

// GET /api/devices/:id/active-borrows
// -> Lấy các đợt mượn chưa trả đủ
async function getActiveBorrows(req, res) {
  try {
    const deviceId = req.params.id;

    const [rows] = await pool.query(
      `SELECT
          borrow_id,
          MAX(borrower_name) AS borrower_name,
          MIN(borrow_date) AS borrow_date,
          SUM(borrowed_quantity) AS total_borrowed,
          SUM(returned_quantity) AS total_returned,
          (
            SUM(borrowed_quantity) -
            SUM(returned_quantity)
          ) AS remaining_quantity
       FROM device_history
       WHERE device_id = ?
       GROUP BY borrow_id
       HAVING remaining_quantity > 0
       ORDER BY borrow_date ASC`,
      [deviceId]
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ.',
    });
  }
}

module.exports = {
  borrowDevice,
  getActiveBorrows,
};