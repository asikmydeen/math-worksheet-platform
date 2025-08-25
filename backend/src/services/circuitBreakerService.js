const EventEmitter = require('events');

/**
 * Circuit Breaker states
 */
const CircuitState = {
  CLOSED: 'CLOSED',    // Normal operation
  OPEN: 'OPEN',        // Failing, rejecting all requests
  HALF_OPEN: 'HALF_OPEN' // Testing if service recovered
};

class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 60 seconds
    this.requestTimeout = options.requestTimeout || 30000; // 30 seconds
    this.volumeThreshold = options.volumeThreshold || 10; // Minimum requests before opening
    this.errorThresholdPercentage = options.errorThresholdPercentage || 50;
    
    // State
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
    
    // Metrics
    this.metrics = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      totalTimeouts: 0,
      totalRejections: 0,
      lastStateChange: Date.now(),
      stateChanges: []
    };
    
    // Rolling window for error rate calculation
    this.rollingWindow = [];
    this.windowSize = options.windowSize || 10000; // 10 seconds
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute(fn) {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (this.canAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        this.metrics.totalRejections++;
        throw new Error(`Circuit breaker is OPEN. Service unavailable. Next retry in ${this.getTimeUntilRetry()}ms`);
      }
    }

    this.metrics.totalRequests++;
    
    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout(fn) {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        this.metrics.totalTimeouts++;
        reject(new Error(`Request timeout after ${this.requestTimeout}ms`));
      }, this.requestTimeout);

      try {
        const result = await fn();
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Handle successful request
   */
  onSuccess() {
    this.failures = 0;
    this.successes++;
    this.metrics.totalSuccesses++;
    
    // Add to rolling window
    this.addToRollingWindow(true);
    
    if (this.state === CircuitState.HALF_OPEN) {
      // Success in half-open state, check if we should close
      if (this.successes >= this.volumeThreshold) {
        this.transitionToClosed();
      }
    }
  }

  /**
   * Handle failed request
   */
  onFailure(error) {
    this.failures++;
    this.metrics.totalFailures++;
    this.lastFailureTime = Date.now();
    
    // Add to rolling window
    this.addToRollingWindow(false);
    
    this.emit('failure', {
      error,
      failures: this.failures,
      state: this.state
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Failure in half-open state, reopen circuit
      this.transitionToOpen();
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we should open the circuit
      const errorRate = this.calculateErrorRate();
      const totalRequests = this.getTotalRequestsInWindow();
      
      if (totalRequests >= this.volumeThreshold && 
          errorRate >= this.errorThresholdPercentage) {
        this.transitionToOpen();
      }
    }
  }

  /**
   * Add request result to rolling window
   */
  addToRollingWindow(success) {
    const now = Date.now();
    this.rollingWindow.push({
      timestamp: now,
      success
    });
    
    // Remove old entries
    this.rollingWindow = this.rollingWindow.filter(
      entry => now - entry.timestamp < this.windowSize
    );
  }

  /**
   * Calculate current error rate
   */
  calculateErrorRate() {
    if (this.rollingWindow.length === 0) return 0;
    
    const failures = this.rollingWindow.filter(entry => !entry.success).length;
    return (failures / this.rollingWindow.length) * 100;
  }

  /**
   * Get total requests in rolling window
   */
  getTotalRequestsInWindow() {
    return this.rollingWindow.length;
  }

  /**
   * Check if we can attempt to reset the circuit
   */
  canAttemptReset() {
    return this.nextAttempt && Date.now() >= this.nextAttempt;
  }

  /**
   * Get time until next retry attempt
   */
  getTimeUntilRetry() {
    if (!this.nextAttempt) return 0;
    return Math.max(0, this.nextAttempt - Date.now());
  }

  /**
   * Transition to OPEN state
   */
  transitionToOpen() {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.resetTimeout;
    this.recordStateChange(CircuitState.OPEN);
    
    this.emit('open', {
      failures: this.failures,
      errorRate: this.calculateErrorRate(),
      nextAttempt: this.nextAttempt
    });
  }

  /**
   * Transition to HALF_OPEN state
   */
  transitionToHalfOpen() {
    this.state = CircuitState.HALF_OPEN;
    this.successes = 0;
    this.failures = 0;
    this.recordStateChange(CircuitState.HALF_OPEN);
    
    this.emit('half-open', {
      previousState: CircuitState.OPEN
    });
  }

  /**
   * Transition to CLOSED state
   */
  transitionToClosed() {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = null;
    this.recordStateChange(CircuitState.CLOSED);
    
    this.emit('closed', {
      previousState: this.state
    });
  }

  /**
   * Record state change for metrics
   */
  recordStateChange(newState) {
    this.metrics.lastStateChange = Date.now();
    this.metrics.stateChanges.push({
      from: this.state,
      to: newState,
      timestamp: Date.now()
    });
    
    // Keep only last 100 state changes
    if (this.metrics.stateChanges.length > 100) {
      this.metrics.stateChanges = this.metrics.stateChanges.slice(-100);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      errorRate: this.calculateErrorRate(),
      totalRequests: this.getTotalRequestsInWindow(),
      metrics: this.metrics,
      nextAttempt: this.nextAttempt,
      timeUntilRetry: this.getTimeUntilRetry()
    };
  }

  /**
   * Force reset the circuit breaker
   */
  reset() {
    this.transitionToClosed();
    this.rollingWindow = [];
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    
    this.emit('reset', {
      manual: true
    });
  }

  /**
   * Update configuration
   */
  configure(options) {
    if (options.failureThreshold !== undefined) {
      this.failureThreshold = options.failureThreshold;
    }
    if (options.resetTimeout !== undefined) {
      this.resetTimeout = options.resetTimeout;
    }
    if (options.requestTimeout !== undefined) {
      this.requestTimeout = options.requestTimeout;
    }
    if (options.volumeThreshold !== undefined) {
      this.volumeThreshold = options.volumeThreshold;
    }
    if (options.errorThresholdPercentage !== undefined) {
      this.errorThresholdPercentage = options.errorThresholdPercentage;
    }
  }
}

// Create a circuit breaker for AI service
const aiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  requestTimeout: 30000, // 30 seconds
  volumeThreshold: 10,
  errorThresholdPercentage: 50
});

// Log state changes
aiCircuitBreaker.on('open', (data) => {
  console.error('AI Circuit Breaker opened:', data);
});

aiCircuitBreaker.on('half-open', (data) => {
  console.log('AI Circuit Breaker half-open:', data);
});

aiCircuitBreaker.on('closed', (data) => {
  console.log('AI Circuit Breaker closed:', data);
});

module.exports = {
  aiCircuitBreaker,
  CircuitBreaker,
  CircuitState
};