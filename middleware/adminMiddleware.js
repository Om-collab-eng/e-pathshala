// Middleware to check if the user is an admin or super_admin
const adminMiddleware = (req, res, next) => {
  if (req.session && req.session.user_id) {
    const role = req.session.role;
    if (role === 'admin' || role === 'super_admin' || role === 'super_super_admin') {
      return next();
    }
  }
  // If not authorized, redirect to login or show error
  req.flash('error_msg', 'You do not have permission to access this page.');
  return res.redirect('/');
};

module.exports = adminMiddleware;