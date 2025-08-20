const User = require('../models/User');
const AllowedEmail = require('../models/AllowedEmail');
const KidProfile = require('../models/KidProfile');
const Worksheet = require('../models/Worksheet');
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

// Admin: Get all users with detailed information
exports.getAllUsersDetailed = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);

    if (!adminUser || adminUser.accessLevel !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { page = 1, limit = 20, search = '', sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    // Build search query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with kid profiles
    const users = await User.find(query)
      .populate({
        path: 'activeKidProfile',
        select: 'name grade avatar'
      })
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await User.countDocuments(query);

    // Get kid profiles for each user and their worksheet stats
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const kidProfiles = await KidProfile.find({ parentUserId: user._id, isActive: true });
        const totalKidWorksheets = await Worksheet.countDocuments({ user: user._id });
        
        // Get AI usage breakdown by kid
        const kidUsageBreakdown = await Promise.all(
          kidProfiles.map(async (kid) => {
            const worksheetCount = await Worksheet.countDocuments({ 
              user: user._id, 
              kidProfile: kid._id 
            });
            return {
              kidId: kid._id,
              name: kid.name,
              grade: kid.grade,
              avatar: kid.avatar,
              worksheets: worksheetCount,
              stats: kid.stats
            };
          })
        );

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          accessLevel: user.accessLevel,
          isActive: user.isActive,
          subscription: user.subscription,
          stats: user.stats,
          activeKidProfile: user.activeKidProfile,
          hasSetupKidProfiles: user.hasSetupKidProfiles,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          kidProfiles: kidProfiles.map(k => ({
            _id: k._id,
            name: k.name,
            grade: k.grade,
            avatar: k.avatar,
            stats: k.stats,
            createdAt: k.createdAt,
            lastActiveAt: k.lastActiveAt
          })),
          totalKidWorksheets,
          kidUsageBreakdown
        };
      })
    );

    res.json({
      success: true,
      users: usersWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users detailed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching detailed user information'
    });
  }
};

// Admin: Update user subscription
exports.updateUserSubscription = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);

    if (!adminUser || adminUser.accessLevel !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { userId } = req.params;
    const { plan, aiRequestsLimit } = req.body;

    const validPlans = ['free', 'monthly', 'annual', 'lifetime'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update subscription
    user.subscription.plan = plan;
    if (aiRequestsLimit !== undefined) {
      user.subscription.aiRequestsLimit = aiRequestsLimit;
    } else {
      // Set default limits based on plan
      switch(plan) {
        case 'free':
          user.subscription.aiRequestsLimit = 10;
          break;
        case 'monthly':
          user.subscription.aiRequestsLimit = 50;
          break;
        case 'annual':
          user.subscription.aiRequestsLimit = 600;
          break;
        case 'lifetime':
          user.subscription.aiRequestsLimit = -1; // Unlimited
          break;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'User subscription updated successfully',
      user: {
        id: user._id,
        email: user.email,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Update user subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user subscription'
    });
  }
};

// Admin: Toggle user access (enable/disable)
exports.toggleUserAccess = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);

    if (!adminUser || adminUser.accessLevel !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'enabled' : 'disabled'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Toggle user access error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling user access'
    });
  }
};

// Admin: Get detailed platform analytics
exports.getDetailedAnalytics = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);

    if (!adminUser || adminUser.accessLevel !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // User statistics
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    // Subscription breakdown
    const subscriptionStats = await User.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 },
          totalAiUsed: { $sum: '$subscription.aiRequestsUsed' }
        }
      }
    ]);

    // Kid profile statistics
    const totalKidProfiles = await KidProfile.countDocuments({ isActive: true });
    const avgKidsPerUser = await User.aggregate([
      {
        $lookup: {
          from: 'kidprofiles',
          localField: '_id',
          foreignField: 'parentUserId',
          as: 'kidProfiles'
        }
      },
      {
        $group: {
          _id: null,
          avgKids: { $avg: { $size: '$kidProfiles' } }
        }
      }
    ]);

    // Worksheet statistics
    const totalWorksheets = await Worksheet.countDocuments({});
    const completedWorksheets = await Worksheet.countDocuments({ status: 'completed' });
    const worksheetsByGrade = await Worksheet.aggregate([
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Recent activity
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email createdAt lastLogin')
      .populate({
        path: 'activeKidProfile',
        select: 'name grade'
      });

    const recentWorksheets = await Worksheet.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title grade subject status createdAt')
      .populate('user', 'name email')
      .populate('kidProfile', 'name grade');

    res.json({
      success: true,
      analytics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers
        },
        subscriptions: subscriptionStats,
        kidProfiles: {
          total: totalKidProfiles,
          avgPerUser: avgKidsPerUser[0]?.avgKids || 0
        },
        worksheets: {
          total: totalWorksheets,
          completed: completedWorksheets,
          completionRate: totalWorksheets > 0 ? (completedWorksheets / totalWorksheets * 100).toFixed(1) : 0,
          byGrade: worksheetsByGrade
        },
        recentActivity: {
          users: recentUsers,
          worksheets: recentWorksheets
        }
      }
    });
  } catch (error) {
    console.error('Get detailed analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching detailed analytics'
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