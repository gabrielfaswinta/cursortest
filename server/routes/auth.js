import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { 
    expiresIn: '7d' 
  });
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      role = 'user',
      businessInfo,
      artistInfo 
    } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        message: 'Email, password, and name are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
        code: 'INVALID_PASSWORD_LENGTH'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Validate role-specific information
    if (role === 'business') {
      if (!businessInfo || !businessInfo.companyName || !businessInfo.businessType) {
        return res.status(400).json({
          message: 'Business information is required for business accounts',
          code: 'MISSING_BUSINESS_INFO'
        });
      }
    }

    if (role === 'artist') {
      if (!artistInfo || !artistInfo.stageName) {
        return res.status(400).json({
          message: 'Artist information is required for artist accounts',
          code: 'MISSING_ARTIST_INFO'
        });
      }
    }

    // Create new user
    const userData = {
      email: email.toLowerCase(),
      password,
      name,
      role
    };

    if (role === 'business' && businessInfo) {
      userData.businessInfo = businessInfo;
    }

    if (role === 'artist' && artistInfo) {
      userData.artistInfo = artistInfo;
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user profile without sensitive data
    const userProfile = user.getPublicProfile();

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userProfile
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user profile without sensitive data
    const userProfile = user.getPublicProfile();

    res.json({
      message: 'Login successful',
      token,
      user: userProfile
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userProfile = req.user.getPublicProfile();
    res.json({
      user: userProfile
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      message: 'Failed to fetch profile',
      code: 'PROFILE_FETCH_ERROR'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'avatar', 'preferences', 'businessInfo', 'artistInfo'
    ];
    
    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Special validation for business info updates
    if (updates.businessInfo && req.user.role === 'business') {
      // Prevent changing license status directly
      delete updates.businessInfo.licenseStatus;
      delete updates.businessInfo.lmkRegistrationNumber;
    }

    // Special validation for artist info updates
    if (updates.artistInfo && req.user.role === 'artist') {
      // Prevent changing verification-related fields directly
      delete updates.artistInfo.lmkMemberNumber;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    const userProfile = user.getPublicProfile();

    res.json({
      message: 'Profile updated successfully',
      user: userProfile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }

    res.status(500).json({
      message: 'Failed to update profile',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters long',
        code: 'INVALID_PASSWORD_LENGTH'
      });
    }

    // Verify current password
    const user = await User.findById(req.user._id);
    const isValidPassword = await user.comparePassword(currentPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      message: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const newToken = generateToken(req.user._id);
    
    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      message: 'Failed to refresh token',
      code: 'TOKEN_REFRESH_ERROR'
    });
  }
});

// Logout (invalidate token on client side)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a production environment, you might want to maintain a blacklist of tokens
    // For now, we'll just return success and let the client handle token removal
    
    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

export default router;