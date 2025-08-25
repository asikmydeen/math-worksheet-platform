const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    index: true
  },
  hits: {
    type: Number,
    default: 1
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Create compound index for efficient queries
rateLimitSchema.index({ key: 1, timestamp: 1 });

// TTL index to automatically remove old documents after 24 hours
rateLimitSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

const RateLimit = mongoose.model('RateLimit', rateLimitSchema);

module.exports = RateLimit;