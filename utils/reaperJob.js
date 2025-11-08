import cron from 'node-cron';
import * as inventoryDao from '../dao/inventoryDao.js';
import { logInfo, logError } from './logger.js';

export const startReaperJob = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      logInfo('Starting reservation reaper job');
      
      const expiredReservations = await inventoryDao.getExpiredReservations();
      
      for (const reservation of expiredReservations) {
        try {
          await inventoryDao.releaseReservation(reservation.reservation_id, reservation.order_id);
          logInfo(`Released expired reservation: ${reservation.reservation_id} for order ${reservation.order_id}`);
        } catch (error) {
          logError(error, null);
        }
      }
      
      if (expiredReservations.length > 0) {
        logInfo(`Reaper job completed: ${expiredReservations.length} expired reservations released`);
      }
    } catch (error) {
      logError(error, null);
    }
  });
  
  logInfo('Reservation reaper job scheduled to run every 5 minutes');
};