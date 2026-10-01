-- Canonical schema for a NEW installation of Material Management.
-- Do not use this file to reset an existing/production database.

CREATE DATABASE IF NOT EXISTS material_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE material_management;

CREATE TABLE IF NOT EXISTS departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'HEAD', 'GUEST') NOT NULL,
  department_id INT NULL,
  CONSTRAINT fk_users_department
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devices (
  device_id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  device_name VARCHAR(150) NOT NULL,
  device_type VARCHAR(100) NOT NULL,
  original_quantity INT NOT NULL,
  current_quantity INT NOT NULL,
  notes TEXT NULL,
  CONSTRAINT fk_devices_department
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_original_quantity CHECK (original_quantity > 0),
  CONSTRAINT chk_current_quantity CHECK (
    current_quantity >= 0 AND current_quantity <= original_quantity
  ),
  INDEX idx_devices_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS device_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  borrow_id CHAR(36) NOT NULL,
  device_id INT NOT NULL,
  borrower_name VARCHAR(100) NULL,
  returner_name VARCHAR(100) NULL,
  borrowed_quantity INT NOT NULL DEFAULT 0,
  returned_quantity INT NOT NULL DEFAULT 0,
  borrow_date DATETIME NOT NULL,
  return_date DATETIME NULL,
  CONSTRAINT fk_history_device
    FOREIGN KEY (device_id) REFERENCES devices(device_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_borrowed_quantity CHECK (borrowed_quantity >= 0),
  CONSTRAINT chk_returned_quantity CHECK (returned_quantity >= 0),
  INDEX idx_history_device (device_id),
  INDEX idx_history_borrow (borrow_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_id INT NOT NULL,
  device_id INT NULL,
  borrower_name VARCHAR(100) NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  borrowed_quantity INT NOT NULL,
  message VARCHAR(500) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_recipient_id (recipient_id),
  INDEX idx_notifications_device_id (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed departments without duplicating existing rows.
INSERT IGNORE INTO departments (department_name) VALUES
  ('Ban Hậu Cần'),
  ('Ban Kỹ Thuật'),
  ('Ban Truyền Thông'),
  ('Ban Thư Ký'),
  ('Ban Y Tế'),
  ('Ban Điều Phối');