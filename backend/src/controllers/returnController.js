// =========================================
// CONTROLLER: RETURN (Trả thiết bị)
// =========================================

const { pool } = require('../config/database');

// POST /api/devices/:id/return -> Trả thiết bị
async function returnDevice(req, res) {
  const connection = await pool.getConnection();

  try {
    const deviceId = req.params.id;

    const {
      borrow_id,
      returner_name,
      returned_quantity,
    } = req.body;

    if (
      !borrow_id ||
      !returner_name ||
      !returned_quantity
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Vui lòng nhập đầy đủ borrow_id, Người trả, Số lượng trả.',
      });
    }

    const qty = Number(returned_quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng trả phải lớn hơn 0.',
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

    // =========================================
    // KIỂM TRA QUYỀN TRẢ THIẾT BỊ
    // =========================================
    // ADMIN:
    // - Được trả thiết bị của tất cả các ban.
    //
    // HEAD:
    // - Chỉ được trả thiết bị thuộc ban của mình.
    // =========================================

    if (
      req.user.role !== 'ADMIN' &&
      (
        req.user.role !== 'HEAD' ||
        req.user.department_id !== device.department_id
      )
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          'Bạn không có quyền trả thiết bị của ban này.',
      });
    }

    // =========================================
    // TÍNH SỐ LƯỢNG CÒN PHẢI TRẢ
    // =========================================
    // Lấy đúng borrow_id để xác định đợt mượn.
    // Đồng thời lấy ngày mượn gốc.
    // =========================================

    const [summaryRows] = await connection.query(
      `SELECT
          MIN(borrow_date) AS borrow_date,
          SUM(borrowed_quantity) AS total_borrowed,
          SUM(returned_quantity) AS total_returned
       FROM device_history
       WHERE device_id = ? AND borrow_id = ?`,
      [deviceId, borrow_id]
    );

    const summary = summaryRows[0];

    if (
      !summary ||
      summary.total_borrowed === null
    ) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          'Không tìm thấy đợt mượn (borrow_id) tương ứng cho thiết bị này.',
      });
    }

    const remaining =
      Number(summary.total_borrowed) -
      Number(summary.total_returned);

    // Không cho trả vượt quá số lượng còn phải trả.
    if (qty > remaining) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          `Số lượng trả (${qty}) vượt quá số lượng còn phải trả (${remaining}).`,
      });
    }

    // =========================================
    // TỰ ĐỘNG GHI NHẬN NGÀY TRẢ
    // =========================================
    const returnDate = new Date();

    // =========================================
    // GHI NHẬN LẦN TRẢ
    // =========================================
    // borrow_id giữ nguyên để liên kết với đợt mượn.
    // borrower_name = NULL vì đây là dòng trả.
    // borrowed_quantity = 0 vì đây không phải lần mượn.
    // Ngày mượn lấy từ đợt mượn gốc.
    // Ngày trả được hệ thống tự động ghi nhận.
    // =========================================

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
       VALUES (?, ?, NULL, ?, 0, ?, ?, ?)`,
      [
        borrow_id,
        deviceId,
        returner_name.trim(),
        qty,
        summary.borrow_date,
        returnDate,
      ]
    );

    // Cộng lại số lượng thiết bị hiện tại.
    await connection.query(
      `UPDATE devices
       SET current_quantity = current_quantity + ?
       WHERE device_id = ?`,
      [qty, deviceId]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Trả thiết bị thành công.',
      data: {
        remaining_after: remaining - qty,
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

module.exports = {
  returnDevice,
};