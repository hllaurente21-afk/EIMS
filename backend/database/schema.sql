CREATE DATABASE IF NOT EXISTS eims CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eims;

CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_code VARCHAR(30) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  department_id INT NULL,
  position VARCHAR(100) NULL,
  email VARCHAR(150) NULL UNIQUE,
  phone VARCHAR(30) NULL,
  date_hired DATE NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  INDEX idx_emp_name (last_name, first_name)
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','hr','employee') NOT NULL DEFAULT 'employee',
  employee_id INT NULL UNIQUE,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  work_date DATE NOT NULL,
  time_in DATETIME NOT NULL,
  time_out DATETIME NULL,
  break_minutes INT NOT NULL DEFAULT 0,
  remarks VARCHAR(255) NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_emp_date (employee_id, work_date),
  CONSTRAINT fk_att_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_att_date (work_date)
);

INSERT IGNORE INTO departments (name) VALUES
  ('Human Resources'), ('Finance'), ('IT'), ('Operations'), ('Administration');
