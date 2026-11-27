// =========================================
// GỬI EMAIL (SMTP qua nodemailer)
// =========================================
// Cấu hình bằng biến môi trường (xem .env.example):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
// Với Gmail: SMTP_HOST=smtp.gmail.com, SMTP_PORT=465,
// SMTP_PASS = "Mật khẩu ứng dụng" 16 ký tự (không phải mật khẩu đăng nhập Gmail).
const nodemailer = require('nodemailer');

let transporter = null;

function isMailConfigured() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Tránh treo request quá lâu nếu máy chủ mail không phản hồi
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  if (!isMailConfigured()) {
    const err = new Error('Chưa cấu hình gửi email (SMTP_*).');
    err.code = 'MAIL_NOT_CONFIGURED';
    throw err;
  }

  const from =
    process.env.MAIL_FROM ||
    `"Chùa Hội Đức" <${process.env.SMTP_USER}>`;

  return getTransporter().sendMail({ from, to, subject, text, html });
}

module.exports = { isMailConfigured, sendMail };
