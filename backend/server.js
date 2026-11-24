// =========================================
// ĐIỂM KHỞI CHẠY SERVER
// =========================================

require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/database');
const { assertJwtConfig } = require('./src/utils/jwt');

const PORT = process.env.PORT || 5000;

async function start() {
  // Dừng ngay nếu JWT_SECRET thiếu / yếu / là giá trị mẫu
  try {
    assertJwtConfig();
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }

  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên port ${PORT}`);
  });
}

start();
