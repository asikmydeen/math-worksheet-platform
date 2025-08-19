const express = require('express');
const router = express.Router();
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

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
