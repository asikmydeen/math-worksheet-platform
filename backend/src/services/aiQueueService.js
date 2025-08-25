const EventEmitter = require('events');
const { aiCircuitBreaker } = require('./circuitBreakerService');

class AIQueueService extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 3; // Max concurrent AI requests
    this.activeRequests = 0;
    this.requestDelay = 500; // Minimum delay between requests in ms
    this.maxQueueSize = 100; // Maximum queue size
    this.requestTimeout = 30000; // 30 seconds timeout
    
    // Stats
    this.stats = {
      totalQueued: 0,
      totalProcessed: 0,
      totalErrors: 0,
      averageWaitTime: 0,
      averageProcessTime: 0
    };

    // Start processing queue
    this.startProcessing();
  }

  /**
   * Add a request to the queue
   * @param {Object} request - The AI request to queue
   * @returns {Promise} - Resolves when the request is completed
   */
  async addToQueue(request) {
    return new Promise((resolve, reject) => {
      // Check queue size
      if (this.queue.length >= this.maxQueueSize) {
        reject(new Error('Queue is full. Please try again later.'));
        return;
      }

      const queueItem = {
        id: Date.now() + Math.random(),
        request,
        resolve,
        reject,
        addedAt: Date.now(),
        status: 'queued',
        retries: 0,
        maxRetries: 3
      };

      this.queue.push(queueItem);
      this.stats.totalQueued++;
      
      this.emit('queued', {
        id: queueItem.id,
        position: this.queue.length,
        estimatedWaitTime: this.getEstimatedWaitTime()
      });

      // Process queue if not already processing
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Start the queue processing loop
   */
  startProcessing() {
    this.processing = true;
    this.processQueue();
  }

  /**
   * Process items in the queue
   */
  async processQueue() {
    while (this.processing) {
      // Check if we can process more requests
      if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
        // Wait a bit before checking again
        await this.delay(100);
        continue;
      }

      // Get next item from queue
      const queueItem = this.queue.shift();
      if (!queueItem) continue;

      // Update wait time stats
      const waitTime = Date.now() - queueItem.addedAt;
      this.updateAverageWaitTime(waitTime);

      // Process the request
      this.activeRequests++;
      queueItem.status = 'processing';
      queueItem.startedAt = Date.now();

      this.emit('processing', {
        id: queueItem.id,
        activeRequests: this.activeRequests
      });

      // Process asynchronously
      this.processRequest(queueItem).catch(error => {
        console.error('Error processing queue item:', error);
      });

      // Add delay between requests to avoid rate limiting
      await this.delay(this.requestDelay);
    }
  }

  /**
   * Process a single request
   */
  async processRequest(queueItem) {
    const { request, resolve, reject, id } = queueItem;

    try {
      // Set timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.requestTimeout);
      });

      // Execute the request with circuit breaker and timeout
      const result = await aiCircuitBreaker.execute(async () => {
        return await Promise.race([
          request.execute(),
          timeoutPromise
        ]);
      });

      // Update stats
      const processTime = Date.now() - queueItem.startedAt;
      this.updateAverageProcessTime(processTime);
      this.stats.totalProcessed++;

      queueItem.status = 'completed';
      resolve(result);

      this.emit('completed', {
        id,
        processTime,
        result: result
      });

    } catch (error) {
      queueItem.status = 'error';
      queueItem.retries++;
      
      // Check if we should retry
      if (queueItem.retries < queueItem.maxRetries) {
        console.log(`Retrying request ${id} (attempt ${queueItem.retries}/${queueItem.maxRetries})`);
        queueItem.status = 'queued';
        
        // Add back to queue with exponential backoff
        await this.delay(Math.pow(2, queueItem.retries) * 1000);
        this.queue.push(queueItem);
        
        this.emit('retry', {
          id,
          attempt: queueItem.retries,
          maxRetries: queueItem.maxRetries
        });
      } else {
        // Max retries reached
        this.stats.totalErrors++;
        reject(error);
        
        this.emit('error', {
          id,
          error: error.message,
          retries: queueItem.retries
        });
      }
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Get estimated wait time for new requests
   */
  getEstimatedWaitTime() {
    const queuedRequests = this.queue.length;
    const processingRequests = this.activeRequests;
    
    // Estimate based on average process time and queue position
    const avgProcessTime = this.stats.averageProcessTime || 5000; // Default 5s
    const estimatedCycles = Math.ceil((queuedRequests + processingRequests) / this.maxConcurrent);
    
    return estimatedCycles * avgProcessTime;
  }

  /**
   * Update average wait time
   */
  updateAverageWaitTime(waitTime) {
    const total = this.stats.totalQueued;
    this.stats.averageWaitTime = 
      (this.stats.averageWaitTime * (total - 1) + waitTime) / total;
  }

  /**
   * Update average process time
   */
  updateAverageProcessTime(processTime) {
    const total = this.stats.totalProcessed;
    if (total === 0) {
      this.stats.averageProcessTime = processTime;
    } else {
      this.stats.averageProcessTime = 
        (this.stats.averageProcessTime * (total - 1) + processTime) / total;
    }
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent,
      stats: this.stats,
      estimatedWaitTime: this.getEstimatedWaitTime()
    };
  }

  /**
   * Clear the queue
   */
  clearQueue() {
    // Reject all pending requests
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    
    this.emit('cleared', {
      clearedCount: this.queue.length
    });
  }

  /**
   * Stop processing
   */
  stop() {
    this.processing = false;
    this.clearQueue();
  }

  /**
   * Helper function to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Set configuration
   */
  configure(options) {
    if (options.maxConcurrent !== undefined) {
      this.maxConcurrent = options.maxConcurrent;
    }
    if (options.requestDelay !== undefined) {
      this.requestDelay = options.requestDelay;
    }
    if (options.maxQueueSize !== undefined) {
      this.maxQueueSize = options.maxQueueSize;
    }
    if (options.requestTimeout !== undefined) {
      this.requestTimeout = options.requestTimeout;
    }
  }
}

// Create singleton instance
const aiQueueService = new AIQueueService();

module.exports = aiQueueService;