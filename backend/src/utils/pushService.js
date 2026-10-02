
const webpush = require('web-push');
const { pool } = require('../config/database');

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (!publicKey || !privateKey) {
  throw new Error('Thiếu VAPID_PUBLIC_KEY hoặc VAPID_PRIVATE_KEY trong .env');
}

webpush.setVapidDetails(
  'mailto:admin@example.com',
  publicKey,
  privateKey
);

// Gửi một sự kiện đến nhiều tài khoản,
// nhưng mỗi endpoint chỉ nhận tối đa một Push.
async function sendPushToUsers(userIds, payload) {
  const uniqueUserIds = [...new Set(
    (userIds || []).filter((id) => Number.isInteger(Number(id))).map(Number)
  )];

  if (uniqueUserIds.length === 0) {
    return { total: 0, sent: 0, failed: 0 };
  }

  const placeholders = uniqueUserIds.map(() => '?').join(',');

  const [subscriptions] = await pool.query(
    `SELECT
       subscription_id,
       endpoint,
       endpoint_hash,
       p256dh,
       auth
     FROM push_subscriptions
     WHERE user_id IN (${placeholders})
       AND push_enabled = 1`,
    uniqueUserIds
  );

  // Gộp các tài khoản dùng chung một endpoint.
  const uniqueSubscriptions = new Map();

  for (const item of subscriptions) {
    if (!uniqueSubscriptions.has(item.endpoint_hash)) {
      uniqueSubscriptions.set(item.endpoint_hash, item);
    }
  }

  const targets = [...uniqueSubscriptions.values()];

  const results = await Promise.allSettled(
    targets.map(async (item) => {
      const subscription = {
        endpoint: item.endpoint,
        keys: {
          p256dh: item.p256dh,
          auth: item.auth,
        },
      };

      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify(payload)
        );
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await pool.query(
            'DELETE FROM push_subscriptions WHERE endpoint_hash = ?',
            [item.endpoint_hash]
          );
        }

        throw error;
      }
    })
  );

  return {
    total: targets.length,
    sent: results.filter((result) => result.status === 'fulfilled').length,
    failed: results.filter((result) => result.status === 'rejected').length,
  };
}

// Giữ hàm cũ để những nơi đang gửi cho một tài khoản
// (ví dụ thông báo mượn thiết bị) vẫn hoạt động.
async function sendPushToUser(userId, payload) {
  return sendPushToUsers([userId], payload);
}

module.exports = {
  sendPushToUser,
  sendPushToUsers,
};