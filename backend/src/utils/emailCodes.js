// =========================================
// MÃ XÁC MINH 6 SỐ GỬI QUA EMAIL
// =========================================
// - Chỉ lưu bản băm (HMAC) của mã, không lưu mã gốc.
// - Hết hạn sau 10 phút, dùng một lần, sai quá 5 lần thì vô hiệu.
// - Giới hạn gửi: cách nhau tối thiểu 60 giây, tối đa 5 mã mỗi giờ.
const crypto = require('crypto');
const { pool } = require('../config/database');

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_CODES_PER_HOUR = 5;

class CodeError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function hashCode(userId, purpose, email, code) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(`${userId}|${purpose}|${email}|${code}`)
    .digest('hex');
}

// Tạo mã mới và trả về mã gốc (để gửi email). Ném CodeError nếu gửi quá nhanh/nhiều.
async function issueCode(userId, purpose, email) {
  const [recent] = await pool.query(
    `SELECT
       TIMESTAMPDIFF(SECOND, created_at, NOW()) AS age_seconds
     FROM email_codes
     WHERE user_id = ? AND purpose = ?
     ORDER BY code_id DESC LIMIT 1`,
    [userId, purpose]
  );

  if (
    recent.length > 0 &&
    Number(recent[0].age_seconds) < RESEND_COOLDOWN_SECONDS
  ) {
    const wait = RESEND_COOLDOWN_SECONDS - Number(recent[0].age_seconds);
    throw new CodeError(
      429,
      `Vui lòng đợi ${wait} giây rồi yêu cầu gửi lại mã.`
    );
  }

  const [hourly] = await pool.query(
    `SELECT COUNT(*) AS total FROM email_codes
     WHERE user_id = ? AND purpose = ?
       AND created_at > (NOW() - INTERVAL 1 HOUR)`,
    [userId, purpose]
  );

  if (Number(hourly[0].total) >= MAX_CODES_PER_HOUR) {
    throw new CodeError(
      429,
      'Bạn đã yêu cầu quá nhiều mã trong 1 giờ. Vui lòng thử lại sau.'
    );
  }

  // Mã cũ chưa dùng không còn giá trị
  await pool.query(
    `UPDATE email_codes SET used_at = NOW()
     WHERE user_id = ? AND purpose = ? AND used_at IS NULL`,
    [userId, purpose]
  );

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');

  const [result] = await pool.query(
    `INSERT INTO email_codes
       (user_id, purpose, email, code_hash, expires_at)
     VALUES (?, ?, ?, ?, NOW() + INTERVAL ${CODE_TTL_MINUTES} MINUTE)`,
    [userId, purpose, email, hashCode(userId, purpose, email, code)]
  );

  return { code, codeId: result.insertId };
}

// Xóa mã vừa tạo (dùng khi gửi email thất bại) để không bị tính vào giới hạn gửi
async function revokeCode(codeId) {
  await pool.query('DELETE FROM email_codes WHERE code_id = ?', [codeId]);
}

// Kiểm tra mã. Trả về dòng mã nếu đúng (và đánh dấu đã dùng); ngược lại trả null.
async function consumeCode(userId, purpose, code, expectedEmail = null) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
    return null;
  }

  const [rows] = await pool.query(
    `SELECT code_id, email, code_hash, attempts
     FROM email_codes
     WHERE user_id = ? AND purpose = ?
       AND used_at IS NULL AND expires_at > NOW()
     ORDER BY code_id DESC LIMIT 1`,
    [userId, purpose]
  );

  const row = rows[0];
  if (!row) return null;

  if (row.attempts >= MAX_ATTEMPTS) {
    await revokeCode(row.code_id);
    return null;
  }

  if (expectedEmail && row.email !== expectedEmail) {
    return null;
  }

  const expected = Buffer.from(row.code_hash, 'hex');
  const actual = Buffer.from(
    hashCode(userId, purpose, row.email, code.trim()),
    'hex'
  );

  const matches =
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual);

  if (!matches) {
    await pool.query(
      'UPDATE email_codes SET attempts = attempts + 1 WHERE code_id = ?',
      [row.code_id]
    );
    return null;
  }

  // Đánh dấu đã dùng một cách nguyên tử để một mã không dùng được 2 lần
  const [update] = await pool.query(
    'UPDATE email_codes SET used_at = NOW() WHERE code_id = ? AND used_at IS NULL',
    [row.code_id]
  );

  return update.affectedRows === 1 ? row : null;
}

module.exports = {
  CodeError,
  CODE_TTL_MINUTES,
  issueCode,
  revokeCode,
  consumeCode,
};
