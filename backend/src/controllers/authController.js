const User = require('../models/User');
const AllowedEmail = require('../models/AllowedEmail');
const jwt = require('jsonwebtoken');

// Google OAuth callback handler
exports.googleCallback = async (profile, done) => {
  try {
    const email = profile.emails[0].value.toLowerCase();
    
    // Check if email is allowed
    const allowedEmail = await AllowedEmail.isEmailAllowed(email);
    if (!allowedEmail) {
      return done(null, false, { 
        message: 'Access denied. Your email is not authorized to use this platform.' 
      });
    }

    // Check if user already exists
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      // Create new user
      user = new User({
        googleId: profile.id,
        email: email,
        name: profile.displayName,
        avatar: profile.photos[0]?.value,
        accessLevel: allowedEmail.accessLevel || 'basic',
        grade: '5' // Default grade
      });
      await user.save();
    } else {
      // Update existing user info
      user.name = profile.displayName;
      user.avatar = profile.photos[0]?.value;
      user.accessLevel = allowedEmail.accessLevel || user.accessLevel;
      user.lastLogin = new Date();
      await user.save();
    }

    // Track login in allowed email
    await allowedEmail.trackLogin();

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
};

// Get current user info
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.hasAccess()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        grade: user.grade,
        accessLevel: user.accessLevel,
        stats: user.stats,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user info'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Fields that cannot be updated via this endpoint
    delete updates.email;
    delete updates.googleId;
    delete updates.accessLevel;
    delete updates.subscription;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        grade: user.grade,
        accessLevel: user.accessLevel,
        stats: user.stats,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// Admin: Add allowed emails
exports.addAllowedEmails = async (req, res) => {
  try {
    const { emails, accessLevel = 'basic', notes } = req.body;
    const adminUser = await User.findById(req.user.id);

    if (!adminUser || adminUser.accessLevel !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of emails'
      });
    }

    const results = [];
    const errors = [];

    for (const email of emails) {
      try {
        const allowedEmail = new AllowedEmail({
          email: email.toLowerCase().trim(),
          domain: email.toLowerCase().split('@')[1],
          accessLevel,
          addedBy: req.user.id,
          notes
        });
        
        await allowedEmail.save();
        results.push(email);
      } catch (error) {
        errors.push({ email, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Added ${results.length} emails successfully`,
      added: results,
      errors: errors
    });
  } catch (error) {
    console.error('Add allowed emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding allowed emails'
    });
  }
};

// Admin: Get allowed emails
exports.getAllowedEmails = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);

    if (!adminUser || adminUser.accessLevel !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { page = 1, limit = 50, search = '', accessLevel } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }
    if (accessLevel) {
      query.accessLevel = accessLevel;
    }

    const allowedEmails = await AllowedEmail.find(query)
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AllowedEmail.countDocuments(query);

    res.json({
      success: true,
      allowedEmails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get allowed emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching allowed emails'
    });
  }
};

// Admin: Remove allowed email
exports.removeAllowedEmail = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);

    if (!adminUser || adminUser.accessLevel !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { emailId } = req.params;
    const allowedEmail = await AllowedEmail.findByIdAndDelete(emailId);

    if (!allowedEmail) {
      return res.status(404).json({
        success: false,
        message: 'Allowed email not found'
      });
    }

    res.json({
      success: true,
      message: 'Email access removed successfully'
    });
  } catch (error) {
    console.error('Remove allowed email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing email access'
    });
  }
};

// Admin: Get user analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);

    if (!adminUser || adminUser.accessLevel !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const totalUsers = await User.countDocuments({ isActive: true });
    const totalAllowedEmails = await AllowedEmail.countDocuments({ isActive: true });
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email createdAt lastLogin stats.totalWorksheets');

    const loginStats = await AllowedEmail.aggregate([
      {
        $group: {
          _id: null,
          totalLogins: { $sum: '$loginCount' },
          activeEmails: { 
            $sum: { $cond: [{ $gt: ['$loginCount', 0] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalAllowedEmails,
        totalLogins: loginStats[0]?.totalLogins || 0,
        activeEmails: loginStats[0]?.activeEmails || 0,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics'
    });
  }
};

// Initialize override email (for first-time setup)
exports.initializeOverrideEmail = async (req, res) => {
  try {
    const { email, secret } = req.body;

    // Verify secret (you should set this in environment variables)
    if (secret !== process.env.ADMIN_SETUP_SECRET) {
      return res.status(403).json({
        success: false,
        message: 'Invalid setup secret'
      });
    }

    // Add the email as an override admin email
    const allowedEmail = new AllowedEmail({
      email: email.toLowerCase(),
      domain: email.toLowerCase().split('@')[1],
      accessLevel: 'admin',
      isOverrideEmail: true,
      addedBy: null, // System added
      notes: 'Initial admin setup'
    });

    await allowedEmail.save();

    res.json({
      success: true,
      message: 'Admin email initialized successfully'
    });
  } catch (error) {
    console.error('Initialize override email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing admin email'
    });
  }
};

// Bulk initialize admin emails (for initial setup)
exports.bulkInitializeAdminEmails = async (req, res) => {
  try {
    const { secret } = req.body;

    // Verify secret
    if (secret !== process.env.ADMIN_SETUP_SECRET) {
      return res.status(403).json({
        success: false,
        message: 'Invalid setup secret'
      });
    }

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
        results.push({ email, status: 'added' });
      } catch (error) {
        errors.push({ email, error: error.message });
      }
    }

    res.json({
      success: true,
      message: 'Bulk admin setup completed',
      results,
      errors
    });
  } catch (error) {
    console.error('Bulk initialize error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in bulk initialization'
    });
  }
};