const mongoose = require('mongoose');

const kidProfileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide the kid\'s name'],
    trim: true,
    maxLength: [50, 'Name cannot be more than 50 characters']
  },
  grade: {
    type: String,
    required: [true, 'Please select a grade level'],
    enum: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    default: '1'
  },
  parentUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  avatar: {
    type: String,
    default: null // Can store avatar URL or emoji
  },
  preferences: {
    favoriteSubjects: [{
      type: String,
      enum: ['Math', 'Science', 'English', 'History', 'Geography', 'Language', 'Computer Science', 'Biology', 'Chemistry', 'Physics', 'Literature', 'Writing', 'Social Studies', 'Art', 'Music', 'Physical Education', 'General']
    }],
    difficultyPreference: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'medium'
    },
    defaultProblemCount: {
      type: Number,
      default: 10,
      min: 5,
      max: 50
    },
    learningGoals: [String]
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
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0
    },
    subjectProgress: [{
      subject: String,
      level: { type: Number, default: 1 },
      experience: { type: Number, default: 0 },
      badges: [String]
    }]
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    dailyGoal: {
      worksheets: { type: Number, default: 1 },
      problems: { type: Number, default: 10 }
    },
    parentalControls: {
      timeLimit: { type: Number, default: 60 }, // minutes per day
      allowedSubjects: [String]
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
kidProfileSchema.index({ parentUserId: 1 });
kidProfileSchema.index({ grade: 1 });
kidProfileSchema.index({ isActive: 1 });
kidProfileSchema.index({ createdAt: -1 });

// Virtual for age estimation based on grade
kidProfileSchema.virtual('estimatedAge').get(function() {
  if (this.grade === 'K') return 5;
  return parseInt(this.grade) + 5;
});

// Method to update stats after completing a worksheet
kidProfileSchema.methods.updateStats = async function(worksheetScore, problemCount, timeSpent = 0, subject = 'Math') {
  this.stats.totalWorksheets += 1;
  this.stats.totalProblems += problemCount;
  this.stats.correctAnswers += Math.round(worksheetScore * problemCount / 100);
  this.stats.timeSpent += timeSpent;
  
  // Update average score
  const totalScore = this.stats.averageScore * (this.stats.totalWorksheets - 1) + worksheetScore;
  this.stats.averageScore = Math.round(totalScore / this.stats.totalWorksheets);
  
  // Update streak
  const today = new Date().setHours(0, 0, 0, 0);
  const lastActivity = this.stats.streak.lastActivity 
    ? new Date(this.stats.streak.lastActivity).setHours(0, 0, 0, 0)
    : null;
  
  if (!lastActivity || today - lastActivity === 86400000) { // Exactly one day
    this.stats.streak.current += 1;
    this.stats.streak.best = Math.max(this.stats.streak.current, this.stats.streak.best);
  } else if (today !== lastActivity && today - lastActivity > 86400000) { // More than one day
    this.stats.streak.current = 1;
  }
  // If same day, don't change streak
  
  this.stats.streak.lastActivity = new Date();
  
  // Update subject progress
  let subjectProgress = this.stats.subjectProgress.find(p => p.subject === subject);
  if (!subjectProgress) {
    subjectProgress = { subject, level: 1, experience: 0, badges: [] };
    this.stats.subjectProgress.push(subjectProgress);
  }
  
  // Add experience points based on score
  const experienceGained = Math.round(worksheetScore / 10) + problemCount;
  subjectProgress.experience += experienceGained;
  
  // Level up logic (every 100 experience points)
  const newLevel = Math.floor(subjectProgress.experience / 100) + 1;
  if (newLevel > subjectProgress.level) {
    subjectProgress.level = newLevel;
    // Award badges for milestones
    if (newLevel === 5) subjectProgress.badges.push('Beginner');
    if (newLevel === 10) subjectProgress.badges.push('Intermediate');
    if (newLevel === 20) subjectProgress.badges.push('Advanced');
  }
  
  this.lastActiveAt = new Date();
  await this.save();
  
  return {
    experienceGained,
    leveledUp: newLevel > (subjectProgress.level - (newLevel - subjectProgress.level)),
    newLevel: subjectProgress.level,
    streakContinued: this.stats.streak.current > 1
  };
};

// Method to check if kid has reached daily limits
kidProfileSchema.methods.checkDailyLimits = function() {
  const today = new Date().setHours(0, 0, 0, 0);
  const lastActivity = this.lastActiveAt ? new Date(this.lastActiveAt).setHours(0, 0, 0, 0) : null;
  
  // Reset daily stats if it's a new day
  if (lastActivity !== today) {
    return {
      timeUsed: 0,
      worksheetsCompleted: 0,
      canContinue: true
    };
  }
  
  // For same day, you'd need to track daily usage (could be added to schema)
  return {
    timeUsed: 0, // Would need to implement daily tracking
    worksheetsCompleted: 0, // Would need to implement daily tracking
    canContinue: true
  };
};

// Static method to get profiles for a parent
kidProfileSchema.statics.getProfilesForParent = async function(parentUserId, includeInactive = false) {
  const query = { parentUserId };
  if (!includeInactive) {
    query.isActive = true;
  }
  
  return await this.find(query).sort({ createdAt: 1 }).limit(4); // Max 4 profiles
};

const KidProfile = mongoose.model('KidProfile', kidProfileSchema);

module.exports = KidProfile;