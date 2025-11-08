import { eventPublisher, EVENTS } from '../utils/eventPublisher.js';
import { logInfo, logError } from '../utils/logger.js';

const LOW_STOCK_THRESHOLD = 10; // Default threshold

export const checkLowStock = async (sku, warehouse, onHand, reserved) => {
  const availableStock = onHand - reserved;
  
  if (availableStock < LOW_STOCK_THRESHOLD) {
    const alertData = {
      sku,
      warehouse,
      availableStock,
      threshold: LOW_STOCK_THRESHOLD,
      timestamp: new Date().toISOString()
    };
    
    logInfo(`Low stock alert for SKU: ${sku} in warehouse: ${warehouse}`);
    eventPublisher.publish(EVENTS.LOW_STOCK, alertData);
  }
};