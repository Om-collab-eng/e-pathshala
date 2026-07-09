const { query } = require('../db');
const PLANS = require('../permissions');

/**
 * Middleware to check if the current user's school has the required permission based on their plan.
 * @param {string} permissionKey - The permission key to check (e.g., 'canExportCSV')
 * @returns {Express.Middleware}
 */
const permissionMiddleware = (permissionKey) => {
  return async (req, res, next) => {
    // Ensure the user is authenticated (should be caught by authMiddleware, but double-check)
    if (!req.session || !req.session.user_id) {
      req.flash('error_msg', 'Please log in to access this page');
      return res.redirect('/login');
    }

    const schoolCode = req.session.school_code;
    if (!schoolCode) {
      // If no school code, deny access
      return res.status(403).send('Access denied: No school associated with your account.');
    }

    try {
      // Determine which database to use based on the session's useDemo flag
      const useDemo = req.session.useDemo || false;

      // Fetch the school's active plan from the schools table
      const schoolResult = await query(
        'SELECT activePlan FROM schools WHERE school_code = $1',
        [schoolCode],
        useDemo
      );

      if (schoolResult.rowCount === 0) {
        // School not found
        return res.status(403).send('Access denied: School not found.');
      }

      const planId = schoolResult.rows[0].activeplan; // Note: column name is activePlan, but we used lowercase in the query? Actually, we selected "activePlan" as is.

      // If the plan is null or undefined, default to FREE
      const plan = planId ? planId.toUpperCase() : 'FREE';

      // Get the permissions for the plan
      const planPermissions = PLANS[plan] && PLANS[plan].perms ? PLANS[plan].perms : PLANS.FREE.perms;

      if (planPermissions[permissionKey]) {
        // Permission granted
        return next();
      } else {
        // Permission denied
        // Check if the request expects JSON (e.g., AJAX request)
        const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
        if (acceptsJson || req.path.startsWith('/api/')) {
          return res.status(403).json({
            error: `Upgrade your plan to access this feature (missing: ${permissionKey}). Visit /billing to upgrade.`
          });
        } else {
          // For regular requests, flash a message and redirect back or to a no-access page
          req.flash('error_msg', `You do not have permission to access this feature. Please upgrade your plan.`);
          // Redirect back to the previous page or home
          return res.redirect('back');
        }
      }
    } catch (err) {
      console.error('Error in permissionMiddleware:', err);
      // Fail safe: deny access on error
      return res.status(500).send('Internal server error');
    }
  };
};

module.exports = permissionMiddleware;