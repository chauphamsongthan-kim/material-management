// =========================================
// CONTROLLER: DEVICES
// =========================================

const { pool } = require('../config/database');
const { canManageDepartment } = require('../utils/permissions');

// POST /api/departments/:id/devices -> Thêm thiết bị
// (quyền đã được kiểm tra qua middleware requireManageDepartmentFromParams)
async function addDevice(req, res) {
  try {
    const departmentId = req.params.id;
    const { device_name, device_type, original_quantity } = req.body;

    if (!device_name || !device_type || original_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ Tên thiết bị, Loại thiết bị, Số lượng gốc.',
      });
    }

    const quantity = Number(original_quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng gốc phải lớn hơn 0.',
      });
    }

    // current_quantity tự động bằng original_quantity khi tạo mới
    const [result] = await pool.query(
      `INSERT INTO devices (department_id, device_name, device_type, original_quantity, current_quantity)
       VALUES (?, ?, ?, ?, ?)`,
      [departmentId, device_name, device_type, quantity, quantity]
    );

    return res.status(201).json({
      success: true,
      message: 'Thêm thiết bị thành công.',
      data: { device_id: result.insertId },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
}

// GET /api/devices/:id -> Chi tiết thiết bị
async function getDeviceById(req, res) {
  try {
    const deviceId = req.params.id;

    const [rows] = await pool.query(
      `SELECT devices.*, departments.department_name
       FROM devices
       JOIN departments ON devices.department_id = departments.department_id
       WHERE devices.device_id = ?`,
      [deviceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị.' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
}

// PUT /api/devices/:id -> Sửa thiết bị
async function updateDevice(req, res) {
  try {
    const deviceId = req.params.id;
    const { device_name, device_type, original_quantity } = req.body;

    const [rows] = await pool.query('SELECT * FROM devices WHERE device_id = ?', [deviceId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị.' });
    }

    const device = rows[0];

    // Kiểm tra quyền: ADMIN hoặc HEAD của đúng ban sở hữu thiết bị
    if (!canManageDepartment(req.user, device.department_id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền Sửa thiết bị của ban này.',
      });
    }

    let newOriginalQuantity = device.original_quantity;
    let newCurrentQuantity = device.current_quantity;

    // Chỉ cho sửa Số lượng gốc khi toàn bộ thiết bị đã được trả đủ
    if (
      original_quantity !== undefined &&
      Number(original_quantity) !== device.original_quantity
    ) {
      if (device.current_quantity !== device.original_quantity) {
        return res.status(400).json({
          success: false,
          message: 'Không thể sửa Số lượng gốc vì vẫn còn thiết bị chưa được trả.',
        });
      }
      const quantity = Number(original_quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Số lượng gốc phải lớn hơn 0.',
        });
      }
      newOriginalQuantity = quantity;
      newCurrentQuantity = quantity;
    }

    const newDeviceName = device_name !== undefined ? device_name : device.device_name;
    const newDeviceType = device_type !== undefined ? device_type : device.device_type;

    await pool.query(
      `UPDATE devices
       SET device_name = ?, device_type = ?, original_quantity = ?, current_quantity = ?
       WHERE device_id = ?`,
      [newDeviceName, newDeviceType, newOriginalQuantity, newCurrentQuantity, deviceId]
    );

    return res.json({ success: true, message: 'Cập nhật thiết bị thành công.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
}

// DELETE /api/devices/:id -> Xóa thiết bị
async function deleteDevice(req, res) {
  try {
    const deviceId = req.params.id;

    const [rows] = await pool.query('SELECT * FROM devices WHERE device_id = ?', [deviceId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị.' });
    }

    const device = rows[0];

    if (!canManageDepartment(req.user, device.department_id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền Xóa thiết bị của ban này.',
      });
    }

    // Chỉ được xóa khi current_quantity = original_quantity
    if (device.current_quantity !== device.original_quantity) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa thiết bị vì vẫn còn thiết bị chưa được trả.',
      });
    }

    // ON DELETE CASCADE sẽ tự xóa toàn bộ device_history liên quan
    await pool.query('DELETE FROM devices WHERE device_id = ?', [deviceId]);

    return res.json({ success: true, message: 'Xóa thiết bị thành công.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
}

// GET /api/devices/search?q= -> Tìm kiếm thiết bị trên toàn bộ 6 ban
async function searchDevices(req, res) {
  try {
    const q = req.query.q || '';

    const [rows] = await pool.query(
      `SELECT devices.*, departments.department_name
       FROM devices
       JOIN departments ON devices.department_id = departments.department_id
       WHERE devices.device_name LIKE ?
       ORDER BY devices.device_name ASC`,
      [`%${q}%`]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
}

module.exports = {
  addDevice,
  getDeviceById,
  updateDevice,
  deleteDevice,
  searchDevices,
};
