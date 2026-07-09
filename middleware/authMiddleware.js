// Middleware to check if the user is authenticated
const authMiddleware = (req, res, next) => {
  if (req.session && req.session.user_id) {
    return next();
  }
  // If not authenticated, redirect to login
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/login');
};

module.exports = authMiddleware;