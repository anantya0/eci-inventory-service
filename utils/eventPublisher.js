import { logInfo, logError } from './logger.js';

export const EVENTS = {
  LOW_STOCK: 'LOW_STOCK',
  RESERVATION_EXPIRED: 'RESERVATION_EXPIRED',
  STOCK_UPDATED: 'STOCK_UPDATED'
};

class EventPublisher {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  publish(eventType, data) {
    logInfo(`Publishing event: ${eventType}`, { data });
    
    const listeners = this.listeners.get(eventType) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        logError(new Error(`Error in event listener for ${eventType}: ${error.message}`));
      }
    });
  }
}

export const eventPublisher = new EventPublisher();