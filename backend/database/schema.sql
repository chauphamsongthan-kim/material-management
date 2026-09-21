-- =========================================
-- RESET DATABASE
-- =========================================

DROP DATABASE IF EXISTS material_management;


-- =========================================
-- CREATE DATABASE
-- =========================================

CREATE DATABASE material_management
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE material_management;


-- =========================================
-- TABLE: DEPARTMENTS
-- =========================================

CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,

    department_name VARCHAR(100) NOT NULL UNIQUE
);


-- =========================================
-- TABLE: USERS
-- =========================================

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    username VARCHAR(100) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('ADMIN', 'HEAD') NOT NULL,

    department_id INT NULL,

    FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
        ON DELETE SET NULL
);


-- =========================================
-- TABLE: DEVICES
-- =========================================

CREATE TABLE IF NOT EXISTS devices (
    device_id INT AUTO_INCREMENT PRIMARY KEY,

    department_id INT NOT NULL,

    device_name VARCHAR(150) NOT NULL,

    device_type VARCHAR(100) NOT NULL,

    original_quantity INT NOT NULL,

    current_quantity INT NOT NULL,

    FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_original_quantity
        CHECK (original_quantity > 0),

    CONSTRAINT chk_current_quantity
        CHECK (
            current_quantity >= 0
            AND current_quantity <= original_quantity
        )
);


-- =========================================
-- TABLE: DEVICE_HISTORY
-- =========================================

CREATE TABLE IF NOT EXISTS device_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,

    borrow_id CHAR(36) NOT NULL,

    device_id INT NOT NULL,

    borrower_name VARCHAR(100) NULL,

    returner_name VARCHAR(100) NULL,

    borrowed_quantity INT NOT NULL DEFAULT 0,

    returned_quantity INT NOT NULL DEFAULT 0,

    borrow_date DATE NOT NULL,

    return_date DATE NULL,

    FOREIGN KEY (device_id)
        REFERENCES devices(device_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_borrowed_quantity
        CHECK (borrowed_quantity >= 0),

    CONSTRAINT chk_returned_quantity
        CHECK (returned_quantity >= 0)
);


-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_devices_department
ON devices(department_id);

CREATE INDEX idx_history_device
ON device_history(device_id);

CREATE INDEX idx_history_borrow
ON device_history(borrow_id);


-- =========================================
-- INITIAL DEPARTMENTS (6 ban)
-- =========================================

INSERT INTO departments (department_name)
VALUES
    ('Ban Hậu Cần'),
    ('Ban Kỹ Thuật'),
    ('Ban Truyền Thông'),
    ('Ban Thư Ký'),
    ('Ban Y Tế'),
    ('Ban Điều Phối');


