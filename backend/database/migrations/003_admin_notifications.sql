
-- Migration 003: Support ADMIN-created notifications.
-- Back up the database before running.
-- Run while connected to material_management.

ALTER TABLE notifications
  ADD COLUMN notification_type
    ENUM('BORROW', 'ADMIN')
    NOT NULL DEFAULT 'BORROW',
  ADD COLUMN title VARCHAR(200) NULL;

ALTER TABLE notifications
  MODIFY COLUMN borrower_name VARCHAR(100) NULL,
  MODIFY COLUMN device_name VARCHAR(255) NULL,
  MODIFY COLUMN borrowed_quantity INT NULL;
  
-- Verify the updated structure.
SHOW COLUMNS FROM notifications;

-- Verify existing notification records are preserved
-- and defaulted to BORROW.
SELECT notification_type, COUNT(*) AS total
FROM notifications
GROUP BY notification_type;