const mongoose = require('mongoose');

const allowedEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  domain: {
    type: String,
    lowercase: true,
    trim: true
  },
  accessLevel: {
    type: String,
    enum: ['basic', 'premium', 'admin'],
    default: 'basic'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow null for system-created entries
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxLength: 500
  },
  // Track usage
  firstLoginAt: Date,
  lastLoginAt: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  // Override settings
  isOverrideEmail: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
allowedEmailSchema.index({ email: 1 });
allowedEmailSchema.index({ domain: 1 });
allowedEmailSchema.index({ isActive: 1 });
allowedEmailSchema.index({ accessLevel: 1 });

// Static method to check if email is allowed
allowedEmailSchema.statics.isEmailAllowed = async function(email) {
  const lowercaseEmail = email.toLowerCase();
  const domain = lowercaseEmail.split('@')[1];
  
  // Check exact email match first
  const exactMatch = await this.findOne({ 
    email: lowercaseEmail, 
    isActive: true 
  });
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // Check domain wildcard (for organizational access)
  const domainMatch = await this.findOne({ 
    domain: domain, 
    isActive: true,
    email: { $exists: false } // Domain-only entries
  });
  
  return domainMatch;
};

// Static method to add bulk emails
allowedEmailSchema.statics.addBulkEmails = async function(emails, addedBy, accessLevel = 'basic') {
  const emailObjects = emails.map(email => ({
    email: email.toLowerCase().trim(),
    domain: email.toLowerCase().split('@')[1],
    accessLevel,
    addedBy
  }));
  
  return await this.insertMany(emailObjects, { ordered: false });
};

// Method to track login
allowedEmailSchema.methods.trackLogin = async function() {
  this.loginCount += 1;
  this.lastLoginAt = new Date();
  
  if (!this.firstLoginAt) {
    this.firstLoginAt = new Date();
  }
  
  await this.save();
};

const AllowedEmail = mongoose.model('AllowedEmail', allowedEmailSchema);

module.exports = AllowedEmail;