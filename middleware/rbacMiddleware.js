/**
 * middleware/rbacMiddleware.js
 * Enforces Role-Based Access Control (RBAC) at the route and API level.
 */

const { getUserEffectivePermissions } = require('../services/rbacService');
const { isSuperAdmin } = require('./roleHome');

/**
 * Middleware factory requiring a specific permission code.
 * Example: router.post('/users/create', requirePermission('users.create'), handler);
 */
function requirePermission(permissionCode) {
  return async (req, res, next) => {
    // 1. Check Authentication
    if (!req.session || !req.session.user_id) {
      if (req.path.startsWith('/api/') || req.xhr || (req.headers.accept || '').includes('json')) {
        return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
      }
      if (req.flash) req.flash('error_msg', 'Please log in to access this page');
      return res.redirect('/login');
    }

    const role = req.session.role;

    // 2. Super Admin always bypasses all permission checks
    if (isSuperAdmin(role)) {
      return next();
    }

    // 3. Compute User Effective Permissions
    try {
      const userPerms = await getUserEffectivePermissions(req.session.user_id, role);
      req.userPermissions = userPerms;
      res.locals.userPermissions = userPerms;

      if (userPerms.includes(permissionCode) || userPerms.includes('*')) {
        return next();
      }

      // 4. Access Denied
      if (req.path.startsWith('/api/') || req.xhr || (req.headers.accept || '').includes('json')) {
        return res.status(403).json({
          success: false,
          error: `Access Denied: You lack the required permission (${permissionCode}) to perform this action.`
        });
      }

      if (req.flash) req.flash('error_msg', 'You do not have permission to access that resource.');
      return res.redirect('back');
    } catch (err) {
      console.error('RBAC Middleware error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error evaluating permissions.' });
    }
  };
}

module.exports = {
  requirePermission
};
