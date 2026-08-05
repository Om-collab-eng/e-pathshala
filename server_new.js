require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const db = require('./db');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5001;

const usePostgres = !!process.env.DATABASE_URL && process.env.USE_SQLITE !== '1';

let pool;
if (usePostgres) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'base');

app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);

let MySQLStore;
try {
  MySQLStore = require('express-mysql-session')(session);
} catch (e) {}

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'librika_session_secret',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
};

if (db.mysqlPool && MySQLStore) {
  try {
    sessionConfig.store = new MySQLStore({
      clearExpired: true,
      checkExpirationInterval: 900000,
      expiration: 86400000,
      createDatabaseTable: true,
      schema: {
        tableName: 'sessions',
        columnNames: { session_id: 'session_id', expires: 'expires', data: 'data' }
      }
    }, db.mysqlPool);
  } catch (storeErr) {
    console.error('MySQL session store error:', storeErr);
  }
} else if (usePostgres && pool) {
  sessionConfig.store = new pgSession({ pool, tableName: 'sessions' });
}

app.use(session(sessionConfig));

app.use(flash());

// Inject res.locals.homeUrl so every EJS can render <a href="<%= homeUrl %>">
// without per-view hardcoding. Impersonation-aware.
const { homeUrlMiddleware, superAdminIsolation } = require('./middleware/roleHome');
app.use(homeUrlMiddleware);

// Super-admin isolation: if a super_admin session tries to hit a
// role-specific dashboard, bounce them back to /super-admin.
app.use(superAdminIsolation);

app.use(async (req, res, next) => {
  if (req.session && req.session.user_id) {
    try {
      const uRes = await db.query('SELECT id, name, role, school_code FROM users WHERE id = $1', [req.session.user_id]);
      if (uRes && uRes.rows && uRes.rows.length > 0) {
        const u = uRes.rows[0];
        req.session.role = u.role || req.session.role;
        req.session.name = u.name || req.session.name;
        req.session.user_name = u.name || req.session.user_name;
      }
    } catch (e) {}
  }

  res.locals.session = req.session || {};

  // Convert connect-flash messages into template locals:
  //   messages  → array of [type, text] for base.ejs toasts
  //   success / error → first message of that type (for inline banners)
  const flashMsgs = (req.flash && typeof req.flash === 'function') ? req.flash() : [];
  res.locals.messages = flashMsgs;
  res.locals.success = null;
  res.locals.error = null;
  if (Array.isArray(flashMsgs)) {
    for (const msg of flashMsgs) {
      if (msg && msg[0] === 'success' && !res.locals.success) res.locals.success = msg[1];
      if (msg && msg[0] === 'error' && !res.locals.error) res.locals.error = msg[1];
    }
  }

  // Compatibility helpers for EJS layouts (express-ejs-layouts & ejs-mate)
  res.locals.defineContent = res.locals.defineContent || function(name) { return ''; };
  res.locals.contentFor = res.locals.contentFor || function(name) { return ''; };

  // Global view defaults
  res.locals.school_name = (req.session && req.session.school_name) || 'Librika Digital Library';
  res.locals.school_code = (req.session && req.session.school_code) || 'DEMO01';
  res.locals.school_plan = (req.session && req.session.school_plan) || 'PRO';
  res.locals.user_name = (req.session && req.session.name) || 'User';
  res.locals.school_perms = (req.session && req.session.school_perms) || {
    canImportCSV: true,
    canExportCSV: true,
    canUseAIScanner: true,
    canUseBarcodeScanner: true,
    canUseAdvancedAnalytics: true,
    canUsePublishing: true
  };
  res.locals.school_limits = (req.session && req.session.school_limits) || {
    studentLimit: 999999,
    bookLimit: 999999,
    staffLimit: 999999
  };

  next();
});

const upload = multer({ dest: 'static/uploads/' });

// --- AUTH ROUTES ---

app.get('/', (req, res) => {
  res.render('index', { title: 'librika.in - EdTech & E-Library SaaS Platform' });
});

