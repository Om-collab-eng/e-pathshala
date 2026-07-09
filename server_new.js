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

const app = express();
const PORT = process.env.PORT || 5001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

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

app.use(session({
  store: new pgSession({ pool, tableName: 'sessions' }),
  secret: process.env.SESSION_SECRET || 'librika_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.messages = req.flash();
  next();
});

const upload = multer({ dest: 'static/uploads/' });

// --- AUTH ROUTES ---

app.get('/', (req, res) => {
  if (req.session && req.session.user_id) {
    if (req.session.role === 'super_admin' || req.session.role === 'admin') return res.redirect('/admin');
    if (req.session.role === 'student') return res.redirect('/student');
    if (req.session.role === 'personal') return res.redirect('/personal');
  }
  res.render('index', { title: 'librika.in - EdTech & E-Library SaaS Platform' });
});

app.get('/login', (req, res) => {
  if (req.session && req.session.user_id) {
    if (req.session.role === 'super_admin' || req.session.role === 'admin') return res.redirect('/admin');
    if (req.session.role === 'student') return res.redirect('/student');
    if (req.session.role === 'personal') return res.redirect('/personal');
  }
  const error = req.flash('error')[0] || req.query.error || null;
  res.render('login', {
    title: 'Secure Access - librika.in',
    demo_mode: req.session.demo_mode || false,
    error,
  });
});

app.post('/login', async (req, res) => {
  const { login_type, school_code, username, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR phone = $1 OR email = $1',
      [username]
    );
    if (result.rows.length === 0) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }
    const user = result.rows[0];
    if (user.banned) {
      req.flash('error', 'Your account has been banned. Contact support.');
      return res.redirect('/login');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }
    req.session.user_id = user.id;
    req.session.username = user.username || user.phone;
    req.session.name = user.name;
    req.session.role = user.role;
    req.session.school_code = user.school_code || school_code || null;
    req.session.demo_mode = false;
    if (!user.profile_complete && (user.role === 'student' || user.role === 'personal')) {
      return res.redirect('/complete-profile');
    }
    if (user.role === 'super_admin' || user.role === 'admin') return res.redirect('/admin');
    if (user.role === 'student') return res.redirect('/student');
    if (user.role === 'personal') return res.redirect('/personal');
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'An error occurred during login');
    res.redirect('/login');
  }
});

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
    const existing = await pool.query(
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
      const schoolCheck = await pool.query('SELECT id FROM schools WHERE school_code = $1', [code]);
      if (schoolCheck.rows.length === 0) {
        await pool.query(
          'INSERT INTO schools (school_code, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [code, name + '\'s School']
        );
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, name, email, phone, password, role, school_code, profile_complete)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)
       RETURNING id`,
      [phone, name, email || null, phone, hashedPassword, role, code]
    );
    const userId = result.rows[0].id;
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
      await pool.query(
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
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
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

// Auth routes
app.use('/', require('./routes/authRoutes'));

// Admin routes
app.use('/admin', require('./routes/admin'));

// Student routes
app.use('/student', require('./routes/student'));

// Super-admin routes
app.use('/super-admin', require('./routes/admin'));

// Digital library routes
const digitalRoutes = require('./routes/digital');
app.use('/digital-library', digitalRoutes);
app.use('/author', digitalRoutes);
app.use('/leaderboard', digitalRoutes);

// API routes
app.use('/api', digitalRoutes);

// Personal library routes
const personalRoutes = require('./routes/personal');

app.use('/personal', async (req, res, next) => {
  res.locals.personal_my_libraries = [];
  res.locals.personal_shared_libraries = [];
  res.locals.personal_active_library = null;
  if (req.session && req.session.user_id && req.session.role === 'personal') {
    try {
      const myLibs = await pool.query(
        `SELECT pl.*, COUNT(pb.id) as book_count FROM personal_libraries pl
         LEFT JOIN personal_books pb ON pl.id = pb.library_id
         WHERE pl.owner_id = $1 GROUP BY pl.id ORDER BY pl.id ASC`,
        [req.session.user_id]
      );
      res.locals.personal_my_libraries = myLibs.rows;

      const sharedLibs = await pool.query(
        `SELECT pl.*, COUNT(pb.id) as book_count, u.name as owner_name FROM personal_libraries pl
         JOIN personal_library_shares pls ON pl.id = pls.library_id
         JOIN users u ON pl.owner_id = u.id
         LEFT JOIN personal_books pb ON pl.id = pb.library_id
         WHERE pls.shared_with_user_id = $1 GROUP BY pl.id ORDER BY pl.id ASC`,
        [req.session.user_id]
      );
      res.locals.personal_shared_libraries = sharedLibs.rows;

      if (req.session.active_library_id) {
        const active = await pool.query('SELECT * FROM personal_libraries WHERE id = $1', [req.session.active_library_id]);
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
  console.error('Unhandled error:', err);
  res.status(500).send('Server error');
});

// ── Server Startup ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Librika server running on http://localhost:${PORT}`);
  startJobs();
});