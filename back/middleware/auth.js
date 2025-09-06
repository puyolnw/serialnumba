const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid token or user not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    res.status(500).json({ message: 'Token verification failed.' });
  }
};

// Check if user has required role
const requireRole = (...roles) => {
  return [verifyToken, (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  }];
};

// Check if user is admin
const requireAdmin = requireRole('ADMIN');

// Check if user is admin or staff
const requireAdminOrStaff = requireRole('ADMIN', 'STAFF');

// Check if user is authenticated (any role)
const requireAuth = verifyToken;

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireAdminOrStaff,
  requireAuth
};
