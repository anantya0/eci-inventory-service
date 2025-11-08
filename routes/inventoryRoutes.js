import express from 'express';
import * as inventoryController from '../controllers/inventoryController.js';

const router = express.Router();

// Specific routes first to avoid conflicts with /:sku
router.post('/reserve', inventoryController.reserveStock);
router.post('/release', inventoryController.releaseReservation);
router.get('/movements', inventoryController.getMovements);
router.post('/movements', inventoryController.recordMovement);

// SKU-specific routes last
router.get('/:sku', inventoryController.getInventoryBySKU);
router.put('/:sku', inventoryController.updateInventory);

export default router;