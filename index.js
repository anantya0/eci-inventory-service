import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import inventoryRoutes from './routes/inventoryRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { logError, logRequest } from './utils/logger.js';
import { startReaperJob } from './utils/reaperJob.js';

const app = express();
const PORT = process.env.PORT || 8081;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Correlation ID middleware
app.use((req, res, next) => {
  req.headers['x-correlation-id'] = req.headers['x-correlation-id'] || Math.random().toString(36).substring(2, 15);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - req.startTime;
    logRequest(req, res, res.statusCode, duration);
    originalSend.call(this, data);
  };
  
  next();
});

// Routes
app.use(`/${API_VERSION}/inventory`, inventoryRoutes);
app.use('/health', healthRoutes);

// Error handling
app.use((err, req, res, next) => {
  const duration = Date.now() - (req.startTime || Date.now());
  logRequest(req, res, 500, duration);
  logError(err, req);
  res.status(500).json({ error: 'Internal server error' });
});

// Start reaper job
startReaperJob();

app.listen(PORT, () => {
  console.log(`Inventory service running on port ${PORT}`);
});