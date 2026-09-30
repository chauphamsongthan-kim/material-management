// =========================================
// CONTROLLER: BORROW (Mượn thiết bị)
// =========================================

const crypto = require('crypto');
const { pool } = require('../config/database');

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

    // Tìm HEAD của ban sở hữu thiết bị
    const [headRows] = await pool.query(
      `SELECT user_id
      FROM users
      WHERE role = 'HEAD' AND department_id = ?`,
      [device.department_id]
    );

    // Tạo thông báo cho HEAD của ban
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