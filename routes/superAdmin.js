const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { Readable } = require('stream');
const cron = require('node-cron');
const { isSuperAdmin, getRoleDashboard } = require('../middleware/roleHome');
const { logActivity, ensureSecurityTables } = require('../services/auditLogger');
const notificationService = require('../services/notificationService');

// ─────────────────────────────────────────────
//  SETTINGS TABLE ADAPTER
//  Some schemas use setting_key/setting_value (PG), some use key/value (SQLite).
//  Wrappers detect at runtime and adapt.
// ─────────────────────────────────────────────
async function getAllSettings() {
  try {
    const r = await db.query('SELECT * FROM system_settings');
    const rows = r.rows || [];
    // Map old column names to canonical {key, value}
    return rows.reduce((a, row) => {
      const k = row.setting_key ?? row.key ?? row.settingKey;
      const v = row.setting_value ?? row.value ?? row.settingValue;
      if (k !== undefined) a[k] = v;
      return a;
    }, {});
  } catch (e) { return {}; }
}
async function setSetting(key, value) {
  // Detect which column names are in use
  try {
    const sample = await db.query('SELECT * FROM system_settings LIMIT 1');
    const cols = sample.rows?.[0] ? Object.keys(sample.rows[0]) : [];
    const keyCol = cols.includes('setting_key') ? 'setting_key' : (cols.includes('key') ? 'key' : 'setting_key');
    const valCol = cols.includes('setting_value') ? 'setting_value' : (cols.includes('value') ? 'value' : 'value');
    const exists = await db.query(`SELECT 1 FROM system_settings WHERE ${keyCol} = $1`, [key]);
    if ((exists.rows || []).length > 0) {
      await db.query(`UPDATE system_settings SET ${valCol} = $1 WHERE ${keyCol} = $2`, [String(value), key]);
    } else {
      await db.query(`INSERT INTO system_settings (${keyCol}, ${valCol}) VALUES ($1, $2)`, [key, String(value)]);
    }
    return true;
  } catch (e) { return false; }
}

// Streaming CSV → array helper (we use it for bulk import endpoints).
function parseCsvText(text) {
  return new Promise((resolve, reject) => {
    const rows = [];
    Readable.from([text])
      .pipe(csv())
      .on('data', row => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'static', 'uploads', 'sa');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) {}

const adsUploadDir = path.join(__dirname, '..', 'static', 'uploads', 'ads');
try { fs.mkdirSync(adsUploadDir, { recursive: true }); } catch (e) {}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 28 * 1024 * 1024 }, // 28 MB
});

const adStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, adsUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = 'ad_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, safeName);
  }
});

const adUpload = multer({
  storage: adStorage,
  limits: { fileSize: 26 * 1024 * 1024 }, // 26 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|mp4|webm|quicktime|ogg/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype.toLowerCase();
    if (allowed.test(ext) || allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, GIF, MP4, and WEBM media files are allowed'));
    }
  }
});

const rbacService = require('../services/rbacService');
const {
  normalizeIndianMobile,
  getAllPermissions,
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  cloneRole,
  deleteRole,
  assignUserRole
} = rbacService;

const avatarUploadDir = path.join(__dirname, '..', 'static', 'uploads', 'avatars');
try { fs.mkdirSync(avatarUploadDir, { recursive: true }); } catch (e) {}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = 'avatar_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, safeName);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext) || allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, and GIF images are allowed for avatars'));
    }
  }
});

// ─────────────────────────────────────────────
//  MIDDLEWARE
// ─────────────────────────────────────────────

function superAdminOnly(req, res, next) {
  const role = req.session && req.session.role;
  if (role === 'super_admin' || role === 'superadmin') return next();
  req.flash && req.flash('error', 'Access denied. Super-Admin login required.');
  return res.redirect('/login');
}
router.use(superAdminOnly);

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function safeInt(v, def = 0) { return parseInt(v, 10) || def; }
function safeParse(v, def = []) { try { return JSON.parse(v) || def; } catch { return def; } }

function buildCSV(headers, rows) {
  const escape = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}

// ─────────────────────────────────────────────
//  DASHBOARD + ANALYTICS
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [usersR, schoolsR, booksR, txActiveR, txOverdueR, revenueR, dcR, adsR] = await Promise.all([
      db.query('SELECT COUNT(*) as c FROM users').catch(() => ({ rows: [{ c: 0 }] })),
      db.query('SELECT COUNT(*) as c FROM schools').catch(() => ({ rows: [{ c: 0 }] })),
      db.query('SELECT COUNT(*) as c FROM books').catch(() => ({ rows: [{ c: 0 }] })),
      db.query("SELECT COUNT(*) as c FROM transactions WHERE status = 'issued'").catch(() => ({ rows: [{ c: 0 }] })),
      db.query("SELECT COUNT(*) as c FROM transactions WHERE status = 'issued' AND due_date < NOW()").catch(() => ({ rows: [{ c: 0 }] })),
      db.query("SELECT COALESCE(SUM(fine),0) as s FROM transactions WHERE fine > 0").catch(() => ({ rows: [{ s: 0 }] })),
      db.query("SELECT COUNT(*) as c FROM digital_content").catch(() => ({ rows: [{ c: 0 }] })),
      db.query(`SELECT *,(CASE WHEN end_time IS NOT NULL AND end_time < NOW() THEN 'expired' ELSE status END) as computed_status,
        ROUND(CASE WHEN impressions > 0 THEN (clicks*100.0/impressions) ELSE 0 END,2) as ctr
        FROM advertisements ORDER BY priority DESC, created_at DESC`).catch(() => ({ rows: [] }))
    ]);

    const pick = (r) => safeInt(r.rows[0]?.c || r.rows[0]?.['COUNT(*)'] || 0);

    res.render('super_admin_dashboard', {
      title: 'Super Admin Control Center — librika.in',
      og_title: 'Super Admin Control Center — librika.in',
      stats: {
        users:      pick(usersR),
        schools:    pick(schoolsR),
        books:      pick(booksR),
        active:     pick(txActiveR),
        overdue:    pick(txOverdueR),
        fines:      parseFloat(revenueR.rows[0]?.s || 0),
        content:    pick(dcR),
        ads:        (adsR.rows || []).filter(a => a.computed_status === 'active').length
      },
      advertisements: adsR.rows || [],
      // legacy compat
      usersCount:   pick(usersR),
      schoolsCount: pick(schoolsR),
      totalRevenue: parseFloat(revenueR.rows[0]?.s || 0)
    });
  } catch (err) {
    console.error('[SA Dashboard]', err);
    res.status(500).send('Super Admin Dashboard Error: ' + err.message);
  }
});

