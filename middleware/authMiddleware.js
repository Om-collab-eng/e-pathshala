const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'librika_jwt_secret';

// Middleware to check if the user is authenticated (via session or JWT token)
const authMiddleware = (req, res, next) => {
  // 1. Check Session Auth
  if (req.session && req.session.user_id) {
    req.userId = req.session.user_id;
    return next();
  }

  // 2. Check Bearer Token (JWT for Mobile APK / REST API)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.user_id;
      req.userRole = decoded.role;
      req.userSchool = decoded.school_code;
      // Synthesize session-like object for compatibility
      if (!req.session) req.session = {};
      req.session.user_id = decoded.user_id;
      req.session.role = decoded.role;
      req.session.school_code = decoded.school_code;
      return next();
    } catch (err) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }
    }
  }

  // 3. Handle Unauthorized access
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Standard web redirect to login
  if (req.flash) req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/login');
};

module.exports = authMiddleware;