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
  initializeOverrideEmail
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/initialize-admin', initializeOverrideEmail);

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

module.exports = router;
