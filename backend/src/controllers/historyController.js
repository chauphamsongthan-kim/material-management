// =========================================
// CONTROLLER: HISTORY (Lịch sử mượn/trả)
// =========================================

const { pool } = require('../config/database');

// GET /api/devices/:id/history -> Xem lịch sử đầy đủ của thiết bị
async function getDeviceHistory(req, res) {
  try {
    const deviceId = req.params.id;

    const [rows] = await pool.query(
      `SELECT
          history_id,
          borrow_id,
          borrower_name,
          returner_name,
          borrowed_quantity,
          returned_quantity,
          borrow_date,
          return_date
       FROM device_history
       WHERE device_id = ?
       ORDER BY
          borrow_date ASC,
          borrow_id ASC,
          CASE
            WHEN borrowed_quantity > 0 THEN 0
            ELSE 1
          END ASC,
          history_id ASC`,
      [deviceId]
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error('Lỗi lấy lịch sử thiết bị:', err);

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ.',
    });
  }
}

module.exports = { getDeviceHistory };