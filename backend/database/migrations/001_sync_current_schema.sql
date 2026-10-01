-- Migration 001: align an existing database with the current application.
-- BACK UP the database first. This migration intentionally contains no DROP,
-- TRUNCATE, DELETE, or database recreation statements.
-- Run while connected to the material_management database.

-- Add devices.notes only when it is missing.
SET @schema_name = DATABASE();

SET @ddl = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE devices ADD COLUMN notes TEXT NULL',
    'SELECT ''devices.notes already exists'' AS migration_note')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'devices'
    AND COLUMN_NAME = 'notes'
);

PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

-- Current application writes timestamps. Upgrade DATE columns to DATETIME
-- without discarding the date component. Old DATE rows become 00:00:00;
-- historical time-of-day cannot be reconstructed from DATE-only data.
SET @ddl = (
  SELECT IF(DATA_TYPE = 'date',
    'ALTER TABLE device_history MODIFY COLUMN borrow_date DATETIME NOT NULL',
    'SELECT ''device_history.borrow_date already supports time'' AS migration_note')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'device_history'
    AND COLUMN_NAME = 'borrow_date'
);

SET @ddl = COALESCE(
  @ddl,
  'SELECT ''device_history.borrow_date not found; inspect schema'' AS migration_note'
);

PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = (
  SELECT IF(DATA_TYPE = 'date',
    'ALTER TABLE device_history MODIFY COLUMN return_date DATETIME NULL',
    'SELECT ''device_history.return_date already supports time'' AS migration_note')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'device_history'
    AND COLUMN_NAME = 'return_date'
);

SET @ddl = COALESCE(
  @ddl,
  'SELECT ''device_history.return_date not found; inspect schema'' AS migration_note'
);

PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

-- Create notifications if absent.
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add expected indexes only if they are absent.
SET @ddl = (
  SELECT IF(COUNT(*) = 0,
    'CREATE INDEX idx_devices_department ON devices(department_id)',
    'SELECT ''idx_devices_department already exists'' AS migration_note')
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'devices'
    AND INDEX_NAME = 'idx_devices_department'
);

PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = (
  SELECT IF(COUNT(*) = 0,
    'CREATE INDEX idx_history_device ON device_history(device_id)',
    'SELECT ''idx_history_device already exists'' AS migration_note')
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'device_history'
    AND INDEX_NAME = 'idx_history_device'
);

PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = (
  SELECT IF(COUNT(*) = 0,
    'CREATE INDEX idx_history_borrow ON device_history(borrow_id)',
    'SELECT ''idx_history_borrow already exists'' AS migration_note')
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'device_history'
    AND INDEX_NAME = 'idx_history_borrow'
);

PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

-- Verification queries (review results after running the migration).
SHOW TABLES;
SHOW COLUMNS FROM devices;
SHOW COLUMNS FROM device_history;
SHOW COLUMNS FROM notifications;