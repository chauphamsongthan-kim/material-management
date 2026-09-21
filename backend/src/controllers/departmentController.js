// =========================================
// CONTROLLER: DEPARTMENTS
// =========================================

const { pool } = require('../config/database');

// GET /api/departments -> Lấy 6 ban
async function getDepartments(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
         department_id,
         CAST(department_name AS BINARY) AS department_name
       FROM departments
       ORDER BY department_id ASC`
    );

    const departments = rows.map((row) => ({
      department_id: row.department_id,
      department_name: Buffer.from(row.department_name).toString('utf8'),
    }));

    return res.json({
      success: true,
      data: departments,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ.',
    });
  }
}

// GET /api/departments/:id/devices -> Lấy thiết bị theo ban
async function getDevicesByDepartment(req, res) {
  try {
    const departmentId = req.params.id;

    const [rows] = await pool.query(
      `SELECT
         device_id,
         department_id,
         device_name,
         device_type,
         original_quantity,
         current_quantity
       FROM devices
       WHERE department_id = ?
       ORDER BY device_id ASC`,
      [departmentId]
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
  getDepartments,
  getDevicesByDepartment,
};