// =========================================
// CONTROLLER: LIÊN KẾT GMAIL & KHÔI PHỤC TÀI KHOẢN
// =========================================
// - Admin cấp 2 liên kết Gmail (xác minh bằng mã 6 số gửi tới Gmail đó).
// - Khi quên mật khẩu, mã khôi phục được gửi tới Gmail đã liên kết.
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const loginLimiter = require('../utils/loginLimiter');
const { isMailConfigured, sendMail } = require('../utils/mailer');
const {
  CodeError,
  CODE_TTL_MINUTES,
  issueCode,
  revokeCode,
  consumeCode,
} = require('../utils/emailCodes');

const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com']);
const EMAIL_PATTERN = /^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

function normalizeGmail(raw) {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  const domain = email.split('@')[1];
  return GMAIL_DOMAINS.has(domain) ? email : null;
}

function maskEmail(email) {
  if (!email) return null;
  const [name, domain] = email.split('@');
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${'*'.repeat(Math.max(name.length - visible.length, 3))}@${domain}`;
}

function sendCodeError(res, err) {
  if (err instanceof CodeError) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  return null;
}

function mailText(purpose, username, code) {
  const action =
    purpose === 'LINK_EMAIL'
      ? 'liên kết Gmail với tài khoản'
      : 'khôi phục mật khẩu tài khoản';

  const text =
    `Mã xác minh để ${action} "${username}" là: ${code}\n\n` +
    `Mã có hiệu lực trong ${CODE_TTL_MINUTES} phút và chỉ dùng được một lần.\n` +
    'Nếu bạn không yêu cầu, hãy bỏ qua email này và không chia sẻ mã cho ai.';

  const html =
    `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937">` +
    `<p>Mã xác minh để ${action} <b>${username}</b>:</p>` +
    `<p style="font-size:30px;letter-spacing:6px;font-weight:bold;color:#7c3a0a">${code}</p>` +
    `<p>Mã có hiệu lực trong ${CODE_TTL_MINUTES} phút và chỉ dùng được một lần.</p>` +
    `<p style="color:#6b7280">Nếu bạn không yêu cầu, hãy bỏ qua email này và không chia sẻ mã cho ai.</p>` +
    `</div>`;

  return { text, html };
}

async function sendCodeMail(to, purpose, username, code) {
  const { text, html } = mailText(purpose, username, code);
  const subject =
    purpose === 'LINK_EMAIL'
      ? 'Mã xác minh liên kết Gmail - Chùa Hội Đức'
      : 'Mã khôi phục mật khẩu - Chùa Hội Đức';
  await sendMail({ to, subject, text, html });
}

