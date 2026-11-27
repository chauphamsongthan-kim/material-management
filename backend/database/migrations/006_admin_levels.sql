-- Migration 006: Admin cấp 1/cấp 2.
-- Server tự chạy bước này khi khởi động (src/config/migrations.js),
-- file này chỉ để tham khảo / chạy tay. Hãy sao lưu database trước.

ALTER TABLE users
  ADD COLUMN admin_level TINYINT NOT NULL DEFAULT 1 AFTER role;

-- Admin được tạo đầu tiên trở thành Admin cấp 2 (duy nhất một tài khoản).
UPDATE users SET admin_level = 2
WHERE role = 'ADMIN'
ORDER BY user_id ASC
LIMIT 1;
