const User = require('../models/User');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

// Register new user with 2FA
exports.register = async (req, res) => {
  try {
    const { username, name, role, grade } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Create new user
    const user = new User({
      username: username.toLowerCase(),
      name,
      role: role || 'student',
      grade: role === 'student' ? grade : undefined
    });

    // Generate 2FA secret
    const secret = user.generate2FASecret();
    await user.save();

    // Generate QR code for authenticator app
    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    res.status(201).json({
      success: true,
      message: 'User created successfully. Please scan the QR code with your authenticator app.',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        grade: user.grade
      },
      qrCode: qrCodeDataUrl,
      secret: secret.base32, // In production, you might not want to send this
      setupInstructions: {
        step1: 'Install an authenticator app (Google Authenticator, Authy, etc.)',
        step2: 'Scan the QR code or enter the secret manually',
        step3: 'Save the setup and use the 6-digit code to login'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login with username and 2FA code
exports.login = async (req, res) => {
  try {
    const { username, twoFactorCode } = req.body;

    // Find user and include 2FA secret
    const user = await User.findOne({ username: username.toLowerCase() }).select('+twoFactorSecret');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or authentication code'
      });
    }

    // Verify 2FA code
    const isValidToken = user.verify2FAToken(twoFactorCode);
    
    if (!isValidToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication code'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        grade: user.grade,
        stats: user.stats,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify 2FA setup (for first-time setup verification)
exports.verify2FA = async (req, res) => {
  try {
    const { username, twoFactorCode } = req.body;

    const user = await User.findOne({ username: username.toLowerCase() }).select('+twoFactorSecret');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValid = user.verify2FAToken(twoFactorCode);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid code. Please try again.'
      });
    }

    res.json({
      success: true,
      message: '2FA setup verified successfully!'
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying 2FA'
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        grade: user.grade,
        stats: user.stats,
        subscription: user.subscription,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Fields that cannot be updated
    delete updates.username;
    delete updates.twoFactorSecret;
    delete updates.role;
    delete updates.subscription;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// Reset 2FA (requires admin or special verification)
exports.reset2FA = async (req, res) => {
  try {
    const { username } = req.body;
    
    // In production, you'd want additional verification here
    // For now, we'll allow reset with just username
    
    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new 2FA secret
    const secret = user.generate2FASecret();
    await user.save();

    // Generate new QR code
    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    res.json({
      success: true,
      message: '2FA has been reset. Please scan the new QR code.',
      qrCode: qrCodeDataUrl,
      secret: secret.base32
    });

  } catch (error) {
    console.error('Reset 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting 2FA'
    });
  }
};
