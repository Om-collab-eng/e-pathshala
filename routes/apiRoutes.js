const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const multer = require('multer');
const { query } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { registerDeviceToken, unregisterDeviceToken, sendNotificationToUser } = require('../services/notificationService');
const aiService = require('../services/aiService');

const JWT_SECRET = process.env.JWT_SECRET || 'librika_jwt_secret';
const upload = multer({ dest: 'static/uploads/' });

// Helper: get user ID from JWT or session
const getUserId = (req) => req.userId || (req.session && req.session.user_id);

// 1. Mobile & Web Unified API Login (Returns JWT token)
router.post('/v1/auth/login', async (req, res) => {
  const { login, password, device_type, fcm_token } = req.body;
  if (!login || !password) {
    return res.status(400).json({ success: false, message: 'Login and password are required' });
  }

  try {
    let userResult = await query('SELECT * FROM users WHERE phone = $1', [login]);
    if (userResult.rowCount === 0) {
      userResult = await query('SELECT * FROM users WHERE admission_no = $1', [login]);
    }
    if (userResult.rowCount === 0) {
      userResult = await query('SELECT * FROM users WHERE email = $1', [login]);
    }

    if (userResult.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password (bcrypt or plaintext compatibility)
    let passwordMatches = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      passwordMatches = (user.password === password);
    }

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.is_banned) {
      return res.status(403).json({ success: false, message: 'Account has been banned' });
    }

    // Generate JWT Token
    const payload = {
      user_id: user.id,
      name: user.name,
      role: user.role,
      school_code: user.school_code
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '60d' });

    // Register FCM Device Token if provided during login
    if (fcm_token) {
      await registerDeviceToken(user.id, fcm_token, device_type || 'android');
    }

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        school_code: user.school_code,
        plan_name: user.plan_name
      }
    });
  } catch (err) {
    console.error('API Login Error:', err);
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
});

// 2. Register Device Token (Requires Auth)
router.post('/v1/devices/register', authMiddleware, async (req, res) => {
  const { fcm_token, device_type } = req.body;
  const userId = getUserId(req);

  if (!fcm_token) {
    return res.status(400).json({ success: false, message: 'fcm_token is required' });
  }

  try {
    await registerDeviceToken(userId, fcm_token, device_type || 'web');
    return res.json({ success: true, message: 'Device registered successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to register device' });
  }
});

// 3. Unregister Device Token (Logout)
router.post('/v1/devices/unregister', authMiddleware, async (req, res) => {
  const { fcm_token } = req.body;
  if (!fcm_token) {
    return res.status(400).json({ success: false, message: 'fcm_token is required' });
  }

  try {
    await unregisterDeviceToken(fcm_token);
    return res.json({ success: true, message: 'Device unregistered successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to unregister device' });
  }
});

// 4. Send Test Notification to Current User's Devices
router.post('/v1/notifications/send-test', authMiddleware, async (req, res) => {
  const userId = getUserId(req);
  const { title, body } = req.body;

  const result = await sendNotificationToUser(userId, {
    title: title || 'Librika Alert 🔔',
    body: body || 'Your Web App and Android App are now linked seamlessly!',
    data: { timestamp: new Date().toISOString() }
  });

  return res.json(result);
});

// ── AI Chat Endpoints ──────────────────────────────────────────────

// 5. AI Library Assistant Chat
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { messages, context } = req.body;
    const userId = getUserId(req);

    // Build library context from user's school
    let libraryContext = context || '';
    const schoolCode = req.school_code || (req.session && req.session.school_code);
    if (schoolCode) {
      const schoolResult = await query('SELECT name FROM schools WHERE school_code = $1', [schoolCode]);
      if (schoolResult.rows.length > 0) {
        libraryContext += ` Library: ${schoolResult.rows[0].name}.`;
      }
    }

    const response = await aiService.chatWithAssistant(messages || [], libraryContext);
    res.json({ status: 'success', response });
  } catch (err) {
    console.error('AI Chat error:', err);
    res.status(500).json({ status: 'error', message: 'AI service unavailable' });
  }
});

