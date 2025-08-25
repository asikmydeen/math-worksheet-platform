/**
 * Custom Error Classes for Better Error Categorization
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

// Authentication Errors
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_FAILED');
    this.name = 'AuthenticationError';
  }
}

class TokenExpiredError extends AuthenticationError {
  constructor(message = 'Token has expired') {
    super(message);
    this.errorCode = 'TOKEN_EXPIRED';
    this.name = 'TokenExpiredError';
  }
}

class InvalidTokenError extends AuthenticationError {
  constructor(message = 'Invalid token') {
    super(message);
    this.errorCode = 'INVALID_TOKEN';
    this.name = 'InvalidTokenError';
  }
}

// Authorization Errors
class AuthorizationError extends AppError {
  constructor(message = 'Not authorized') {
    super(message, 403, 'NOT_AUTHORIZED');
    this.name = 'AuthorizationError';
  }
}

class InsufficientPermissionsError extends AuthorizationError {
  constructor(resource, action) {
    super(`Insufficient permissions to ${action} ${resource}`);
    this.errorCode = 'INSUFFICIENT_PERMISSIONS';
    this.name = 'InsufficientPermissionsError';
    this.resource = resource;
    this.action = action;
  }
}

class SubscriptionRequiredError extends AuthorizationError {
  constructor(feature) {
    super(`Subscription required to access ${feature}`);
    this.errorCode = 'SUBSCRIPTION_REQUIRED';
    this.name = 'SubscriptionRequiredError';
    this.feature = feature;
  }
}

// Validation Errors
class ValidationError extends AppError {
  constructor(message, fields = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.fields = fields;
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      fields: this.fields
    };
  }
}

class RequiredFieldError extends ValidationError {
  constructor(fieldName) {
    super(`Required field '${fieldName}' is missing`, { [fieldName]: 'Required field' });
    this.errorCode = 'REQUIRED_FIELD';
    this.name = 'RequiredFieldError';
  }
}

class InvalidFormatError extends ValidationError {
  constructor(fieldName, expectedFormat) {
    super(`Invalid format for field '${fieldName}'`, { 
      [fieldName]: `Expected format: ${expectedFormat}` 
    });
    this.errorCode = 'INVALID_FORMAT';
    this.name = 'InvalidFormatError';
  }
}

// Resource Errors
class ResourceNotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} not found`, 404, 'RESOURCE_NOT_FOUND');
    this.name = 'ResourceNotFoundError';
    this.resource = resource;
    this.resourceId = id;
  }
}

class ResourceConflictError extends AppError {
  constructor(resource, reason) {
    super(`${resource} conflict: ${reason}`, 409, 'RESOURCE_CONFLICT');
    this.name = 'ResourceConflictError';
    this.resource = resource;
  }
}

class DuplicateResourceError extends ResourceConflictError {
  constructor(resource, field) {
    super(resource, `${field} already exists`);
    this.errorCode = 'DUPLICATE_RESOURCE';
    this.name = 'DuplicateResourceError';
    this.field = field;
  }
}

// Rate Limiting Errors
class RateLimitError extends AppError {
  constructor(retryAfter) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter
    };
  }
}

// External Service Errors
class ExternalServiceError extends AppError {
  constructor(service, originalError) {
    super(`External service error: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
    this.service = service;
    this.originalError = originalError;
  }
}

class AIServiceError extends ExternalServiceError {
  constructor(message, originalError) {
    super('AI Service', originalError);
    this.message = message || 'AI service temporarily unavailable';
    this.errorCode = 'AI_SERVICE_ERROR';
    this.name = 'AIServiceError';
  }
}

class PaymentServiceError extends ExternalServiceError {
  constructor(message, originalError) {
    super('Payment Service', originalError);
    this.message = message || 'Payment processing failed';
    this.errorCode = 'PAYMENT_SERVICE_ERROR';
    this.name = 'PaymentServiceError';
  }
}

// Business Logic Errors
class BusinessLogicError extends AppError {
  constructor(message, statusCode = 400, errorCode = 'BUSINESS_LOGIC_ERROR') {
    super(message, statusCode, errorCode);
    this.name = 'BusinessLogicError';
  }
}

class QuotaExceededError extends BusinessLogicError {
  constructor(resource, limit, current) {
    super(`${resource} quota exceeded. Limit: ${limit}, Current: ${current}`, 429, 'QUOTA_EXCEEDED');
    this.name = 'QuotaExceededError';
    this.resource = resource;
    this.limit = limit;
    this.current = current;
  }
}

class InvalidOperationError extends BusinessLogicError {
  constructor(operation, reason) {
    super(`Invalid operation '${operation}': ${reason}`, 400, 'INVALID_OPERATION');
    this.name = 'InvalidOperationError';
    this.operation = operation;
  }
}

// Database Errors
class DatabaseError extends AppError {
  constructor(message, originalError) {
    super(message || 'Database operation failed', 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

class DatabaseConnectionError extends DatabaseError {
  constructor(originalError) {
    super('Database connection failed', originalError);
    this.errorCode = 'DATABASE_CONNECTION_ERROR';
    this.name = 'DatabaseConnectionError';
  }
}

// Error Factory
class ErrorFactory {
  static createError(type, ...args) {
    const errorTypes = {
      authentication: AuthenticationError,
      tokenExpired: TokenExpiredError,
      invalidToken: InvalidTokenError,
      authorization: AuthorizationError,
      insufficientPermissions: InsufficientPermissionsError,
      subscriptionRequired: SubscriptionRequiredError,
      validation: ValidationError,
      requiredField: RequiredFieldError,
      invalidFormat: InvalidFormatError,
      notFound: ResourceNotFoundError,
      conflict: ResourceConflictError,
      duplicate: DuplicateResourceError,
      rateLimit: RateLimitError,
      externalService: ExternalServiceError,
      aiService: AIServiceError,
      paymentService: PaymentServiceError,
      businessLogic: BusinessLogicError,
      quotaExceeded: QuotaExceededError,
      invalidOperation: InvalidOperationError,
      database: DatabaseError,
      databaseConnection: DatabaseConnectionError
    };
    
    const ErrorClass = errorTypes[type] || AppError;
    return new ErrorClass(...args);
  }
}

module.exports = {
  AppError,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
  AuthorizationError,
  InsufficientPermissionsError,
  SubscriptionRequiredError,
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
  ResourceNotFoundError,
  ResourceConflictError,
  DuplicateResourceError,
  RateLimitError,
  ExternalServiceError,
  AIServiceError,
  PaymentServiceError,
  BusinessLogicError,
  QuotaExceededError,
  InvalidOperationError,
  DatabaseError,
  DatabaseConnectionError,
  ErrorFactory
};