import * as inventoryDao from '../dao/inventoryDao.js';
import { logError, logInfo } from '../utils/logger.js';
import { validateReservation, validateMovement, validateSKU } from '../utils/validation.js';

export const getInventoryBySKU = async (req, res) => {
  try {
    if (!validateSKU(req.params.sku)) {
      return res.status(400).json({ error: 'Invalid SKU format' });
    }
    
    const inventory = await inventoryDao.getInventoryBySKU(req.params.sku);
    if (inventory.length === 0) {
      return res.status(404).json({ error: 'Inventory not found for SKU' });
    }
    
    res.json(inventory);
  } catch (error) {
    logError(error, req);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    if (!validateSKU(req.params.sku)) {
      return res.status(400).json({ error: 'Invalid SKU format' });
    }
    
    const { warehouse, on_hand } = req.body;
    
    if (!warehouse || typeof warehouse !== 'string') {
      return res.status(400).json({ error: 'Warehouse is required and must be a string' });
    }
    
    if (typeof on_hand !== 'number' || on_hand < 0) {
      return res.status(400).json({ error: 'on_hand must be a non-negative number' });
    }
    
    const inventory = await inventoryDao.updateInventory(req.params.sku, warehouse, on_hand);
    res.json(inventory);
  } catch (error) {
    logError(error, req);
    if (error.message === 'Product not found') {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
};

export const reserveStock = async (req, res) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'];
    if (!idempotencyKey) {
      return res.status(400).json({ error: 'Idempotency-Key header is required' });
    }
    
    const validationErrors = validateReservation(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    
    // Check for existing reservation with same idempotency key
    const existingReservation = await checkIdempotency(idempotencyKey);
    if (existingReservation) {
      return res.json(existingReservation);
    }
    
    const { sku, quantity, order_id, warehouse } = req.body;
    const reservation = await inventoryDao.reserveStock(sku, quantity, order_id, warehouse);
    
    // Store idempotency record
    await storeIdempotency(idempotencyKey, reservation);
    
    logInfo(`Stock reserved: ${quantity} units of ${sku} for order ${order_id}`, req);
    res.status(201).json(reservation);
  } catch (error) {
    logError(error, req);
    if (error.message.includes('Insufficient stock') || error.message === 'Product not found') {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
};

export const releaseReservation = async (req, res) => {
  try {
    const { reservation_id, order_id } = req.body;
    
    if (!reservation_id || !order_id) {
      return res.status(400).json({ error: 'reservation_id and order_id are required' });
    }
    
    const released = await inventoryDao.releaseReservation(reservation_id, order_id);
    if (!released) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    logInfo(`Reservation released: ${reservation_id} for order ${order_id}`, req);
    res.status(204).send();
  } catch (error) {
    logError(error, req);
    if (error.message === 'Reservation not found') {
      res.status(404).json({ error: 'Reservation not found' });
    } else {
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
};

export const getMovements = async (req, res) => {
  try {
    const { page = 1, limit = 10, sku, warehouse, movement_type } = req.query;
    const filters = { sku, warehouse, movement_type };
    
    const movements = await inventoryDao.getMovements(page, limit, filters);
    res.json(movements);
  } catch (error) {
    logError(error, req);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

export const recordMovement = async (req, res) => {
  try {
    const validationErrors = validateMovement(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    
    const movement = await inventoryDao.recordMovement(req.body);
    res.status(201).json(movement);
  } catch (error) {
    logError(error, req);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

// Simple in-memory idempotency store (use Redis in production)
const idempotencyStore = new Map();

const checkIdempotency = async (key) => {
  return idempotencyStore.get(key);
};

const storeIdempotency = async (key, data) => {
  idempotencyStore.set(key, data);
  // Clean up after 1 hour
  setTimeout(() => idempotencyStore.delete(key), 3600000);
};