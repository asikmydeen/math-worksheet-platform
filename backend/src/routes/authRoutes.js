const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  register,
  login,
  verify2FA,
  getMe,
  updateProfile,
  reset2FA
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/reset-2fa', reset2FA); // In production, add admin middleware

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    // Generate JWT token for the user
    const token = req.user.generateAuthToken();
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/google/success?token=${token}`);
  }
);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
