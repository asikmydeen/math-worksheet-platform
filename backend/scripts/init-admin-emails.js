const mongoose = require('mongoose');
require('dotenv').config();

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
    required: false
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
  firstLoginAt: Date,
  lastLoginAt: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  isOverrideEmail: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

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

async function initializeAdminEmails() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    const adminEmails = [
      'writetoasik@gmail.com',
      'itsmeasik@gmail.com', 
      'writetonikkath@gmail.com'
    ];

    const results = [];
    const errors = [];

    for (const email of adminEmails) {
      try {
        // Check if already exists
        const existing = await AllowedEmail.findOne({ email: email.toLowerCase() });
        if (existing) {
          console.log(`📧 ${email} already exists`);
          results.push({ email, status: 'already exists' });
          continue;
        }

        const allowedEmail = new AllowedEmail({
          email: email.toLowerCase(),
          domain: email.toLowerCase().split('@')[1],
          accessLevel: 'admin',
          isOverrideEmail: true,
          addedBy: null,
          notes: 'Initial admin setup - Full access'
        });
        
        await allowedEmail.save();
        console.log(`✅ Added admin email: ${email}`);
        results.push({ email, status: 'added' });
      } catch (error) {
        console.error(`❌ Error adding ${email}:`, error.message);
        errors.push({ email, error: error.message });
      }
    }

    console.log('\n📊 Summary:');
    console.log('Added:', results.filter(r => r.status === 'added').length);
    console.log('Already existed:', results.filter(r => r.status === 'already exists').length);
    console.log('Errors:', errors.length);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => console.log(`  ${err.email}: ${err.error}`));
    }

    console.log('\n✅ Admin email initialization complete!');
    console.log('You can now log in with any of the admin emails using Google OAuth.');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the initialization
initializeAdminEmails();