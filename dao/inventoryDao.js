import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { validateProductBySKU } from '../utils/catalogService.js';
import { eventPublisher, EVENTS } from '../utils/eventPublisher.js';
import { checkLowStock } from '../services/alertService.js';

export const getInventoryBySKU = async (sku) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM inventory WHERE sku = ?',
      [sku]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching inventory by SKU:', error);
    throw new Error(`Failed to fetch inventory: ${error.message}`);
  }
};

export const updateInventory = async (sku, warehouse, onHand) => {
  try {
    // Validate product exists in catalog service
    const isValidProduct = await validateProductBySKU(sku);
    if (!isValidProduct) throw new Error('Product not found');
    
    const [result] = await db.execute(
      `INSERT INTO inventory (inventory_id, sku, warehouse, on_hand, updated_at) 
       VALUES (?, ?, ?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE on_hand = ?, updated_at = NOW()`,
      [uuidv4(), sku, warehouse, onHand, onHand]
    );
    
    return getInventoryBySKU(sku);
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw new Error(`Failed to update inventory: ${error.message}`);
  }
};

export const reserveStock = async (sku, quantity, orderId, warehouse = null) => {
  // Validate product exists in catalog service
  const isValidProduct = await validateProductBySKU(sku);
  if (!isValidProduct) throw new Error('Product not found');
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Find suitable warehouse
    let targetWarehouse = warehouse;
    if (!targetWarehouse) {
      const [warehouseRows] = await connection.execute(
        'SELECT warehouse FROM inventory WHERE sku = ? AND (on_hand - reserved) >= ? ORDER BY (on_hand - reserved) DESC LIMIT 1',
        [sku, quantity]
      );
      if (warehouseRows.length === 0) throw new Error('Insufficient stock');
      targetWarehouse = warehouseRows[0].warehouse;
    }
    
    // Check and reserve atomically
    const [updateResult] = await connection.execute(
      'UPDATE inventory SET reserved = reserved + ? WHERE sku = ? AND warehouse = ? AND (on_hand - reserved) >= ?',
      [quantity, sku, targetWarehouse, quantity]
    );
    
    if (updateResult.affectedRows === 0) {
      throw new Error('Insufficient stock or warehouse not found');
    }
    
    // Create reservation record
    const reservationId = uuidv4();
    const expiresAt = new Date(Date.now() + (process.env.RESERVATION_TTL_MINUTES || 15) * 60 * 1000);
    
    await connection.execute(
      'INSERT INTO reservations (reservation_id, sku, warehouse, quantity, order_id, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [reservationId, sku, targetWarehouse, quantity, orderId, expiresAt]
    );
    
    // Log movement
    await connection.execute(
      'INSERT INTO inventory_movements (movement_id, sku, warehouse, movement_type, quantity, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), sku, targetWarehouse, 'RESERVED', quantity, orderId]
    );
    
    await connection.commit();
    return { reservation_id: reservationId, warehouse: targetWarehouse };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const releaseReservation = async (reservationId, orderId) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get reservation details
    const [reservationRows] = await connection.execute(
      'SELECT * FROM reservations WHERE reservation_id = ? AND order_id = ?',
      [reservationId, orderId]
    );
    
    if (reservationRows.length === 0) throw new Error('Reservation not found');
    const reservation = reservationRows[0];
    
    // Release stock
    await connection.execute(
      'UPDATE inventory SET reserved = reserved - ? WHERE sku = ? AND warehouse = ?',
      [reservation.quantity, reservation.sku, reservation.warehouse]
    );
    
    // Remove reservation
    await connection.execute('DELETE FROM reservations WHERE reservation_id = ?', [reservationId]);
    
    // Log movement
    await connection.execute(
      'INSERT INTO inventory_movements (movement_id, sku, warehouse, movement_type, quantity, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), reservation.sku, reservation.warehouse, 'RELEASED', reservation.quantity, orderId]
    );
    
    await connection.commit();
    return true;
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getMovements = async (page = 1, limit = 10, filters = {}) => {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  let query = `SELECT * FROM inventory_movements WHERE 1=1`;
  const params = [];
  
  if (filters.sku) {
    query += ' AND sku = ?';
    params.push(filters.sku);
  }
  
  if (filters.warehouse) {
    query += ' AND warehouse = ?';
    params.push(filters.warehouse);
  }
  
  if (filters.movement_type) {
    query += ' AND movement_type = ?';
    params.push(filters.movement_type);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
  
  const [rows] = await db.query(query, params);
  return rows;
};

export const recordMovement = async (movementData) => {
  const movementId = uuidv4();
  
  await db.execute(
    'INSERT INTO inventory_movements (movement_id, sku, warehouse, movement_type, quantity, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
    [movementId, movementData.sku, movementData.warehouse, movementData.movement_type, movementData.quantity, movementData.reference_id]
  );
  
  const [rows] = await db.execute('SELECT * FROM inventory_movements WHERE movement_id = ?', [movementId]);
  return rows[0];
};

export const getExpiredReservations = async () => {
  const [rows] = await db.execute('SELECT * FROM reservations WHERE expires_at < NOW()');
  return rows;
};