const authController = require('./controllers/authController');

app.get('/login', authController.getLogin);
app.post('/login', authController.postLogin);

app.get('/register', (req, res) => {
  res.render('register', { title: 'Join - librika.in' });
});

app.post('/register', upload.single('profile_photo'), async (req, res) => {
  const { account_type, name, school_code, library_name, email, phone, password } = req.body;
  if (!name || !phone || !password) {
    req.flash('error', 'Name, phone, and password are required');
    return res.redirect('/register');
  }
  try {
    const existing = await db.query(
      'SELECT id FROM users WHERE phone = $1 OR email = $1',
      [phone]
    );
    if (existing.rows.length > 0) {
      req.flash('error', 'A user with this phone or email already exists');
      return res.redirect('/register');
    }
    let role = account_type === 'personal' ? 'personal' : 'student';
    const code = account_type === 'personal' ? null : (school_code || null);
    if (account_type === 'school' && code) {
      const schoolCheck = await db.query('SELECT id FROM schools WHERE school_code = $1', [code]);
      if (schoolCheck.rows.length === 0) {
        await db.query(
          'INSERT INTO schools (school_code, name) VALUES ($1, $2)',
          [code, name + "'s School"]
        );
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, phone, password, role, school_code, profile_complete)
       VALUES ($1, $2, $3, $4, $5, $6, false)`,
      [name, email || null, phone, hashedPassword, role, code]
    );
    
    // Fetch inserted user
    const newUserRes = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    const userId = newUserRes.rows[0] ? newUserRes.rows[0].id : (result.lastId || result.insertId);
    
    req.session.user_id = userId;
    req.session.username = phone;
    req.session.name = name;
    req.session.role = role;
    req.session.school_code = code;
    req.flash('success', 'Registration successful! Complete your profile to get started.');
    res.redirect('/complete-profile');
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', 'An error occurred during registration');
    res.redirect('/register');
  }
});

app.get('/complete-profile', (req, res) => {
  if (!req.session || !req.session.user_id) return res.redirect('/login');
  res.render('complete_profile', { title: 'Complete Profile - librika.in' });
});

app.post('/complete-profile', async (req, res) => {
  if (!req.session || !req.session.user_id) return res.redirect('/login');
  const { name, admission_no, class: studentClass } = req.body;
  try {
    const updates = [];
    const values = [];
    let idx = 1;
    if (name) { updates.push(`name = $${idx++}`); values.push(name); }
    if (admission_no) { updates.push(`admission_no = $${idx++}`); values.push(admission_no); }
    if (studentClass) { updates.push(`class = $${idx++}`); values.push(studentClass); }
    if (updates.length > 0) {
      updates.push(`profile_complete = true`);
      values.push(req.session.user_id);
      await db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
        values
      );
      if (name) req.session.name = name;
    }
    req.flash('success', 'Profile updated successfully');
    if (req.session.role === 'student') return res.redirect('/student');
    if (req.session.role === 'personal') return res.redirect('/personal');
    res.redirect('/');
  } catch (err) {
    console.error('Profile update error:', err);
    req.flash('error', 'Failed to update profile');
    res.redirect('/complete-profile');
  }
});

app.get('/logout', (req, res) => {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '-1');
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

app.get('/demo-mode', (req, res) => {
  req.session.demo_mode = true;
  req.session.save(() => res.redirect('/login?demo=1'));
});

app.get('/exit-demo', (req, res) => {
  req.session.demo_mode = false;
  req.session.save(() => res.redirect('/login'));
});

// ── Route Mounting ─────────────────────────────────────────────────
const maintenanceMiddleware = require('./middleware/maintenanceMiddleware');
app.use(maintenanceMiddleware);

// Auth routes
app.use('/', require('./routes/authRoutes'));

// Admin routes
app.use('/admin', require('./routes/admin'));

// Data Hub routes (Import / Export)
app.use('/data', require('./routes/dataRoutes'));

// Student routes
app.use('/student', require('./routes/student'));

// Student Portal routes (goals, analytics, assignments, security, AI, etc.)
app.use('/student', require('./routes/student_portal'));

// Super-admin routes
app.use('/super-admin', require('./routes/superAdmin'));

// Digital library routes
const digitalRoutes = require('./routes/digital');
app.use('/digital-library', digitalRoutes);
app.use('/author', digitalRoutes);
app.use('/leaderboard', digitalRoutes);

// Public Advertisement API Endpoints
app.get('/api/ads', async (req, res) => {
  const section = req.query.section || 'all';
  try {
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const queryStr = `
      SELECT * FROM advertisements 
      WHERE status = 'active'
      AND (start_time IS NULL OR start_time <= $1)
      AND (end_time IS NULL OR end_time >= $1)
      AND (target_section = 'all' OR target_section = $2)
      ORDER BY priority DESC, created_at DESC
    `;
    const result = await db.query(queryStr, [nowStr, section]);
    const ads = result.rows;

    if (ads.length > 0) {
      const ids = ads.map(a => a.id);
      db.query(`UPDATE advertisements SET impressions = impressions + 1 WHERE id IN (${ids.join(',')})`).catch(() => {});
    }

    res.json({ status: 'success', advertisements: ads });
  } catch (err) {
    console.error('Fetch Ads Error:', err);
    res.json({ status: 'error', advertisements: [] });
  }
});

app.post('/api/ads/:id/click', async (req, res) => {
  const adId = parseInt(req.params.id);
  try {
    await db.query('UPDATE advertisements SET clicks = clicks + 1 WHERE id = $1', [adId]);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'error' });
  }
});

// Personal library routes
const personalRoutes = require('./routes/personal');

app.use('/personal', async (req, res, next) => {
  res.locals.personal_my_libraries = [];
  res.locals.personal_shared_libraries = [];
  res.locals.personal_active_library = null;
  if (req.session && req.session.user_id && req.session.role === 'personal') {
    try {
      const myLibs = await db.query(
        `SELECT pl.*, COUNT(pb.id) as book_count FROM personal_libraries pl
         LEFT JOIN personal_books pb ON pl.id = pb.library_id
         WHERE pl.owner_id = $1 GROUP BY pl.id ORDER BY pl.id ASC`,
        [req.session.user_id]
      );
      res.locals.personal_my_libraries = myLibs.rows;

      const sharedLibs = await db.query(
        `SELECT pl.*, COUNT(pb.id) as book_count, u.name as owner_name FROM personal_libraries pl
         JOIN personal_library_shares pls ON pl.id = pls.library_id
         JOIN users u ON pl.owner_id = u.id
         LEFT JOIN personal_books pb ON pl.id = pb.library_id
         WHERE pls.shared_with_user_id = $1 GROUP BY pl.id ORDER BY pl.id ASC`,
        [req.session.user_id]
      );
      res.locals.personal_shared_libraries = sharedLibs.rows;

      if (req.session.active_library_id) {
        const active = await db.query('SELECT * FROM personal_libraries WHERE id = $1', [req.session.active_library_id]);
        if (active.rows.length > 0) {
          res.locals.personal_active_library = active.rows[0];
        }
      }
    } catch (err) {
      console.error('Personal library context error:', err);
    }
  }
  next();
});
app.use('/personal', personalRoutes);

// Billing routes
app.use('/billing', require('./routes/billing'));

// ── Background Jobs ────────────────────────────────────────────
const { startJobs } = require('./jobs');

// ── Global Error Handlers ──────────────────────────────────────

app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.use((err, req, res, next) => {
  console.error('Unhandled error stack trace:', err.stack || err);
  if (res.headersSent) return next(err);
  const accepts = req.accepts(['html', 'json']);
  if (accepts === 'json') {
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  } else {
    res.status(500).type('html').send('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Error</title></head><body><h1>500</h1><p>Internal Server Error</p></body></html>');
  }
});

// ── Server Startup ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Librika server running on http://localhost:${PORT}`);
  startJobs();
});

module.exports = app;