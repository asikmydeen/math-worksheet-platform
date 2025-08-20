const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Primary identification - now based on email from Google
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxLength: [100, 'Name cannot be more than 100 characters']
  },
  // Google OAuth fields
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  avatar: {
    type: String
  },
  // Access control
  accessLevel: {
    type: String,
    enum: ['basic', 'premium', 'admin'],
    default: 'basic'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'parent', 'admin'],
    default: 'parent' // Changed default to parent since users will manage kids
  },
  // Keep grade for backward compatibility, but will use kid profiles primarily
  grade: {
    type: String,
    enum: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    default: '5'
  },
  // Kid profile management
  activeKidProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KidProfile',
    default: null
  },
  hasSetupKidProfiles: {
    type: Boolean,
    default: false
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
      enum: ['free', 'monthly', 'annual', 'lifetime'],
      default: 'free'
    },
    aiRequestsUsed: {
      type: Number,
      default: 0
    },
    aiRequestsLimit: {
      type: Number,
      default: 10 // Reduced for free tier
    },
    resetDate: {
      type: Date,
      default: Date.now
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    subscriptionStatus: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'incomplete'],
      default: 'active'
    }
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
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ accessLevel: 1 });
userSchema.index({ isActive: 1 });

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email,
      role: this.role,
      accessLevel: this.accessLevel
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' } // Extended for better UX
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
        this.subscription.aiRequestsLimit = 10;
        break;
      case 'monthly':
        this.subscription.aiRequestsLimit = 50;
        break;
      case 'annual':
        this.subscription.aiRequestsLimit = 600;
        break;
      case 'lifetime':
        this.subscription.aiRequestsLimit = -1; // Unlimited
        break;
    }
    
    await this.save();
  }
};

// Check if user has access
userSchema.methods.hasAccess = function() {
  return this.isActive && ['basic', 'premium', 'admin'].includes(this.accessLevel);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
