// =========================================
// TIỆN ÍCH JWT
// =========================================

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Các giá trị mẫu trong tài liệu/.env.example: tuyệt đối không dùng thật
const PLACEHOLDER_SECRETS = new Set([
  'thay_bang_chuoi_bi_mat_that_manh',
  'your_jwt_secret',
  'secret',
  'changeme',
]);

const MIN_SECRET_LENGTH = 32;

// Lấy JWT_SECRET và từ chối nếu thiếu / quá ngắn / là giá trị mẫu
function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (
    !secret ||
    secret.length < MIN_SECRET_LENGTH ||
    PLACEHOLDER_SECRETS.has(secret)
  ) {
    throw new Error(
      'JWT_SECRET chưa được cấu hình đúng: cần ngẫu nhiên và dài tối thiểu ' +
        `${MIN_SECRET_LENGTH} ký tự (không dùng giá trị mẫu). Tạo bằng lệnh: ` +
        `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
    );
  }

  return secret;
}

// Gọi khi khởi động server để dừng sớm nếu cấu hình sai
function assertJwtConfig() {
  getSecret();
}

// "Dấu vân tay" của mật khẩu hiện tại. Nằm trong token để khi đổi mật khẩu
// thì mọi token cũ của tài khoản đó tự mất hiệu lực.
function passwordVersion(passwordHash) {
  return crypto
    .createHash('sha256')
    .update(String(passwordHash))
    .digest('hex')
    .slice(0, 16);
}

function signToken(payload) {
  return jwt.sign(payload, getSecret(), {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
}

module.exports = {
  signToken,
  verifyToken,
  assertJwtConfig,
  passwordVersion,
};
