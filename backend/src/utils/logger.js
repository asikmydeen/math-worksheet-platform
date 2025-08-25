const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about the colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define which transports to use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// Helper functions for structured logging
logger.logRequest = (req, message, metadata = {}) => {
  logger.info(message, {
    ...metadata,
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.headers['user-agent'],
    },
  });
};

logger.logError = (error, req = null, metadata = {}) => {
  const errorData = {
    ...metadata,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    },
  };

  if (req) {
    errorData.request = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?.id,
    };
  }

  logger.error(error.message, errorData);
};

logger.logPerformance = (operation, duration, metadata = {}) => {
  logger.info(`Performance: ${operation}`, {
    ...metadata,
    performance: {
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    },
  });
};

logger.logSecurity = (event, req, metadata = {}) => {
  logger.warn(`Security: ${event}`, {
    ...metadata,
    security: {
      event,
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    },
  });
};

logger.logAI = (operation, metadata = {}) => {
  logger.info(`AI Service: ${operation}`, {
    ...metadata,
    ai: {
      operation,
      timestamp: new Date().toISOString(),
    },
  });
};

logger.logDatabase = (operation, collection, duration, metadata = {}) => {
  logger.debug(`Database: ${operation} on ${collection}`, {
    ...metadata,
    database: {
      operation,
      collection,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = logger;