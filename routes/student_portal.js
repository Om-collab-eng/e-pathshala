const aiService = require('../services/aiService');
const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
const db = require('../db');

const pool = { query: (text, params) => db.query(text, params) };
const upload = multer({
  dest: path.join(__dirname, '..', 'static', 'uploads'),
  limits: { fileSize: 15 * 1024 * 1024 },
});

function studentOnly(req, res, next) {
  if (req.session && req.session.user_id && (req.session.role === 'student' || req.session.role === 'user' || req.session.role === 'super_admin' || req.session.role === 'admin')) return next();
  req.flash('error', 'Access denied. Student login required.');
  return res.redirect('/login');
}

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function fmtDate(d) {
  if (!d) return '';
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

async function insertGetId(table, cols, vals, params) {
  const r = await pool.query(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')}) RETURNING id`, params);
  if (r.rows && r.rows[0] && r.rows[0].id) return r.rows[0].id;
  return r.lastId || null;
}

// Middleware: inject unread notification count for the shared topbar
router.use(studentOnly, async (req, res, next) => {
  res.locals.notifCount = 0;
  try {
    const r = await pool.query('SELECT COUNT(*) as c FROM notifications WHERE user_id = $1 AND is_read = 0', [req.session.user_id]);
    res.locals.notifCount = parseInt((r.rows && r.rows[0] && r.rows[0].c) || 0, 10);
  } catch (e) {}
  next();
});

/* ── My Library (aggregate) ─────────────────────────────────────── */
router.get('/my-library', async (req, res) => {
  const userId = req.session.user_id;
  const sCode = req.session.school_code;
  try {
    const borrowed = (await pool.query(
      `SELECT t.*, b.title, b.author, b.cover_url, b.genre FROM transactions t JOIN books b ON b.id = t.book_id WHERE t.user_id = $1 AND t.return_date IS NULL ORDER BY t.due_date ASC`,
      [userId])).rows;
    const reserved = (await pool.query(
      `SELECT r.*, b.title, b.author, b.cover_url FROM reservations r JOIN books b ON b.id = r.book_id WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
      [userId])).rows;
    const favorites = (await pool.query(
      `SELECT f.item_type, f.item_id, f.created_at,
              b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover,
              d.title AS dig_title, d.category AS dig_category, d.cover_url AS dig_cover
       FROM student_favorites f
       LEFT JOIN books b ON f.item_type = 'book' AND b.id = f.item_id
       LEFT JOIN digital_content d ON f.item_type = 'digital' AND d.id = f.item_id
       WHERE f.user_id = $1 ORDER BY f.created_at DESC`, [userId])).rows;
    const wishlist = (await pool.query(
      `SELECT w.*, b.title, b.author, b.cover_url, b.available_copies FROM student_wishlist w JOIN books b ON b.id = w.book_id WHERE w.user_id = $1 ORDER BY w.created_at DESC`, [userId])).rows;
    const history = (await pool.query(
      `SELECT COUNT(*) as c FROM transactions WHERE user_id = $1 AND return_date IS NOT NULL AND return_date != 'LOST'`, [userId])).rows[0].c;
    const downloads = (await pool.query(
      'SELECT * FROM student_downloads WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [userId])).rows;
    const continueReading = (await pool.query(
      `SELECT p.last_page, p.total_pages, p.updated_at, d.* FROM reading_progress p JOIN digital_content d ON d.id = p.content_id WHERE p.student_id = $1 AND (p.completed_at IS NULL OR p.last_page < p.total_pages) ORDER BY p.updated_at DESC LIMIT 8`, [userId])).rows;
    const sCodeParam = sCode || 'GLOBAL';
    const announcements = (await pool.query(
      `SELECT * FROM announcements WHERE school_code = $1 ORDER BY created_at DESC LIMIT 3`, [sCodeParam])).rows;
    const events = (await pool.query(
      `SELECT * FROM student_events WHERE (school_code = $1 OR user_id = $2) AND event_date >= $3 ORDER BY event_date ASC LIMIT 3`,
      [sCodeParam, userId, nowStr()])).rows;

    res.render('student_mylibrary', {
      title: 'My Library - librika.in',
      active: 'library',
      borrowed,
      reserved,
      favorites,
      wishlist,
      historyCount: parseInt(history, 10),
      downloads,
      continueReading,
      announcements,
      events,
    });
  } catch (err) {
    console.error('My Library error:', err);
    req.flash('error', 'Failed to load your library');
    res.redirect('/student');
  }
});

/* ── Favorites ──────────────────────────────────────────────────── */
router.get('/favorites', async (req, res) => {
  try {
    const favorites = (await pool.query(
      `SELECT f.id AS fav_id, f.item_type, f.item_id, f.created_at,
              b.id AS book_id, b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover, b.genre AS book_genre,
              d.id AS dig_id, d.title AS dig_title, d.category AS dig_category, d.cover_url AS dig_cover, d.file_url AS dig_file
       FROM student_favorites f
       LEFT JOIN books b ON f.item_type = 'book' AND b.id = f.item_id
       LEFT JOIN digital_content d ON f.item_type = 'digital' AND d.id = f.item_id
       WHERE f.user_id = $1 ORDER BY f.created_at DESC`,
      [req.session.user_id])).rows;
    res.render('student_favorites', { title: 'Favorites - librika.in', active: 'favorites', favorites });
  } catch (err) {
    console.error('Favorites error:', err);
    req.flash('error', 'Failed to load favorites');
    res.redirect('/student');
  }
});

router.post('/api/favorite/:type/:id', async (req, res) => {
  const type = req.params.type === 'book' ? 'book' : 'digital';
  const itemId = parseInt(req.params.id, 10);
  try {
    const existing = (await pool.query(
      'SELECT id FROM student_favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3',
      [req.session.user_id, type, itemId])).rows;
    if (existing.length) {
      await pool.query('DELETE FROM student_favorites WHERE id = $1', [existing[0].id]);
      return res.json({ status: 'success', added: false });
    }
    await pool.query(
      'INSERT INTO student_favorites (user_id, item_type, item_id, created_at) VALUES ($1, $2, $3, $4)',
      [req.session.user_id, type, itemId, nowStr()]);
    res.json({ status: 'success', added: true });
  } catch (err) {
    console.error('Favorite toggle error:', err);
    res.status(500).json({ status: 'error' });
  }
});

/* ── Wishlist ───────────────────────────────────────────────────── */
router.get('/wishlist', async (req, res) => {
  try {
    const wishlist = (await pool.query(
      `SELECT w.*, b.title, b.author, b.cover_url, b.available_copies, b.genre
       FROM student_wishlist w JOIN books b ON b.id = w.book_id
       WHERE w.user_id = $1 ORDER BY w.created_at DESC`, [req.session.user_id])).rows;
    res.render('student_wishlist', { title: 'Wishlist - librika.in', active: 'wishlist', wishlist });
  } catch (err) {
    console.error('Wishlist error:', err);
    req.flash('error', 'Failed to load wishlist');
    res.redirect('/student');
  }
});

router.post('/api/wishlist/:bookId', async (req, res) => {
  const bookId = parseInt(req.params.bookId, 10);
  try {
    const existing = (await pool.query('SELECT id FROM student_wishlist WHERE user_id = $1 AND book_id = $2', [req.session.user_id, bookId])).rows;
    if (existing.length) {
      await pool.query('DELETE FROM student_wishlist WHERE id = $1', [existing[0].id]);
      return res.json({ status: 'success', added: false });
    }
    await pool.query('INSERT INTO student_wishlist (user_id, book_id, created_at) VALUES ($1, $2, $3)',
      [req.session.user_id, bookId, nowStr()]);
    res.json({ status: 'success', added: true });
  } catch (err) {
    console.error('Wishlist toggle error:', err);
    res.status(500).json({ status: 'error' });
  }
});

/* ── Reading History ────────────────────────────────────────────── */
router.get('/history', async (req, res) => {
  try {
    const physical = (await pool.query(
      `SELECT t.*, b.title, b.author, b.cover_url, b.genre, b.pages
       FROM transactions t JOIN books b ON b.id = t.book_id
       WHERE t.user_id = $1 AND t.return_date IS NOT NULL AND t.return_date != 'LOST'
       ORDER BY t.return_date DESC`, [req.session.user_id])).rows;
    const digital = (await pool.query(
      `SELECT p.*, d.title, d.category, d.subject, d.cover_url
       FROM reading_progress p JOIN digital_content d ON d.id = p.content_id
       WHERE p.student_id = $1 AND p.completed_at IS NOT NULL
       ORDER BY p.completed_at DESC`, [req.session.user_id])).rows;
    res.render('student_history', { title: 'Reading History - librika.in', active: 'history', physical, digital });
  } catch (err) {
    console.error('History error:', err);
    req.flash('error', 'Failed to load history');
    res.redirect('/student');
  }
});

/* ── Downloads / Offline ────────────────────────────────────────── */
router.get('/downloads', async (req, res) => {
  try {
    const downloads = (await pool.query(
      `SELECT d.*, dc.title AS content_title, dc.cover_url, dc.category
       FROM student_downloads d LEFT JOIN digital_content dc ON dc.id = d.content_id
       WHERE d.user_id = $1 ORDER BY d.created_at DESC`, [req.session.user_id])).rows;
    let storageUsed = 0;
    downloads.forEach(d => { storageUsed += parseInt(d.file_size || 0, 10); });
    res.render('student_downloads', { title: 'Downloads - librika.in', active: 'downloads', downloads, storageUsed });
  } catch (err) {
    console.error('Downloads error:', err);
    req.flash('error', 'Failed to load downloads');
    res.redirect('/student');
  }
});

router.post('/api/downloads/remove/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM student_downloads WHERE id = $1 AND user_id = $2', [parseInt(req.params.id, 10), req.session.user_id]);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'error' });
  }
});

/* ── Reading Goals ──────────────────────────────────────────────── */
router.get('/goals', async (req, res) => {
  const userId = req.session.user_id;
  try {
    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [userId])).rows[0] || {};
    const personalGoals = (await pool.query(
      `SELECT * FROM reading_goals WHERE role = 'student' AND created_by = $1`, [userId])).rows;
    const progressRows = (await pool.query(
      `SELECT total_pages, last_page, reading_time, updated_at, completed_at FROM reading_progress WHERE student_id = $1`, [userId])).rows;
    const completed = (await pool.query(
      `SELECT COUNT(*) as c FROM transactions WHERE user_id = $1 AND return_date IS NOT NULL AND return_date != 'LOST'`, [userId])).rows[0].c;
    const pagesRead = progressRows.reduce((a, r) => a + (parseInt(r.last_page, 10) || 0), 0);
    const minutesRead = progressRows.reduce((a, r) => a + (parseInt(r.reading_time, 10) || 0), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 19).replace('T', ' ');
    const monthRows = (await pool.query(
      `SELECT total_pages, last_page FROM reading_progress WHERE student_id = $1 AND updated_at >= $2`, [userId, monthStart])).rows;
    const monthPages = monthRows.reduce((a, r) => a + (parseInt(r.last_page, 10) || 0), 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const dayLog = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().slice(0, 10);
      const dayRows = progressRows.filter(r => String(r.updated_at || '').slice(0, 10) === dStr);
      dayLog.push({ date: dStr, label: d.toLocaleDateString('en', { weekday: 'short' }), pages: dayRows.reduce((a, r) => a + (parseInt(r.last_page, 10) || 0), 0) });
    }

    const today = now.toISOString().slice(0, 10);
    const todayPages = progressRows.filter(r => String(r.updated_at || '').slice(0, 10) === today).reduce((a, r) => a + (parseInt(r.last_page, 10) || 0), 0);

    res.render('student_goals', {
      title: 'Reading Goals - librika.in',
      active: 'goals',
      notifCount: 0,
      success: (req.flash && req.flash('success') && req.flash('success')[0]) ? req.flash('success')[0] : null,
      error: (req.flash && req.flash('error') && req.flash('error')[0]) ? req.flash('error')[0] : null,
      user,
      personalGoals,
      streak: parseInt(user.reading_streak || 0, 10),
      longestStreak: parseInt(user.longest_streak || 0, 10),
      pagesRead,
      minutesRead,
      booksCompleted: parseInt(completed, 10),
      monthPages,
      todayPages,
      dayLog,
    });
  } catch (err) {
    console.error('Goals error:', err);
    req.flash('error', 'Failed to load goals');
    res.redirect('/student');
  }
});

router.post('/api/goal', async (req, res) => {
  const { period, target } = req.body;
  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period) || !target) {
    return res.status(400).json({ status: 'error', message: 'Invalid goal' });
  }
  try {
    const existing = (await pool.query(
      `SELECT id FROM reading_goals WHERE role = 'student' AND created_by = $1 AND period = $2`,
      [req.session.user_id, period])).rows;
    if (existing.length) {
      await pool.query('UPDATE reading_goals SET target = $1, updated_at = $2 WHERE id = $3',
        [parseInt(target, 10), nowStr(), existing[0].id]);
    } else {
      await pool.query(
        `INSERT INTO reading_goals (school_code, role, target, period, created_by, created_at, updated_at) VALUES ($1, 'student', $2, $3, $4, $5, $5)`,
        [req.session.school_code, parseInt(target, 10), period, req.session.user_id, nowStr()]);
    }
    res.json({ status: 'success' });
  } catch (err) {
    console.error('Goal set error:', err);
    res.status(500).json({ status: 'error' });
  }
});

/* ── Achievements ───────────────────────────────────────────────── */
router.get('/achievements', async (req, res) => {
  const userId = req.session.user_id;
  try {
    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [userId])).rows[0] || {};
    let badges = [];
    try { badges = JSON.parse(user.badges || '[]'); } catch (e) {}
    const physDone = parseInt((await pool.query(
      `SELECT COUNT(*) as c FROM transactions WHERE user_id = $1 AND return_date IS NOT NULL AND return_date != 'LOST'`, [userId])).rows[0].c, 10);
    const digDone = parseInt((await pool.query(
      `SELECT COUNT(*) as c FROM reading_progress WHERE student_id = $1 AND last_page >= total_pages AND total_pages > 1`, [userId])).rows[0].c, 10);
    const totalDone = physDone + digDone;
    const quizzes = parseInt((await pool.query(
      `SELECT COUNT(*) as c FROM quiz_attempts WHERE user_id = $1 AND passed = 1`, [userId])).rows[0].c, 10);
    const reviews = parseInt((await pool.query(
      `SELECT COUNT(*) as c FROM book_reviews WHERE user_id = $1 AND status = 'approved'`, [userId])).rows[0].c, 10);
    const score = parseInt(user.overall_reader_score || 0, 10);
    const streak = parseInt(user.reading_streak || 0, 10);

    const badgesDef = [
      { key: 'First Book Completed', icon: '📖', desc: 'Complete your first book', value: totalDone, target: 1 },
      { key: '5 Books Completed', icon: '📚', desc: 'Complete 5 books', value: totalDone, target: 5 },
      { key: '10 Books Completed', icon: '🎓', desc: 'Complete 10 books', value: totalDone, target: 10 },
      { key: '25 Books Completed', icon: '🏅', desc: 'Complete 25 books', value: totalDone, target: 25 },
      { key: '50 Books Completed', icon: '🏆', desc: 'Complete 50 books', value: totalDone, target: 50 },
      { key: 'Quiz Master', icon: '🧠', desc: 'Pass 5 quizzes', value: quizzes, target: 5 },
      { key: 'Review Expert', icon: '✍️', desc: 'Get 5 reviews approved', value: reviews, target: 5 },
      { key: 'Reading Champion', icon: '👑', desc: 'Reach 500 reader score', value: score, target: 500 },
      { key: '7-Day Streak', icon: '🔥', desc: 'Read 7 days in a row', value: streak, target: 7 },
    ];

    res.render('student_achievements', { title: 'Achievements - librika.in', active: 'achievements', user, badges, badgesDef, totalDone, quizzes, reviews, score, streak });
  } catch (err) {
    console.error('Achievements error:', err);
    req.flash('error', 'Failed to load achievements');
    res.redirect('/student');
  }
});

/* ── Analytics ──────────────────────────────────────────────────── */
router.get('/analytics', async (req, res) => {
  const userId = req.session.user_id;
  try {
    const progressRows = (await pool.query(
      `SELECT total_pages, last_page, reading_time, updated_at, content_id FROM reading_progress WHERE student_id = $1`, [userId])).rows;
    const pagesRead = progressRows.reduce((a, r) => a + (parseInt(r.last_page, 10) || 0), 0);
    const minutesRead = progressRows.reduce((a, r) => a + (parseInt(r.reading_time, 10) || 0), 0);
    const hoursRead = (minutesRead / 60).toFixed(1);
    const booksCompleted = parseInt((await pool.query(
      `SELECT COUNT(*) as c FROM transactions WHERE user_id = $1 AND return_date IS NOT NULL AND return_date != 'LOST'`, [userId])).rows[0].c, 10)
      + parseInt((await pool.query(
        `SELECT COUNT(*) as c FROM reading_progress WHERE student_id = $1 AND last_page >= total_pages AND total_pages > 1`, [userId])).rows[0].c, 10);

    const genres = (await pool.query(
      `SELECT b.genre, COUNT(*) as c FROM transactions t JOIN books b ON b.id = t.book_id WHERE t.user_id = $1 AND b.genre IS NOT NULL GROUP BY b.genre ORDER BY c DESC LIMIT 6`,
      [userId])).rows;

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const prefix = d.toISOString().slice(0, 7);
      const count = progressRows.filter(r => String(r.updated_at || '').slice(0, 7) === prefix).length;
      months.push({ label: d.toLocaleDateString('en', { month: 'short' }), value: count });
    }

    const contributions = parseInt((await pool.query(
      `SELECT COUNT(*) as c FROM digital_content WHERE student_id = $1`, [userId])).rows[0].c, 10);
    const aiUses = parseInt((await pool.query(
      `SELECT COUNT(*) as c FROM ai_usage_log WHERE user_id = $1`, [userId])).rows[0].c, 10);
    const downloads = parseInt((await pool.query(
      `SELECT COUNT(*) as c FROM student_downloads WHERE user_id = $1`, [userId])).rows[0].c, 10);

    res.render('student_analytics', {
      title: 'Analytics - librika.in',
      active: 'analytics',
      pagesRead, minutesRead, hoursRead, booksCompleted,
      genres, months, contributions, aiUses, downloads,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    req.flash('error', 'Failed to load analytics');
    res.redirect('/student');
  }
});

/* ── Calendar ───────────────────────────────────────────────────── */
router.get('/calendar', async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
  const userId = req.session.user_id;
  const sCode = req.session.school_code || 'GLOBAL';

  const startStr = `${year}-${String(month).padStart(2, '0')}-01 00:00`;
  const endDay = new Date(year, month, 0).getDate();
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')} 23:59`;

  let events = [], assignments = [], dueBooks = [];

  try {
    events = (await pool.query(
      `SELECT * FROM student_events WHERE (school_code = $1 OR user_id = $2) AND event_date >= $3 AND event_date <= $4 ORDER BY event_date ASC`,
      [sCode, userId, startStr, endStr])).rows || [];
  } catch (e) { events = []; }

  try {
    assignments = (await pool.query(
      `SELECT id, title, subject, due_date FROM assignments WHERE school_code = $1 AND due_date IS NOT NULL AND due_date >= $2 AND due_date <= $3`,
      [sCode, startStr, endStr])).rows || [];
  } catch (e) { assignments = []; }

  try {
    dueBooks = (await pool.query(
      `SELECT t.due_date, b.title FROM transactions t JOIN books b ON b.id = t.book_id WHERE t.user_id = $1 AND t.return_date IS NULL AND t.due_date >= $2 AND t.due_date <= $3`,
      [userId, startStr, endStr])).rows || [];
  } catch (e) { dueBooks = []; }

  res.render('student_calendar', {
    title: 'Calendar - librika.in',
    active: 'calendar',
    notifCount: 0,
    year, month,
    events,
    assignments,
    dueBooks,
    school_name: req.session.school_name || 'E-Pathshala Network'
  });
});

router.post('/api/events', async (req, res) => {
  const { title, description, event_date, category } = req.body;
  if (!title || !event_date) return res.status(400).json({ status: 'error' });
  try {
    await pool.query(
      `INSERT INTO student_events (school_code, title, description, event_date, category, user_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.session.school_code || 'GLOBAL', title, description || '', event_date, category || 'personal', req.session.user_id, nowStr()]);
    res.json({ status: 'success' });
  } catch (err) {
    console.error('Event create error:', err);
    res.status(500).json({ status: 'error' });
  }
});

router.post('/api/events/remove/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM student_events WHERE id = $1 AND user_id = $2', [parseInt(req.params.id, 10), req.session.user_id]);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'error' });
  }
});

/* ── Notifications ──────────────────────────────────────────────── */
router.get('/notifications', async (req, res) => {
  const filter = req.query.filter || 'all';
  let rows = [];
  try {
    if (filter === 'unread') {
      rows = (await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 AND is_read = 0 ORDER BY created_at DESC LIMIT 100', [req.session.user_id])).rows || [];
    } else if (filter !== 'all') {
      rows = (await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT 100', [req.session.user_id, filter])).rows || [];
    } else {
      rows = (await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [req.session.user_id])).rows || [];
    }
  } catch (err) {
    console.error('Notifications DB error:', err);
    rows = [];
  }
  res.render('student_notifications', {
    title: 'Notifications - librika.in',
    active: 'notifications',
    notifCount: rows.filter(n => !n.is_read).length,
    notifications: rows,
    filter,
    school_name: req.session.school_name || 'E-Pathshala Network'
  });
});

router.post('/notifications/read-all', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = $1', [req.session.user_id]);
    res.redirect('/student/notifications');
  } catch (err) {
    req.flash('error', 'Failed to update notifications');
    res.redirect('/student/notifications');
  }
});

router.post('/api/notifications/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2', [parseInt(req.body.id, 10), req.session.user_id]);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'error' });
  }
});

/* ── Assignments ────────────────────────────────────────────────── */
router.get('/assignments', async (req, res) => {
  const sCode = req.session.school_code || 'GLOBAL';
  const stuClass = req.session.class || null;
  let assignments = [], submissions = [];

  try {
    let queryStr = `SELECT * FROM assignments WHERE school_code = $1`;
    const params = [sCode];
    if (stuClass) {
      params.push(stuClass);
      queryStr += ` AND (class = $${params.length} OR class IS NULL OR class = '')`;
    }
    queryStr += ` ORDER BY due_date ASC`;
    assignments = (await pool.query(queryStr, params)).rows || [];
  } catch (e) { assignments = []; }

  try {
    submissions = (await pool.query(
      `SELECT * FROM assignment_submissions WHERE user_id = $1`, [req.session.user_id])).rows || [];
  } catch (e) { submissions = []; }

  res.render('student_assignments', {
    title: 'Assignments - librika.in',
    active: 'assignments',
    notifCount: 0,
    assignments,
    submissions,
    school_name: req.session.school_name || 'E-Pathshala Network'
  });
});

router.get('/assignments/:id', async (req, res) => {
  try {
    const assignment = (await pool.query('SELECT * FROM assignments WHERE id = $1', [parseInt(req.params.id, 10)])).rows[0];
    if (!assignment) return res.redirect('/student/assignments');
    const submission = (await pool.query(
      `SELECT * FROM assignment_submissions WHERE assignment_id = $1 AND user_id = $2`, [assignment.id, req.session.user_id])).rows[0] || null;
    res.render('student_assignment_detail', { title: `${assignment.title} - librika.in`, active: 'assignments', notifCount: 0, assignment, submission, school_name: req.session.school_name || 'E-Pathshala Network' });
  } catch (err) {
    console.error('Assignment detail error:', err);
    res.redirect('/student/assignments');
  }
});

router.post('/assignments/:id/submit', upload.single('file'), async (req, res) => {
  const assignmentId = parseInt(req.params.id, 10);
  const { notes } = req.body;
  try {
    const assignment = (await pool.query('SELECT * FROM assignments WHERE id = $1', [assignmentId])).rows[0];
    if (!assignment) return res.redirect('/student/assignments');
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!fileUrl && !notes) {
      req.flash('error', 'Upload a file or add notes to submit.');
      return res.redirect(`/student/assignments/${assignmentId}`);
    }
    const existing = (await pool.query(
      'SELECT id FROM assignment_submissions WHERE assignment_id = $1 AND user_id = $2', [assignmentId, req.session.user_id])).rows;
    if (existing.length) {
      await pool.query('UPDATE assignment_submissions SET file_url = $1, notes = $2, submitted_at = $3, status = $4 WHERE id = $5',
        [fileUrl || (await pool.query('SELECT file_url FROM assignment_submissions WHERE id = $1', [existing[0].id])).rows[0].file_url, notes || '', nowStr(), 'resubmitted', existing[0].id]);
    } else {
      await pool.query(
        `INSERT INTO assignment_submissions (assignment_id, user_id, file_url, notes, submitted_at, status) VALUES ($1, $2, $3, $4, $5, 'submitted')`,
        [assignmentId, req.session.user_id, fileUrl, notes || '', nowStr()]);
    }
    req.flash('success', 'Assignment submitted successfully!');
    res.redirect(`/student/assignments/${assignmentId}`);
  } catch (err) {
    console.error('Assignment submit error:', err);
    req.flash('error', 'Failed to submit assignment');
    res.redirect(`/student/assignments/${assignmentId}`);
  }
});

/* ── Book Requests ──────────────────────────────────────────────── */
router.get('/requests', async (req, res) => {
  let requests = [];
  try {
    requests = (await pool.query(
      `SELECT * FROM book_requests WHERE user_id = $1 ORDER BY created_at DESC`, [req.session.user_id])).rows || [];
  } catch (err) { requests = []; }
  res.render('student_requests', {
    title: 'Book Requests - librika.in',
    active: 'requests',
    notifCount: 0,
    requests,
    success: (req.flash && req.flash('success') && req.flash('success')[0]) ? req.flash('success')[0] : null,
    error: (req.flash && req.flash('error') && req.flash('error')[0]) ? req.flash('error')[0] : null,
    school_name: req.session.school_name || 'E-Pathshala Network'
  });
});

router.post('/requests', async (req, res) => {
  const { title, author, request_type, details } = req.body;
  if (!title) {
    req.flash('error', 'Book title is required.');
    return res.redirect('/student/requests');
  }
  try {
    await pool.query(
      `INSERT INTO book_requests (user_id, title, author, request_type, details, status, school_code, created_at) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)`,
      [req.session.user_id, title, author || '', request_type || 'book', details || '', req.session.school_code, nowStr()]);
    await pool.query('INSERT INTO notifications (user_id, message, type, created_at, school_code) VALUES ($1, $2, $3, $4, $5)',
      [req.session.user_id, `Your request for "${title}" has been submitted for review.`, 'request', nowStr(), req.session.school_code]);
    req.flash('success', 'Book request submitted!');
    res.redirect('/student/requests');
  } catch (err) {
    console.error('Request create error:', err);
    req.flash('error', 'Failed to submit request');
    res.redirect('/student/requests');
  }
});

router.post('/requests/:id/cancel', async (req, res) => {
  try {
    await pool.query(
      `UPDATE book_requests SET status = 'cancelled' WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
      [parseInt(req.params.id, 10), req.session.user_id]);
    res.redirect('/student/requests');
  } catch (err) {
    res.redirect('/student/requests');
  }
});

/* ── Settings ───────────────────────────────────────────────────── */
router.get('/settings', async (req, res) => {
  try {
    const existing = (await pool.query('SELECT * FROM student_settings WHERE user_id = $1', [req.session.user_id])).rows[0] || {};
    res.render('student_settings', { title: 'Settings - librika.in', active: 'settings', prefs: existing });
  } catch (err) {
    console.error('Settings error:', err);
    res.redirect('/student');
  }
});

router.post('/settings', async (req, res) => {
  const b = req.body;
  const boolKeys = ['notifications_enabled', 'email_notifications', 'due_reminders', 'community_notifications', 'ai_recommendations', 'assignment_reminders', 'privacy_show_progress', 'privacy_show_badges', 'privacy_show_activity', 'auto_download', 'offline_content', 'data_saver'];
  const strKeys = ['theme', 'accent_color', 'font_size', 'ui_density', 'language'];
  const existing = (await pool.query('SELECT user_id FROM student_settings WHERE user_id = $1', [req.session.user_id])).rows[0];
  try {
    if (existing) {
      const sets = [];
      const params = [];
      let i = 1;
      boolKeys.forEach(k => {
        if (b[k] !== undefined) { sets.push(`${k} = $${i++}`); params.push(b[k] === 'on' || b[k] === '1' || b[k] === true ? 1 : 0); }
      });
      strKeys.forEach(k => {
        if (b[k]) { sets.push(`${k} = $${i++}`); params.push(b[k]); }
      });
      if (sets.length) {
        params.push(req.session.user_id);
        await pool.query(`UPDATE student_settings SET ${sets.join(', ')} WHERE user_id = $${i}`, params);
      }
    } else {
      await pool.query(
        `INSERT INTO student_settings (user_id, notifications_enabled, email_notifications, due_reminders, community_notifications, ai_recommendations, assignment_reminders, theme, accent_color, font_size, ui_density, language, privacy_show_progress, privacy_show_badges, privacy_show_activity, auto_download, offline_content, data_saver)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [req.session.user_id,
         b.notifications_enabled ? 1 : 0, b.email_notifications ? 1 : 0, b.due_reminders ? 1 : 0,
         b.community_notifications ? 1 : 0, b.ai_recommendations ? 1 : 0, b.assignment_reminders ? 1 : 0,
         b.theme || 'dark', b.accent_color || '#6366f1', b.font_size || 'medium', b.ui_density || 'comfortable', b.language || 'en',
         b.privacy_show_progress ? 1 : 0, b.privacy_show_badges ? 1 : 0, b.privacy_show_activity ? 1 : 0,
         b.auto_download ? 1 : 0, b.offline_content ? 1 : 0, b.data_saver ? 1 : 0]);
    }
    req.flash('success', 'Settings saved!');
    res.redirect('/student/settings');
  } catch (err) {
    console.error('Settings save error:', err);
    req.flash('error', 'Failed to save settings');
    res.redirect('/student/settings');
  }
});

/* ── Security ───────────────────────────────────────────────────── */
router.get('/security', async (req, res) => {
  const userId = req.session.user_id;
  try {
    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [userId])).rows[0] || {};
    const devices = (await pool.query(
      'SELECT * FROM student_devices WHERE user_id = $1 ORDER BY last_active DESC', [userId])).rows;
    const loginHistory = (await pool.query(
      `SELECT * FROM login_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`, [userId])).rows;
    const backupCodes = (await pool.query(
      `SELECT * FROM two_factor_backup_codes WHERE user_id = $1 ORDER BY id`, [userId])).rows;
    res.render('student_security', {
      title: 'Security - librika.in',
      active: 'security',
      user,
      devices,
      loginHistory,
      backupCodes,
    });
  } catch (err) {
    console.error('Security error:', err);
    res.redirect('/student');
  }
});

router.post('/security/password', async (req, res) => {
  const { current_password, new_password } = req.body;
  try {
    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [req.session.user_id])).rows[0];
    if (!user || !user.password) return res.redirect('/student/security');
    const ok = await bcrypt.compare(current_password, user.password).catch(() => false);
    if (!ok) {
      req.flash('error', 'Current password is incorrect.');
      return res.redirect('/student/security');
    }
    if (!new_password || new_password.length < 6) {
      req.flash('error', 'New password must be at least 6 characters.');
      return res.redirect('/student/security');
    }
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.session.user_id]);
    req.flash('success', 'Password updated successfully!');
    res.redirect('/student/security');
  } catch (err) {
    console.error('Password change error:', err);
    req.flash('error', 'Failed to change password');
    res.redirect('/student/security');
  }
});

router.post('/security/2fa', async (req, res) => {
  try {
    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [req.session.user_id])).rows[0];
    const nowEnabled = user && user.two_factor_enabled ? 0 : 1;
    await pool.query('UPDATE users SET two_factor_enabled = $1 WHERE id = $2', [nowEnabled, req.session.user_id]);
    if (nowEnabled && (!user.two_factor_secret)) {
      const secret = Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);
      await pool.query('UPDATE users SET two_factor_secret = $1 WHERE id = $2', [secret, req.session.user_id]);
    }
    req.flash('success', nowEnabled ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.');
    res.redirect('/student/security');
  } catch (err) {
    console.error('2FA toggle error:', err);
    req.flash('error', 'Failed to update 2FA');
    res.redirect('/student/security');
  }
});

router.post('/security/logout-all', async (req, res) => {
  try {
    await pool.query('DELETE FROM student_devices WHERE user_id = $1', [req.session.user_id]);
    req.flash('success', 'All other sessions have been signed out.');
    res.redirect('/student/security');
  } catch (err) {
    res.redirect('/student/security');
  }
});

router.post('/api/devices/revoke/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM student_devices WHERE id = $1 AND user_id = $2', [parseInt(req.params.id, 10), req.session.user_id]);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'error' });
  }
});

/* ── Support ────────────────────────────────────────────────────── */
router.get('/support', async (req, res) => {
  try {
    const tickets = (await pool.query(
      `SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC`, [req.session.user_id])).rows;
    res.render('student_support', { title: 'Help & Support - librika.in', active: 'support', tickets });
  } catch (err) {
    console.error('Support error:', err);
    res.redirect('/student');
  }
});

router.post('/support/ticket', async (req, res) => {
  const { category, subject, message } = req.body;
  if (!message) {
    req.flash('error', 'Please write a message.');
    return res.redirect('/student/support');
  }
  try {
    await pool.query(
      `INSERT INTO support_tickets (user_id, category, subject, message, status, school_code, created_at) VALUES ($1, $2, $3, $4, 'open', $5, $6)`,
      [req.session.user_id, category || 'question', subject || '', message, req.session.school_code, nowStr()]);
    req.flash('success', 'Your ticket has been submitted. We will get back to you soon!');
    res.redirect('/student/support');
  } catch (err) {
    console.error('Support ticket error:', err);
    req.flash('error', 'Failed to submit ticket');
    res.redirect('/student/support');
  }
});

/* ── AI Hub ─────────────────────────────────────────────────────── */
router.get('/ai', async (req, res) => {
  try {
    let notifCount = 0;
    try {
      const sCode = req.session ? req.session.school_code : null;
      const uId = req.session ? req.session.user_id : null;
      if (uId) {
        const r = await pool.query('SELECT COUNT(*) as c FROM notifications WHERE (user_id = $1 OR school_code = $2 OR school_code = $3) AND is_read = false', [uId, sCode, 'GLOBAL']);
        notifCount = parseInt(r.rows[0].c, 10) || 0;
      }
    } catch(e) { notifCount = 0; }
    res.render('student_ai', {
      title: 'AI Assistant - librika.in',
      active: 'ai',
      notifCount: notifCount,
      school_name: (req.session && req.session.school_name) ? req.session.school_name : 'E-Pathshala Network'
    });
  } catch(err) {
    console.error('AI route error:', err);
    res.render('student_ai', {
      title: 'AI Assistant - librika.in',
      active: 'ai',
      notifCount: 0,
      school_name: 'E-Pathshala Network'
    });
  }
});

router.post('/api/ai/chat', async (req, res) => {
  const { message, tool } = req.body;
  if (!message) return res.status(400).json({ status: 'error', message: 'Empty message' });
  const toolName = tool || 'chat';
  try {
    if (req.session && req.session.user_id) {
      await pool.query('INSERT INTO ai_usage_log (user_id, tool, prompt, created_at) VALUES ($1, $2, $3, $4)',
        [req.session.user_id, toolName, String(message).slice(0, 500), nowStr()]).catch(() => {});
    }
    const systemPrompts = {
      chat: 'You are the librika.in AI Assistant for students and librarians. Answer clearly, kindly, and concisely.',
      summarize: 'Summarize the given text in 5-6 clear bullet points.',
      quiz: 'Create a 5-question multiple-choice quiz on the given topic. Format each question with options and answers.',
      flashcards: 'Create 8 flashcards on the given topic. Format as Front: ... Back: ...',
      explain: 'Explain this topic in simple language with a short everyday example.',
      vocabulary: 'List important vocabulary words with meanings and example sentences.',
      translate: 'Translate the text faithfully into simple English.',
    };
    const system = systemPrompts[toolName] || systemPrompts.chat;
    const fullPrompt = `${system}\n\nUser Query: ${message}`;
    
    const reply = await aiService.callAI(fullPrompt, { temperature: 0.7 });
    return res.json({ status: 'success', reply: reply || 'How can I assist you with your library research today?' });
  } catch (err) {
    console.error('AI chat endpoint fallback:', err.message);
    return res.json({ 
      status: 'success', 
      reply: 'I am your Library AI Assistant. I can help you search books, summarize text, create study quizzes, and recommend reading materials! What would you like to explore?' 
    });
  }
});

module.exports = router;


// Notification Poll Endpoint
// Notification Poll Endpoint (1-Second Realtime)
router.get('/api/notifications/poll', async (req, res) => {
  try {
    const userId = req.session ? (req.session.user_id || req.session.id) : null;
    const sCode  = req.session ? req.session.school_code : null;
    const uRole  = req.session ? req.session.role : null;
    if (!userId && !sCode) return res.json({ status: 'success', unreadCount: 0, newNotifications: [], maxId: 0 });

    const sinceId = parseInt(req.query.since_id || '0', 10);
    
    const countRes = await pool.query(
      `SELECT COUNT(*) as c FROM notifications WHERE (user_id = $1 OR school_code = $2 OR school_code = 'GLOBAL' OR type = $3) AND (is_read = false OR is_read = '0' OR is_read IS NULL)`,
      [userId || 0, sCode || 'GLOBAL', uRole || 'student']
    ).catch(() => ({ rows: [{ c: 0 }] }));
    const unreadCount = parseInt(countRes.rows[0].c, 10) || 0;

    let newNotifs = [];
    if (sinceId === 0) {
      const initRes = await pool.query(
        `SELECT id, message, type, created_at FROM notifications WHERE (user_id = $1 OR school_code = $2 OR school_code = 'GLOBAL' OR type = $3) AND (is_read = false OR is_read = '0' OR is_read IS NULL) ORDER BY id DESC LIMIT 3`,
        [userId || 0, sCode || 'GLOBAL', uRole || 'student']
      ).catch(() => ({ rows: [] }));
      newNotifs = initRes.rows || [];
    } else {
      const newRes = await pool.query(
        `SELECT id, message, type, created_at FROM notifications WHERE (user_id = $1 OR school_code = $2 OR school_code = 'GLOBAL' OR type = $3) AND id > $4 ORDER BY id ASC LIMIT 5`,
        [userId || 0, sCode || 'GLOBAL', uRole || 'student', sinceId]
      ).catch(() => ({ rows: [] }));
      newNotifs = newRes.rows || [];
    }

    const maxRes = await pool.query(`SELECT MAX(id) as m FROM notifications`).catch(() => ({ rows: [{ m: 0 }] }));
    const maxId = parseInt(maxRes.rows[0].m, 10) || 0;

    res.json({
      status: 'success',
      unreadCount,
      newNotifications: newNotifs,
      maxId
    });
  } catch (err) {
    res.json({ status: 'success', unreadCount: 0, newNotifications: [], maxId: 0 });
  }
});
