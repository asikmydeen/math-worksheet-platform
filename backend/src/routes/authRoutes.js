const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  getMe,
  updateProfile,
  addAllowedEmails,
  getAllowedEmails,
  removeAllowedEmail,
  getUserAnalytics,
  getAllUsersDetailed,
  updateUserSubscription,
  toggleUserAccess,
  getDetailedAnalytics,
  initializeOverrideEmail,
  bulkInitializeAdminEmails
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/initialize-admin', initializeOverrideEmail);
router.post('/bulk-initialize-admins', bulkInitializeAdminEmails);

// GET endpoint for easy browser-based initialization (temporary - remove after setup)
router.get('/setup-admin-emails', async (req, res) => {
  try {
    // For security, require a secret in the URL
    const { secret } = req.query;
    
    // Use ADMIN_SETUP_SECRET or JWT_SECRET as fallback
    const validSecret = process.env.ADMIN_SETUP_SECRET || process.env.JWT_SECRET;
    if (secret !== validSecret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid setup secret'
      });
    }

    // Call the existing bulk initialization function
    req.body = { secret };
    await bulkInitializeAdminEmails(req, res);
  } catch (error) {
    console.error('Setup admin emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up admin emails'
    });
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: process.env.FRONTEND_URL + '/access-denied'
  }),
  (req, res) => {
    try {
      // Generate JWT token for the user
      const token = req.user.generateAuthToken();
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/google/success?token=${token}`);
    } catch (error) {
      console.error('Google callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/access-denied`);
    }
  }
);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin routes for email management
router.post('/admin/emails', protect, addAllowedEmails);
router.get('/admin/emails', protect, getAllowedEmails);
router.delete('/admin/emails/:emailId', protect, removeAllowedEmail);
router.get('/admin/analytics', protect, getUserAnalytics);

// Advanced admin routes
router.get('/admin/users', protect, getAllUsersDetailed);
router.put('/admin/users/:userId/subscription', protect, updateUserSubscription);
router.put('/admin/users/:userId/access', protect, toggleUserAccess);
router.get('/admin/detailed-analytics', protect, getDetailedAnalytics);

module.exports = router;
