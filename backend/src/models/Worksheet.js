const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  answer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  userAnswer: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'fill-in-blank', 'word-problem', 'equation', 'true-false', 'short-answer', 'essay', 'matching'],
    default: 'fill-in-blank'
  },
  topic: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  hints: [String],
  explanation: String,
  workShown: String,
  timeSpent: {
    type: Number,
    default: 0
  },
  choices: [String], // For multiple choice questions
  matchingPairs: [{ // For matching questions
    left: String,
    right: String
  }]
});

const worksheetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  kidProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KidProfile',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  grade: {
    type: String,
    required: true,
    enum: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'College', 'Adult']
  },
  subject: {
    type: String,
    required: true,
    enum: ['Math', 'Science', 'English', 'History', 'Geography', 'Language', 'Computer Science', 'Art', 'Music', 'Physical Education', 'Social Studies', 'Biology', 'Chemistry', 'Physics', 'Literature', 'Writing', 'General']
  },
  topics: [String],
  problems: [problemSchema],
  
  generationType: {
    type: String,
    enum: ['standard', 'natural-language', 'custom'],
    default: 'standard'
  },
  naturalLanguageRequest: String,
  aiModel: String,
  aiPrompt: String,
  
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  completedAt: Date,
  timeSpent: {
    type: Number,
    default: 0
  },
  attempts: {
    type: Number,
    default: 0
  },
  
  showHints: {
    type: Boolean,
    default: true
  },
  showExplanations: {
    type: Boolean,
    default: false
  },
  timerEnabled: {
    type: Boolean,
    default: false
  },
  timeLimit: Number,
  
  tags: [String],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'archived'],
    default: 'in-progress'
  },
  
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
worksheetSchema.index({ user: 1, createdAt: -1 });
worksheetSchema.index({ user: 1, status: 1, createdAt: -1 });
worksheetSchema.index({ user: 1, kidProfile: 1, createdAt: -1 });
worksheetSchema.index({ user: 1, grade: 1, createdAt: -1 });
worksheetSchema.index({ user: 1, subject: 1, createdAt: -1 });
worksheetSchema.index({ user: 1, score: -1 });
worksheetSchema.index({ user: 1, completedAt: -1 });
worksheetSchema.index({ createdAt: -1 }); // For sorting by newest
worksheetSchema.index({ user: 1, _id: -1 }); // For cursor-based pagination

// Compound index for common query patterns
worksheetSchema.index({ 
  user: 1, 
  kidProfile: 1, 
  status: 1, 
  grade: 1, 
  createdAt: -1 
});

// Method to calculate score
worksheetSchema.methods.calculateScore = function() {
  const totalProblems = this.problems.length;
  if (totalProblems === 0) return 0;
  
  const correctProblems = this.problems.filter(p => p.isCorrect === true).length;
  this.score = Math.round((correctProblems / totalProblems) * 100);
  
  return this.score;
};

// Method to grade problems
worksheetSchema.methods.gradeProblems = function() {
  this.problems.forEach(problem => {
    if (problem.userAnswer !== null && problem.userAnswer !== undefined) {
      if (typeof problem.answer === 'number' && typeof problem.userAnswer === 'string') {
        problem.isCorrect = parseFloat(problem.userAnswer) === problem.answer;
      } else if (typeof problem.answer === 'string' && typeof problem.userAnswer === 'string') {
        problem.isCorrect = problem.answer.toLowerCase().trim() === problem.userAnswer.toLowerCase().trim();
      } else {
        problem.isCorrect = problem.answer === problem.userAnswer;
      }
    }
  });
  
  return this.calculateScore();
};

const Worksheet = mongoose.model('Worksheet', worksheetSchema);

module.exports = Worksheet;
