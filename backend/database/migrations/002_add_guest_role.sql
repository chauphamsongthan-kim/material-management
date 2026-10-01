-- Migration 002: Add GUEST role without deleting existing users.
-- Back up the database before running this migration.

ALTER TABLE users
  MODIFY COLUMN role ENUM('ADMIN', 'HEAD', 'GUEST') NOT NULL;

SHOW COLUMNS FROM users LIKE 'role';
