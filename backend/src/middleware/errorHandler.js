const { AppError } = require('../utils/errorTypes');
const logger = require('../utils/logger');

/**
 * Error logger middleware
 */
const errorLogger = (err, req, res, next) => {
  // Log error details
  logger.error({
    error: {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      isOperational: err.isOperational
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?.id,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for']
      },
      body: req.body,
      query: req.query,
      params: req.params
    },
    timestamp: new Date().toISOString()
  });
  
  next(err);
};

/**
 * Development error handler - sends full error details
 */
const developmentErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: {
      name: err.name,
      message: err.message,
      statusCode: statusCode,
      errorCode: err.errorCode,
      stack: err.stack,
      ...err
    },
    request: {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Production error handler - sends sanitized error response
 */
const productionErrorHandler = (err, req, res, next) => {
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  
  // Don't leak error details in production for non-operational errors
  if (!err.isOperational) {
    logger.error('Non-operational error:', err);
    statusCode = 500;
    message = 'Something went wrong. Please try again later.';
    errorCode = 'INTERNAL_ERROR';
  }
  
  // Send error response
  const errorResponse = {
    success: false,
    message: message,
    errorCode: errorCode,
    timestamp: new Date().toISOString()
  };
  
  // Add additional fields for operational errors
  if (err.isOperational) {
    if (err.fields) errorResponse.fields = err.fields;
    if (err.retryAfter) errorResponse.retryAfter = err.retryAfter;
    if (err.resource) errorResponse.resource = err.resource;
  }
  
  res.status(statusCode).json(errorResponse);
};

/**
 * MongoDB error handler
 */
const mongoErrorHandler = (err, req, res, next) => {
  if (err.name !== 'MongoError' && err.name !== 'MongoServerError') {
    return next(err);
  }
  
  // Handle duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const error = new AppError(
      `${field} already exists`,
      409,
      'DUPLICATE_FIELD'
    );
    error.field = field;
    return next(error);
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    const error = new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR'
    );
    error.fields = errors;
    return next(error);
  }
  
  // Handle other MongoDB errors
  const error = new AppError(
    'Database operation failed',
    500,
    'DATABASE_ERROR'
  );
  error.isOperational = false;
  next(error);
};

/**
 * JWT error handler
 */
const jwtErrorHandler = (err, req, res, next) => {
  if (err.name !== 'JsonWebTokenError' && err.name !== 'TokenExpiredError') {
    return next(err);
  }
  
  let error;
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
  } else {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
  
  next(error);
};

/**
 * Multer error handler (file upload errors)
 */
const multerErrorHandler = (err, req, res, next) => {
  if (!err.code || !err.code.startsWith('LIMIT_')) {
    return next(err);
  }
  
  let message;
  let errorCode;
  
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      message = 'File too large';
      errorCode = 'FILE_TOO_LARGE';
      break;
    case 'LIMIT_FILE_COUNT':
      message = 'Too many files';
      errorCode = 'TOO_MANY_FILES';
      break;
    case 'LIMIT_FIELD_KEY':
      message = 'Field name too long';
      errorCode = 'FIELD_NAME_TOO_LONG';
      break;
    case 'LIMIT_FIELD_VALUE':
      message = 'Field value too long';
      errorCode = 'FIELD_VALUE_TOO_LONG';
      break;
    case 'LIMIT_UNEXPECTED_FILE':
      message = 'Unexpected file field';
      errorCode = 'UNEXPECTED_FILE_FIELD';
      break;
    default:
      message = 'File upload error';
      errorCode = 'FILE_UPLOAD_ERROR';
  }
  
  const error = new AppError(message, 400, errorCode);
  next(error);
};

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Prevent sending response if already sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Log all errors
  errorLogger(err, req, res, () => {});
  
  // Handle specific error types
  mongoErrorHandler(err, req, res, (err) => {
    jwtErrorHandler(err, req, res, (err) => {
      multerErrorHandler(err, req, res, (err) => {
        // Use appropriate handler based on environment
        if (process.env.NODE_ENV === 'development') {
          developmentErrorHandler(err, req, res, next);
        } else {
          productionErrorHandler(err, req, res, next);
        }
      });
    });
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  errorLogger
};