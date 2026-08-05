// ─────────────────────────────────────────────────────────────────────
//  roleHome.js — Centralized role → dashboard routing & RBAC helpers
// ─────────────────────────────────────────────────────────────────────
//
//  Single source of truth for "where should this user go when they
//  click Home?" Plus RBAC helpers (requireRole, superAdminIsolation).
//
//  Used by:
//   - routes/authRoutes.js  → GET /home
//   - controllers/authController.js → postLogin redirect
//   - server_new.js middleware → res.locals.homeUrl
//   - routes/superAdmin.js → master-login target URL
//   - views/base.ejs → saGoHome()
//   - every role-dashboard router (admin, student, personal) for isolation
// ─────────────────────────────────────────────────────────────────────

const ROLE_HOME = Object.freeze({
  // Platform admins
  super_admin:        '/super-admin',
  superadmin:         '/super-admin',
  super_super_admin:  '/super-admin',

  // School-side admins / librarians share /admin
  admin:      '/admin',
  librarian:  '/admin',

  // End users share /student
  student:    '/student',
  teacher:    '/student',
  parent:     '/student',

  // Personal library users
  personal:   '/personal/dashboard',
  owner:      '/personal/dashboard',
});

const ROLE_LABEL = Object.freeze({
  super_admin:        'Super Admin',
  superadmin:         'Super Admin',
  super_super_admin:  'Super Admin',
  admin:              'School Admin',
  librarian:          'Librarian',
  student:            'Student',
  teacher:            'Teacher',
  parent:             'Parent',
  personal:           'Personal User',
  owner:              'Personal User',
});

/**
 * Canonical home URL for a given role string. Falls back to '/login'.
 * Accepts any casing; accepts null/undefined; never throws.
 */
function getRoleDashboard(role) {
  if (!role) return '/login';
  const key = String(role).trim().toLowerCase();
  return ROLE_HOME[key] || '/login';
}

/**
 * Human-readable label for a role (used in UI chips, breadcrumbs, etc.).
 */
function getRoleLabel(role) {
  if (!role) return 'Guest';
  const key = String(role).trim().toLowerCase();
  return ROLE_LABEL[key] || key;
}

/**
 * isSuperAdmin — accepts any of the super_admin variants.
 */
function isSuperAdmin(role) {
  if (!role) return false;
  const key = String(role).trim().toLowerCase();
  return key === 'super_admin' || key === 'superadmin' || key === 'super_super_admin';
}

/**
 * requireRole(...allowed) — middleware factory. Pass any number of
 * allowed role strings. Always permits super_admin (platform admins
 * have oversight of every role).
 *
 * Usage:  router.get('/x', requireRole('admin', 'librarian'), handler)
 */
function requireRole(...allowed) {
  const allowedLower = new Set(allowed.map(r => String(r).trim().toLowerCase()));
  return (req, res, next) => {
    const role = req.session && req.session.role;
    if (!role) {
      if (req.path.startsWith('/api/') || req.xhr || (req.headers.accept || '').includes('json')) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      if (req.flash) req.flash('error_msg', 'Please log in to access this page');
      return res.redirect('/login');
    }
    const roleLower = String(role).trim().toLowerCase();
    if (isSuperAdmin(roleLower)) return next(); // SA always allowed
    if (allowedLower.has(roleLower)) return next();
    if (req.path.startsWith('/api/') || (req.headers.accept || '').includes('json')) {
      return res.status(403).json({ success: false, error: 'Forbidden — insufficient role' });
    }
    if (req.flash) req.flash('error_msg', 'You do not have permission to access this page.');
    return res.redirect('/');
  };
}

/**
 * superAdminIsolation — middleware that redirects super_admin sessions
 * away from non-super-admin dashboards. Mounted at the top of /admin,
 * /student, and /personal route stacks so SA users land on /super-admin
 * even if they type those URLs manually.
 */
function superAdminIsolation(req, res, next) {
  if (req.session && isSuperAdmin(req.session.role)) {
    // Only isolate the role-specific dashboards (/admin, /student, /personal),
    // not all routes. Otherwise AJAX/JSON requests against /super-admin/*
    // endpoints would be blocked too.
    const p = req.path || '';
    const isRoleDashboard =
      p === '/admin' || p.startsWith('/admin/') ||
      p === '/student' || p.startsWith('/student/') ||
      p === '/personal' || p.startsWith('/personal/') ||
      p === '/librarian' || p.startsWith('/librarian/') ||
      p === '/teacher' || p.startsWith('/teacher/');
    if (isRoleDashboard) {
      if (req.flash) req.flash('info', 'Super Admin cannot access role-specific dashboards — redirected to Control Center.');
      return res.redirect('/super-admin');
    }
  }
  next();
}

/**
 * homeUrlMiddleware — sets res.locals.homeUrl so every EJS can render
 * <a href="<%= homeUrl %>"> without per-view hardcoding.
 *
 *   res.locals.homeUrl        — the dashboard URL for the session role
 *   res.locals.roleLabel      — the friendly role name
 *   res.locals.impersonating  — boolean, true if an SA is impersonating
 *   res.locals.impersonatedName — the impersonated user's name (if so)
 */
function homeUrlMiddleware(req, res, next) {
  const role = req.session && req.session.role;
  res.locals.homeUrl     = getRoleDashboard(role);
  res.locals.roleLabel   = getRoleLabel(role);
  res.locals.impersonating = !!(req.session && req.session.impersonating_from);
  res.locals.impersonatedName = (req.session && req.session.impersonated_name) || null;
  res.locals.impersonatorName  = (req.session && req.session.impersonator_name) || null;
  next();
}

module.exports = {
  ROLE_HOME,
  ROLE_LABEL,
  getRoleDashboard,
  getRoleLabel,
  isSuperAdmin,
  requireRole,
  superAdminIsolation,
  homeUrlMiddleware,
};