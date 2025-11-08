import { v4 as uuidv4 } from 'uuid';

export const validateReservation = (reservationData) => {
  const errors = [];
  
  if (!reservationData.sku || typeof reservationData.sku !== 'string') {
    errors.push('SKU is required and must be a string');
  }
  
  if (!reservationData.quantity || typeof reservationData.quantity !== 'number' || reservationData.quantity <= 0) {
    errors.push('Quantity is required and must be a positive number');
  }
  
  if (!reservationData.order_id || typeof reservationData.order_id !== 'string') {
    errors.push('Order ID is required and must be a string');
  }
  
  return errors;
};

export const validateMovement = (movementData) => {
  const errors = [];
  const validTypes = ['IN', 'OUT', 'RESERVED', 'RELEASED'];
  
  if (!movementData.sku || typeof movementData.sku !== 'string') {
    errors.push('SKU is required and must be a string');
  }
  
  if (!movementData.warehouse || typeof movementData.warehouse !== 'string') {
    errors.push('Warehouse is required and must be a string');
  }
  
  if (!movementData.movement_type || !validTypes.includes(movementData.movement_type)) {
    errors.push('Movement type must be one of: IN, OUT, RESERVED, RELEASED');
  }
  
  if (!movementData.quantity || typeof movementData.quantity !== 'number') {
    errors.push('Quantity is required and must be a number');
  }
  
  return errors;
};

export const validateUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const validateSKU = (sku) => {
  return sku && typeof sku === 'string' && sku.trim().length > 0;
};