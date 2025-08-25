const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Store for rate limit data
const rateLimitStore = new Map();

/**
 * Custom store for rate limiting that supports both IP and user-based limiting
 */
class CustomRateLimitStore {
  constructor() {
    this.hits = new Map();
    this.resetTimes = new Map();
  }

  async increment(key) {
    const now = Date.now();
    const resetTime = this.resetTimes.get(key);

    // Reset if window has expired
    if (!resetTime || now > resetTime) {
      this.hits.set(key, 1);
      this.resetTimes.set(key, now + 60000); // 1 minute window
      return { totalHits: 1, resetTime: this.resetTimes.get(key) };
    }

    const currentHits = (this.hits.get(key) || 0) + 1;
    this.hits.set(key, currentHits);
    
    return { totalHits: currentHits, resetTime: this.resetTimes.get(key) };
  }

  async decrement(key) {
    const currentHits = this.hits.get(key) || 0;
    if (currentHits > 0) {
      this.hits.set(key, currentHits - 1);
    }
  }

  async resetKey(key) {
    this.hits.delete(key);
    this.resetTimes.delete(key);
  }

  async resetAll() {
    this.hits.clear();
    this.resetTimes.clear();
  }
}

// Create store instance
const store = new CustomRateLimitStore();

/**
 * General API rate limiting
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Strict rate limiting for AI generation endpoints
 */
const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: async (req) => {
    // Premium users get more requests
    if (req.user?.subscription?.plan === 'premium') {
      return 50; // 50 requests per hour for premium
    }
    return 10; // 10 requests per hour for free users
  },
  message: 'AI generation limit reached. Please upgrade to premium for more requests.',
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const isPremium = req.user?.subscription?.plan === 'premium';
    res.status(429).json({
      success: false,
      message: isPremium 
        ? 'AI generation limit reached. Please try again later.'
        : 'AI generation limit reached. Upgrade to premium for more requests.',
      requiresUpgrade: !isPremium,
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Authentication rate limiting
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts. Please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Worksheet submission rate limiting
 */
const worksheetSubmissionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 submissions per 5 minutes
  message: 'Too many worksheet submissions. Please slow down.',
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

/**
 * API key based rate limiting for external integrations
 */
const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: async (req) => {
    // Different limits based on API key tier
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return 10;
    
    // You can check API key tier from database here
    // For now, using a simple check
    if (apiKey.startsWith('premium_')) return 100;
    if (apiKey.startsWith('pro_')) return 50;
    return 20;
  },
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || req.ip;
  }
});

/**
 * Dynamic rate limiting based on user behavior
 */
class DynamicRateLimiter {
  constructor() {
    this.userScores = new Map();
    this.blacklist = new Set();
  }

  /**
   * Calculate user trust score based on behavior
   */
  calculateTrustScore(userId) {
    const score = this.userScores.get(userId) || {
      requests: 0,
      violations: 0,
      lastViolation: null,
      trustLevel: 1.0
    };

    // Decay violations over time
    if (score.lastViolation) {
      const hoursSinceViolation = (Date.now() - score.lastViolation) / (1000 * 60 * 60);
      if (hoursSinceViolation > 24) {
        score.violations = Math.max(0, score.violations - 1);
        score.trustLevel = Math.min(1.0, score.trustLevel + 0.1);
      }
    }

    return score;
  }

  /**
   * Create dynamic limiter
   */
  createLimiter(baseLimit = 100) {
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: (req) => {
        if (this.blacklist.has(req.ip)) {
          return 0; // Completely block blacklisted IPs
        }

        const userId = req.user?.id || req.ip;
        const trustScore = this.calculateTrustScore(userId);
        
        // Adjust limit based on trust score
        return Math.floor(baseLimit * trustScore.trustLevel);
      },
      handler: (req, res) => {
        const userId = req.user?.id || req.ip;
        const score = this.userScores.get(userId) || {
          requests: 0,
          violations: 0,
          lastViolation: null,
          trustLevel: 1.0
        };

        score.violations++;
        score.lastViolation = Date.now();
        score.trustLevel = Math.max(0.1, score.trustLevel - 0.2);

        // Blacklist if too many violations
        if (score.violations > 5) {
          this.blacklist.add(req.ip);
        }

        this.userScores.set(userId, score);

        res.status(429).json({
          success: false,
          message: 'Rate limit exceeded. Your limits have been adjusted due to excessive requests.'
        });
      }
    });
  }
}

// Create dynamic limiter instance
const dynamicLimiter = new DynamicRateLimiter();

/**
 * MongoDB backed rate limiter for distributed systems
 */
const createMongoRateLimiter = (options) => {
  return async (req, res, next) => {
    try {
      const key = options.keyGenerator ? options.keyGenerator(req) : req.ip;
      const now = Date.now();
      const windowStart = now - options.windowMs;

      // Find or create rate limit document
      const RateLimit = mongoose.model('RateLimit');
      const doc = await RateLimit.findOneAndUpdate(
        { key, timestamp: { $gte: windowStart } },
        { 
          $inc: { hits: 1 },
          $set: { timestamp: now }
        },
        { upsert: true, new: true }
      );

      // Check if limit exceeded
      if (doc.hits > options.max) {
        return res.status(429).json({
          success: false,
          message: options.message || 'Rate limit exceeded',
          retryAfter: windowStart + options.windowMs
        });
      }

      // Add rate limit headers
      res.setHeader('RateLimit-Limit', options.max);
      res.setHeader('RateLimit-Remaining', Math.max(0, options.max - doc.hits));
      res.setHeader('RateLimit-Reset', new Date(windowStart + options.windowMs).toISOString());

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // Don't block request on rate limit errors
      next();
    }
  };
};

module.exports = {
  generalLimiter,
  aiGenerationLimiter,
  authLimiter,
  worksheetSubmissionLimiter,
  apiKeyLimiter,
  dynamicLimiter,
  createMongoRateLimiter,
  CustomRateLimitStore
};