// 6. AI Chat Action (quick actions like "find book", "check availability")
router.post('/chat-action', authMiddleware, async (req, res) => {
  try {
    const { action, query: searchQuery } = req.body;
    const schoolCode = req.school_code || (req.session && req.session.school_code);
    let result = null;

    if (action === 'find_book') {
      const books = await query(
        `SELECT id, title, author, isbn, available_copies FROM books 
         WHERE school_code = $1 AND (LOWER(title) LIKE $2 OR LOWER(author) LIKE $2)
         LIMIT 10`,
        [schoolCode, `%${(searchQuery || '').toLowerCase()}%`]
      );
      result = books.rows;
    } else if (action === 'check_availability') {
      const books = await query(
        `SELECT title, available_copies, total_copies FROM books 
         WHERE school_code = $1 AND LOWER(title) LIKE $2`,
        [schoolCode, `%${(searchQuery || '').toLowerCase()}%`]
      );
      result = books.rows;
    }

    res.json({ status: 'success', action, result });
  } catch (err) {
    console.error('Chat action error:', err);
    res.status(500).json({ status: 'error', message: 'Action failed' });
  }
});

// ── Scanner Vision & OCR Endpoints ─────────────────────────────────

// 7. Scan book cover and extract details using AI Vision
router.post('/scan-ocr-text', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'error', message: 'No image uploaded' });
    const imageBase64 = fs.readFileSync(req.file.path).toString('base64');
    const bookDetails = await aiService.analyzeBookCover(imageBase64);
    // Clean up uploaded temp file
    try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore cleanup errors */ }
    res.json({ status: 'success', ...bookDetails });
  } catch (err) {
    console.error('Scanner vision error:', err);
    res.status(500).json({ status: 'error', message: 'Vision analysis failed' });
  }
});

// 8. OCR text extraction from image
router.post('/ocr-extract', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'error', message: 'No image uploaded' });
    const imageBase64 = fs.readFileSync(req.file.path).toString('base64');
    const text = await aiService.extractTextOCR(imageBase64);
    try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore cleanup errors */ }
    res.json({ status: 'success', text });
  } catch (err) {
    console.error('OCR extraction error:', err);
    res.status(500).json({ status: 'error', message: 'OCR extraction failed' });
  }
});

// ── Mobile API Endpoints ───────────────────────────────────────────

// 9. Mobile Dashboard
router.get('/mobile/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);

    // Current borrowings
    const borrowings = await query(
      `SELECT t.*, b.title, b.author, b.cover_image FROM transactions t 
       JOIN books b ON t.book_id = b.id 
       WHERE t.user_id = $1 AND t.status = 'issued' ORDER BY t.due_date ASC`,
      [userId]
    );

    // Recent notifications
    const notifications = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    // User stats
    const user = await query(
      `SELECT name, role, physical_score, digital_score, overall_score, badges, reading_streak FROM users WHERE id = $1`,
      [userId]
    );

    res.json({
      status: 'success',
      user: user.rows[0] || {},
      borrowings: borrowings.rows,
      notifications: notifications.rows
    });
  } catch (err) {
    console.error('Mobile dashboard error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to load dashboard' });
  }
});

