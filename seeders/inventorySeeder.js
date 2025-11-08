import 'dotenv/config';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const seedInventory = async () => {
  const connection = await db.getConnection();
  
  try {
    console.log('Seeding inventory data...');
    
    // Sample inventory across warehouses using SKUs from catalog service
    const inventoryData = [
      { sku: 'LAPTOP-001', warehouse: 'WH-NYC', on_hand: 50, reserved: 0 },
      { sku: 'LAPTOP-001', warehouse: 'WH-LA', on_hand: 30, reserved: 0 },
      { sku: 'PHONE-001', warehouse: 'WH-NYC', on_hand: 100, reserved: 0 },
      { sku: 'BOOK-001', warehouse: 'WH-CHI', on_hand: 75, reserved: 0 },
      { sku: 'SHIRT-001', warehouse: 'WH-LA', on_hand: 200, reserved: 0 },
      { sku: 'MOUSE-001', warehouse: 'WH-CHI', on_hand: 150, reserved: 0 }
    ];
    
    await connection.beginTransaction();
    
    // Batch insert for better performance
    const values = inventoryData.map(inv => [
      uuidv4(), inv.sku, inv.warehouse, inv.on_hand, inv.reserved
    ]);
    
    await connection.query(
      'INSERT IGNORE INTO inventory (inventory_id, sku, warehouse, on_hand, reserved) VALUES ?',
      [values]
    );
    
    await connection.commit();
    console.log(`${inventoryData.length} inventory records seeded successfully!`);
    process.exit(0);
  } catch (error) {
    await connection.rollback();
    console.error('Error seeding inventory:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
};

seedInventory();