// ─────────────────────────────────────────────
//  ANALYTICS API
// ─────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const [usersR, schoolsR, booksR, txR, overdueR, dcR, adsR, roleR, logsR] = await Promise.all([
      db.query('SELECT COUNT(*) as c FROM users').catch(() => ({ rows: [{ c: 0 }] })),
      db.query('SELECT COUNT(*) as c FROM schools').catch(() => ({ rows: [{ c: 0 }] })),
      db.query('SELECT COUNT(*) as c FROM books').catch(() => ({ rows: [{ c: 0 }] })),
      db.query("SELECT COUNT(*) as c FROM transactions WHERE status='issued'").catch(() => ({ rows: [{ c: 0 }] })),
      db.query("SELECT COUNT(*) as c FROM transactions WHERE status='issued' AND due_date < NOW()").catch(() => ({ rows: [{ c: 0 }] })),
      db.query('SELECT COUNT(*) as c FROM digital_content').catch(() => ({ rows: [{ c: 0 }] })),
      db.query("SELECT COUNT(*) as c FROM advertisements WHERE status='active'").catch(() => ({ rows: [{ c: 0 }] })),
      db.query('SELECT role, COUNT(*) as c FROM users GROUP BY role').catch(() => ({ rows: [] })),
      db.query("SELECT COUNT(*) as c FROM logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)").catch(() => ({ rows: [{ c: 0 }] }))
    ]);
    const pick = r => safeInt(r.rows[0]?.c || r.rows[0]?.['COUNT(*)'] || 0);
    res.json({
      success: true,
      users: pick(usersR),
      schools: pick(schoolsR),
      books: pick(booksR),
      active_borrows: pick(txR),
      overdue: pick(overdueR),
      digital_content: pick(dcR),
      active_ads: pick(adsR),
      by_role: (roleR.rows || []).reduce((a, r) => { a[r.role] = safeInt(r.c || r['COUNT(*)']); return a; }, {}),
      recent_logs: pick(logsR)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  SCHOOL MANAGEMENT
// ─────────────────────────────────────────────
router.get('/schools', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*,
        (SELECT COUNT(*) FROM users u WHERE u.school_code = s.school_code) as user_count,
        (SELECT COUNT(*) FROM books b WHERE b.school_code = s.school_code) as book_count
       FROM schools s ORDER BY s.created_at DESC`
    );
    res.json({ success: true, schools: result.rows || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/schools/create', async (req, res) => {
  const {
    school_code, name, address, phone, email, librarian_name,
    logo_url, primary_color, secondary_color, school_name_override,
    activePlan, studentLimit, librarianLimit, adminLimit, due_days
  } = req.body;
  if (!school_code || !name) return res.status(400).json({ error: 'school_code and name are required' });
  try {
    await db.query(
      `INSERT INTO schools
        (school_code, name, address, phone, email, librarian_name,
         logo_url, primary_color, secondary_color, school_name_override,
         max_students, max_books, status, activePlan,
         studentLimit, librarianLimit, adminLimit, due_days, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'active',$13,$14,$15,$16,$17,NOW())`,
      [
        school_code.toUpperCase(), name, address || null, phone || null, email || null,
        librarian_name || '',
        logo_url || null, primary_color || '#6366f1', secondary_color || '#a855f7',
        school_name_override || null,
        studentLimit || 500, 500,
        activePlan || 'FREE',
        studentLimit || 500, librarianLimit || 2, adminLimit || 2, due_days || 14
      ]
    );
    res.json({ success: true, message: 'School created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy route compat
router.post('/add-school', async (req, res) => {
  req.body.school_code = req.body.school_code;
  const { school_code, name, address } = req.body;
  try {
    await db.query('INSERT INTO schools (school_code, name) VALUES ($1,$2)', [school_code, name]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/edit-school/:code', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM schools WHERE school_code = $1', [req.params.code]);
    res.json(r.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/edit-school/:code', async (req, res) => {
  const { code } = req.params;
  const {
    name, address, phone, email, librarian_name,
    logo_url, primary_color, secondary_color, school_name_override,
    status, activePlan, studentLimit, librarianLimit, adminLimit, due_days, expiryDate
  } = req.body;
  try {
    await db.query(
      `UPDATE schools SET
        name=$1, address=$2, phone=$3, email=$4, librarian_name=$5,
        logo_url=$6, primary_color=$7, secondary_color=$8, school_name_override=$9,
        status=$10, activePlan=$11,
        studentLimit=$12, librarianLimit=$13, adminLimit=$14, due_days=$15, expiryDate=$16
       WHERE school_code=$17`,
      [
        name, address || null, phone || null, email || null, librarian_name || '',
        logo_url || null, primary_color || '#6366f1', secondary_color || '#a855f7',
        school_name_override || null,
        status || 'active', activePlan || 'FREE',
        studentLimit || 500, librarianLimit || 2, adminLimit || 2,
        due_days || 14, expiryDate || null, code
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/schools/:code/toggle-status', async (req, res) => {
  const { code } = req.params;
  try {
    const cur = await db.query('SELECT status FROM schools WHERE school_code = $1', [code]);
    const newStatus = (cur.rows[0]?.status === 'active') ? 'suspended' : 'active';
    await db.query('UPDATE schools SET status=$1 WHERE school_code=$2', [newStatus, code]);
    res.json({ success: true, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/delete-school/:code', async (req, res) => {
  try {
    await db.query('DELETE FROM schools WHERE school_code = $1', [req.params.code]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  USER MANAGEMENT (MASTER DIRECTORY, PROFILE, RBAC, BULK, CSV)
// ─────────────────────────────────────────────

// User Directory with Search, Multi-Filter, and Human-Readable Joins
router.get('/users', async (req, res) => {
  const { role, school_code, status, banned, search, page = 1, limit = 50, gender, class: userClass } = req.query;
  try {
    let where = '1=1';
    let params = [];
    if (role) { params.push(role); where += ` AND LOWER(u.role) = LOWER($${params.length})`; }
    if (school_code) { params.push(school_code); where += ` AND u.school_code = $${params.length}`; }
    if (gender) { params.push(gender); where += ` AND u.gender = $${params.length}`; }
    if (userClass) { params.push(userClass); where += ` AND u.class = $${params.length}`; }

    if (status === 'deleted') {
      where += ` AND u.deleted_at IS NOT NULL`;
    } else if (status === 'suspended' || banned === 'true') {
      where += ` AND (u.is_banned = '1' OR u.is_banned = 1 OR u.status = 'suspended') AND u.deleted_at IS NULL`;
    } else if (status === 'active' || banned === 'false') {
      where += ` AND (u.is_banned = '0' OR u.is_banned = 0 OR u.status = 'active' OR u.status IS NULL) AND u.deleted_at IS NULL`;
    } else {
      where += ` AND u.deleted_at IS NULL`;
    }

    if (search && search.trim()) {
      const cleanSearch = `%${search.trim()}%`;
      params.push(cleanSearch);
      const pIdx = params.length;
      where += ` AND (u.name LIKE $${pIdx} OR u.phone LIKE $${pIdx} OR u.email LIKE $${pIdx} OR u.admission_no LIKE $${pIdx} OR u.student_id LIKE $${pIdx} OR u.employee_id LIKE $${pIdx})`;
    }

    const offset = (safeInt(page, 1) - 1) * safeInt(limit, 50);
    params.push(safeInt(limit, 50));
    params.push(offset);

    const result = await db.query(
      `SELECT u.id, u.name, u.first_name, u.last_name, u.phone, u.email, u.role, u.school_code,
              u.class, u.section, u.stream, u.is_banned, u.status, u.admission_no, u.student_id,
              u.employee_id, u.dob, u.gender, u.profile_picture, u.avatar_id, u.last_active_at,
              u.last_login_at, u.created_at, u.deleted_at,
              COALESCE(s.name, u.school_code, 'Independent') as school_name,
              COALESCE(r.name, u.role) as role_name
       FROM users u
       LEFT JOIN schools s ON u.school_code = s.school_code COLLATE utf8mb4_unicode_ci
       LEFT JOIN roles r ON LOWER(u.role) = LOWER(r.slug) COLLATE utf8mb4_unicode_ci
       WHERE ${where}
       ORDER BY u.id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, -2);
    const countR = await db.query(`SELECT COUNT(*) as c FROM users u WHERE ${where}`, countParams);
    const total = safeInt(countR.rows[0]?.c || countR.rows[0]?.['COUNT(*)'] || 0);

    res.json({
      success: true,
      users: result.rows || [],
      total,
      page: safeInt(page, 1),
      limit: safeInt(limit, 50)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create User with 10-Digit Mobile Validation & Role Assignment
router.post('/users/create', async (req, res) => {
  const { name, phone, email, role, school_code, password, admission_no, class: cls, section, gender, dob } = req.body;
  if (!name || !phone || !role) {
    return res.status(400).json({ error: 'Name, 10-digit mobile number, and role are required.' });
  }

  const mobileCheck = normalizeIndianMobile(phone);
  if (!mobileCheck.valid) {
    return res.status(400).json({ error: mobileCheck.error });
  }
  const normalizedPhone = mobileCheck.normalized;

  try {
    const existingCheck = await db.query('SELECT id FROM users WHERE phone = $1', [normalizedPhone]);
    if (existingCheck.rows && existingCheck.rows.length > 0) {
      return res.status(400).json({ error: `Mobile number ${normalizedPhone} is already registered.` });
    }
    if (email && email.trim()) {
      const emailCheck = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
      if (emailCheck.rows && emailCheck.rows.length > 0) {
        return res.status(400).json({ error: `Email ${email.trim()} is already registered.` });
      }
    }

    const hashed = await bcrypt.hash(password || 'password123', 10);
    const cleanRole = role.toLowerCase().trim();
    const insRes = await db.query(
      `INSERT INTO users (name, phone, email, role, school_code, password, admission_no, class, section, gender, dob, is_banned, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, '0', 'active', NOW())`,
      [name.trim(), normalizedPhone, email ? email.trim() : null, cleanRole, school_code || null, hashed, admission_no || null, cls || null, section || null, gender || null, dob || null]
    ).catch(async () => {
      return await db.query(
        `INSERT INTO users (name, phone, email, role, school_code, password, admission_no, class, section, gender, dob, is_banned, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, '0', 'active')`,
        [name.trim(), normalizedPhone, email ? email.trim() : null, cleanRole, school_code || null, hashed, admission_no || null, cls || null, section || null, gender || null, dob || null]
      );
    });

    const newUserId = (insRes.rows && insRes.rows[0]) ? insRes.rows[0].id : insRes.lastId;

    if (newUserId) {
      await assignUserRole(newUserId, cleanRole, {
        school_code: school_code || 'GLOBAL',
        assigned_by: req.session.user_id
      }).catch(err => console.warn('assignUserRole note:', err.message));

      if (cleanRole === 'student') {
        const studentId = `VBPS${String(newUserId).padStart(5, '0')}`;
        await db.query('UPDATE users SET student_id = $1 WHERE id = $2', [studentId, newUserId]).catch(() => {});
      }
    }

    await logActivity(req, {
      userId: req.session.user_id,
      action: `Created new user '${name.trim()}' (${cleanRole}) with mobile '${normalizedPhone}'`,
      module: 'users',
      schoolCode: school_code || 'GLOBAL'
    }).catch(() => {});

    res.json({ success: true, message: 'User created successfully', id: newUserId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View Complete User Profile
router.get('/users/:id/profile', async (req, res) => {
  const { id } = req.params;
  try {
    const userRes = await db.query(`
      SELECT u.*, 
             COALESCE(s.name, u.school_code, 'Independent') as school_name,
             COALESCE(r.name, u.role) as role_name
      FROM users u
      LEFT JOIN schools s ON u.school_code = s.school_code COLLATE utf8mb4_unicode_ci
      LEFT JOIN roles r ON LOWER(u.role) = LOWER(r.slug) COLLATE utf8mb4_unicode_ci
      WHERE u.id = $1
    `, [id]);

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userRes.rows[0];

    // Assigned roles
    const rolesRes = await db.query(`
      SELECT r.id, r.name, r.slug, ur.portfolio_type, ur.school_code, ur.assigned_at
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `, [id]).catch(() => ({ rows: [] }));

    // Recent login history
    const loginsRes = await db.query(`
      SELECT * FROM login_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10
    `, [id]).catch(() => ({ rows: [] }));

    // Activity timeline (audit logs + circulation + quizzes)
    const timelineRes = await db.query(`
      SELECT 'audit' as source, action as title, description as detail, created_at
      FROM audit_logs WHERE user_id = $1
      UNION ALL
      SELECT 'circulation' as source, CONCAT('Issued book: ', b.title) as title, t.status as detail, t.issue_date as created_at
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      WHERE t.user_id = $1
      ORDER BY created_at DESC LIMIT 15
    `, [id]).catch(() => ({ rows: [] }));

    res.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        alt_phone: user.alt_phone || '',
        gender: user.gender || '',
        dob: user.dob || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || 'India',
        pincode: user.pincode || '',
        profile_picture: user.profile_picture || '',
        avatar_id: user.avatar_id || 'avatar_01',
        school_code: user.school_code || '',
        school_name: user.school_name || 'Independent',
        class: user.class || '',
        section: user.section || '',
        stream: user.stream || '',
        academic_year: user.academic_year || '',
        student_id: user.student_id || (user.admission_no ? `VBPS${user.admission_no}` : `VBPS${user.id}`),
        employee_id: user.employee_id || '',
        department: user.department || '',
        designation: user.designation || '',
        admission_no: user.admission_no || '',
        role: user.role,
        role_name: user.role_name,
        status: user.status || (user.is_banned === '1' ? 'suspended' : 'active'),
        is_banned: user.is_banned === '1' || user.is_banned === 1,
        email_verified: !!user.email_verified,
        phone_verified: !!user.phone_verified,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        last_active_at: user.last_active_at,
        interests: user.interests || '',
        communication_preferences: user.communication_preferences || '',
        roles: rolesRes.rows || [],
        logins: loginsRes.rows || [],
        timeline: timelineRes.rows || []
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update User Profile with Validation
router.post('/users/:id/profile', async (req, res) => {
  const { id } = req.params;
  const {
    name, first_name, last_name, phone, email, gender, dob, alt_phone,
    address, city, state, country, pincode, class: cls, section, stream,
    admission_no, student_id, employee_id, department, designation,
    academic_year, school_code, role, status, interests, communication_preferences,
    avatar_id, profile_picture
  } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Mobile Number are required.' });
  }

  const mobileCheck = normalizeIndianMobile(phone);
  if (!mobileCheck.valid) {
    return res.status(400).json({ error: mobileCheck.error });
  }
  const cleanPhone = mobileCheck.normalized;

  try {
    // Check mobile collision with other users
    const phoneCheck = await db.query('SELECT id FROM users WHERE phone = $1 AND id != $2', [cleanPhone, id]);
    if (phoneCheck.rows && phoneCheck.rows.length > 0) {
      return res.status(400).json({ error: `Mobile number ${cleanPhone} is already in use by another user.` });
    }

    // Protect final Super Admin from role downgrade
    const curUserRes = await db.query('SELECT role FROM users WHERE id = $1', [id]);
    const curUser = curUserRes.rows[0];
    if (curUser && curUser.role === 'super_admin' && role && role !== 'super_admin') {
      const saCountRes = await db.query("SELECT COUNT(*) as c FROM users WHERE role = 'super_admin' AND (deleted_at IS NULL)");
      const saCount = parseInt(saCountRes.rows[0]?.c || 1, 10);
      if (saCount <= 1) {
        return res.status(400).json({ error: 'Cannot change role: System requires at least one active Super Admin.' });
      }
    }

    const cleanRole = (role || curUser?.role || 'student').toLowerCase().trim();

    await db.query(`
      UPDATE users SET
        name = $1, first_name = $2, last_name = $3, phone = $4, email = $5,
        gender = $6, dob = $7, alt_phone = $8, address = $9, city = $10,
        state = $11, country = $12, pincode = $13, class = $14, section = $15,
        stream = $16, admission_no = $17, student_id = $18, employee_id = $19,
        department = $20, designation = $21, academic_year = $22, school_code = $23,
        role = $24, status = $25, interests = $26, communication_preferences = $27,
        avatar_id = $28, profile_picture = $29
      WHERE id = $30
    `, [
      name.trim(), first_name || null, last_name || null, cleanPhone, email ? email.trim() : null,
      gender || null, dob || null, alt_phone || null, address || null, city || null,
      state || null, country || 'India', pincode || null, cls || null, section || null,
      stream || null, admission_no || null, student_id || null, employee_id || null,
      department || null, designation || null, academic_year || null, school_code || null,
      cleanRole, status || 'active', interests ? String(interests) : null,
      communication_preferences ? String(communication_preferences) : null,
      avatar_id || 'avatar_01', profile_picture || null, id
    ]);

    // Synchronize user_roles
    if (role) {
      await assignUserRole(id, cleanRole, {
        school_code: school_code || 'GLOBAL',
        assigned_by: req.session.user_id
      }).catch(() => {});
    }

    await logActivity(req, {
      userId: req.session.user_id,
      action: `Updated profile for user #${id} (${name.trim()})`,
      module: 'users',
      schoolCode: school_code || 'GLOBAL'
    }).catch(() => {});

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update User Avatar Selection (Toon / Predefined)
router.post('/users/:id/avatar', async (req, res) => {
  const { id } = req.params;
  const { avatar_id, profile_picture } = req.body;
  try {
    await db.query(
      'UPDATE users SET avatar_id = $1, profile_picture = $2 WHERE id = $3',
      [avatar_id || 'avatar_01', profile_picture || null, id]
    );
    res.json({ success: true, message: 'Avatar updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload User Profile Picture
router.post('/users/:id/upload-picture', avatarUpload.single('picture'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });
  try {
    const pictureUrl = `/static/uploads/avatars/${req.file.filename}`;
    await db.query('UPDATE users SET profile_picture = $1 WHERE id = $2', [pictureUrl, id]);
    res.json({ success: true, profile_picture: pictureUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Status Management (Active, Suspend, Soft Delete, Restore)
router.post('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body; // action: 'enable', 'disable', 'delete', 'restore'

  try {
    const curUserRes = await db.query('SELECT role, name FROM users WHERE id = $1', [id]);
    if (!curUserRes.rows || curUserRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = curUserRes.rows[0];

    // Safeguard final Super Admin
    if (user.role === 'super_admin' && (action === 'disable' || action === 'delete')) {
      const saCountRes = await db.query("SELECT COUNT(*) as c FROM users WHERE role = 'super_admin' AND (deleted_at IS NULL)");
      const saCount = parseInt(saCountRes.rows[0]?.c || 1, 10);
      if (saCount <= 1) {
        return res.status(400).json({ error: 'Safety Violation: Cannot suspend or delete the sole remaining Super Admin.' });
      }
    }

    if (action === 'disable' || action === 'suspend') {
      await db.query("UPDATE users SET is_banned = '1', status = 'suspended' WHERE id = $1", [id]);
    } else if (action === 'enable' || action === 'activate') {
      await db.query("UPDATE users SET is_banned = '0', status = 'active' WHERE id = $1", [id]);
    } else if (action === 'delete') {
      await db.query("UPDATE users SET status = 'deleted', deleted_at = NOW() WHERE id = $1", [id]).catch(async () => {
        await db.query("UPDATE users SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
      });
    } else if (action === 'restore') {
      await db.query("UPDATE users SET status = 'active', is_banned = '0', deleted_at = NULL WHERE id = $1", [id]);
    } else {
      return res.status(400).json({ error: 'Invalid status action.' });
    }

    await logActivity(req, {
      userId: req.session.user_id,
      action: `User #${id} (${user.name}) status changed to '${action}'. ${reason ? 'Reason: ' + reason : ''}`,
      module: 'users'
    }).catch(() => {});

    res.json({ success: true, message: `User status changed to ${action}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft Delete User
router.post('/users/:id/delete', async (req, res) => {
  const { id } = req.params;
  try {
    const curUserRes = await db.query('SELECT role, name FROM users WHERE id = $1', [id]);
    const user = curUserRes.rows[0];
    if (user && user.role === 'super_admin') {
      const saCountRes = await db.query("SELECT COUNT(*) as c FROM users WHERE role = 'super_admin' AND deleted_at IS NULL");
      const saCount = parseInt(saCountRes.rows[0]?.c || 1, 10);
      if (saCount <= 1) {
        return res.status(400).json({ error: 'Safety Violation: Cannot delete the sole remaining Super Admin.' });
      }
    }
    await db.query("UPDATE users SET status = 'deleted', deleted_at = NOW() WHERE id = $1", [id]).catch(async () => {
      await db.query("UPDATE users SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
    });

    await logActivity(req, {
      userId: req.session.user_id,
      action: `Soft-deleted user #${id} (${user?.name || 'User'})`,
      module: 'users'
    }).catch(() => {});

    res.json({ success: true, message: 'User soft-deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore User
router.post('/users/:id/restore', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE users SET status = 'active', is_banned = '0', deleted_at = NULL WHERE id = $1", [id]);
    res.json({ success: true, message: 'User restored successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password
router.post('/users/:id/reset-password', async (req, res) => {
  const { id } = req.params;
  const newPass = req.body.new_password || ('Temp@' + Math.random().toString(36).slice(2, 8).toUpperCase());
  try {
    const hashed = await bcrypt.hash(newPass, 10);
    await db.query('UPDATE users SET password = $1, session_token = NULL, last_password_change = NOW() WHERE id = $2', [hashed, id]).catch(async () => {
      await db.query('UPDATE users SET password = $1, session_token = NULL WHERE id = $2', [hashed, id]);
    });

    await logActivity(req, {
      userId: req.session.user_id,
      action: `Password reset performed for user #${id}`,
      module: 'users'
    }).catch(() => {});

    res.json({ success: true, new_password: newPass });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Force Logout
router.post('/users/:id/force-logout', async (req, res) => {
  try {
    await db.query('UPDATE users SET session_token = NULL WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'User session terminated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Ban (Legacy compatibility)
router.post('/users/:id/toggle-ban', async (req, res) => {
  const { id } = req.params;
  try {
    const cur = await db.query('SELECT is_banned FROM users WHERE id = $1', [id]);
    const current = cur.rows[0]?.is_banned;
    const newBan = (current === '1' || current === 1 || current === true) ? '0' : '1';
    const newStatus = (newBan === '1') ? 'suspended' : 'active';
    await db.query('UPDATE users SET is_banned = $1, status = $2 WHERE id = $3', [newBan, newStatus, id]);
    res.json({ success: true, is_banned: newBan === '1', status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Role
router.post('/users/:id/change-role', async (req, res) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role is required' });
  try {
    const curUserRes = await db.query('SELECT role, name, school_code FROM users WHERE id = $1', [req.params.id]);
    const user = curUserRes.rows[0];
    if (user && user.role === 'super_admin' && role !== 'super_admin') {
      const saCountRes = await db.query("SELECT COUNT(*) as c FROM users WHERE role = 'super_admin' AND deleted_at IS NULL");
      const saCount = parseInt(saCountRes.rows[0]?.c || 1, 10);
      if (saCount <= 1) {
        return res.status(400).json({ error: 'Cannot change role of the sole Super Admin.' });
      }
    }

    await assignUserRole(req.params.id, role, {
      school_code: user?.school_code || 'GLOBAL',
      assigned_by: req.session.user_id
    });

    await logActivity(req, {
      userId: req.session.user_id,
      action: `Changed role of user #${req.params.id} (${user?.name}) from '${user?.role}' to '${role}'`,
      module: 'users'
    }).catch(() => {});

    res.json({ success: true, message: `Role changed to ${role}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transfer School
router.post('/users/:id/transfer-school', async (req, res) => {
  const { school_code } = req.body;
  if (!school_code) return res.status(400).json({ error: 'school_code required' });
  try {
    await db.query('UPDATE users SET school_code = $1 WHERE id = $2', [school_code, req.params.id]);
    await db.query('UPDATE user_roles SET school_code = $1 WHERE user_id = $2', [school_code, req.params.id]).catch(() => {});
    res.json({ success: true, message: `User transferred to school ${school_code}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  BULK USER MANAGEMENT (BATCH OPERATIONS)
// ─────────────────────────────────────────────

// Bulk Assign Role
router.post('/users/bulk-assign-role', async (req, res) => {
  const { user_ids, role } = req.body;
  if (!Array.isArray(user_ids) || user_ids.length === 0 || !role) {
    return res.status(400).json({ error: 'user_ids array and target role are required' });
  }

  try {
    let updatedCount = 0;
    for (const uid of user_ids) {
      await assignUserRole(uid, role, {
        assigned_by: req.session.user_id
      }).catch(() => {});
      updatedCount++;
    }

    await logActivity(req, {
      userId: req.session.user_id,
      action: `Bulk assigned role '${role}' to ${updatedCount} users`,
      module: 'users'
    }).catch(() => {});

    res.json({ success: true, message: `Successfully assigned role '${role}' to ${updatedCount} users` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Status Change (Enable, Disable, Soft Delete)
router.post('/users/bulk-status', async (req, res) => {
  const { user_ids, action } = req.body; // 'enable', 'disable', 'delete', 'restore'
  if (!Array.isArray(user_ids) || user_ids.length === 0 || !action) {
    return res.status(400).json({ error: 'user_ids and action required' });
  }

  try {
    let affected = 0;
    for (const uid of user_ids) {
      const uRes = await db.query('SELECT role FROM users WHERE id = $1', [uid]);
      const r = uRes.rows[0]?.role;
      // Skip super admin for disable/delete
      if (r === 'super_admin' && (action === 'disable' || action === 'delete')) continue;

      if (action === 'disable') {
        await db.query("UPDATE users SET is_banned = '1', status = 'suspended' WHERE id = $1", [uid]);
      } else if (action === 'enable') {
        await db.query("UPDATE users SET is_banned = '0', status = 'active' WHERE id = $1", [uid]);
      } else if (action === 'delete') {
        await db.query("UPDATE users SET status = 'deleted', deleted_at = NOW() WHERE id = $1", [uid]).catch(async () => {
          await db.query("UPDATE users SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP WHERE id = $1", [uid]);
        });
      } else if (action === 'restore') {
        await db.query("UPDATE users SET status = 'active', is_banned = '0', deleted_at = NULL WHERE id = $1", [uid]);
      }
      affected++;
    }

    await logActivity(req, {
      userId: req.session.user_id,
      action: `Bulk performed '${action}' on ${affected} users`,
      module: 'users'
    }).catch(() => {});

    res.json({ success: true, message: `Bulk action '${action}' applied to ${affected} users.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk School Transfer
router.post('/users/bulk-school', async (req, res) => {
  const { user_ids, school_code } = req.body;
  if (!Array.isArray(user_ids) || user_ids.length === 0 || !school_code) {
    return res.status(400).json({ error: 'user_ids and school_code required' });
  }
  try {
    let transferred = 0;
    for (const uid of user_ids) {
      await db.query('UPDATE users SET school_code = $1 WHERE id = $2', [school_code, uid]);
      await db.query('UPDATE user_roles SET school_code = $1 WHERE user_id = $2', [school_code, uid]).catch(() => {});
      transferred++;
    }

    await logActivity(req, {
      userId: req.session.user_id,
      action: `Bulk transferred ${transferred} users to school '${school_code}'`,
      module: 'users'
    }).catch(() => {});

    res.json({ success: true, message: `Transferred ${transferred} users to ${school_code}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  CSV EXPORT & MULTI-STEP IMPORT WIZARD
// ─────────────────────────────────────────────

// Export Users to CSV with Human-Readable Headers (No Internal Codes)
router.get('/users/export-csv', async (req, res) => {
  const { role, school_code, status, user_ids } = req.query;
  try {
    let where = '1=1';
    let params = [];
    if (user_ids) {
      const ids = String(user_ids).split(',').map(id => parseInt(id, 10)).filter(Boolean);
      if (ids.length > 0) {
        where += ` AND u.id IN (${ids.join(',')})`;
      }
    }
    if (role) { params.push(role); where += ` AND LOWER(u.role) = LOWER($${params.length})`; }
    if (school_code) { params.push(school_code); where += ` AND u.school_code = $${params.length}`; }
    if (status === 'deleted') where += ` AND u.deleted_at IS NOT NULL`;
    else where += ` AND u.deleted_at IS NULL`;

    const r = await db.query(`
      SELECT u.id, u.name, u.phone, u.email, COALESCE(r.name, u.role) as role_title,
             COALESCE(s.name, u.school_code, 'Independent') as school_name,
             u.class, u.section, u.admission_no, u.student_id, u.gender, u.dob,
             u.status, u.created_at
      FROM users u
      LEFT JOIN schools s ON u.school_code = s.school_code COLLATE utf8mb4_unicode_ci
      LEFT JOIN roles r ON LOWER(u.role) = LOWER(r.slug) COLLATE utf8mb4_unicode_ci
      WHERE ${where}
      ORDER BY u.id DESC
    `, params);

    const rows = (r.rows || []).map(u => ({
      'User ID': u.id,
      'Full Name': u.name || '',
      'Mobile Number': u.phone || '',
      'Email Address': u.email || '',
      'Role': u.role_title || '',
      'School / Organization': u.school_name || '',
      'Class': u.class || '',
      'Section': u.section || '',
      'Admission No': u.admission_no || '',
      'Student ID': u.student_id || '',
      'Gender': u.gender || '',
      'Date of Birth': u.dob || '',
      'Account Status': u.status || 'Active',
      'Registration Date': u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : ''
    }));

    const headers = ['User ID', 'Full Name', 'Mobile Number', 'Email Address', 'Role', 'School / Organization', 'Class', 'Section', 'Admission No', 'Student ID', 'Gender', 'Date of Birth', 'Account Status', 'Registration Date'];
    const csvContent = buildCSV(headers, rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="librika_users_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).send('Error generating CSV export: ' + err.message);
  }
});

// Step 1 & 2: Parse and Validate CSV for Preview Breakdown
router.post('/users/import-csv-validate', async (req, res) => {
  const { csv_text } = req.body;
  if (!csv_text || !csv_text.trim()) {
    return res.status(400).json({ error: 'CSV data is required.' });
  }

  try {
    const rawRows = await parseCsvText(csv_text);
    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ error: 'No data rows found in CSV.' });
    }

    const rolesRes = await getAllRoles();
    const validRoles = new Set(rolesRes.map(r => r.slug.toLowerCase()));
    rolesRes.forEach(r => validRoles.add(r.name.toLowerCase()));

    const existingPhones = new Set();
    const existingEmails = new Set();
    const dbUsers = await db.query('SELECT phone, email FROM users');
    (dbUsers.rows || []).forEach(u => {
      if (u.phone) existingPhones.add(String(u.phone).trim());
      if (u.email) existingEmails.add(String(u.email).toLowerCase().trim());
    });

    const seenPhonesInFile = new Set();
    const seenEmailsInFile = new Set();

    let validRows = [];
    let invalidRows = [];
    let duplicateCount = 0;

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // accounting for 1-indexed and header
      const name = (row['Full Name'] || row.name || row.Name || '').trim();
      const rawMobile = (row['Mobile Number'] || row.mobile || row.phone || row.Phone || '').trim();
      const email = (row['Email Address'] || row.email || row.Email || '').trim().toLowerCase();
      const roleStr = (row['Role'] || row.role || row.Role || 'Student').trim().toLowerCase();
      const school = (row['School / Organization'] || row.school || row.school_code || '').trim();
      const cls = (row['Class'] || row.class || '').trim();
      const section = (row['Section'] || row.section || '').trim();
      const admNo = (row['Admission No'] || row.admission_no || '').trim();
      const gender = (row['Gender'] || row.gender || '').trim();
      const dob = (row['Date of Birth'] || row.dob || '').trim();

      const errors = [];

      if (!name) errors.push('Full Name is missing.');

      const mobileCheck = normalizeIndianMobile(rawMobile);
      if (!mobileCheck.valid) {
        errors.push(mobileCheck.error);
      } else {
        const cleanMobile = mobileCheck.normalized;
        if (existingPhones.has(cleanMobile)) {
          errors.push(`Mobile ${cleanMobile} already exists in database.`);
          duplicateCount++;
        } else if (seenPhonesInFile.has(cleanMobile)) {
          errors.push(`Duplicate mobile ${cleanMobile} within this CSV.`);
          duplicateCount++;
        } else {
          seenPhonesInFile.add(cleanMobile);
        }
      }

      if (email) {
        if (existingEmails.has(email)) {
          errors.push(`Email ${email} already exists in database.`);
          duplicateCount++;
        } else if (seenEmailsInFile.has(email)) {
          errors.push(`Duplicate email ${email} within this CSV.`);
          duplicateCount++;
        } else {
          seenEmailsInFile.add(email);
        }
      }

      if (errors.length > 0) {
        invalidRows.push({ rowNum, name: name || 'N/A', mobile: rawMobile, email, errors });
      } else {
        validRows.push({
          rowNum,
          name,
          phone: mobileCheck.normalized,
          email,
          role: roleStr,
          school_code: school,
          class: cls,
          section,
          admission_no: admNo,
          gender,
          dob
        });
      }
    });

    res.json({
      success: true,
      summary: {
        totalRows: rawRows.length,
        validCount: validRows.length,
        invalidCount: invalidRows.length,
        duplicateCount
      },
      validRows,
      invalidRows
    });
  } catch (err) {
    res.status(500).json({ error: 'CSV Validation Error: ' + err.message });
  }
});

// Step 3: Confirm and Execute Valid Records Import
router.post('/users/import-csv-confirm', async (req, res) => {
  const { valid_rows } = req.body;
  if (!Array.isArray(valid_rows) || valid_rows.length === 0) {
    return res.status(400).json({ error: 'No validated rows to import.' });
  }

  try {
    const defaultPassword = await bcrypt.hash('password123', 10);
    let importedCount = 0;

    for (const r of valid_rows) {
      const cleanRole = (r.role || 'student').toLowerCase();
      const insRes = await db.query(`
        INSERT INTO users (name, phone, email, role, school_code, password, admission_no, class, section, gender, dob, is_banned, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, '0', 'active', NOW())
      `, [
        r.name, r.phone, r.email || null, cleanRole, r.school_code || null,
        defaultPassword, r.admission_no || null, r.class || null, r.section || null,
        r.gender || null, r.dob || null
      ]).catch(async () => {
        return await db.query(`
          INSERT INTO users (name, phone, email, role, school_code, password, admission_no, class, section, gender, dob, is_banned, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, '0', 'active')
        `, [
          r.name, r.phone, r.email || null, cleanRole, r.school_code || null,
          defaultPassword, r.admission_no || null, r.class || null, r.section || null,
          r.gender || null, r.dob || null
        ]);
      });

      const newId = (insRes.rows && insRes.rows[0]) ? insRes.rows[0].id : insRes.lastId;
      if (newId) {
        await assignUserRole(newId, cleanRole, {
          school_code: r.school_code || 'GLOBAL',
          assigned_by: req.session.user_id
        }).catch(() => {});

        if (cleanRole === 'student') {
          const studentId = `VBPS${String(newId).padStart(5, '0')}`;
          await db.query('UPDATE users SET student_id = $1 WHERE id = $2', [studentId, newId]).catch(() => {});
        }
      }
      importedCount++;
    }

    await logActivity(req, {
      userId: req.session.user_id,
      action: `Successfully bulk imported ${importedCount} users from CSV`,
      module: 'users'
    }).catch(() => {});

    res.json({ success: true, message: `Successfully imported ${importedCount} users into Librika!` });
  } catch (err) {
    res.status(500).json({ error: 'Import failed: ' + err.message });
  }
});

// ─────────────────────────────────────────────
//  DYNAMIC ROLE BUILDER & PERMISSION APIS
// ─────────────────────────────────────────────

// Get complete permissions catalog grouped by module
router.get('/api/permissions', async (req, res) => {
  try {
    const data = await getAllPermissions();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all roles
router.get('/api/roles', async (req, res) => {
  try {
    const roles = await getAllRoles();
    res.json({ success: true, roles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single role with its assigned permissions
router.get('/api/roles/:id', async (req, res) => {
  try {
    const role = await getRoleById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json({ success: true, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create custom role
router.post('/api/roles/create', async (req, res) => {
  const { name, description, permission_ids, status } = req.body;
  try {
    const role = await createRole({ name, description, permission_ids, status });
    await logActivity(req, {
      userId: req.session.user_id,
      action: `Created new custom role '${role.name}' with ${role.permissions.length} permissions`,
      module: 'roles'
    }).catch(() => {});
    res.json({ success: true, role });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit role
router.post('/api/roles/:id/edit', async (req, res) => {
  const { name, description, permission_ids, status } = req.body;
  try {
    const role = await updateRole(req.params.id, { name, description, permission_ids, status });
    await logActivity(req, {
      userId: req.session.user_id,
      action: `Updated role '${role.name}'`,
      module: 'roles'
    }).catch(() => {});
    res.json({ success: true, role });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Clone role
router.post('/api/roles/:id/clone', async (req, res) => {
  const { new_name, new_description } = req.body;
  try {
    const cloned = await cloneRole(req.params.id, { newName: new_name, newDescription: new_description });
    await logActivity(req, {
      userId: req.session.user_id,
      action: `Cloned role #${req.params.id} into '${cloned.name}'`,
      module: 'roles'
    }).catch(() => {});
    res.json({ success: true, role: cloned });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete role
router.post('/api/roles/:id/delete', async (req, res) => {
  try {
    const result = await deleteRole(req.params.id);
    await logActivity(req, {
      userId: req.session.user_id,
      action: `Deleted custom role #${req.params.id}`,
      module: 'roles'
    }).catch(() => {});
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Toggle role active/inactive
router.post('/api/roles/:id/toggle-status', async (req, res) => {
  try {
    const role = await getRoleById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    const newStatus = role.status === 'active' ? 'inactive' : 'active';
    const updated = await updateRole(req.params.id, { status: newStatus });
    res.json({ success: true, role: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  BOOK MANAGEMENT
// ─────────────────────────────────────────────
router.get('/books', async (req, res) => {
  const { school_code, search, banned, page = 1, limit = 50 } = req.query;
  try {
    let where = '1=1';
    let params = [];
    if (school_code) { params.push(school_code); where += ` AND school_code = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (title LIKE $${params.length} OR author LIKE $${params.length} OR isbn LIKE $${params.length} OR barcode_id LIKE $${params.length})`;
    }
    if (banned !== undefined && banned !== '') {
      params.push(banned === 'true' ? '1' : '0');
      where += ` AND is_banned = $${params.length}`;
    }
    const offset = (safeInt(page, 1) - 1) * safeInt(limit, 50);
    params.push(safeInt(limit, 50)); params.push(offset);
    const result = await db.query(
      `SELECT id, title, author, genre, isbn, publisher, barcode_id, school_code,
              total_copies, available_copies, is_banned, shelf_location, category, language, cover_url
       FROM books WHERE ${where} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countParams = params.slice(0, -2);
    const countR = await db.query(`SELECT COUNT(*) as c FROM books WHERE ${where}`, countParams);
    res.json({ success: true, books: result.rows || [], total: safeInt(countR.rows[0]?.c || countR.rows[0]?.['COUNT(*)']) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/books/:id/edit', async (req, res) => {
  const { id } = req.params;
  const { title, author, genre, isbn, publisher, shelf_location, category, language, description, total_copies } = req.body;
  try {
    await db.query(
      `UPDATE books SET title=$1, author=$2, genre=$3, isbn=$4, publisher=$5,
       shelf_location=$6, category=$7, language=$8, description=$9, total_copies=$10 WHERE id=$11`,
      [title, author, genre || null, isbn || null, publisher || null,
       shelf_location || null, category || null, language || null, description || null,
       safeInt(total_copies, 1), id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/books/:id/delete', async (req, res) => {
  try {
    await db.query('DELETE FROM books WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/books/:id/toggle-ban', async (req, res) => {
  const { id } = req.params;
  try {
    const cur = await db.query('SELECT is_banned FROM books WHERE id=$1', [id]);
    const current = cur.rows[0]?.is_banned;
    const newBan = (current === '1' || current === 1) ? '0' : '1';
    await db.query('UPDATE books SET is_banned=$1 WHERE id=$2', [newBan, id]);
    res.json({ success: true, is_banned: newBan === '1' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  TRANSACTIONS
// ─────────────────────────────────────────────
router.get('/transactions', async (req, res) => {
  const { school_code, status, page = 1, limit = 50 } = req.query;
  try {
    let where = '1=1';
    let params = [];
    if (school_code) { params.push(school_code); where += ` AND t.school_code = $${params.length}`; }
    if (status) { params.push(status); where += ` AND t.status = $${params.length}`; }
    const offset = (safeInt(page, 1) - 1) * safeInt(limit, 50);
    params.push(safeInt(limit, 50)); params.push(offset);
    const result = await db.query(
      `SELECT t.*, u.name as user_name, u.phone as user_phone, b.title as book_title, b.author as book_author
       FROM transactions t
       LEFT JOIN users u ON u.id = t.user_id
       LEFT JOIN books b ON b.id = t.book_id
       WHERE ${where} ORDER BY t.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countParams = params.slice(0, -2);
    const countR = await db.query(`SELECT COUNT(*) as c FROM transactions t WHERE ${where}`, countParams);
    res.json({ success: true, transactions: result.rows || [], total: safeInt(countR.rows[0]?.c || countR.rows[0]?.['COUNT(*)']) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  DIGITAL CONTENT MODERATION
// ─────────────────────────────────────────────
router.get('/digital-content', async (req, res) => {
  const { status, school_code, page = 1, limit = 50 } = req.query;
  try {
    let where = '1=1';
    let params = [];
    if (status) { params.push(status); where += ` AND dc.status = $${params.length}`; }
    if (school_code) { params.push(school_code); where += ` AND dc.school_code = $${params.length}`; }
    const offset = (safeInt(page, 1) - 1) * safeInt(limit, 50);
    params.push(safeInt(limit, 50)); params.push(offset);
    const result = await db.query(
      `SELECT dc.*, u.name as uploader_name, u.phone as uploader_phone
       FROM digital_content dc
       LEFT JOIN users u ON u.id = dc.student_id
       WHERE ${where} ORDER BY dc.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countParams = params.slice(0, -2);
    const countR = await db.query(`SELECT COUNT(*) as c FROM digital_content dc WHERE ${where}`, countParams);
    res.json({ success: true, content: result.rows || [], total: safeInt(countR.rows[0]?.c || countR.rows[0]?.['COUNT(*)']) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/digital-content/:id/approve', async (req, res) => {
  try {
    await db.query("UPDATE digital_content SET status='approved', rejection_reason=NULL WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/digital-content/:id/reject', async (req, res) => {
  const { reason } = req.body;
  try {
    await db.query("UPDATE digital_content SET status='rejected', rejection_reason=$1 WHERE id=$2", [reason || 'Rejected by admin', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/digital-content/:id/delete', async (req, res) => {
  try {
    await db.query('DELETE FROM digital_content WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy global-content routes
router.get('/global-content', async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM digital_content WHERE school_code='GLOBAL'");
    res.json({ success: true, content: result.rows || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/global-content/add', async (req, res) => {
  const { title, description, url, type } = req.body;
  try {
    await db.query("INSERT INTO digital_content (title, description, file_url, category, school_code, status) VALUES ($1,$2,$3,$4,'GLOBAL','approved')",
      [title, description || null, url || null, type || 'link']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/global-content/remove/:id', async (req, res) => {
  try {
    await db.query("DELETE FROM digital_content WHERE id=$1 AND school_code='GLOBAL'", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  NOTIFICATIONS
// ─────────────────────────────────────────────
router.post('/notify', async (req, res) => {
  const { title, message, type = 'info', scope, school_code, user_id, role } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  const io = req.app.get('io');
  const finalTitle = title || 'Librika Notification';

  try {
    let inserted = 0;
    if (scope === 'all') {
      const users = await db.query('SELECT id, school_code FROM users');
      inserted = (users.rows || []).length;
      await notificationService.notifyAll({
        io,
        title: finalTitle,
        message,
        type,
        url: '/student'
      });
    } else if (scope === 'school' && school_code) {
      const users = await db.query('SELECT id, school_code FROM users WHERE school_code=$1', [school_code]);
      inserted = (users.rows || []).length;
      await notificationService.notifySchool({
        io,
        schoolCode: school_code,
        title: finalTitle,
        message,
        type,
        url: '/student'
      });
    } else if (scope === 'role' && role) {
      const users = await db.query('SELECT id, school_code FROM users WHERE role=$1', [role]);
      inserted = (users.rows || []).length;
      await notificationService.notifyRole({
        io,
        role,
        title: finalTitle,
        message,
        type,
        url: '/student'
      });
    } else if (scope === 'user' && user_id) {
      const u = await db.query('SELECT id, school_code FROM users WHERE id=$1', [user_id]);
      if (u.rows[0]) {
        inserted = 1;
        await notificationService.notifyUser({
          io,
          userId: u.rows[0].id,
          schoolCode: u.rows[0].school_code || 'GLOBAL',
          title: finalTitle,
          message,
          type,
          url: '/student'
        });
      }
    } else {
      return res.status(400).json({ error: 'Invalid scope' });
    }
    res.json({ success: true, sent_to: inserted });
  } catch (err) {
    console.error('[/super-admin/notify] Error broadcasting:', err);
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────
//  AUDIT LOGS
// ─────────────────────────────────────────────
router.get('/audit-logs', async (req, res) => { await ensureSecurityTables();
  const { school_code, module, search, page = 1, limit = 50 } = req.query;
  try {
    let where = '1=1';
    let params = [];
    if (school_code) { params.push(school_code); where += ` AND l.school_code = $${params.length}`; }
    if (module) { params.push(module); where += ` AND l.module = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (l.action LIKE $${params.length} OR l.ip_address LIKE $${params.length})`;
    }
    const offset = (safeInt(page, 1) - 1) * safeInt(limit, 50);
    params.push(safeInt(limit, 50)); params.push(offset);
    const result = await db.query(
      `SELECT l.*, u.name as user_name, u.role as user_role
       FROM logs l
       LEFT JOIN users u ON u.id = l.user_id
       WHERE ${where} ORDER BY l.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countParams = params.slice(0, -2);
    const countR = await db.query(`SELECT COUNT(*) as c FROM logs l WHERE ${where}`, countParams);
    res.json({ success: true, logs: result.rows || [], total: safeInt(countR.rows[0]?.c || countR.rows[0]?.['COUNT(*)']) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  SYSTEM SETTINGS
// ─────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    res.json(await getAllSettings());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', async (req, res) => {
  // Accept both old and new param names
  const key = req.body.setting_key ?? req.body.key;
  const value = req.body.setting_value ?? req.body.value;
  if (!key) return res.status(400).json({ error: 'key required' });
  const ok = await setSetting(key, value);
  res.json({ success: ok });
});

router.post('/toggle-maintenance', async (req, res) => {
  try {
    const all = await getAllSettings();
    const current = all.maintenance_mode || 'false';
    const newVal = String(current) === 'true' ? 'false' : 'true';
    await setSetting('maintenance_mode', newVal);
    res.json({ success: true, maintenance_mode: newVal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/system-health', async (req, res) => {
  try {
    const dbCheck = await db.query('SELECT 1 as ok').then(() => 'ok').catch(() => 'error');
    const sessionCount = await db.query('SELECT COUNT(*) as c FROM sessions').then(r => safeInt(r.rows[0]?.c || 0)).catch(() => 0);
    const logCount = await db.query('SELECT COUNT(*) as c FROM logs').then(r => safeInt(r.rows[0]?.c || 0)).catch(() => 0);
    res.json({
      success: true,
      db_status: dbCheck,
      uptime_seconds: process.uptime(),
      memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      sessions: sessionCount,
      total_logs: logCount,
      node_version: process.version,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  MASTER AUTH
// ─────────────────────────────────────────────
router.post('/master-login', async (req, res) => {
  const { user_id } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE id=$1', [user_id]);
    if (!(result.rows || []).length) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    req.session.user_id = user.id;
    req.session.username = user.phone || user.admission_no;
    req.session.name = user.name;
    req.session.role = user.role;
    req.session.school_code = user.school_code;
    res.json({ success: true, redirect: getRoleDashboard(user.role), role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  ADVERTISEMENT MANAGEMENT
router.post(['/notifications/read-all', '/api/notifications/read-all'], async (req, res) => {
  try {
    await ensureSecurityTables();
    await db.query('UPDATE notifications SET is_read = 1');
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
//  ADVERTISEMENT & E-LIBRARY TICKER CMS
// ─────────────────────────────────────────────
router.get('/ads-data', async (req, res) => {
  try {
    await ensureSecurityTables();
    const [adsResult, schoolsResult] = await Promise.all([
      db.query(`SELECT *,
        (CASE 
          WHEN is_active = 0 OR status = 'PAUSED' OR status = 'inactive' THEN 'PAUSED'
          WHEN status = 'DRAFT' OR status = 'draft' THEN 'DRAFT'
          WHEN end_time IS NOT NULL AND end_time < NOW() THEN 'EXPIRED'
          WHEN start_time IS NOT NULL AND start_time > NOW() THEN 'SCHEDULED'
          ELSE 'ACTIVE'
        END) as computed_status,
        ROUND(CASE WHEN impressions > 0 THEN (clicks*100.0/impressions) ELSE 0 END, 2) as ctr
        FROM advertisements 
        ORDER BY display_order ASC, priority DESC, created_at DESC`),
      db.query('SELECT school_code, name FROM schools ORDER BY name ASC').catch(() => ({ rows: [] }))
    ]);

    const advertisements = adsResult.rows || [];
    const stats = {
      total: advertisements.length,
      active: advertisements.filter(a => a.computed_status === 'ACTIVE').length,
      scheduled: advertisements.filter(a => a.computed_status === 'SCHEDULED').length,
      expired: advertisements.filter(a => a.computed_status === 'EXPIRED').length,
      paused: advertisements.filter(a => a.computed_status === 'PAUSED' || a.computed_status === 'DRAFT').length
    };

    res.json({ 
      success: true, 
      advertisements, 
      stats, 
      schools: schoolsResult.rows || [] 
    });
  } catch (err) {
    console.error('Fetch ads-data error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ads/create', adUpload.single('media_file'), async (req, res) => {
  let {
    title, subtitle, description, cta_text, target_url, destination_url,
    image_url, bg_gradient, start_time, end_time, status, priority,
    target_section, type, content_text, category, source,
    target_type, school_code, display_order, media_url
  } = req.body;

  try {
    await ensureSecurityTables();
    let finalMediaUrl = (media_url && String(media_url).trim()) || (image_url && String(image_url).trim()) || null;
    let thumbnailUrl = null;

    if (req.file) {
      finalMediaUrl = `/uploads/ads/${req.file.filename}`;
      const ext = path.extname(req.file.filename).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        thumbnailUrl = finalMediaUrl;
      }
    }

    const adType = (type || 'BANNER').toUpperCase();
    const adTargetType = (target_type || 'ALL_SCHOOLS').toUpperCase();
    const cleanStart = (start_time && String(start_time).trim()) ? String(start_time).replace('T', ' ') : null;
    const cleanEnd = (end_time && String(end_time).trim()) ? String(end_time).replace('T', ' ') : null;
    const finalUrl = (destination_url && String(destination_url).trim()) || (target_url && String(target_url).trim()) || '#';
    const finalStatus = (status || 'ACTIVE').toUpperCase();
    const isActive = (finalStatus === 'ACTIVE' || finalStatus === 'SCHEDULED') ? 1 : 0;

    await db.query(
      `INSERT INTO advertisements (
        title, subtitle, description, cta_text, target_url, image_url,
        media_url, thumbnail_url, type, content_text, category, source,
        target_type, school_code, display_order, bg_gradient,
        start_time, end_time, status, is_active, priority, target_section
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
      [
        title || (adType === 'INTERESTING_FACT' ? (category || 'Did You Know?') : 'Announcement'),
        subtitle || null,
        description || null,
        cta_text || (adType === 'INTERESTING_FACT' ? 'Read Fact' : 'Explore Now'),
        finalUrl,
        finalMediaUrl,
        finalMediaUrl,
        thumbnailUrl,
        adType,
        content_text || description || null,
        category || null,
        source || null,
        adTargetType,
        adTargetType === 'SPECIFIC_SCHOOL' ? school_code : null,
        safeInt(display_order, 0),
        bg_gradient || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        cleanStart,
        cleanEnd,
        finalStatus,
        isActive,
        safeInt(priority, 1),
        target_section || 'all'
      ]
    );

    await logActivity(req, {
      action: `Created advertisement: "${title || content_text || 'Item'}" [${adType}]`,
      module: 'marketing'
    });

    res.json({ success: true, message: 'Advertisement created successfully' });
  } catch (err) {
    console.error('Create ad error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ads/edit/:id', adUpload.single('media_file'), async (req, res) => {
  let {
    title, subtitle, description, cta_text, target_url, destination_url,
    image_url, bg_gradient, start_time, end_time, status, priority,
    target_section, type, content_text, category, source,
    target_type, school_code, display_order, media_url
  } = req.body;

  try {
    await ensureSecurityTables();
    let finalMediaUrl = (media_url && String(media_url).trim()) || (image_url && String(image_url).trim()) || null;
    let thumbnailUrl = null;

    if (req.file) {
      finalMediaUrl = `/uploads/ads/${req.file.filename}`;
      const ext = path.extname(req.file.filename).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        thumbnailUrl = finalMediaUrl;
      }
    }

    const adType = (type || 'BANNER').toUpperCase();
    const adTargetType = (target_type || 'ALL_SCHOOLS').toUpperCase();
    const cleanStart = (start_time && String(start_time).trim()) ? String(start_time).replace('T', ' ') : null;
    const cleanEnd = (end_time && String(end_time).trim()) ? String(end_time).replace('T', ' ') : null;
    const finalUrl = (destination_url && String(destination_url).trim()) || (target_url && String(target_url).trim()) || '#';
    const finalStatus = (status || 'ACTIVE').toUpperCase();
    const isActive = (finalStatus === 'ACTIVE' || finalStatus === 'SCHEDULED') ? 1 : 0;

    // Fetch existing if no new media supplied
    if (!finalMediaUrl) {
      const existing = await db.query('SELECT media_url, thumbnail_url, image_url FROM advertisements WHERE id = $1', [req.params.id]);
      if (existing.rows && existing.rows[0]) {
        finalMediaUrl = existing.rows[0].media_url || existing.rows[0].image_url || null;
        thumbnailUrl = existing.rows[0].thumbnail_url || null;
      }
    }

    await db.query(
      `UPDATE advertisements SET
         title = $1, subtitle = $2, description = $3, cta_text = $4, target_url = $5,
         image_url = $6, media_url = $7, thumbnail_url = $8, type = $9,
         content_text = $10, category = $11, source = $12, target_type = $13,
         school_code = $14, display_order = $15, bg_gradient = $16,
         start_time = $17, end_time = $18, status = $19, is_active = $20,
         priority = $21, target_section = $22
       WHERE id = $23`,
      [
        title || (adType === 'INTERESTING_FACT' ? (category || 'Did You Know?') : 'Announcement'),
        subtitle || null,
        description || null,
        cta_text || (adType === 'INTERESTING_FACT' ? 'Read Fact' : 'Explore Now'),
        finalUrl,
        finalMediaUrl,
        finalMediaUrl,
        thumbnailUrl,
        adType,
        content_text || description || null,
        category || null,
        source || null,
        adTargetType,
        adTargetType === 'SPECIFIC_SCHOOL' ? school_code : null,
        safeInt(display_order, 0),
        bg_gradient || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        cleanStart,
        cleanEnd,
        finalStatus,
        isActive,
        safeInt(priority, 1),
        target_section || 'all',
        req.params.id
      ]
    );

    await logActivity(req, {
      action: `Updated advertisement ID ${req.params.id} ("${title || content_text || 'Item'}")`,
      module: 'marketing'
    });

    res.json({ success: true, message: 'Advertisement updated successfully' });
  } catch (err) {
    console.error('Update ad error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ads/toggle/:id', async (req, res) => {
  try {
    await ensureSecurityTables();
    const existing = await db.query('SELECT status, is_active FROM advertisements WHERE id = $1', [req.params.id]);
    if (!existing.rows || existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Advertisement not found' });
    }
    const currentStatus = (existing.rows[0].status || '').toUpperCase();
    const isPaused = currentStatus === 'PAUSED' || currentStatus === 'INACTIVE' || existing.rows[0].is_active === 0;

    const newStatus = isPaused ? 'ACTIVE' : 'PAUSED';
    const newIsActive = isPaused ? 1 : 0;

    await db.query('UPDATE advertisements SET status = $1, is_active = $2 WHERE id = $3', [newStatus, newIsActive, req.params.id]);

    await logActivity(req, {
      action: `${isPaused ? 'Resumed' : 'Paused'} advertisement ID ${req.params.id}`,
      module: 'marketing'
    });

    res.json({ success: true, newStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ads/delete/:id', async (req, res) => {
  try {
    await ensureSecurityTables();
    await db.query('DELETE FROM advertisements WHERE id = $1', [req.params.id]);
    await logActivity(req, {
      action: `Deleted advertisement ID ${req.params.id}`,
      module: 'marketing'
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
//  CSV EXPORTS
// ─────────────────────────────────────────────
router.get('/export-report', async (req, res) => {
  try {
    const schools = await db.query('SELECT school_code, name FROM schools');
    let csv = 'School Code,School Name,User Count,Book Count,Transactions\n';
    for (const s of (schools.rows || [])) {
      const [uR, bR, tR] = await Promise.all([
        db.query('SELECT COUNT(*) as c FROM users WHERE school_code=$1', [s.school_code]),
        db.query('SELECT COUNT(*) as c FROM books WHERE school_code=$1', [s.school_code]),
        db.query('SELECT COUNT(*) as c FROM transactions WHERE school_code=$1', [s.school_code])
      ]);
      const u = safeInt(uR.rows[0]?.c || uR.rows[0]?.['COUNT(*)']);
      const b = safeInt(bR.rows[0]?.c || bR.rows[0]?.['COUNT(*)']);
      const t = safeInt(tR.rows[0]?.c || tR.rows[0]?.['COUNT(*)']);
      csv += `"${s.school_code}","${s.name}","${u}","${b}","${t}"\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=schools_report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).send('Export Error: ' + err.message);
  }
});

router.get('/export/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, phone, email, role, school_code, class, section, is_banned, admission_no FROM users ORDER BY school_code, role, name');
    const headers = ['id', 'name', 'phone', 'email', 'role', 'school_code', 'class', 'section', 'is_banned', 'admission_no'];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
    res.send(buildCSV(headers, result.rows || []));
  } catch (err) {
    res.status(500).send('Export Error');
  }
});

router.get('/export/books', async (req, res) => {
  try {
    const result = await db.query('SELECT id, title, author, genre, isbn, publisher, barcode_id, school_code, total_copies, available_copies, shelf_location, category FROM books ORDER BY school_code, title');
    const headers = ['id', 'title', 'author', 'genre', 'isbn', 'publisher', 'barcode_id', 'school_code', 'total_copies', 'available_copies', 'shelf_location', 'category'];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=books_export.csv');
    res.send(buildCSV(headers, result.rows || []));
  } catch (err) {
    res.status(500).send('Export Error');
  }
});

router.get('/export/transactions', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.id, u.name as user_name, u.phone, b.title as book_title, b.author,
              t.issue_date, t.due_date, t.return_date, t.fine, t.status, t.school_code
       FROM transactions t
       LEFT JOIN users u ON u.id = t.user_id
       LEFT JOIN books b ON b.id = t.book_id
       ORDER BY t.id DESC`
    );
    const headers = ['id', 'user_name', 'phone', 'book_title', 'author', 'issue_date', 'due_date', 'return_date', 'fine', 'status', 'school_code'];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions_export.csv');
    res.send(buildCSV(headers, result.rows || []));
  } catch (err) {
    res.status(500).send('Export Error');
  }
});

router.get('/export/fines', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.id, u.name as user_name, u.phone, b.title as book_title,
              t.due_date, t.return_date, t.fine, t.status, t.school_code
       FROM transactions t
       LEFT JOIN users u ON u.id = t.user_id
       LEFT JOIN books b ON b.id = t.book_id
       WHERE t.fine > 0 OR (t.status='issued' AND t.due_date < NOW())
       ORDER BY t.fine DESC`
    );
    const headers = ['id', 'user_name', 'phone', 'book_title', 'due_date', 'return_date', 'fine', 'status', 'school_code'];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fines_export.csv');
    res.send(buildCSV(headers, result.rows || []));
  } catch (err) {
    res.status(500).send('Export Error');
  }
});

// ═════════════════════════════════════════════════════════════════════
//  PHASE 2 — COMPLETE CRUD ACROSS ALL ENTITIES
// ═════════════════════════════════════════════════════════════════════

// ─── School Admins ───────────────────────────────────────────────────
router.get('/users-by-role/:role', async (req, res) => {
  const { role } = req.params;
  const { school_code, banned, search, page = 1, limit = 50 } = req.query;
  try {
    let where = 'role = $1';
    const params = [role];
    if (school_code) { params.push(school_code); where += ` AND school_code = $${params.length}`; }
    if (banned !== undefined && banned !== '') {
      params.push(banned === 'true' ? '1' : '0');
      where += ` AND is_banned = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (name LIKE $${params.length} OR phone LIKE $${params.length} OR email LIKE $${params.length})`;
    }
    const offset = (safeInt(page, 1) - 1) * safeInt(limit, 50);
    params.push(safeInt(limit, 50)); params.push(offset);
    const result = await db.query(
      `SELECT id, name, phone, email, role, school_code, class, section, stream,
              is_banned, status, admission_no, dob, created_at, last_login_at
       FROM users WHERE ${where} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countParams = params.slice(0, -2);
    const countR = await db.query(`SELECT COUNT(*) as c FROM users WHERE ${where}`, countParams);
    res.json({ success: true, users: result.rows || [], total: safeInt(countR.rows[0]?.c || countR.rows[0]?.['COUNT(*)']) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Parents (alias for users-by-role filter) ────────────────────────
// Parent CRUD reuses the same handlers — handled by /users routes.

// ─── Books: create, bulk upload, archive, restore ────────────────────
router.post('/books/create', upload.single('cover'), async (req, res) => {
  const {
    title, author, genre, isbn, publisher, shelf_location, category,
    language, description, total_copies, school_code, barcode_id, subject, pages
  } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const coverUrl = req.file ? `/static/uploads/sa/${req.file.filename}` : null;
    const result = await db.query(
      `INSERT INTO books (title, author, genre, isbn, publisher, shelf_location, category,
                           language, description, total_copies, available_copies, school_code,
                           barcode_id, subject, pages, cover_url, book_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11,$12,$13,$14,$15,'physical')`,
      [title, author || null, genre || null, isbn || null, publisher || null,
       shelf_location || null, category || null, language || null, description || null,
       safeInt(total_copies, 1), school_code || null,
       barcode_id || null, subject || null, safeInt(pages, 120), coverUrl]
    );
    res.json({ success: true, id: result.lastId || (result.rows && result.rows[0] && result.rows[0].id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/books/bulk-upload', upload.single('csv'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file required' });
  let records;
  try {
    const raw = fs.readFileSync(req.file.path, 'utf8');
    records = await parseCsvText(raw);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid CSV: ' + err.message });
  }
  let inserted = 0, failed = 0;
  const errors = [];
  for (const row of records) {
    try {
      await db.query(
        `INSERT INTO books (title, author, genre, isbn, publisher, shelf_location, category,
                             language, description, total_copies, available_copies,
                             school_code, barcode_id, subject, pages, book_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11,$12,$13,$14,'physical')`,
        [
          row.title || row.Title || null,
          row.author || row.Author || null,
          row.genre || row.Genre || null,
          row.isbn || row.ISBN || null,
          row.publisher || row.Publisher || null,
          row.shelf_location || row.Shelf || null,
          row.category || row.Category || null,
          row.language || row.Language || 'English',
          row.description || null,
          safeInt(row.total_copies || row.Quantity || 1, 1),
          row.school_code || row.SchoolCode || null,
          row.barcode_id || row.Barcode || null,
          row.subject || row.Subject || null,
          safeInt(row.pages || row.Pages, 120),
        ]
      );
      inserted++;
    } catch (err) {
      failed++;
      errors.push({ row: row.title || row.Title, error: err.message });
    }
  }
  // Cleanup uploaded file
  try { fs.unlinkSync(req.file.path); } catch (e) {}
  res.json({ success: true, inserted, failed, errors: errors.slice(0, 10) });
});

router.post('/books/:id/archive', async (req, res) => {
  try {
    await db.query(`UPDATE books SET is_banned = '1' WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/books/:id/restore', async (req, res) => {
  try {
    await db.query(`UPDATE books SET is_banned = '0' WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Digital / Community / Global Library ─────────────────────────────
function digitalScopeFilter(scope) {
  // 'community' = school_code NOT NULL AND != 'GLOBAL'
  // 'global'    = school_code = 'GLOBAL'
  // 'all'       = everything
  if (scope === 'global') return { clause: "school_code = 'GLOBAL'", params: [] };
  if (scope === 'community') return { clause: "(school_code IS NOT NULL AND school_code <> 'GLOBAL')", params: [] };
  return { clause: '1=1', params: [] };
}

router.get('/digital-content-list', async (req, res) => {
  const { scope = 'all', status, school_code, search, page = 1, limit = 50 } = req.query;
  try {
    let where = '1=1';
    const params = [];
    const scopeF = digitalScopeFilter(scope);
    where += ` AND ${scopeF.clause}`;
    if (status) { params.push(status); where += ` AND dc.status = $${params.length}`; }
    if (school_code) { params.push(school_code); where += ` AND dc.school_code = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (dc.title LIKE $${params.length} OR dc.tags LIKE $${params.length})`;
    }
    const offset = (safeInt(page, 1) - 1) * safeInt(limit, 50);
    params.push(safeInt(limit, 50)); params.push(offset);
    const result = await db.query(
      `SELECT dc.*, u.name as uploader_name, u.phone as uploader_phone
       FROM digital_content dc
       LEFT JOIN users u ON u.id = dc.student_id
       WHERE ${where} ORDER BY dc.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countParams = params.slice(0, -2);
    const countR = await db.query(`SELECT COUNT(*) as c FROM digital_content dc WHERE ${where}`, countParams);
    res.json({ success: true, content: result.rows || [], total: safeInt(countR.rows[0]?.c || countR.rows[0]?.['COUNT(*)']) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/digital-content/create', upload.single('cover'), async (req, res) => {
  const { title, category, description, subject, class: cls, tags, file_url, status, featured, school_code } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const coverUrl = req.file ? `/static/uploads/sa/${req.file.filename}` : null;
    const result = await db.query(
      `INSERT INTO digital_content
        (title, category, description, subject, class, tags, cover_url, file_url,
         status, featured, school_code, views, downloads, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      [title, category || null, description || null, subject || null, cls || null,
       tags || null, coverUrl, file_url || null,
       status || 'approved', featured ? 1 : 0, school_code || null]
    );
    res.json({ success: true, id: result.lastId || (result.rows && result.rows[0] && result.rows[0].id) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/digital-content/:id/edit', async (req, res) => {
  const { id } = req.params;
  const { title, category, description, subject, class: cls, tags, file_url, status, featured, school_code } = req.body;
  try {
    await db.query(
      `UPDATE digital_content SET
        title=$1, category=$2, description=$3, subject=$4, class=$5, tags=$6,
        file_url=$7, status=$8, featured=$9, school_code=$10, updated_at=CURRENT_TIMESTAMP
       WHERE id=$11`,
      [title, category || null, description || null, subject || null, cls || null,
       tags || null, file_url || null, status || 'approved',
       featured ? 1 : 0, school_code || null, id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/digital-content/:id/feature', async (req, res) => {
  try {
    await db.query(`UPDATE digital_content SET featured = 1 - COALESCE(featured, 0) WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Categories & Subjects ───────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const [books, dc] = await Promise.all([
      db.query(`SELECT category as name, COUNT(*) as count FROM books WHERE category IS NOT NULL AND category <> '' GROUP BY category ORDER BY name`),
      db.query(`SELECT category as name, COUNT(*) as count FROM digital_content WHERE category IS NOT NULL AND category <> '' GROUP BY category ORDER BY name`),
    ]);
    const subjects = await db.query(`SELECT subject as name, COUNT(*) as count FROM books WHERE subject IS NOT NULL AND subject <> '' GROUP BY subject ORDER BY name`);
    res.json({ success: true, book_categories: books.rows || [], digital_categories: dc.rows || [], subjects: subjects.rows || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/categories/rename', async (req, res) => {
  const { entity, from, to } = req.body;
  if (!entity || !from || !to) return res.status(400).json({ error: 'entity, from, to required' });
  try {
    const table = entity === 'digital' ? 'digital_content' : 'books';
    const col = entity === 'subject' ? 'subject' : 'category';
    const r = await db.query(`UPDATE ${table} SET ${col} = $1 WHERE ${col} = $2`, [to, from]);
    res.json({ success: true, updated: r.rowCount || 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create a new category/subject (applies to books.category, books.subject or digital_content.category).
// Useful for pre-seeding taxonomy before any books use it.
router.post('/categories/create', async (req, res) => {
  const { entity, name } = req.body;
  if (!entity || !name) return res.status(400).json({ error: 'entity and name required' });
  try {
    const table = entity === 'digital' ? 'digital_content' : 'books';
    const col = entity === 'subject' ? 'subject' : 'category';
    // Attach the new value to a NULL placeholder row? No — instead we validate the
    // target table exists, and just acknowledge. Actual rows appear once used.
    await db.query(`SELECT 1 FROM ${table} WHERE 1=0`);
    res.json({ success: true, message: `${name} added to ${entity} taxonomy` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete a category/subject value from every row that uses it.
router.post('/categories/delete', async (req, res) => {
  const { entity, name } = req.body;
  if (!entity || !name) return res.status(400).json({ error: 'entity and name required' });
  try {
    const table = entity === 'digital' ? 'digital_content' : 'books';
    const col = entity === 'subject' ? 'subject' : 'category';
    const r = await db.query(`UPDATE ${table} SET ${col} = NULL WHERE ${col} = $1`, [name]);
    res.json({ success: true, cleared: r.rowCount || 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Reading Goals ───────────────────────────────────────────────────
router.get('/reading-goals', async (req, res) => {
  try {
    const r = await db.query(`SELECT * FROM reading_goals ORDER BY created_at DESC`);
    res.json({ success: true, goals: r.rows || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/reading-goals/create', async (req, res) => {
  const { school_code, role, target, period, description } = req.body;
  if (!target) return res.status(400).json({ error: 'target required' });
  try {
    await db.query(
      `INSERT INTO reading_goals (school_code, role, target, period, description, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP)`,
      [school_code || null, role || 'student', safeInt(target, 10), period || 'monthly',
       description || null, req.session.user_id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/reading-goals/:id/edit', async (req, res) => {
  const { school_code, role, target, period, description } = req.body;
  try {
    await db.query(
      `UPDATE reading_goals SET school_code=$1, role=$2, target=$3, period=$4, description=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6`,
      [school_code || null, role || 'student', safeInt(target, 10), period || 'monthly',
       description || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/reading-goals/:id/delete', async (req, res) => {
  try {
    await db.query(`DELETE FROM reading_goals WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Book Requests (reservations) ────────────────────────────────────
router.get('/book-requests', async (req, res) => {
  const { status, school_code, page = 1, limit = 50 } = req.query;
  try {
    let where = '1=1';
    const params = [];
    if (status) { params.push(status); where += ` AND r.status = $${params.length}`; }
    if (school_code) { params.push(school_code); where += ` AND r.school_code = $${params.length}`; }
    const offset = (safeInt(page, 1) - 1) * safeInt(limit, 50);
    params.push(safeInt(limit, 50)); params.push(offset);
    const r = await db.query(
      `SELECT r.*, u.name as user_name, u.phone as user_phone, b.title as book_title, b.author
       FROM reservations r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN books b ON b.id = r.book_id
       WHERE ${where} ORDER BY r.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countParams = params.slice(0, -2);
    const countR = await db.query(`SELECT COUNT(*) as c FROM reservations r WHERE ${where}`, countParams);
    res.json({ success: true, requests: r.rows || [], total: safeInt(countR.rows[0]?.c || countR.rows[0]?.['COUNT(*)']) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/book-requests/:id/edit', async (req, res) => {
  const { status } = req.body;
  try {
    await db.query(`UPDATE reservations SET status=$1 WHERE id=$2`, [status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/book-requests/:id/delete', async (req, res) => {
  try {
    await db.query(`DELETE FROM reservations WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Issued Books (transactions) ─────────────────────────────────────
router.get('/issued-books', async (req, res) => {
  const { school_code, status, page = 1, limit = 50 } = req.query;
  try {
    let where = '1=1';
    const params = [];
    if (school_code) { params.push(school_code); where += ` AND t.school_code = $${params.length}`; }
    if (status) { params.push(status); where += ` AND t.status = $${params.length}`; }
    const offset = (safeInt(page, 1) - 1) * safeInt(limit, 50);
    params.push(safeInt(limit, 50)); params.push(offset);
    const r = await db.query(
      `SELECT t.*, u.name as user_name, u.phone as user_phone, b.title as book_title, b.author as book_author
       FROM transactions t
       LEFT JOIN users u ON u.id = t.user_id
       LEFT JOIN books b ON b.id = t.book_id
       WHERE ${where} ORDER BY t.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countParams = params.slice(0, -2);
    const countR = await db.query(`SELECT COUNT(*) as c FROM transactions t WHERE ${where}`, countParams);
    res.json({ success: true, transactions: r.rows || [], total: safeInt(countR.rows[0]?.c || countR.rows[0]?.['COUNT(*)']) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/issued-books/:id/edit', async (req, res) => {
  const { id } = req.params;
  const { due_date, return_date, fine, status } = req.body;
  try {
    await db.query(
      `UPDATE transactions SET due_date=$1, return_date=$2, fine=$3, status=$4 WHERE id=$5`,
      [due_date || null, return_date || null, safeInt(fine, 0), status || 'issued', id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/issued-books/:id/delete', async (req, res) => {
  try {
    await db.query(`DELETE FROM transactions WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── RFID Records ────────────────────────────────────────────────────
router.get('/rfid', async (req, res) => {
  const { school_code, status, search, page = 1, limit = 50 } = req.query;
  try {
    let where = '1=1';
    const params = [];
    if (school_code) { params.push(school_code); where += ` AND r.school_code = $${params.length}`; }
    if (status) { params.push(status); where += ` AND r.status = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (r.rfid_tag LIKE $${params.length} OR r.accession_number LIKE $${params.length} OR r.barcode_id LIKE $${params.length})`;
    }
    const offset = (safeInt(page, 1) - 1) * safeInt(limit, 50);
    params.push(safeInt(limit, 50)); params.push(offset);
    const r = await db.query(
      `SELECT r.*, b.title as book_title, b.author as book_author
       FROM rfid_records r
       LEFT JOIN books b ON b.id = r.book_id
       WHERE ${where} ORDER BY r.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countParams = params.slice(0, -2);
    const countR = await db.query(`SELECT COUNT(*) as c FROM rfid_records r WHERE ${where}`, countParams);
    res.json({ success: true, records: r.rows || [], total: safeInt(countR.rows[0]?.c || countR.rows[0]?.['COUNT(*)']) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/rfid/create', async (req, res) => {
  const { rfid_tag, book_id, barcode_id, accession_number, shelf_location, school_code } = req.body;
  if (!rfid_tag) return res.status(400).json({ error: 'rfid_tag required' });
  try {
    await db.query(
      `INSERT INTO rfid_records (rfid_tag, book_id, barcode_id, accession_number, shelf_location, school_code, status)
       VALUES ($1,$2,$3,$4,$5,$6,'active')`,
      [rfid_tag, book_id || null, barcode_id || null, accession_number || null,
       shelf_location || null, school_code || null]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/rfid/:id/edit', async (req, res) => {
  const { rfid_tag, book_id, barcode_id, accession_number, shelf_location, status } = req.body;
  try {
    await db.query(
      `UPDATE rfid_records SET rfid_tag=$1, book_id=$2, barcode_id=$3, accession_number=$4, shelf_location=$5, status=$6 WHERE id=$7`,
      [rfid_tag, book_id || null, barcode_id || null, accession_number || null,
       shelf_location || null, status || 'active', req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/rfid/:id/delete', async (req, res) => {
  try {
    await db.query(`DELETE FROM rfid_records WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/rfid/scan/:tag', async (req, res) => {
  try {
    const r = await db.query(`SELECT * FROM rfid_records WHERE rfid_tag = $1`, [req.params.tag]);
    if (!(r.rows || []).length) return res.status(404).json({ error: 'RFID tag not found' });
    await db.query(
      `UPDATE rfid_records SET scan_count = scan_count + 1, last_scanned_at = NOW() WHERE rfid_tag = $1`,
      [req.params.tag]
    );
    res.json({ success: true, record: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═════════════════════════════════════════════════════════════════════
//  PHASE 3 — SUPER ADMIN CAPABILITIES
// ═════════════════════════════════════════════════════════════════════

// ─── A. User Management extras ───────────────────────────────────────
router.post('/users/:id/impersonate', async (req, res) => {
  const { id } = req.params;
  try {
    const r = await db.query('SELECT id, name, role, school_code, phone FROM users WHERE id = $1', [id]);
    if (!(r.rows || []).length) return res.status(404).json({ error: 'User not found' });
    const target = r.rows[0];

    // Save current SA context, swap session role to target
    req.session.impersonating_from = req.session.user_id;
    req.session.impersonator_name = req.session.name;
    req.session.impersonated_role = target.role;
    req.session.impersonated_name = target.name;
    req.session.user_id = target.id;
    req.session.name = target.name;
    req.session.role = target.role;
    req.session.school_code = target.school_code;
    req.session.username = target.phone;

    // Audit log
    await db.query(
      `INSERT INTO impersonation_log (impersonator_id, impersonated_id, started_at, ip_address)
       VALUES ($1, $2, NOW(), $3)`,
      [req.session.impersonating_from, id, req.ip || req.connection?.remoteAddress || 'unknown']
    );
    await db.query(
      `INSERT INTO logs (user_id, action, module, ip_address, school_code, created_at)
       VALUES ($1, $2, 'impersonation', $3, $4, NOW())`,
      [req.session.impersonating_from, `Started impersonating user ${id} (${target.name})`,
       req.ip || '', target.school_code || null]
    );
    res.json({ success: true, redirect: getRoleDashboard(target.role), role: target.role });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/impersonate/exit', async (req, res) => {
  try {
    if (!req.session.impersonating_from) return res.status(400).json({ error: 'Not impersonating' });
    const origId = req.session.impersonating_from;
    await db.query(
      `UPDATE impersonation_log SET ended_at = NOW()
       WHERE impersonator_id = $1 AND impersonated_id = $2 AND ended_at IS NULL
       ORDER BY id DESC LIMIT 1`,
      [origId, req.session.user_id]
    );
    // Restore original SA session
    const r = await db.query('SELECT id, name, role, school_code FROM users WHERE id = $1', [origId]);
    if (!(r.rows || []).length) {
      req.session.destroy(() => res.redirect('/login'));
      return;
    }
    const orig = r.rows[0];
    req.session.user_id = orig.id;
    req.session.name = orig.name;
    req.session.role = orig.role;
    req.session.school_code = orig.school_code;
    delete req.session.impersonating_from;
    delete req.session.impersonator_name;
    delete req.session.impersonated_role;
    delete req.session.impersonated_name;
    res.json({ success: true, redirect: '/super-admin' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/users/bulk-action', async (req, res) => {
  const { ids, action } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array required' });
  if (!action) return res.status(400).json({ error: 'action required' });
  try {
    let count = 0;
    for (const id of ids) {
      if (action === 'delete') {
        await db.query(`DELETE FROM users WHERE id = $1`, [id]);
        count++;
      } else if (action === 'ban') {
        await db.query(`UPDATE users SET is_banned = '1', status = 'suspended' WHERE id = $1`, [id]);
        count++;
      } else if (action === 'unban') {
        await db.query(`UPDATE users SET is_banned = '0', status = 'active' WHERE id = $1`, [id]);
        count++;
      } else if (action === 'force-logout') {
        await db.query(`UPDATE users SET session_token = NULL WHERE id = $1`, [id]);
        count++;
      }
    }
    res.json({ success: true, affected: count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/users/import', upload.single('csv'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file required' });
  let records;
  try {
    records = await parseCsvText(fs.readFileSync(req.file.path, 'utf8'));
  } catch (err) {
    return res.status(400).json({ error: 'Invalid CSV: ' + err.message });
  }
  let inserted = 0, failed = 0;
  const errors = [];
  for (const row of records) {
    try {
      const hashed = await bcrypt.hash(row.password || 'password123', 10);
      await db.query(
        `INSERT INTO users (name, phone, email, role, school_code, password, class, section, admission_no)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          row.name || row.Name,
          row.phone || row.Phone,
          row.email || row.Email || null,
          row.role || row.Role || 'student',
          row.school_code || row.SchoolCode || null,
          hashed,
          row.class || row.Class || null,
          row.section || row.Section || null,
          row.admission_no || row.AdmissionNo || null,
        ]
      );
      inserted++;
    } catch (err) {
      failed++;
      errors.push({ row: row.name || row.Phone, error: err.message });
    }
  }
  try { fs.unlinkSync(req.file.path); } catch (e) {}
  res.json({ success: true, inserted, failed, errors: errors.slice(0, 10) });
});

// ─── B. Security: audit log detail, login history, devices, 2FA, IP ─

// Advanced audit log filters
router.get('/audit-logs/advanced', async (req, res) => {
  const { school_code, module, action, severity, date_from, date_to, user_id, search, page = 1, limit = 50 } = req.query;
  try {
    let where = '1=1';
    const params = [];
    if (school_code) { params.push(school_code); where += ` AND l.school_code = $${params.length}`; }
    if (module) { params.push(module); where += ` AND l.module = $${params.length}`; }
    if (action) { params.push(`%${action}%`); where += ` AND l.action LIKE $${params.length}`; }
    if (user_id) { params.push(safeInt(user_id, 0)); where += ` AND l.user_id = $${params.length}`; }
    if (date_from) { params.push(date_from); where += ` AND l.created_at >= $${params.length}`; }
    if (date_to) { params.push(date_to); where += ` AND l.created_at <= $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (l.action LIKE $${params.length} OR l.ip_address LIKE $${params.length} OR l.module LIKE $${params.length})`;
    }
    const offset = (safeInt(page, 1) - 1) * safeInt(limit, 50);
    params.push(safeInt(limit, 50)); params.push(offset);
    const r = await db.query(
      `SELECT l.*, u.name as user_name, u.role as user_role
       FROM logs l
       LEFT JOIN users u ON u.id = l.user_id
       WHERE ${where} ORDER BY l.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countParams = params.slice(0, -2);
    const countR = await db.query(`SELECT COUNT(*) as c FROM logs l WHERE ${where}`, countParams);
    res.json({ success: true, logs: r.rows || [], total: safeInt(countR.rows[0]?.c || countR.rows[0]?.['COUNT(*)']) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/audit-logs/:id', async (req, res) => {
  try {
    const r = await db.query(
      `SELECT l.*, u.name as user_name, u.role as user_role, u.phone as user_phone, u.email as user_email
       FROM logs l LEFT JOIN users u ON u.id = l.user_id WHERE l.id = $1`,
      [req.params.id]
    );
    if (!(r.rows || []).length) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, log: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Login history
router.get('/login-history', async (req, res) => {
  await ensureSecurityTables();
  const { user_id, school_code, success, ip, date_from, date_to, timeframe = 'today', search, page = 1, limit = 50 } = req.query;
  try {
    let where = '1=1';
    const params = [];

    if (user_id) { params.push(safeInt(user_id, 0)); where += ` AND lh.user_id = $${params.length}`; }
    if (school_code) { params.push(school_code); where += ` AND lh.school_code = $${params.length}`; }
    if (success !== undefined && success !== '') {
      params.push(success === 'true' ? 1 : 0);
      where += ` AND lh.success = $${params.length}`;
    }
    if (ip) { params.push(`%${ip}%`); where += ` AND lh.ip_address LIKE $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (lh.email LIKE $${params.length} OR lh.phone LIKE $${params.length} OR u.name LIKE $${params.length} OR lh.ip_address LIKE $${params.length})`;
    }

    // Default to today unless 'all' or '7days' or custom dates are requested
    if (timeframe === 'today' && !date_from && !date_to) {
      const todayStr = new Date().toISOString().slice(0, 10);
      params.push(todayStr + ' 00:00:00');
      where += ` AND lh.created_at >= $${params.length}`;
    } else if (timeframe === '7days' && !date_from && !date_to) {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const sevenDaysStr = d.toISOString().slice(0, 10);
      params.push(sevenDaysStr + ' 00:00:00');
      where += ` AND lh.created_at >= $${params.length}`;
    }

    if (date_from) { params.push(date_from + ' 00:00:00'); where += ` AND lh.created_at >= $${params.length}`; }
    if (date_to) { params.push(date_to + ' 23:59:59'); where += ` AND lh.created_at <= $${params.length}`; }

    const offset = (safeInt(page, 1) - 1) * safeInt(limit, 50);
    params.push(safeInt(limit, 50)); params.push(offset);
    const r = await db.query(
      `SELECT lh.*, u.name as user_name FROM login_history lh
       LEFT JOIN users u ON u.id = lh.user_id
       WHERE ${where} ORDER BY lh.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countParams = params.slice(0, -2);
    const countR = await db.query(
      `SELECT COUNT(*) as c FROM login_history lh
       LEFT JOIN users u ON u.id = lh.user_id
       WHERE ${where}`,
      countParams
    );
    res.json({
      success: true,
      timeframe,
      history: r.rows || [],
      total: safeInt(countR.rows[0]?.c || countR.rows[0]?.['COUNT(*)'])
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Devices (active sessions) — read from sessions + student_devices
router.get('/devices', async (req, res) => {
  await ensureSecurityTables();
  const { user_id } = req.query;
  try {
    let sessions = [];
    const seenSids = new Set();

    if (db.poolMain || db.mysqlPool) {
      try {
        const r = await db.query(`SELECT * FROM sessions LIMIT 100`).catch(() => ({ rows: [] }));
        for (const row of (r.rows || [])) {
          const sid = row.session_id || row.sid;
          let sess = row.data || row.sess;
          if (typeof sess === 'string') { try { sess = JSON.parse(sess); } catch (e) {} }
          const expire = row.expires || row.expire;
          if (sess && (sess.user_id || sess.userId || (sess.passport && sess.passport.user))) {
            const uId = sess.user_id || sess.userId || (sess.passport && sess.passport.user);
            sessions.push({
              sid: String(sid),
              user_id: uId,
              user_name: sess.name || sess.user_name || 'User #' + uId,
              role: sess.role || 'user',
              ip: sess.ip || '',
              ua: sess.user_agent || '',
              expire: expire,
            });
            seenSids.add(String(sid));
          }
        }
      } catch (e) {}
    }

    // Always fetch active device records from student_devices
    try {
      const devRes = await db.query(`
        SELECT d.id, d.user_id, d.device_name, d.device_type, d.ip_address as ip, d.session_token as sid, d.user_agent as ua, d.last_active as expire,
               u.name as user_name, u.role
        FROM student_devices d
        LEFT JOIN users u ON u.id = d.user_id
        ORDER BY d.last_active DESC LIMIT 100
      `).catch(() => ({ rows: [] }));
      for (const d of (devRes.rows || [])) {
        const sidKey = String(d.sid || d.id);
        if (!seenSids.has(sidKey)) {
          sessions.push({
            sid: sidKey,
            user_id: d.user_id,
            user_name: d.user_name || 'Unknown',
            role: d.role || 'user',
            ip: d.ip || '',
            ua: `${d.device_name || ''} (${d.device_type || 'Web'})`,
            expire: d.expire
          });
          seenSids.add(sidKey);
        }
      }
    } catch (e) {}

    // Filter by user_id if requested
    if (user_id) sessions = sessions.filter(s => String(s.user_id) === String(user_id));
    res.json({ success: true, devices: sessions });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/devices/:sid/revoke', async (req, res) => {
  try {
    const sid = req.params.sid;
    await db.query(`DELETE FROM sessions WHERE session_id = $1 OR sid = $1`, [sid]).catch(() => {});
    await db.query(`DELETE FROM student_devices WHERE session_token = $1 OR CAST(id AS CHAR) = $1`, [sid]).catch(() => {});
    await logActivity(req, {
      action: 'Super-admin revoked session/device: ' + sid,
      module: 'security'
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2FA management
router.get('/two-factor/list', async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, name, phone, email, role, school_code, two_factor_enabled FROM users WHERE two_factor_enabled = 1 ORDER BY id DESC LIMIT 200`
    );
    res.json({ success: true, users: r.rows || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/users/:id/2fa', async (req, res) => {
  try {
    const r = await db.query(`SELECT id, two_factor_enabled FROM users WHERE id = $1`, [req.params.id]);
    if (!(r.rows || []).length) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, enabled: r.rows[0].two_factor_enabled });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/users/:id/2fa/disable', async (req, res) => {
  try {
    await db.query(`UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = $1`, [req.params.id]);
    await db.query(`DELETE FROM two_factor_backup_codes WHERE user_id = $1`, [req.params.id]).catch(() => {});
    await logActivity(req, {
      userId: req.params.id,
      action: '2FA disabled by super-admin for user #' + req.params.id,
      module: '2fa'
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// IP allowlist
router.get('/ip-allowlist', async (req, res) => { await ensureSecurityTables();
  try {
    const r = await db.query(`SELECT * FROM ip_allowlist ORDER BY created_at DESC`);
    res.json({ success: true, rules: r.rows || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/ip-allowlist/create', async (req, res) => {
  const { cidr, label, enabled } = req.body;
  if (!cidr) return res.status(400).json({ error: 'cidr required' });
  try {
    await db.query(
      `INSERT INTO ip_allowlist (cidr, label, enabled, created_by) VALUES ($1, $2, $3, $4)`,
      [cidr, label || null, enabled ? 1 : 0, req.session.user_id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/ip-allowlist/:id/edit', async (req, res) => {
  const { cidr, label, enabled } = req.body;
  try {
    await db.query(`UPDATE ip_allowlist SET cidr=$1, label=$2, enabled=$3 WHERE id=$4`,
      [cidr, label || null, enabled ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/ip-allowlist/:id/toggle', async (req, res) => {
  try {
    await db.query(`UPDATE ip_allowlist SET enabled = 1 - enabled WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/ip-allowlist/:id/delete', async (req, res) => {
  try {
    await db.query(`DELETE FROM ip_allowlist WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Role permissions defaults (read/write users.permissions JSON)
router.get('/role-permissions', async (req, res) => {
  try {
    const all = await getAllSettings();
    let value = {};
    if (all.role_permissions) {
      try { value = JSON.parse(all.role_permissions); } catch (e) {}
    }
    res.json({ success: true, permissions: value });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/role-permissions', async (req, res) => {
  const { permissions } = req.body;
  if (!permissions || typeof permissions !== 'object') return res.status(400).json({ error: 'permissions object required' });
  try {
    // Merge with existing so saving one role never wipes another role's permissions.
    const existing = await getAllSettings();
    let current = {};
    if (existing.role_permissions) {
      try { current = JSON.parse(existing.role_permissions) || {}; } catch (e) {}
    }
    const merged = Object.assign({}, current, permissions);
    await setSetting('role_permissions', JSON.stringify(merged));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── C. System Configuration (AI / Email / Storage / API Keys) ───────
const SETTINGS_GROUPS = {
  ai: {
    label: 'AI Search Configuration',
    keys: [
      'ai_provider', 'ai_model', 'ai_api_key', 'ai_temperature',
      'ai_max_tokens', 'ai_search_weight_genre', 'ai_search_weight_author',
      'ai_search_weight_popularity', 'ai_search_threshold',
    ],
    placeholders: {
      ai_provider: 'openai | gemini | nvidia | openrouter',
      ai_model: 'gpt-4o-mini | gemini-2.0-flash | llama-3.1-70b',
      ai_api_key: 'sk-...',
      ai_temperature: '0.7',
      ai_max_tokens: '512',
      ai_search_weight_genre: '0.3',
      ai_search_weight_author: '0.2',
      ai_search_weight_popularity: '0.1',
      ai_search_threshold: '0.6',
    },
  },
  email: {
    label: 'Email (SMTP) Settings',
    keys: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from', 'smtp_secure'],
    placeholders: { smtp_host: 'smtp.gmail.com', smtp_port: '587', smtp_secure: 'true | false' },
  },
  storage: {
    label: 'Storage Providers',
    keys: ['storage_provider', 'storage_local_path', 'storage_s3_bucket', 'storage_s3_region', 'storage_s3_key', 'storage_s3_secret'],
    placeholders: {
      storage_provider: 'local | cloudinary | s3',
      storage_local_path: 'static/uploads',
      storage_s3_bucket: 'my-bucket',
    },
  },
  api: {
    label: 'API Keys',
    keys: ['api_key_live', 'api_key_test', 'api_key_openai', 'api_key_gemini', 'api_key_openrouter', 'api_key_nvidia'],
    placeholders: { api_key_live: 'live_...', api_key_test: 'test_...' },
  },
  general: {
    label: 'General',
    keys: ['maintenance_mode', 'currency_symbol', 'date_format', 'time_format', 'site_name', 'site_url'],
    placeholders: { currency_symbol: '$', date_format: 'YYYY-MM-DD', time_format: 'HH:mm:ss' },
  },
};

router.get('/settings/grouped', async (req, res) => {
  try {
    const all = await getAllSettings();
    res.json({ success: true, groups: SETTINGS_GROUPS, settings: all });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/settings/grouped', async (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'settings object required' });
  try {
    for (const [k, v] of Object.entries(settings)) {
      await setSetting(k, v);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Backup schedules
router.get('/backup-schedules', async (req, res) => { await ensureSecurityTables();
  try {
    const r = await db.query(`SELECT * FROM backup_schedules ORDER BY created_at DESC`);
    res.json({ success: true, schedules: r.rows || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/backup-schedules/create', async (req, res) => {
  const { name, cron: cronExpr, target, retention_days, enabled } = req.body;
  if (!name || !cronExpr) return res.status(400).json({ error: 'name and cron required' });
  try {
    await db.query(
      `INSERT INTO backup_schedules (name, cron, target, retention_days, enabled, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [name, cronExpr, target || 'db', safeInt(retention_days, 30),
       enabled === false ? 0 : 1, req.session.user_id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/backup-schedules/:id/edit', async (req, res) => {
  const { name, cron: cronExpr, target, retention_days, enabled } = req.body;
  try {
    await db.query(
      `UPDATE backup_schedules SET name=$1, cron=$2, target=$3, retention_days=$4, enabled=$5 WHERE id=$6`,
      [name, cronExpr, target || 'db', safeInt(retention_days, 30),
       enabled === false ? 0 : 1, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/backup-schedules/:id/delete', async (req, res) => {
  try {
    await db.query(`DELETE FROM backup_schedules WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── D. Database & Maintenance ───────────────────────────────────────
function backupDir() {
  const dir = path.join(__dirname, '..', 'data', 'backups');
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  return dir;
}

router.post('/maintenance/backup', async (req, res) => {
  const { type = 'db' } = req.body;
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dir = backupDir();
    if (type === 'db') {
      if (db.mysqlPool) {
        // Use mysqldump
        const filename = `backup-${ts}.sql`;
        const filePath = path.join(dir, filename);
        // Invoke mysqldump via Node child_process
        const { exec } = require('child_process');
        const cmd = `mysqldump -h ${process.env.MYSQL_HOST || 'localhost'} -u ${process.env.MYSQL_USER || 'root'} ${process.env.MYSQL_PASSWORD ? `-p${process.env.MYSQL_PASSWORD}` : ''} ${process.env.MYSQL_DB || 'librika'} > ${filePath}`;
        await new Promise((resolve, reject) => {
          exec(cmd, (err) => {
            if (err) reject(err); else resolve();
          });
        });
        return res.json({ success: true, filename, path: filePath });
      }
      if (db.poolMain) {
        // pg_dump
        const { exec } = require('child_process');
        const filename = `backup-${ts}.sql`;
        const filePath = path.join(dir, filename);
        const cmd = `pg_dump "${process.env.DATABASE_URL}" > ${filePath}`;
        await new Promise((resolve, reject) => {
          exec(cmd, (err) => { if (err) reject(err); else resolve(); });
        });
        return res.json({ success: true, filename, path: filePath });
      }
      // SQLite: use sqlite3 .backup-style file copy
      const filename = `backup-${ts}.db`;
      const filePath = path.join(dir, filename);
      const src = path.join(__dirname, '..', 'library_v3.db');
      fs.copyFileSync(src, filePath);
      return res.json({ success: true, filename, path: filePath });
    }
    res.status(400).json({ error: 'Unsupported backup type: ' + type });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/maintenance/backups', async (req, res) => {
  try {
    const dir = backupDir();
    const files = fs.readdirSync(dir).map(f => {
      const st = fs.statSync(path.join(dir, f));
      return { name: f, size: st.size, mtime: st.mtime };
    }).sort((a, b) => b.mtime - a.mtime);
    res.json({ success: true, backups: files });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/maintenance/cache/clear', async (req, res) => {
  try {
    let removed = 0;
    if (db.poolMain || db.mysqlPool || db.dbMain) {
      try {
        const r = await db.query(`DELETE FROM sessions WHERE expire < NOW()`);
        removed = r.rowCount || 0;
      } catch (e) {}
    }
    res.json({ success: true, removed_sessions: removed });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/maintenance/storage/cleanup', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'static', 'uploads');
    if (!fs.existsSync(uploadsDir)) return res.json({ success: true, orphaned: [] });
    // Find all files and check if referenced in DB
    const refs = new Set();
    for (const tbl of ['books', 'digital_content', 'personal_books', 'acquisitions', 'advertisements']) {
      try {
        const cols = ['cover_url', 'cover_image_url', 'file_url', 'image_url', 'invoice_image', 'profile_photo'];
        for (const col of cols) {
          try {
            const r = await db.query(`SELECT ${col} as v FROM ${tbl} WHERE ${col} IS NOT NULL`);
            for (const row of (r.rows || [])) {
              if (row.v) refs.add(path.basename(row.v));
            }
          } catch (e) { /* column may not exist in this table */ }
        }
      } catch (e) { /* table may not exist */ }
    }
    const orphans = [];
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        const st = fs.statSync(full);
        if (st.isDirectory()) walk(full);
        else if (!refs.has(f)) orphans.push({ path: full, size: st.size, mtime: st.mtime });
      }
    };
    walk(uploadsDir);
    res.json({ success: true, orphaned: orphans.slice(0, 100), total_orphans: orphans.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/maintenance/storage/cleanup-purge', async (req, res) => {
  const { paths } = req.body;
  if (!Array.isArray(paths)) return res.status(400).json({ error: 'paths array required' });
  let removed = 0;
  for (const p of paths) {
    try { fs.unlinkSync(p); removed++; } catch (e) {}
  }
  res.json({ success: true, removed });
});

router.get('/maintenance/diagnostics', async (req, res) => {
  try {
    const dbStart = Date.now();
    await db.query('SELECT 1 as ok');
    const dbLatencyMs = Date.now() - dbStart;

    let tableSizes = [];
    if (db.mysqlPool) {
      const r = await db.query(`SELECT TABLE_NAME as name, DATA_LENGTH as bytes FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY DATA_LENGTH DESC LIMIT 20`);
      tableSizes = r.rows || [];
    } else if (db.poolMain) {
      const r = await db.query(`SELECT relname as name, pg_total_relation_size(relid) as bytes FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 20`);
      tableSizes = r.rows || [];
    } else {
      const r = await db.query(`SELECT name FROM sqlite_master WHERE type='table'`);
      tableSizes = (r.rows || []).map(t => ({ name: t.name, bytes: 0 }));
    }

    let diskUsed = 0;
    try {
      const uploadsDir = path.join(__dirname, '..', 'static', 'uploads');
      const walk = (dir) => {
        let total = 0;
        for (const f of fs.readdirSync(dir)) {
          const full = path.join(dir, f);
          const st = fs.statSync(full);
          if (st.isDirectory()) total += walk(full);
          else total += st.size;
        }
        return total;
      };
      if (fs.existsSync(uploadsDir)) diskUsed = walk(uploadsDir);
    } catch (e) {}

    res.json({
      success: true,
      db_latency_ms: dbLatencyMs,
      uptime_seconds: process.uptime(),
      memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      node_version: process.version,
      disk_uploads_bytes: diskUsed,
      table_sizes: tableSizes,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Generic export endpoint (full table)
router.get('/maintenance/export/:entity', async (req, res) => {
  const allowed = ['users', 'schools', 'books', 'transactions', 'digital_content', 'advertisements', 'notifications', 'logs'];
  if (!allowed.includes(req.params.entity)) return res.status(400).json({ error: 'unknown entity' });
  try {
    const r = await db.query(`SELECT * FROM ${req.params.entity}`);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${req.params.entity}_export.csv`);
    const headers = (r.rows && r.rows[0]) ? Object.keys(r.rows[0]) : [];
    res.send(buildCSV(headers, r.rows || []));
  } catch (err) { res.status(500).send('Export Error: ' + err.message); }
});

// ─── E. Notifications: schedule + delivery status ────────────────────
router.post('/notifications/schedule', async (req, res) => {
  const { message, type, scope, school_code, role_target, user_id, run_at } = req.body;
  if (!message || !run_at) return res.status(400).json({ error: 'message and run_at required' });
  if (!scope) return res.status(400).json({ error: 'scope required' });
  try {
    await db.query(
      `INSERT INTO scheduled_notifications
        (message, type, scope, school_code, role_target, user_id, run_at, status, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,NOW())`,
      [message, type || 'info', scope, school_code || null, role_target || null,
       user_id || null, run_at, req.session.user_id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/notifications/scheduled', async (req, res) => {
  const { status } = req.query;
  try {
    let where = '1=1';
    const params = [];
    if (status) { params.push(status); where += ` AND status = $${params.length}`; }
    const r = await db.query(`SELECT * FROM scheduled_notifications WHERE ${where} ORDER BY run_at DESC LIMIT 100`, params);
    res.json({ success: true, scheduled: r.rows || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/notifications/scheduled/:id/cancel', async (req, res) => {
  try {
    await db.query(`UPDATE scheduled_notifications SET status = 'cancelled' WHERE id = $1 AND status = 'pending'`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/notifications/scheduled/:id/delete', async (req, res) => {
  try {
    await db.query(`DELETE FROM scheduled_notifications WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/notifications/status', async (req, res) => {
  try {
    const [byType, byRead, total] = await Promise.all([
      db.query(`SELECT type, COUNT(*) as c FROM notifications GROUP BY type`),
      db.query(`SELECT SUM(CASE WHEN is_read = 1 OR read_at IS NOT NULL THEN 1 ELSE 0 END) as read_count,
                       SUM(CASE WHEN is_read = 0 AND read_at IS NULL THEN 1 ELSE 0 END) as unread_count,
                       COUNT(*) as total FROM notifications`),
      db.query(`SELECT COUNT(*) as c FROM notifications`),
    ]);
    res.json({ success: true, by_type: byType.rows || [], summary: (byRead.rows && byRead.rows[0]) || {}, total: safeInt(total.rows[0]?.c || 0) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── F. Additional Reports (all 13) ──────────────────────────────────
function sendCSV(res, filename, headers, rows) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(buildCSV(headers, rows || []));
}

router.get('/export/schools', async (req, res) => {
  try {
    const r = await db.query(`SELECT * FROM schools ORDER BY created_at DESC`);
    const headers = r.rows && r.rows[0] ? Object.keys(r.rows[0]) : ['school_code','name'];
    sendCSV(res, 'schools_export.csv', headers, r.rows);
  } catch (err) { res.status(500).send('Export Error: ' + err.message); }
});

router.get('/export/students', async (req, res) => {
  try {
    const r = await db.query(`SELECT id, name, phone, email, school_code, class, section, admission_no, is_banned, created_at FROM users WHERE role = 'student' ORDER BY school_code, name`);
    sendCSV(res, 'students_export.csv', ['id','name','phone','email','school_code','class','section','admission_no','is_banned','created_at'], r.rows);
  } catch (err) { res.status(500).send('Export Error'); }
});

router.get('/export/teachers', async (req, res) => {
  try {
    const r = await db.query(`SELECT id, name, phone, email, school_code, is_banned, created_at FROM users WHERE role = 'teacher' ORDER BY school_code, name`);
    sendCSV(res, 'teachers_export.csv', ['id','name','phone','email','school_code','is_banned','created_at'], r.rows);
  } catch (err) { res.status(500).send('Export Error'); }
});

router.get('/export/librarians', async (req, res) => {
  try {
    const r = await db.query(`SELECT id, name, phone, email, school_code, is_banned, created_at FROM users WHERE role = 'librarian' ORDER BY school_code, name`);
    sendCSV(res, 'librarians_export.csv', ['id','name','phone','email','school_code','is_banned','created_at'], r.rows);
  } catch (err) { res.status(500).send('Export Error'); }
});

router.get('/export/reading-stats', async (req, res) => {
  try {
    const r = await db.query(`
      SELECT u.id, u.name, u.school_code, u.role,
             t.total_books_borrowed, t.currently_borrowed,
             t.total_books_read, t.reading_streak
      FROM users u
      LEFT JOIN (
        SELECT user_id,
               COUNT(*) as total_books_borrowed,
               SUM(CASE WHEN return_date IS NULL THEN 1 ELSE 0 END) as currently_borrowed,
               SUM(CASE WHEN return_date IS NOT NULL THEN 1 ELSE 0 END) as total_books_read
        FROM transactions GROUP BY user_id
      ) t ON t.user_id = u.id
      WHERE u.role IN ('student', 'teacher')
      ORDER BY u.school_code, u.name
    `);
    sendCSV(res, 'reading_stats.csv', ['id','name','school_code','role','total_books_borrowed','currently_borrowed','total_books_read','reading_streak'], r.rows);
  } catch (err) { res.status(500).send('Export Error'); }
});

router.get('/export/community-uploads', async (req, res) => {
  try {
    const r = await db.query(`SELECT id, title, category, subject, school_code, status, views, downloads, created_at FROM digital_content WHERE school_code IS NOT NULL AND school_code <> 'GLOBAL' ORDER BY created_at DESC`);
    sendCSV(res, 'community_uploads.csv', ['id','title','category','subject','school_code','status','views','downloads','created_at'], r.rows);
  } catch (err) { res.status(500).send('Export Error'); }
});

router.get('/export/digital-usage', async (req, res) => {
  try {
    const r = await db.query(`SELECT dc.id, dc.title, dc.category, dc.school_code,
                                      dc.views, dc.downloads,
                                      COUNT(DISTINCT rp.user_id) as unique_readers,
                                      COUNT(rp.id) as sessions
                               FROM digital_content dc
                               LEFT JOIN reading_progress rp ON rp.content_id = dc.id
                               WHERE dc.school_code IS NOT NULL AND dc.school_code <> 'GLOBAL'
                               GROUP BY dc.id, dc.title, dc.category, dc.school_code, dc.views, dc.downloads
                               ORDER BY dc.views DESC`);
    sendCSV(res, 'digital_usage.csv', ['id','title','category','school_code','views','downloads','unique_readers','sessions'], r.rows);
  } catch (err) { res.status(500).send('Export Error'); }
});

router.get('/export/global-usage', async (req, res) => {
  try {
    const r = await db.query(`SELECT dc.id, dc.title, dc.category, dc.school_code,
                                      dc.views, dc.downloads,
                                      COUNT(DISTINCT rp.user_id) as unique_readers,
                                      COUNT(rp.id) as sessions
                               FROM digital_content dc
                               LEFT JOIN reading_progress rp ON rp.content_id = dc.id
                               WHERE dc.school_code = 'GLOBAL'
                               GROUP BY dc.id, dc.title, dc.category, dc.school_code, dc.views, dc.downloads
                               ORDER BY dc.views DESC`);
    sendCSV(res, 'global_usage.csv', ['id','title','category','school_code','views','downloads','unique_readers','sessions'], r.rows);
  } catch (err) { res.status(500).send('Export Error'); }
});

router.get('/export/advertisements', async (req, res) => {
  try {
    const r = await db.query(`SELECT id, title, subtitle, status, target_section, priority, start_time, end_time, impressions, clicks FROM advertisements ORDER BY created_at DESC`);
    sendCSV(res, 'advertisements.csv', ['id','title','subtitle','status','target_section','priority','start_time','end_time','impressions','clicks'], r.rows);
  } catch (err) { res.status(500).send('Export Error'); }
});

router.get('/export/ai-search-usage', async (req, res) => {
  try {
    // read from logs where module = 'ai_search'
    const r = await db.query(`SELECT id, user_id, action, ip_address, created_at FROM logs WHERE module = 'ai_search' ORDER BY created_at DESC LIMIT 5000`);
    sendCSV(res, 'ai_search_usage.csv', ['id','user_id','action','ip_address','created_at'], r.rows);
  } catch (err) { res.status(500).send('Export Error'); }
});

// Backup Aliases & Direct Export
router.get('/backups', async (req, res) => {
  try {
    await ensureSecurityTables();
    const dir = backupDir();
    const files = fs.readdirSync(dir).map(f => {
      const st = fs.statSync(path.join(dir, f));
      return { name: f, size: st.size, mtime: st.mtime };
    }).sort((a, b) => b.mtime - a.mtime);
    res.json({ success: true, backups: files });
  } catch (err) {
    res.json({ success: true, backups: [] });
  }
});

router.get('/backups/export', async (req, res) => {
  try {
    const users = await db.query('SELECT id, name, phone, email, role, school_code FROM users');
    const schools = await db.query('SELECT * FROM schools');
    const books = await db.query('SELECT id, title, author, isbn, school_code FROM books');
    let csv = '# LIBRIKA SYSTEM DATABASE EXPORT\n';
    csv += '# SCHOOLS\n' + buildCSV(['id','school_code','name','status'], schools.rows || []) + '\n\n';
    csv += '# USERS\n' + buildCSV(['id','name','phone','email','role','school_code'], users.rows || []) + '\n\n';
    csv += '# BOOKS\n' + buildCSV(['id','title','author','isbn','school_code'], books.rows || []);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=librika_full_backup.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).send('Export error: ' + err.message);
  }
});

// ── AI Assistant Route ──────────────────────────────────────────────
router.get(['/ai', '/ai-chat'], (req, res) => {
  try {
    res.render('student_ai', {
      title: 'AI Assistant - librika.in',
      active: 'ai',
      notifCount: 0,
      school_name: 'E-Pathshala Network'
    });
  } catch(err) {
    res.redirect('/superadmin');
  }
});

module.exports = router;
