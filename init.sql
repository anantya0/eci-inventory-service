-- Create database
CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

-- Inventory table (PS4 compliant) - stores SKU directly
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(100) NOT NULL,
    warehouse VARCHAR(100) NOT NULL,
    on_hand INTEGER DEFAULT 0,
    reserved INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_sku_warehouse (sku, warehouse),
    INDEX idx_sku_warehouse (sku, warehouse),
    INDEX idx_warehouse (warehouse)
);

-- Inventory movements tracking
CREATE TABLE IF NOT EXISTS inventory_movements (
    movement_id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(100) NOT NULL,
    warehouse VARCHAR(100) NOT NULL,
    movement_type VARCHAR(20) NOT NULL, -- 'IN', 'OUT', 'RESERVED', 'RELEASED'
    quantity INTEGER NOT NULL,
    reference_id VARCHAR(255), -- order_id, shipment_id, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sku_movements (sku),
    INDEX idx_warehouse_movements (warehouse),
    INDEX idx_reference (reference_id),
    INDEX idx_created_at (created_at)
);

-- Reservations table for TTL management
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(100) NOT NULL,
    warehouse VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_expires_at (expires_at),
    INDEX idx_order_id (order_id),
    INDEX idx_sku_warehouse_res (sku, warehouse)
);

-- Insert sample inventory (matching catalog products)
INSERT IGNORE INTO inventory (inventory_id, sku, warehouse, on_hand, reserved) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'SKU-12345', 'WH-001', 150, 0),
('660e8400-e29b-41d4-a716-446655440002', 'SKU-12346', 'WH-001', 75, 0),
('660e8400-e29b-41d4-a716-446655440003', 'SKU-12347', 'WH-002', 100, 0),
('660e8400-e29b-41d4-a716-446655440004', 'SKU-12348', 'WH-001', 200, 0),
('660e8400-e29b-41d4-a716-446655440005', 'SKU-12349', 'WH-002', 50, 0),
('660e8400-e29b-41d4-a716-446655440006', 'SKU-12350', 'WH-001', 80, 0),
('660e8400-e29b-41d4-a716-446655440007', 'SKU-12351', 'WH-002', 120, 0),
('660e8400-e29b-41d4-a716-446655440008', 'SKU-12352', 'WH-001', 60, 0),
('660e8400-e29b-41d4-a716-446655440009', 'SKU-12353', 'WH-002', 90, 0),
('660e8400-e29b-41d4-a716-446655440010', 'SKU-12354', 'WH-001', 110, 0);