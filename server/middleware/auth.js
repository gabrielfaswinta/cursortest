import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token - user not found',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if user is verified for sensitive operations
    if (!user.isVerified && req.path.includes('/admin')) {
      return res.status(403).json({ 
        message: 'Account verification required',
        code: 'VERIFICATION_REQUIRED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(500).json({ 
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole
      });
    }

    next();
  };
};

export const requireBusinessLicense = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'business') {
      return res.status(403).json({ 
        message: 'Business account required',
        code: 'BUSINESS_ACCOUNT_REQUIRED'
      });
    }

    if (!req.user.hasValidLicense()) {
      return res.status(403).json({ 
        message: 'Valid business license required',
        code: 'INVALID_LICENSE',
        licenseStatus: req.user.businessInfo?.licenseStatus
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      message: 'License validation error',
      code: 'LICENSE_CHECK_ERROR'
    });
  }
};

export const requireArtistVerification = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'artist') {
      return res.status(403).json({ 
        message: 'Artist account required',
        code: 'ARTIST_ACCOUNT_REQUIRED'
      });
    }

    if (!req.user.isVerified) {
      return res.status(403).json({ 
        message: 'Artist verification required',
        code: 'ARTIST_VERIFICATION_REQUIRED'
      });
    }

    // Check if artist has LMK member number
    if (!req.user.artistInfo?.lmkMemberNumber) {
      return res.status(403).json({ 
        message: 'LMK member number required for royalty compliance',
        code: 'LMK_MEMBER_REQUIRED'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      message: 'Artist verification error',
      code: 'ARTIST_CHECK_ERROR'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Continue without authentication if token is invalid
        console.log('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    } else {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    userRequests.push(now);
    next();
  };
};