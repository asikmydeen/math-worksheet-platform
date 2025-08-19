const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    lowercase: true,
    minLength: [3, 'Username must be at least 3 characters'],
    maxLength: [20, 'Username cannot be more than 20 characters'],
    match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores']
  },
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxLength: [50, 'Name cannot be more than 50 characters']
  },
  twoFactorSecret: {
    type: String,
    required: true,
    select: false // Don't include in queries by default
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'parent', 'admin'],
    default: 'student'
  },
  grade: {
    type: String,
    enum: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    required: function() { return this.role === 'student'; }
  },
  preferences: {
    defaultGrade: String,
    defaultProblemCount: {
      type: Number,
      default: 10
    },
    defaultDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'medium'
    },
    favoriteTopics: [String]
  },
  stats: {
    totalWorksheets: {
      type: Number,
      default: 0
    },
    totalProblems: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    streak: {
      current: { type: Number, default: 0 },
      best: { type: Number, default: 0 },
      lastActivity: Date
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free'
    },
    aiRequestsUsed: {
      type: Number,
      default: 0
    },
    aiRequestsLimit: {
      type: Number,
      default: 50
    },
    resetDate: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

// Generate 2FA secret
userSchema.methods.generate2FASecret = function() {
  const secret = speakeasy.generateSecret({
    name: `MathWorksheetAI (${this.username})`,
    length: 32
  });
  this.twoFactorSecret = secret.base32;
  return secret;
};

// Verify 2FA token
userSchema.methods.verify2FAToken = function(token) {
  return speakeasy.totp.verify({
    secret: this.twoFactorSecret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps tolerance
  });
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      username: this.username,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Update stats method
userSchema.methods.updateStats = async function(worksheetScore, problemCount) {
  this.stats.totalWorksheets += 1;
  this.stats.totalProblems += problemCount;
  this.stats.correctAnswers += Math.round(worksheetScore * problemCount / 100);
  
  // Update average score
  const totalScore = this.stats.averageScore * (this.stats.totalWorksheets - 1) + worksheetScore;
  this.stats.averageScore = Math.round(totalScore / this.stats.totalWorksheets);
  
  // Update streak
  const today = new Date().setHours(0, 0, 0, 0);
  const lastActivity = this.stats.streak.lastActivity 
    ? new Date(this.stats.streak.lastActivity).setHours(0, 0, 0, 0)
    : null;
  
  if (!lastActivity || today - lastActivity === 86400000) {
    this.stats.streak.current += 1;
    this.stats.streak.best = Math.max(this.stats.streak.current, this.stats.streak.best);
  } else if (today !== lastActivity) {
    this.stats.streak.current = 1;
  }
  
  this.stats.streak.lastActivity = new Date();
  
  await this.save();
};

// Check and reset AI requests if needed
userSchema.methods.checkAIRequestsReset = async function() {
  const now = new Date();
  const resetDate = new Date(this.subscription.resetDate);
  
  if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
    this.subscription.aiRequestsUsed = 0;
    this.subscription.resetDate = now;
    
    switch(this.subscription.plan) {
      case 'free':
        this.subscription.aiRequestsLimit = 50;
        break;
      case 'basic':
        this.subscription.aiRequestsLimit = 500;
        break;
      case 'premium':
        this.subscription.aiRequestsLimit = -1;
        break;
    }
    
    await this.save();
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
