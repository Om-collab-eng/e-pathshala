const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { getRoleDashboard } = require('../middleware/roleHome');

// /home — single front door that always routes to the correct dashboard
// based on the current session role. Used by every Home button in every
// view. If the user isn't logged in, fall through to /login.
router.get('/home', async (req, res) => {
  if (req.session && req.session.user_id) {
    if (!req.session.impersonating_from) {
      try {
        const db = require('../db');
        const uRes = await db.query('SELECT role FROM users WHERE id = $1', [req.session.user_id]);
        if (uRes && uRes.rows && uRes.rows[0]) req.session.role = uRes.rows[0].role;
      } catch (e) {}
    }
    // If the session is currently impersonating a non-super_admin user,
    // honor the impersonated role for the Home button.
    const effectiveRole = req.session.impersonating_from
      ? req.session.impersonated_role
      : req.session.role;
    return res.redirect(getRoleDashboard(effectiveRole));
  }
  res.redirect('/login');
});

// Login routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Logout route
router.get('/logout', authController.getLogout);

// Registration routes (placeholder)
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

module.exports = router;