const logError = (error, req = null) => {
  const timestamp = new Date().toLocaleString();
  const correlationId = req?.headers['x-correlation-id'] || generateCorrelationId();
  
  if (process.env.NODE_ENV === 'production') {
    console.error(`${timestamp} ERROR [${correlationId}] ${req?.method} ${req?.url} - ${error.message}`);
  } else {
    const logEntry = {
      timestamp,
      level: 'ERROR',
      correlationId,
      message: error.message,
      stack: error.stack,
      method: req?.method,
      url: req?.url
    };
    console.error(JSON.stringify(logEntry));
  }
};

const logRequest = (req, res, statusCode, duration) => {
  const timestamp = new Date().toLocaleString();
  console.log(`${statusCode} - ${req.method} ${req.originalUrl} - ${duration}ms - ${timestamp}`);
};

const logInfo = (message, req = null) => {
  const timestamp = new Date().toISOString();
  const correlationId = req?.headers['x-correlation-id'] || generateCorrelationId();
  
  const logEntry = {
    timestamp,
    level: 'INFO',
    correlationId,
    message
  };
  
  console.log(JSON.stringify(logEntry));
};

const generateCorrelationId = () => {
  return Math.random().toString(36).substring(2, 15);
};

export { logError, logInfo, logRequest };