const mongoose = require('mongoose');
const crypto = require('crypto');

const llmSettingsSchema = new mongoose.Schema({
  provider: {
    type: String,
    default: 'openrouter',
    enum: ['openrouter', 'openai', 'custom']
  },
  apiKey: {
    type: String,
    required: true
  },
  baseUrl: {
    type: String,
    default: 'https://openrouter.ai/api/v1'
  },
  selectedModel: {
    type: String,
    default: 'openai/gpt-4o-mini'
  },
  modelConfig: {
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 2000
    },
    topP: {
      type: Number,
      default: 1,
      min: 0,
      max: 1
    }
  },
  availableModels: [{
    id: String,
    name: String,
    pricing: {
      prompt: Number,
      completion: Number,
      unit: String
    },
    contextLength: Number,
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Encrypt API key before saving
llmSettingsSchema.pre('save', function(next) {
  if (this.isModified('apiKey') && this.apiKey && !this.apiKey.startsWith('enc:')) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-secret', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(this.apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    this.apiKey = `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  next();
});

// Method to decrypt API key
llmSettingsSchema.methods.getDecryptedApiKey = function() {
  if (!this.apiKey || !this.apiKey.startsWith('enc:')) {
    return this.apiKey;
  }
  
  try {
    const parts = this.apiKey.split(':');
    if (parts.length !== 4) return this.apiKey;
    
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-secret', 'salt', 32);
    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting API key:', error);
    return null;
  }
};

// Method to set API key (will be encrypted on save)
llmSettingsSchema.methods.setApiKey = function(apiKey) {
  this.apiKey = apiKey;
};

// Static method to get active settings
llmSettingsSchema.statics.getActiveSettings = async function() {
  return this.findOne({ isActive: true }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('LLMSettings', llmSettingsSchema);