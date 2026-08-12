-- Database Schema Setup

CREATE DATABASE IF NOT EXISTS erp_crm_db;
USE erp_crm_db;

-- 0. Companies table (SaaS Tenant)
CREATE TABLE IF NOT EXISTS Companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Employees table
CREATE TABLE IF NOT EXISTS Employees (
    id VARCHAR(50) NOT NULL,
    company_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('Admin', 'Sales', 'Warehouse', 'Accounts') NOT NULL,
    joining_date DATE NOT NULL,
    password VARCHAR(255) DEFAULT NULL,
    is_activated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, company_id),
    FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE
);

-- 2. Customers table
CREATE TABLE IF NOT EXISTS Customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    business_name VARCHAR(100) NOT NULL,
    gst_number VARCHAR(15) DEFAULT NULL,
    customer_type ENUM('Retail', 'Wholesale', 'Distributor') NOT NULL,
    address TEXT NOT NULL,
    status ENUM('Lead', 'Active', 'Inactive') DEFAULT 'Lead',
    follow_up_date DATE DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE
);

-- 3. Follow-up Notes table
CREATE TABLE IF NOT EXISTS FollowUpNotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    customer_id INT NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id, company_id) REFERENCES Employees(id, company_id) ON DELETE CASCADE
);

-- 4. Products table
CREATE TABLE IF NOT EXISTS Products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    minimum_stock_alert INT NOT NULL DEFAULT 5,
    location VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (sku, company_id),
    FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE
);

-- 5. Stock Movements table
CREATE TABLE IF NOT EXISTS StockMovements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    movement_type ENUM('IN', 'OUT') NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by, company_id) REFERENCES Employees(id, company_id) ON DELETE CASCADE
);

-- 6. Challans table
CREATE TABLE IF NOT EXISTS Challans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    challan_number VARCHAR(50) NOT NULL,
    customer_id INT NOT NULL,
    status ENUM('Draft', 'Confirmed', 'Cancelled') DEFAULT 'Draft',
    total_quantity INT NOT NULL DEFAULT 0,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (challan_number, company_id),
    FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by, company_id) REFERENCES Employees(id, company_id) ON DELETE CASCADE
);

-- 7. Challan Items table
CREATE TABLE IF NOT EXISTS ChallanItems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challan_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (challan_id) REFERENCES Challans(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);
