# Inventory Service

A Node.js Express microservice for inventory management with warehouse allocation, stock reservations, and movement tracking.

## Features

- **Stock Management**: Track inventory levels per SKU/warehouse
- **Atomic Reservations**: Reserve stock with idempotency keys and TTL (15 minutes)
- **Warehouse Allocation**: Single-warehouse first strategy with fallback
- **Movement Tracking**: Complete audit trail of inventory changes
- **Reaper Job**: Automatic cleanup of expired reservations every 5 minutes
- **PS4 Compliant**: Follows PS4 database schema and business rules

## API Endpoints

```
GET    /v1/inventory/{sku}        - Get stock level by SKU
PUT    /v1/inventory/{sku}        - Update stock level
POST   /v1/inventory/reserve      - Reserve stock (requires Idempotency-Key)
POST   /v1/inventory/release      - Release reserved stock
GET    /v1/inventory/movements    - Get stock movements (with pagination)
POST   /v1/inventory/movements    - Record stock movement
GET    /health                    - Health check
```

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

3. **Seed sample data**:
   ```bash
   npm run seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## Example Usage

### Reserve Stock
```bash
curl -X POST http://localhost:8081/v1/inventory/reserve \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: order-123" \
  -d '{
    "sku": "LAPTOP-001",
    "quantity": 2,
    "order_id": "order-123",
    "warehouse": "WH-NYC"
  }'
```

### Release Reservation
```bash
curl -X POST http://localhost:8081/v1/inventory/release \
  -H "Content-Type: application/json" \
  -d '{
    "reservation_id": "res-456",
    "order_id": "order-123"
  }'
```

### Check Stock Levels
```bash
curl http://localhost:8081/v1/inventory/LAPTOP-001
```

## Key Features Implemented

✅ **Atomic Stock Reservations**: Uses database transactions to ensure consistency  
✅ **Idempotency Keys**: Prevents double-reserving with same order  
✅ **TTL Reservations**: 15-minute expiry with automatic cleanup  
✅ **Warehouse Allocation**: Single-warehouse first, then split if needed  
✅ **Movement Tracking**: Complete audit trail of all inventory changes  
✅ **Reaper Job**: Scheduled cleanup of expired reservations  
✅ **Error Handling**: Comprehensive error responses and logging  
✅ **Health Checks**: Service monitoring endpoint  

## Environment Variables

```
PORT=8081
DB_HOST=localhost
DB_PORT=3307
DB_NAME=inventory_db
DB_USER=root
DB_PASSWORD=toor
RESERVATION_TTL_MINUTES=15
LOW_STOCK_THRESHOLD=10
```