// GET /api/auth/email
async function getEmailStatus(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT email, email_verified_at FROM users WHERE user_id = ? LIMIT 1',
      [req.user.user_id]
    );
    const row = rows[0] || {};
    return res.json({
      success: true,
      data: {
        linked: !!row.email_verified_at,
        email_masked: row.email_verified_at ? maskEmail(row.email) : null,
        mail_configured: isMailConfigured(),
      },
    });
  } catch (err) {
    console.error('Lỗi lấy trạng thái Gmail:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
}

// POST /api/auth/email/request  { email }
async function requestEmailLink(req, res) {
  try {
    if (!isMailConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Hệ thống chưa được cấu hình gửi email. Vui lòng liên hệ người quản trị máy chủ.',
      });
    }

    const email = normalizeGmail(req.body?.email);
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập địa chỉ Gmail hợp lệ (đuôi @gmail.com).',
      });
    }

    const [taken] = await pool.query(
      'SELECT user_id FROM users WHERE email = ? AND user_id <> ? LIMIT 1',
      [email, req.user.user_id]
    );
    if (taken.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Gmail này đã được liên kết với tài khoản khác.',
      });
    }

    const { code, codeId } = await issueCode(
      req.user.user_id,
      'LINK_EMAIL',
      email
    );

    try {
      await sendCodeMail(email, 'LINK_EMAIL', req.user.username, code);
    } catch (mailErr) {
      await revokeCode(codeId);
      console.error('Lỗi gửi email xác minh Gmail:', mailErr.message);
      return res.status(502).json({
        success: false,
        message: 'Không gửi được email. Vui lòng kiểm tra địa chỉ Gmail và thử lại sau.',
      });
    }

    return res.json({
      success: true,
      message: `Đã gửi mã xác minh tới ${maskEmail(email)}. Mã có hiệu lực ${CODE_TTL_MINUTES} phút.`,
    });
  } catch (err) {
    if (sendCodeError(res, err)) return;
    console.error('Lỗi yêu cầu liên kết Gmail:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
}

// POST /api/auth/email/verify  { email, code }
async function verifyEmailLink(req, res) {
  try {
    const email = normalizeGmail(req.body?.email);
    const code = req.body?.code;

    if (!email || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập Gmail và mã xác minh.',
      });
    }

    const limiterKey = `link-email:${req.user.user_id}`;
    const wait = loginLimiter.getRetryAfterSeconds(limiterKey);
    if (wait > 0) {
      return res.status(429).json({
        success: false,
        message: `Bạn nhập sai quá nhiều lần. Vui lòng thử lại sau ${wait} giây.`,
      });
    }

    const row = await consumeCode(
      req.user.user_id,
      'LINK_EMAIL',
      code,
      email
    );

    if (!row) {
      loginLimiter.recordFailure(limiterKey);
      return res.status(400).json({
        success: false,
        message: 'Mã không đúng hoặc đã hết hạn.',
      });
    }

    loginLimiter.reset(limiterKey);

    try {
      await pool.query(
        'UPDATE users SET email = ?, email_verified_at = NOW() WHERE user_id = ?',
        [email, req.user.user_id]
      );
    } catch (dbErr) {
      if (dbErr.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Gmail này đã được liên kết với tài khoản khác.',
        });
      }
      throw dbErr;
    }

    return res.json({
      success: true,
      message: 'Đã liên kết Gmail thành công.',
      data: { linked: true, email_masked: maskEmail(email) },
    });
  } catch (err) {
    console.error('Lỗi xác minh Gmail:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
}

// DELETE /api/auth/email  { password }
async function unlinkEmail(req, res) {
  try {
    const password = req.body?.password;
    if (typeof password !== 'string' || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu hiện tại để hủy liên kết.',
      });
    }

    const limiterKey = `unlink-email:${req.user.user_id}`;
    const wait = loginLimiter.getRetryAfterSeconds(limiterKey);
    if (wait > 0) {
      return res.status(429).json({
        success: false,
        message: `Bạn nhập sai quá nhiều lần. Vui lòng thử lại sau ${wait} giây.`,
      });
    }

    const [rows] = await pool.query(
      'SELECT password_hash FROM users WHERE user_id = ? LIMIT 1',
      [req.user.user_id]
    );

    if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash))) {
      loginLimiter.recordFailure(limiterKey);
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác.',
      });
    }

    loginLimiter.reset(limiterKey);

    await pool.query(
      'UPDATE users SET email = NULL, email_verified_at = NULL WHERE user_id = ?',
      [req.user.user_id]
    );
    await pool.query(
      `UPDATE email_codes SET used_at = NOW()
       WHERE user_id = ? AND used_at IS NULL`,
      [req.user.user_id]
    );

    return res.json({ success: true, message: 'Đã hủy liên kết Gmail.' });
  } catch (err) {
    console.error('Lỗi hủy liên kết Gmail:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
}

// =========================================
// QUÊN MẬT KHẨU (không cần đăng nhập)
// =========================================
const FORGOT_MESSAGE =
  'Nếu tài khoản đã liên kết Gmail, mã khôi phục sẽ được gửi tới Gmail đó trong ít phút.';

// POST /api/auth/forgot-password  { username }
// Luôn trả lời giống nhau để không lộ tài khoản nào tồn tại / có Gmail.
async function forgotPassword(req, res) {
  const username = req.body?.username;

  if (typeof username !== 'string' || !username.trim() || username.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập tên đăng nhập.',
    });
  }

  // Trả lời ngay, gửi email chạy nền để thời gian phản hồi không lộ thông tin
  res.json({ success: true, message: FORGOT_MESSAGE });

  try {
    if (!isMailConfigured()) {
      console.warn('Quên mật khẩu: chưa cấu hình SMTP nên không gửi được email.');
      return;
    }

    const [rows] = await pool.query(
      `SELECT user_id, username, email
       FROM users
       WHERE username = ? AND email IS NOT NULL AND email_verified_at IS NOT NULL
       LIMIT 1`,
      [username.trim()]
    );

    if (rows.length === 0) return;

    const user = rows[0];
    const { code, codeId } = await issueCode(
      user.user_id,
      'RESET_PASSWORD',
      user.email
    );

    try {
      await sendCodeMail(user.email, 'RESET_PASSWORD', user.username, code);
    } catch (mailErr) {
      await revokeCode(codeId);
      console.error('Lỗi gửi email khôi phục mật khẩu:', mailErr.message);
    }
  } catch (err) {
    if (!(err instanceof CodeError)) {
      console.error('Lỗi xử lý quên mật khẩu:', err);
    }
  }
}

// POST /api/auth/reset-password  { username, code, new_password }
async function resetPassword(req, res) {
  try {
    const { username, code, new_password: newPassword } = req.body || {};

    if (
      typeof username !== 'string' ||
      typeof code !== 'string' ||
      typeof newPassword !== 'string' ||
      !username.trim() ||
      !code.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ tên đăng nhập, mã khôi phục và mật khẩu mới.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      });
    }

    const limiterKey = `reset-password:${username.trim()}`;
    const wait = loginLimiter.getRetryAfterSeconds(limiterKey);
    if (wait > 0) {
      return res.status(429).json({
        success: false,
        message: `Bạn nhập sai quá nhiều lần. Vui lòng thử lại sau ${wait} giây.`,
      });
    }

    const [rows] = await pool.query(
      `SELECT user_id FROM users
       WHERE username = ? AND email IS NOT NULL AND email_verified_at IS NOT NULL
       LIMIT 1`,
      [username.trim()]
    );

    const row = rows[0]
      ? await consumeCode(rows[0].user_id, 'RESET_PASSWORD', code)
      : null;

    if (!row) {
      loginLimiter.recordFailure(limiterKey);
      return res.status(400).json({
        success: false,
        message: 'Mã không đúng hoặc đã hết hạn.',
      });
    }

    loginLimiter.reset(limiterKey);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [
      passwordHash,
      rows[0].user_id,
    ]);

    // Đổi mật khẩu làm mọi phiên đăng nhập cũ mất hiệu lực (xem authMiddleware)
    await pool.query(
      `UPDATE email_codes SET used_at = NOW()
       WHERE user_id = ? AND used_at IS NULL`,
      [rows[0].user_id]
    );

    return res.json({
      success: true,
      message: 'Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới.',
    });
  } catch (err) {
    console.error('Lỗi đặt lại mật khẩu:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
}

module.exports = {
  getEmailStatus,
  requestEmailLink,
  verifyEmailLink,
  unlinkEmail,
  forgotPassword,
  resetPassword,
};
