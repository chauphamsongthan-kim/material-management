
const crypto = require('crypto');
const { pool } = require('../config/database');

// Kiểm tra và chuẩn hóa thông tin đăng ký Push
function validateSubscription(body) {
  const { endpoint, keys } = body || {};

  if (
    typeof endpoint !== 'string' ||
    !endpoint.trim() ||
    typeof keys?.p256dh !== 'string' ||
    !keys.p256dh.trim() ||
    typeof keys?.auth !== 'string' ||
    !keys.auth.trim()
  ) {
    return { valid: false };
  }

  let parsedEndpoint;

  try {
    parsedEndpoint = new URL(endpoint);
  } catch {
    return { valid: false };
  }

  if (parsedEndpoint.protocol !== 'https:') {
    return { valid: false };
  }

  const endpointHash = crypto
    .createHash('sha256')
    .update(endpoint)
    .digest('hex');

  return {
    valid: true,
    endpoint,
    endpointHash,
    p256dh: keys.p256dh,
    auth: keys.auth,
  };
}

function getValidEndpointHash(endpoint) {
  if (typeof endpoint !== 'string' || !endpoint.trim()) {
    return null;
  }

  try {
    const parsedEndpoint = new URL(endpoint);

    if (parsedEndpoint.protocol !== 'https:') {
      return null;
    }

    return crypto
      .createHash('sha256')
      .update(endpoint)
      .digest('hex');
  } catch {
    return null;
  }
}

// Đăng ký Push và bật cho tài khoản hiện tại
async function subscribeToPush(req, res) {
  try {
    const userId = req.user.user_id;
    const subscription = validateSubscription(req.body);

    if (!subscription.valid) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin đăng ký Push không hợp lệ.',
      });
    }

    const { endpoint, endpointHash, p256dh, auth } = subscription;

    await pool.query(
      `INSERT INTO push_subscriptions
        (user_id, endpoint, endpoint_hash, p256dh, auth, push_enabled)
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         endpoint = VALUES(endpoint),
         p256dh = VALUES(p256dh),
         auth = VALUES(auth),
         push_enabled = 1,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, endpoint, endpointHash, p256dh, auth]
    );

    return res.status(200).json({
      success: true,
      message: 'Đã bật thông báo đẩy cho tài khoản này.',
    });
  } catch (error) {
    console.error('Lỗi đăng ký Push:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Không thể đăng ký thông báo đẩy.',
    });
  }
}

// Liên kết thiết bị với tài khoản, không tự bật Push cho tài khoản
async function linkPushDevice(req, res) {
  try {
    const userId = req.user.user_id;
    const subscription = validateSubscription(req.body);

    if (!subscription.valid) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin đăng ký Push không hợp lệ.',
      });
    }

    const { endpoint, endpointHash, p256dh, auth } = subscription;

    await pool.query(
      `INSERT INTO push_subscriptions
        (user_id, endpoint, endpoint_hash, p256dh, auth, push_enabled)
       VALUES (?, ?, ?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE
         endpoint = VALUES(endpoint),
         p256dh = VALUES(p256dh),
         auth = VALUES(auth),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, endpoint, endpointHash, p256dh, auth]
    );

    return res.status(200).json({
      success: true,
      message: 'Đã liên kết thiết bị với tài khoản.',
    });
  } catch (error) {
    console.error('Lỗi liên kết thiết bị Push:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Không thể liên kết thiết bị.',
    });
  }
}

// Lấy trạng thái Push riêng của tài khoản hiện tại trên endpoint này
async function getPushStatus(req, res) {
  try {
    const userId = req.user.user_id;
    const endpoint = req.query.endpoint;

    if (typeof endpoint !== 'string' || !endpoint.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu địa chỉ Push.',
      });
    }

    const endpointHash = getValidEndpointHash(endpoint);

    if (!endpointHash) {
      return res.status(400).json({
        success: false,
        message: 'Địa chỉ Push không hợp lệ.',
      });
    }

    const [rows] = await pool.query(
      `SELECT push_enabled
       FROM push_subscriptions
       WHERE user_id = ? AND endpoint_hash = ?
       LIMIT 1`,
      [userId, endpointHash]
    );

    return res.status(200).json({
      success: true,
      enabled: rows.length > 0 && Boolean(rows[0].push_enabled),
    });
  } catch (error) {
    console.error('Lỗi kiểm tra trạng thái Push:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Không thể kiểm tra trạng thái thông báo đẩy.',
    });
  }
}

// Tắt Push cho tài khoản hiện tại, không hủy đăng ký của trình duyệt
async function unsubscribeFromPush(req, res) {
  try {
    const userId = req.user.user_id;
    const { endpoint } = req.body || {};

    if (typeof endpoint !== 'string' || !endpoint.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu địa chỉ Push cần tắt.',
      });
    }

    const endpointHash = getValidEndpointHash(endpoint);

    if (!endpointHash) {
      return res.status(400).json({
        success: false,
        message: 'Địa chỉ Push không hợp lệ.',
      });
    }

    await pool.query(
      `UPDATE push_subscriptions
       SET push_enabled = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND endpoint_hash = ?`,
      [userId, endpointHash]
    );

    return res.status(200).json({
      success: true,
      message: 'Đã tắt thông báo đẩy cho tài khoản này.',
    });
  } catch (error) {
    console.error('Lỗi tắt Push:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Không thể tắt thông báo đẩy.',
    });
  }
}

module.exports = {
  subscribeToPush,
  linkPushDevice,
  getPushStatus,
  unsubscribeFromPush,
};