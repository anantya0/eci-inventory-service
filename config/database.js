import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'inventory_db',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0
});

// Test connection and handle errors
pool.getConnection()
  .then(connection => {
    console.log('Inventory database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Inventory database connection failed:', err.message);
    process.exit(1);
  });

// Handle pool errors
pool.on('connection', (connection) => {
  console.log('New inventory DB connection established as id ' + connection.threadId);
});

pool.on('error', (err) => {
  console.error('Inventory database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Attempting to reconnect to inventory DB...');
  }
});

export default pool;