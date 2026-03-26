const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect Routes (Verify Token)
exports.protect = async (req, res, next) => {
  let token;

  // Check for Token in Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Split to get token string robustly
      token = req.headers.authorization.split(/\s+/)[1].trim();
      console.error("[DEBUG] authMiddleware received token:", token);





      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find user by id and attach to req object
      req.user = await User.findById(decoded.id);

      if (!req.user) {
         return res.status(401).json({ success: false, message: 'User not found, auth failed' });
      }

      next();

    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }
};

// Role-Based Authorization Access Gating
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this route` 
      });
    }
    next();
  };
};
