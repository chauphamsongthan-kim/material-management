-- Migration 006: Admin cấp 1/cấp 2 và liên kết Gmail để khôi phục tài khoản.
-- Server tự chạy các bước này khi khởi động (src/config/migrations.js),
-- file này chỉ để tham khảo / chạy tay. Hãy sao lưu database trước.

ALTER TABLE users
  ADD COLUMN admin_level TINYINT NOT NULL DEFAULT 1 AFTER role,
  ADD COLUMN email VARCHAR(254) NULL AFTER admin_level,
  ADD COLUMN email_verified_at TIMESTAMP NULL AFTER email,
  ADD UNIQUE KEY uq_users_email (email);

-- Admin được tạo đầu tiên trở thành Admin cấp 2.
UPDATE users SET admin_level = 2
WHERE role = 'ADMIN'
ORDER BY user_id ASC
LIMIT 1;

CREATE TABLE IF NOT EXISTS email_codes (
  code_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  purpose ENUM('LINK_EMAIL', 'RESET_PASSWORD') NOT NULL,
  email VARCHAR(254) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  attempts TINYINT NOT NULL DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_codes_user_purpose (user_id, purpose),
  CONSTRAINT fk_email_codes_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
