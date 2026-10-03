
// =========================================
// CONTROLLER: DEVICES
// =========================================

const { pool } = require('../config/database');
const { canManageDepartment } = require('../utils/permissions');
const {
  saveDeviceImage,
  deleteDeviceImage,
} = require('../utils/imageStorage');

// POST /api/departments/:id/devices -> Thêm thiết bị
// Quyền đã được kiểm tra qua middleware requireManageDepartmentFromParams
async function addDevice(req, res) {
  let savedImage = null;

  try {
    const departmentId = req.params.id;
    const { device_name, device_type, original_quantity, notes = '' } = req.body;

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

    // Lưu và nén ảnh nếu người dùng có tải ảnh lên
    if (req.file) {
      savedImage = await saveDeviceImage(req.file);
    }

    const imageUrl = savedImage ? savedImage.imageUrl : null;

    // current_quantity tự động bằng original_quantity khi tạo mới
    const [result] = await pool.query(
      `INSERT INTO devices
      (
        department_id,
        device_name,
        device_type,
        original_quantity,
        current_quantity,
        notes,
        image_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        departmentId,
        device_name,
        device_type,
        quantity,
        quantity,
        notes,
        imageUrl,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Thêm thiết bị thành công.',
      data: { device_id: result.insertId },
    });
  } catch (err) {
    console.error(err);

    // Dọn ảnh nếu đã lưu nhưng thêm thiết bị vào DB thất bại
    if (savedImage) {
      try {
        await deleteDeviceImage(savedImage.imageUrl);
      } catch (cleanupError) {
        console.error('Không thể xóa ảnh vừa tải lên:', cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ.',
    });
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
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thiết bị.',
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ.',
    });
  }
}

// PUT /api/devices/:id -> Sửa thiết bị
async function updateDevice(req, res) {
  let savedImage = null;

  try {
    const deviceId = req.params.id;
    const { device_name, device_type, original_quantity, notes } = req.body;

    const [rows] = await pool.query(
      'SELECT * FROM devices WHERE device_id = ?',
      [deviceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thiết bị.',
      });
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

    const newDeviceName =
      device_name !== undefined ? device_name : device.device_name;

    const newDeviceType =
      device_type !== undefined ? device_type : device.device_type;

    const newNotes =
      notes !== undefined ? notes : device.notes;

    // Chỉ lưu ảnh mới khi người dùng có chọn ảnh
    if (req.file) {
      savedImage = await saveDeviceImage(req.file);
    }

    // Không chọn ảnh mới thì giữ nguyên ảnh hiện tại
    const newImageUrl = savedImage
      ? savedImage.imageUrl
      : device.image_url;

    await pool.query(
      `UPDATE devices
       SET device_name = ?,
           device_type = ?,
           original_quantity = ?,
           current_quantity = ?,
           notes = ?,
           image_url = ?
       WHERE device_id = ?`,
      [
        newDeviceName,
        newDeviceType,
        newOriginalQuantity,
        newCurrentQuantity,
        newNotes,
        newImageUrl,
        deviceId,
      ]
    );

    // Xóa ảnh cũ sau khi DB đã cập nhật thành công
    if (savedImage && device.image_url) {
      try {
        await deleteDeviceImage(device.image_url);
      } catch (cleanupError) {
        console.error('Không thể xóa ảnh cũ:', cleanupError);
      }
    }

    return res.json({
      success: true,
      message: 'Cập nhật thiết bị thành công.',
    });
  } catch (err) {
    console.error(err);

    // Dọn ảnh mới nếu cập nhật DB thất bại
    if (savedImage) {
      try {
        await deleteDeviceImage(savedImage.imageUrl);
      } catch (cleanupError) {
        console.error('Không thể xóa ảnh mới:', cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ.',
    });
  }
}

// DELETE /api/devices/:id -> Xóa thiết bị
async function deleteDevice(req, res) {
  try {
    const deviceId = req.params.id;

    const [rows] = await pool.query(
      'SELECT * FROM devices WHERE device_id = ?',
      [deviceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thiết bị.',
      });
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

    // Xóa thiết bị trong DB trước
    await pool.query(
      'DELETE FROM devices WHERE device_id = ?',
      [deviceId]
    );

    // Xóa ảnh liên quan; lỗi xóa ảnh không làm thay đổi kết quả DB
    if (device.image_url) {
      try {
        await deleteDeviceImage(device.image_url);
      } catch (cleanupError) {
        console.error('Không thể xóa ảnh thiết bị:', cleanupError);
      }
    }

    return res.json({
      success: true,
      message: 'Xóa thiết bị thành công.',
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ.',
    });
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
          OR devices.device_type LIKE ?
       ORDER BY devices.device_name ASC`,
      [`%${q}%`, `%${q}%`]
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
  addDevice,
  getDeviceById,
  updateDevice,
  deleteDevice,
  searchDevices,
};