// 10. Mobile Book Search/Browse
router.get('/mobile/books', authMiddleware, async (req, res) => {
  try {
    const { q, genre, page = 1, limit = 20 } = req.query;
    const schoolCode = req.school_code || (req.session && req.session.school_code);
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let sql = `SELECT id, title, author, isbn, genre, cover_image, available_copies, total_copies 
               FROM books WHERE school_code = $1`;
    const params = [schoolCode];
    let paramIdx = 2;

    if (q) {
      sql += ` AND (LOWER(title) LIKE $${paramIdx} OR LOWER(author) LIKE $${paramIdx} OR isbn LIKE $${paramIdx})`;
      params.push(`%${q.toLowerCase()}%`);
      paramIdx++;
    }
    if (genre) {
      sql += ` AND LOWER(genre) = $${paramIdx}`;
      params.push(genre.toLowerCase());
      paramIdx++;
    }

    sql += ` ORDER BY title ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(parseInt(limit), offset);

    const books = await query(sql, params);
    res.json({ status: 'success', books: books.rows, page: parseInt(page) });
  } catch (err) {
    console.error('Mobile books error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to load books' });
  }
});

// 11. Mobile Borrowings History
router.get('/mobile/borrowings', authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await query(
      `SELECT t.*, b.title, b.author, b.cover_image FROM transactions t 
       JOIN books b ON t.book_id = b.id 
       WHERE t.user_id = $1 ORDER BY t.created_at DESC LIMIT 50`,
      [userId]
    );
    res.json({ status: 'success', borrowings: result.rows });
  } catch (err) {
    console.error('Mobile borrowings error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to load borrowings' });
  }
});

// 12. Mobile Reserve Book
router.post('/mobile/reserve', authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    const schoolCode = req.school_code || (req.session && req.session.school_code);
    const { book_id } = req.body;
    if (!book_id) return res.status(400).json({ status: 'error', message: 'Book ID required' });

    // Check book exists in school
    const book = await query('SELECT available_copies FROM books WHERE id = $1 AND school_code = $2',
      [book_id, schoolCode]);
    if (book.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Book not found' });

    // Check existing reservation
    const existing = await query(
      `SELECT id FROM reservations WHERE user_id = $1 AND book_id = $2 AND status = 'active'`,
      [userId, book_id]
    );
    if (existing.rows.length > 0) return res.json({ status: 'error', message: 'Already reserved' });

    await query(
      `INSERT INTO reservations (user_id, book_id, school_code, status, created_at) VALUES ($1, $2, $3, 'active', NOW())`,
      [userId, book_id, schoolCode]
    );

    res.json({ status: 'success', message: 'Book reserved successfully' });
  } catch (err) {
    console.error('Mobile reserve error:', err);
    res.status(500).json({ status: 'error', message: 'Reservation failed' });
  }
});

module.exports = router;



// Real-time Notification Polling Endpoint
// Real-time 1-Second Top-Down Notification Polling Endpoint
// Real-time Top-Down Notification Polling Endpoint (Admin & Student)
// Real-time Top-Down Notification Polling Endpoint (Role-Aware Admin & Student)
router.get('/notifications/poll', async (req, res) => {
  try {
    const userId = req.session ? (req.session.user_id || req.session.id || 0) : 0;
    const sCode  = req.session ? (req.session.school_code || 'GLOBAL') : 'GLOBAL';
    const uRole  = req.session ? (req.session.role || 'student') : 'student';
    const isAdmin = (uRole === 'admin' || uRole === 'super_admin' || uRole === 'superadmin' || uRole === 'librarian');

    const db = require('../db');
    const sinceId = parseInt(req.query.since_id || '0', 10);

    // Build role-appropriate SQL query
    let countSql, listSql, countParams, listParams;

    if (isAdmin) {
      // Admin sees ALL school alerts, book requests, reservations, and admin-targeted notifications
      countSql = `SELECT COUNT(*) as c FROM notifications WHERE (school_code = $1 OR school_code = 'GLOBAL' OR user_id = $2 OR user_id = 0) AND (is_read = false OR is_read = '0' OR is_read IS NULL)`;
      countParams = [sCode, userId];

      if (sinceId === 0) {
        listSql = `SELECT id, message, type, created_at FROM notifications WHERE (school_code = $1 OR school_code = 'GLOBAL' OR user_id = $2 OR user_id = 0) AND (is_read = false OR is_read = '0' OR is_read IS NULL) ORDER BY id DESC LIMIT 5`;
        listParams = [sCode, userId];
      } else {
        listSql = `SELECT id, message, type, created_at FROM notifications WHERE (school_code = $1 OR school_code = 'GLOBAL' OR user_id = $2 OR user_id = 0) AND id > $3 ORDER BY id ASC LIMIT 5`;
        listParams = [sCode, userId, sinceId];
      }
    } else {
      // Student sees their own notifications + global school broadcasts
      countSql = `SELECT COUNT(*) as c FROM notifications WHERE (user_id = $1 OR (school_code = $2 AND (user_id IS NULL OR user_id = 0))) AND (is_read = false OR is_read = '0' OR is_read IS NULL)`;
      countParams = [userId, sCode];

      if (sinceId === 0) {
        listSql = `SELECT id, message, type, created_at FROM notifications WHERE (user_id = $1 OR (school_code = $2 AND (user_id IS NULL OR user_id = 0))) AND (is_read = false OR is_read = '0' OR is_read IS NULL) ORDER BY id DESC LIMIT 5`;
        listParams = [userId, sCode];
      } else {
        listSql = `SELECT id, message, type, created_at FROM notifications WHERE (user_id = $1 OR (school_code = $2 AND (user_id IS NULL OR user_id = 0))) AND id > $3 ORDER BY id ASC LIMIT 5`;
        listParams = [userId, sCode, sinceId];
      }
    }

    const countRes = await db.query(countSql, countParams).catch(() => ({ rows: [{ c: 0 }] }));
    const unreadCount = parseInt(countRes.rows[0].c, 10) || 0;

    const listRes = await db.query(listSql, listParams).catch(() => ({ rows: [] }));
    const newNotifs = listRes.rows || [];

    const maxRes = await db.query(`SELECT MAX(id) as m FROM notifications`).catch(() => ({ rows: [{ m: 0 }] }));
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
