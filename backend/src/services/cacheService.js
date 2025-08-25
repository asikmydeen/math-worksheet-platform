const crypto = require('crypto');

class CacheService {
  static worksheetCache = new Map();
  static problemBank = new Map();
  static CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  static MAX_CACHE_SIZE = 100; // Maximum cached worksheets

  /**
   * Generate cache key from worksheet parameters
   */
  static generateCacheKey(params) {
    const { subject, grade, count, topics, difficulty } = params;
    const topicsStr = Array.isArray(topics) ? topics.sort().join(',') : topics || '';
    const keyStr = `${subject}-${grade}-${count}-${topicsStr}-${difficulty}`;
    return crypto.createHash('md5').update(keyStr).digest('hex');
  }

  /**
   * Get cached worksheet if available and not expired
   */
  static getCachedWorksheet(params) {
    const key = this.generateCacheKey(params);
    const cached = this.worksheetCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Cache hit for worksheet: ${key}`);
      return {
        ...cached.data,
        fromCache: true,
        cacheAge: Date.now() - cached.timestamp
      };
    }
    
    if (cached) {
      console.log(`Cache expired for worksheet: ${key}`);
      this.worksheetCache.delete(key);
    }
    
    return null;
  }

  /**
   * Cache a generated worksheet
   */
  static cacheWorksheet(params, worksheetData) {
    const key = this.generateCacheKey(params);
    
    // Implement LRU cache - remove oldest if cache is full
    if (this.worksheetCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.worksheetCache.keys().next().value;
      this.worksheetCache.delete(oldestKey);
      console.log(`Cache full, removed oldest entry: ${oldestKey}`);
    }
    
    this.worksheetCache.set(key, {
      data: worksheetData,
      timestamp: Date.now()
    });
    
    console.log(`Cached worksheet: ${key}, cache size: ${this.worksheetCache.size}`);
  }

  /**
   * Add problems to the problem bank for reuse
   */
  static addToProblemaBank(subject, grade, problems) {
    const key = `${subject}-${grade}`;
    if (!this.problemBank.has(key)) {
      this.problemBank.set(key, []);
    }
    
    const bank = this.problemBank.get(key);
    
    // Add problems with quality score > 0.7 to the bank
    const highQualityProblems = problems.filter(p => p.qualityScore > 0.7);
    bank.push(...highQualityProblems);
    
    // Keep only the most recent 500 problems
    if (bank.length > 500) {
      bank.splice(0, bank.length - 500);
    }
    
    console.log(`Added ${highQualityProblems.length} problems to bank for ${key}, total: ${bank.length}`);
  }

  /**
   * Get problems from the problem bank
   */
  static getFromProblemBank(subject, grade, count, topics) {
    const key = `${subject}-${grade}`;
    const bank = this.problemBank.get(key);
    
    if (!bank || bank.length === 0) {
      return null;
    }
    
    let availableProblems = [...bank];
    
    // Filter by topics if specified
    if (topics && topics.length > 0) {
      const topicSet = new Set(Array.isArray(topics) ? topics : [topics]);
      availableProblems = availableProblems.filter(p => 
        topicSet.has(p.topic) || topics.some(t => p.topic.includes(t))
      );
    }
    
    if (availableProblems.length < count) {
      return null; // Not enough problems in bank
    }
    
    // Randomly select problems
    const selected = [];
    const used = new Set();
    
    while (selected.length < count && availableProblems.length > used.size) {
      const index = Math.floor(Math.random() * availableProblems.length);
      if (!used.has(index)) {
        used.add(index);
        selected.push({ ...availableProblems[index] });
      }
    }
    
    console.log(`Retrieved ${selected.length} problems from bank for ${key}`);
    return selected;
  }

  /**
   * Clear expired cache entries
   */
  static cleanupCache() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, value] of this.worksheetCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.worksheetCache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`Cleaned up ${removed} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    return {
      worksheetCacheSize: this.worksheetCache.size,
      problemBankSize: Array.from(this.problemBank.values()).reduce((sum, bank) => sum + bank.length, 0),
      problemBankKeys: Array.from(this.problemBank.keys())
    };
  }
}

// Run cleanup every 30 minutes
setInterval(() => {
  CacheService.cleanupCache();
}, 30 * 60 * 1000);

module.exports = CacheService;