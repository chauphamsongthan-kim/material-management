-- Migration 005: Thêm cột devices.image_url (ảnh thiết bị).
-- Có thể chạy an toàn nhiều lần: chỉ thêm cột khi cột chưa tồn tại.
-- Back up the database before running.
-- Run while connected to the material_management database.

SET @schema_name = DATABASE();

SET @ddl = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE devices ADD COLUMN image_url VARCHAR(255) NULL',
    'SELECT ''devices.image_url already exists'' AS migration_note')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'devices'
    AND COLUMN_NAME = 'image_url'
);

PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SHOW COLUMNS FROM devices LIKE 'image_url';
