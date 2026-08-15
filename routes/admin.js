const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const aiService = require('../services/aiService');
const { logActivity, ensureSecurityTables } = require('../services/auditLogger');
require('dotenv').config();

const upload = multer({ dest: path.join(__dirname, '..', 'static', 'uploads') });

// Strict Router-Level RBAC Guard: Super Admin must NEVER load Librarian views
router.use(async (req, res, next) => {
  if (req.session && req.session.user_id) {
    try {
      const uRes = await db.query('SELECT role FROM users WHERE id = $1', [req.session.user_id]);
      if (uRes && uRes.rows && uRes.rows.length > 0) {
        const dbRole = uRes.rows[0].role;
        req.session.role = dbRole;
        if (dbRole === 'super_admin' || dbRole === 'superadmin') {
          return res.redirect('/super-admin');
        }
      }
    } catch(e) {}
  }
  if (req.session && (req.session.role === 'super_admin' || req.session.role === 'superadmin')) {
    return res.redirect('/super-admin');
  }
  next();
});

function adminOnly(req, res, next) {
  if (req.session && (req.session.role === 'admin' || req.session.role === 'super_admin' || req.session.role === 'superadmin')) return next();
  req.flash('error', 'Access denied. Admin login required.');
  return res.redirect('/login');
}

function hasPerm(req, perm) {
  if (req.session && (req.session.role === 'admin' || req.session.role === 'super_admin' || req.session.role === 'superadmin')) return true;
  const perms = req.session.permissions || [];
  return perms.includes(perm);
}

function renderDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function dueDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Dashboard ────────────────────────────────────────────────────────
router.get('/', adminOnly, async (req, res) => {
  if (req.session && (req.session.role === 'super_admin' || req.session.role === 'superadmin')) {
    return res.redirect('/super-admin');
  }
  const sCode = req.session.school_code;
  const classFilter = req.query.class;
  try {
    let query = `SELECT t.*, u.name as user_name, u.admission_no as user_admission, u.phone as user_phone,
                        b.title as book_title, b.barcode_id as book_barcode
                 FROM transactions t
                 JOIN users u ON t.user_id = u.id
                 JOIN books b ON t.book_id = b.id
                 WHERE t.return_date IS NULL AND t.school_code = $1`;
    const params = [sCode];
    if (classFilter) { query += ` AND u.class = $2`; params.push(classFilter); }
    query += ` ORDER BY t.issue_date DESC`;
    const txRes = await db.query(query, params);
    const transactions = txRes.rows.map(tx => {
      const fine = calculateFine(tx.due_date);
      return { ...tx, ...fine };
    });

    const availRes = await db.query('SELECT SUM(available_copies) FROM books WHERE school_code = $1', [sCode]);
    const availableBooks = parseInt(availRes.rows[0].sum) || 0;
    const booksRes = await db.query('SELECT * FROM books WHERE school_code = $1 ORDER BY id DESC', [sCode]);
    const books = booksRes.rows;
    const totalIssued = (await db.query('SELECT COUNT(*) FROM transactions WHERE return_date IS NULL AND school_code = $1', [sCode])).rows[0].count;
    const totalReturned = (await db.query('SELECT COUNT(*) FROM transactions WHERE return_date IS NOT NULL AND school_code = $1', [sCode])).rows[0].count;

    const resvRes = await db.query(
      `SELECT r.id, r.user_id, r.book_id, r.status, r.created_at,
              u.name as student_name, u.phone as student_phone,
              b.title as book_title, b.author as book_author, b.available_copies
       FROM reservations r
       JOIN users u ON u.id = r.user_id
       JOIN books b ON b.id = r.book_id
       WHERE r.school_code = $1 AND r.status = 'Pending'
       ORDER BY r.created_at ASC`, [sCode]);
    const reservations = resvRes.rows;

    let students = [];
    let totalStudentsVal = 0;
    if (hasPerm(req, 'manage_students')) {
      const stuRes = await db.query('SELECT * FROM users WHERE school_code = $1 ORDER BY id DESC', [sCode]);
      students = stuRes.rows;
      totalStudentsVal = students.filter(u => u.role === 'student').length;
    }

    // Pending reviews
    const revRes = await db.query(
      `SELECT r.id, r.user_id, r.book_id, r.book_type, r.learned, r.favorite, r.recommend, r.status, r.created_at,
              u.name as student_name, COALESCE(b.title, d.title) as book_title
       FROM book_reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN books b ON r.book_id = b.id AND r.book_type = 'physical'
       LEFT JOIN digital_content d ON r.book_id = d.id AND r.book_type = 'digital'
       WHERE r.status = 'pending' AND r.school_code = $1`, [sCode]);
    const pendingReviews = revRes.rows;

        // Digital items
    const digRes = await db.query(
      `SELECT * FROM digital_content WHERE school_code = $1 OR school_code = 'GLOBAL' ORDER BY id DESC LIMIT 50`,
      [sCode]
    ).catch(() => ({ rows: [] }));
    const digitalItems = digRes.rows || [];

    // Notifications list
    const userId = req.session ? req.session.user_id : 0;
    const notifRes = await db.query(
      `SELECT * FROM notifications WHERE school_code = $1 OR user_id = $2 OR school_code = 'GLOBAL' ORDER BY id DESC LIMIT 50`,
      [sCode, userId]
    ).catch(() => ({ rows: [] }));
    const notificationsList = notifRes.rows || [];

    const overdueCount = transactions.filter(t => t.is_overdue).length;

    res.render('admin', {
      title: (req.session && (req.session.role === 'super_admin' || req.session.role === 'superadmin')) ? 'Super Admin Dashboard - librika.in' : 'Admin Dashboard - librika.in',
      transactions,
      classFilter,
      available_books: availableBooks,
      books,
      overdue_count: overdueCount,
      students,
      total_students: totalStudentsVal,
      total_issued: totalIssued,
      total_returned: totalReturned,
      reservations,
      pending_reviews: pendingReviews,
          digital_items: digitalItems,
      notifications_list: notificationsList,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    req.flash('error', 'Failed to load admin dashboard');
    res.redirect('/');
  }
});


function calculateFine(dueDateStr) {
  if (!dueDateStr) return { fine: 0, is_overdue: false };
  const due = new Date(dueDateStr);
  const today = new Date();
  if (today > due) {
    const days = Math.floor((today - due) / (1000 * 60 * 60 * 24));
    return { fine: days * 5, is_overdue: true };
  }
  return { fine: 0, is_overdue: false };
}

async function updateScore(conn, userId, scoreType, points, description) {
  const user = (await conn.query('SELECT physical_reader_score, digital_reader_score, overall_reader_score, school_code FROM users WHERE id = $1', [userId])).rows[0];
  if (!user) return;
  let phys = parseInt(user.physical_reader_score) || 0;
  let dig = parseInt(user.digital_reader_score) || 0;
  if (scoreType === 'physical') phys = Math.max(0, phys + points);
  else if (scoreType === 'digital') dig = Math.max(0, dig + points);
  const overall = phys + dig;
  await conn.query('UPDATE users SET physical_reader_score = $1, digital_reader_score = $2, overall_reader_score = $3 WHERE id = $4',
    [phys, dig, overall, userId]);
  await conn.query('INSERT INTO points_log (user_id, points, score_type, description, created_at, school_code) VALUES ($1, $2, $3, $4, $5, $6)',
    [userId, points, scoreType, description, nowStr(), user.school_code]);
  await checkAndAwardBadges(conn, userId);
}

async function checkAndAwardBadges(conn, userId) {
  const user = (await conn.query('SELECT * FROM users WHERE id = $1', [userId])).rows[0];
  if (!user) return;
  const physDone = (await conn.query('SELECT COUNT(*) as c FROM transactions WHERE user_id = $1 AND return_date IS NOT NULL AND return_date != $2', [userId, 'LOST'])).rows[0].c;
  const digDone = (await conn.query('SELECT COUNT(*) as c FROM reading_progress WHERE student_id = $1 AND last_page >= total_pages AND total_pages > 1', [userId])).rows[0].c;
  const totalDone = parseInt(physDone) + parseInt(digDone);
  const quizzesPassed = (await conn.query('SELECT COUNT(*) as c FROM quiz_attempts WHERE user_id = $1 AND passed = 1', [userId])).rows[0].c;
  const reviewsApproved = (await conn.query('SELECT COUNT(*) as c FROM book_reviews WHERE user_id = $1 AND status = $2', [userId, 'approved'])).rows[0].c;
  const overallScore = parseInt(user.overall_reader_score) || 0;
  const streak = parseInt(user.reading_streak) || 0;
  let badges = [];
  try { badges = JSON.parse(user.badges || '[]'); } catch(e) {}
  const newBadges = [...badges];
  if (totalDone >= 1 && !newBadges.includes('First Book Completed')) newBadges.push('First Book Completed');
  if (totalDone >= 5 && !newBadges.includes('5 Books Completed')) newBadges.push('5 Books Completed');
  if (totalDone >= 10 && !newBadges.includes('10 Books Completed')) newBadges.push('10 Books Completed');
  if (totalDone >= 25 && !newBadges.includes('25 Books Completed')) newBadges.push('25 Books Completed');
  if (totalDone >= 50 && !newBadges.includes('50 Books Completed')) newBadges.push('50 Books Completed');
  if (quizzesPassed >= 5 && !newBadges.includes('Quiz Master')) newBadges.push('Quiz Master');
  if (reviewsApproved >= 5 && !newBadges.includes('Review Expert')) newBadges.push('Review Expert');
  if (overallScore >= 500 && !newBadges.includes('Reading Champion')) newBadges.push('Reading Champion');
  await conn.query('UPDATE users SET quizzes_passed = $1, approved_reviews = $2, badges = $3 WHERE id = $4',
    [quizzesPassed, reviewsApproved, JSON.stringify(newBadges), userId]);
}

async function check90DayCooldown(conn, userId, bookId, bookType) {
  const cooldown = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  const pastPass = (await conn.query(
    'SELECT attempted_at FROM quiz_attempts WHERE user_id = $1 AND book_id = $2 AND book_type = $3 AND passed = 1 ORDER BY attempted_at DESC LIMIT 1',
    [userId, bookId, bookType])).rows[0];
  if (pastPass && pastPass.attempted_at > cooldown) return true;
  if (bookType === 'physical') {
    const pastReturn = (await conn.query(
      "SELECT return_date FROM transactions WHERE user_id = $1 AND book_id = $2 AND return_date IS NOT NULL AND return_date != 'LOST' ORDER BY return_date DESC LIMIT 1",
      [userId, bookId])).rows[0];
    if (pastReturn) {
      const lastReturn = pastReturn.return_date + ' 23:59';
      if (lastReturn > cooldown) return true;
    }
  } else {
    const pastComplete = (await conn.query(
      'SELECT completed_at FROM reading_progress WHERE student_id = $1 AND content_id = $2 AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 1',
      [userId, bookId])).rows[0];
    if (pastComplete && pastComplete.completed_at > cooldown) return true;
  }
  return false;
}


// ── Reservation APIs ────────────────────────────────────────────
router.post('/api/reservation/:resId/approve', adminOnly, async (req, res) => {
  const { resId } = req.params;
  const sCode = req.session.school_code;
  try {
    const resv = (await db.query(`SELECT * FROM reservations WHERE id = $1 AND school_code = $2 AND status = 'Pending'`, [resId, sCode])).rows[0];
    if (!resv) return res.json({ status: 'error', message: 'Reservation not found or already processed' });
    const book = (await db.query('SELECT * FROM books WHERE id = $1', [resv.book_id])).rows[0];
    if (!book) return res.json({ status: 'error', message: 'Book not found' });
    if (parseInt(book.available_copies) < 1) return res.json({ status: 'error', message: 'No copies available' });
    const dDate = dueDate(14);
    await db.query('INSERT INTO transactions (user_id, book_id, issue_date, due_date, school_code) VALUES ($1,$2,$3,$4,$5)',
      [resv.user_id, resv.book_id, renderDate(new Date()), dDate, sCode]);
    await db.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [resv.book_id]);
    await db.query("UPDATE reservations SET status = 'Approved' WHERE id = $1", [resId]);
    await db.query('INSERT INTO notifications (user_id, message, type, created_at, school_code) VALUES ($1,$2,$3,$4,$5)',
      [resv.user_id, `Your reservation for '${book.title}' has been approved (due ${dDate}).`, 'reservation_approved', nowStr(), sCode]);
    res.json({ status: 'success' });
  } catch (err) { console.error(err); res.json({ status: 'error', message: err.message }); }
});

router.post('/api/reservation/:resId/reject', adminOnly, async (req, res) => {
  const { resId } = req.params;
  const sCode = req.session.school_code;
  try {
    const resv = (await db.query(`SELECT * FROM reservations WHERE id = $1 AND school_code = $2 AND status = 'Pending'`, [resId, sCode])).rows[0];
    if (!resv) return res.json({ status: 'error', message: 'Reservation not found' });
    const book = (await db.query('SELECT title FROM books WHERE id = $1', [resv.book_id])).rows[0];
    await db.query("UPDATE reservations SET status = 'Rejected' WHERE id = $1", [resId]);
    if (book) {
      await db.query('INSERT INTO notifications (user_id, message, type, created_at, school_code) VALUES ($1,$2,$3,$4,$5)',
        [resv.user_id, `Your reservation for '${book.title}' has been declined.`, 'reservation_rejected', nowStr(), sCode]);
    }
    res.json({ status: 'success' });
  } catch (err) { console.error(err); res.json({ status: 'error', message: err.message }); }
});

router.post(['/notifications/read-all', '/api/notifications/read-all'], adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'GLOBAL';
  const uId = req.session.user_id || 0;
  try {
    await db.query(
      `UPDATE notifications SET is_read = 1 WHERE (school_code = $1 OR school_code = 'GLOBAL' OR user_id = $2 OR user_id = 0 OR user_id IS NULL)`,
      [sCode, uId]
    );
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({ success: true, message: 'All notifications marked as read' });
    }
    return res.redirect('/admin?tab=notifications');
  } catch (err) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(500).json({ success: false, error: err.message });
    }
    return res.redirect('/admin?tab=notifications');
  }
});


// ── Student Management ──────────────────────────────────────────
router.post('/student/add', adminOnly, async (req, res) => {
  if (!hasPerm(req, 'manage_students')) return res.redirect('/admin');
  const sCode = req.session.school_code || '00000';
  const { name, admission_no, phone, class: cls, password, email, reqEmail, role, school_code } = req.body;
  const sc = (school_code || sCode || '00000').toUpperCase();
  const targetEmail = email || reqEmail || (name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000) + '@gmail.com');
  const targetPass  = password || 'librika123';
  const targetPhone = phone || ('9' + Math.floor(100000000 + Math.random() * 900000000));

  try {
    const dup = (await db.query('SELECT id FROM users WHERE email = $1 OR (phone = $2 AND phone IS NOT NULL AND phone != "")', [targetEmail, targetPhone])).rows[0];
    if (dup) { 
      req.flash('error', 'Email or Phone already registered in system'); 
      return res.redirect('/admin?tab=members'); 
    }
    
    let nextId = Date.now();
    try {
      const maxRes = await db.query('SELECT MAX(CAST(id AS UNSIGNED)) as max_id FROM users');
      if (maxRes && maxRes.rows && maxRes.rows[0]) {
        const mVal = parseInt(maxRes.rows[0].max_id || maxRes.rows[0].MAX_ID || 0, 10);
        if (!isNaN(mVal) && mVal > 0) nextId = mVal + 1;
      }
    } catch (e) {}

    await db.query(
      'INSERT INTO users (id, name, admission_no, phone, class, role, password, school_code, email, is_banned) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0)',
      [nextId, name, admission_no || null, targetPhone, cls || null, role || 'student', targetPass, sc, targetEmail]);
    
    req.flash('success', `Member ${name} successfully registered! Email: ${targetEmail}, Pass: ${targetPass}`);
    res.redirect('/admin?tab=members');
  } catch (err) {
    console.error('Error adding member:', err);
    req.flash('error', 'Failed to add member: ' + (err.message || 'Error'));
    res.redirect('/admin?tab=members');
  }
});

router.post('/student/:id/toggle-ban', adminOnly, async (req, res) => {
  if (!hasPerm(req, 'manage_students')) return res.redirect('/admin');
  const sCode = req.session.school_code;
  const { id } = req.params;
  try {
    const user = (await db.query('SELECT * FROM users WHERE id = $1 AND school_code = $2', [id, sCode])).rows[0];
    if (user) {
      const newStatus = (user.is_banned && (user.is_banned === true || user.is_banned === '1' || user.is_banned === 1)) ? 0 : 1;
      await db.query('UPDATE users SET is_banned = $1 WHERE id = $2', [newStatus, id]);
    }
    res.redirect('/admin');
  } catch (err) { console.error(err); res.redirect('/admin'); }
});

router.post('/student/:id/delete', adminOnly, async (req, res) => {
  if (!hasPerm(req, 'manage_students')) return res.redirect('/admin');
  const sCode = req.session.school_code;
  const { id } = req.params;
  try {
    const user = (await db.query('SELECT * FROM users WHERE id = $1 AND school_code = $2', [id, sCode])).rows[0];
    if (user) await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.redirect('/admin');
  } catch (err) { console.error(err); res.redirect('/admin'); }
});


// ── Settings ─────────────────────────────────────────────────────
router.get('/settings', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  try {
    const school = (await db.query('SELECT * FROM schools WHERE school_code = $1', [sCode])).rows[0];
    res.render('admin_settings', { title: 'Settings - librika.in', school });
  } catch (err) { console.error(err); res.redirect('/admin'); }
});

router.post('/settings', adminOnly, async (req, res) => {
  const oldCode = req.session.school_code;
  const { new_code, new_name, due_days } = req.body;
  try {
    if (new_code && new_code.toUpperCase() !== oldCode) {
      const nc = new_code.toUpperCase();
      await db.query('UPDATE schools SET school_code = $1, name = $2, due_days = $3 WHERE school_code = $4',
        [nc, new_name, parseInt(due_days) || 3, oldCode]);
      await db.query('UPDATE users SET school_code = $1 WHERE school_code = $2', [nc, oldCode]);
      await db.query('UPDATE books SET school_code = $1 WHERE school_code = $2', [nc, oldCode]);
      await db.query('UPDATE transactions SET school_code = $1 WHERE school_code = $2', [nc, oldCode]);
      req.session.destroy(() => res.redirect('/login'));
      return;
    }
    await db.query('UPDATE schools SET name = $1, due_days = $2 WHERE school_code = $3',
      [new_name, parseInt(due_days) || 3, oldCode]);
    req.flash('success', 'Settings updated');
    res.redirect('/admin/settings');
  } catch (err) { console.error(err); res.redirect('/admin/settings'); }
});


// ── Add Book ──────────────────────────────────────────────────────
router.get(['/add_book', '/book/add'], adminOnly, (req, res) => {
  if (!hasPerm(req, 'manage_books')) return res.redirect('/admin');
  res.render('add_book', { title: 'Add Book - librika.in' });
});

router.post(['/add_book', '/book/add'], adminOnly, async (req, res) => {
  if (!hasPerm(req, 'manage_books')) return res.redirect('/admin');
  const sCode = req.session.school_code;
  const { title, author, genre, copies, isbn, description } = req.body;
  try {
    const barcodeId = isbn || String(Date.now()).slice(-12);
    const bwipjs = require('bwip-js');
    const barcodeDir = path.join(__dirname, '..', 'static', 'barcodes');
    if (!require('fs').existsSync(barcodeDir)) require('fs').mkdirSync(barcodeDir, { recursive: true });
    await new Promise((resolve, reject) => {
      bwipjs.toBuffer({ bcid: 'code128', text: barcodeId, scale: 3, height: 10, includetext: true, textxalign: 'center' }, (err, buf) => {
        if (err) return reject(err);
        require('fs').writeFileSync(path.join(barcodeDir, barcodeId + '.png'), buf);
        resolve();
      });
    });
    const insertRes = await db.query(
      'INSERT INTO books (title, author, genre, barcode_id, total_copies, available_copies, school_code, description, isbn) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
      [title, author, genre || 'General', barcodeId, parseInt(copies) || 1, parseInt(copies) || 1, sCode, description || null, isbn || null]);
    
    const bookId = (insertRes.rows && insertRes.rows.length > 0) ? insertRes.rows[0].id : (insertRes.lastId || null);
    if (!description) {
      aiService.generateBookDescription(title, author, isbn).then(desc => {
        db.query('UPDATE books SET description = $1 WHERE id = $2', [desc, bookId]).catch(console.error);
      }).catch(console.error);
    }
    
    req.flash('success', 'Book added successfully!');
    res.redirect('/admin');
  } catch (err) { console.error(err); req.flash('error', 'Failed to add book'); res.redirect('/admin/add_book'); }
});


// ── Issue Book ────────────────────────────────────────────────────
router.get('/issue', adminOnly, async (req, res) => {
  if (!hasPerm(req, 'manage_transactions')) return res.redirect('/admin');
  const sCode = req.session.school_code;
  try {
    const students = (await db.query("SELECT * FROM users WHERE role = 'student' AND school_code = $1", [sCode])).rows;
    const books = (await db.query('SELECT * FROM books WHERE available_copies > 0 AND school_code = $1', [sCode])).rows;
    const selectedBookId = req.query.book_id ? parseInt(req.query.book_id) : null;
    res.render('issue_book', { title: 'Issue Book - librika.in', students, books, selectedBookId });
  } catch (err) { console.error(err); res.redirect('/admin'); }
});

router.post('/issue', adminOnly, async (req, res) => {
  if (!hasPerm(req, 'manage_transactions')) return res.redirect('/admin');
  const sCode = req.session.school_code;
  const { student_id, barcode_id, book_id } = req.body;
  try {
    let book = null;
    if (barcode_id) {
      book = (await db.query('SELECT * FROM books WHERE barcode_id = $1 AND available_copies > 0 AND school_code = $2', [barcode_id, sCode])).rows[0];
    } else if (book_id) {
      book = (await db.query('SELECT * FROM books WHERE id = $1 AND available_copies > 0 AND school_code = $2', [book_id, sCode])).rows[0];
    }
    if (!book) {
      req.flash('error', 'Book not available');
      return res.redirect('/admin/issue');
    }
    const student = (await db.query('SELECT * FROM users WHERE id = $1 AND school_code = $2', [student_id, sCode])).rows[0];
    if (!student) {
      req.flash('error', 'Student not found');
      return res.redirect('/admin/issue');
    }
    const issueDate = renderDate(new Date());
    const dDate = dueDate(3);
    await db.query('INSERT INTO transactions (user_id, book_id, issue_date, due_date, class, school_code) VALUES ($1,$2,$3,$4,$5,$6)',
      [student_id, book.id, issueDate, dDate, student.class, sCode]);
    await db.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book.id]);
    if (!(await check90DayCooldown(pool, student_id, book.id, 'physical'))) {
      await updateScore(pool, student_id, 'physical', 5, `Issued book '${book.title}'`);
    }
    req.flash('success', `'${book.title}' issued to ${student.name}`);
    res.redirect('/admin');
  } catch (err) { console.error(err); req.flash('error', 'Failed to issue book'); res.redirect('/admin/issue'); }
});

// ── Return Book ─────────────────────────────────────────────────────
router.get('/return/:txId', adminOnly, async (req, res) => {
  if (!hasPerm(req, 'manage_transactions')) return res.redirect('/admin');
  const sCode = req.session.school_code;
  const { txId } = req.params;
  try {
    const tx = (await db.query('SELECT * FROM transactions WHERE id = $1 AND school_code = $2', [txId, sCode])).rows[0];
    if (tx && !tx.return_date) {
      const returnDate = renderDate(new Date());
      await db.query('UPDATE transactions SET return_date = $1 WHERE id = $2', [returnDate, txId]);
      await db.query('UPDATE books SET available_copies = available_copies + 1 WHERE id = $1', [tx.book_id]);

      const dueDate = new Date(tx.due_date);
      const retDate = new Date(returnDate);
      const book = (await db.query('SELECT pages, title FROM books WHERE id = $1', [tx.book_id])).rows[0];
      const pages = parseInt(book.pages) || 120;
      const issueDate = new Date(tx.issue_date);
      const daysKept = Math.floor((retDate - issueDate) / (1000 * 60 * 60 * 24));

      const cooldownApplies = await check90DayCooldown(pool, tx.user_id, tx.book_id, 'physical');
      let meetsMinPeriod = true;
      if (pages < 100 && daysKept < 2) meetsMinPeriod = false;
      else if (pages <= 300 && daysKept < 5) meetsMinPeriod = false;
      else if (pages > 300 && daysKept < 7) meetsMinPeriod = false;

      if (!cooldownApplies && meetsMinPeriod) {
        if (retDate <= dueDate) {
          await updateScore(pool, tx.user_id, 'physical', 15, `Returned '${book.title}' on time`);
          req.flash('success', 'Book returned on time. +15 points to student.');
        } else {
          await updateScore(pool, tx.user_id, 'physical', -20, `Returned '${book.title}' late`);
          req.flash('warning', 'Book returned late. -20 points from student.');
        }
      } else if (!meetsMinPeriod) {
        req.flash('warning', `Book returned (${daysKept} days). Minimum reading period not met.`);
      } else {
        req.flash('info', 'Book returned. Cooldown active, no points updated.');
      }
    }
    res.redirect('/admin');
  } catch (err) { console.error(err); res.redirect('/admin'); }
});


// ── Acquisitions ──────────────────────────────────────────────────
router.get('/acquisitions', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  try {
    const acqs = (await db.query(
      `SELECT a.*, v.name as vendor_name, u.name as user_name
       FROM acquisitions a
       JOIN vendors v ON a.vendor_id = v.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.school_code = $1
       ORDER BY a.id DESC`, [sCode])).rows;
    const vendors = (await db.query("SELECT * FROM vendors WHERE (school_code = $1 OR school_code = 'GLOBAL') AND status = 'active'", [sCode])).rows;
    const stats = {
      total_acquisitions: (await db.query('SELECT COUNT(*) as c FROM acquisitions WHERE school_code = $1', [sCode])).rows[0].c,
      total_books: acqs.reduce((a, r) => a + parseInt(r.total_books || 0), 0),
      total_copies: acqs.reduce((a, r) => a + parseInt(r.total_copies || 0), 0),
      total_value: acqs.reduce((a, r) => a + parseFloat(r.total_amount || 0), 0),
    };
    res.render('admin_acquisitions', { title: 'Acquisitions - librika.in', acquisitions: acqs, vendors, stats });
  } catch (err) { console.error(err); res.redirect('/admin'); }
});

router.post('/acquisitions/ocr', adminOnly, upload.single('invoice_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, error: 'No file uploaded' });
    }
    const fs = require('fs');
    const imgBuf = fs.readFileSync(req.file.path);
    const base64Str = 'data:image/jpeg;base64,' + imgBuf.toString('base64');
    
    const extractedText = await aiService.extractTextOCR(base64Str);
    
    res.json({
      success: true,
      extracted_text: extractedText,
      bill_number: 'INV-' + Date.now().toString().slice(-6),
      bill_date: renderDate(new Date()),
      vendor_name: 'OCR Extracted',
      total_amount: 0,
      items: [{ isbn: '', title: 'See extracted text', author: 'Unknown', quantity: 1, unit_price: 0, shelf: '', rack: '' }]
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

router.post('/sync-cloudinary', adminOnly, async (req, res) => {
  try {
    res.json({ success: true, message: 'Cloudinary sync triggered' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/acquisitions/isbn-lookup', async (req, res) => {
  const isbn = req.query.isbn;
  if (!isbn) return res.json({ success: false });
  try {
    const https = require('https');
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    https.get(url, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try {
          const json = JSON.parse(data);
          const key = `ISBN:${isbn}`;
          if (json[key]) {
            const b = json[key];
            return res.json({
              success: true,
              title: b.title || '',
              author: (b.authors || []).map(a => a.name).join(', '),
              publisher: (b.publishers || []).map(p => p.name).join(', '),
              category: ((b.subjects || [])[0] || {}).name || 'General',
            });
          }
        } catch(e) {}
        res.json({ success: false, message: 'Not found' });
      });
    }).on('error', () => res.json({ success: false }));
  } catch(e) { res.json({ success: false }); }
});

router.get('/acquisitions/get/:acqId', adminOnly, async (req, res) => {
  const { acqId } = req.params;
  try {
    const acq = (await db.query('SELECT * FROM acquisitions WHERE id = $1', [acqId])).rows[0];
    const items = (await db.query(
      `SELECT ai.*, b.publisher, b.isbn as book_isbn, b.genre as category, b.language, bc.shelf, bc.rack
       FROM acquisition_items ai
       LEFT JOIN books b ON ai.book_id = b.id
       LEFT JOIN book_copies bc ON bc.book_id = ai.book_id AND bc.acquisition_id = ai.acquisition_id
       WHERE ai.acquisition_id = $1`, [acqId])).rows;
    res.json({ acquisition: acq, items });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/acquisitions/complete', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const userId = req.session.user_id;
  const { acquisition_id, vendor_name, vendor_id, bill_number, bill_date, total_amount, items, invoice_image } = req.body;
  try {
    let vId = vendor_id;
    if (!vId && vendor_name) {
      const existingVendor = (await db.query('SELECT id FROM vendors WHERE name = $1 AND school_code = $2', [vendor_name, sCode])).rows[0];
      if (existingVendor) {
        vId = existingVendor.id;
      } else {
        const vRes = await db.query('INSERT INTO vendors (school_code, name, created_at) VALUES ($1,$2,$3) RETURNING id',
          [sCode, vendor_name, nowStr()]);
        vId = (vRes.rows && vRes.rows.length > 0) ? vRes.rows[0].id : (vRes.lastId || null);
      }
    }
    let acqId = acquisition_id;
    if (acqId) {
      // edit existing
      await db.query('UPDATE acquisitions SET bill_number=$1, bill_date=$2, vendor_id=$3, total_amount=$4, last_updated=$5 WHERE id=$6',
        [bill_number, bill_date, vId, total_amount, nowStr(), acqId]);
      // remove old items & copies
      const oldItems = (await db.query('SELECT id FROM acquisition_items WHERE acquisition_id = $1', [acqId])).rows;
      for (const oi of oldItems) {
        await db.query('DELETE FROM book_copies WHERE acquisition_id = $1', [acqId]);
      }
      await db.query('DELETE FROM acquisition_items WHERE acquisition_id = $1', [acqId]);
    } else {
      const acqRes = await db.query(
        'INSERT INTO acquisitions (school_code, bill_number, bill_date, vendor_id, total_books, total_copies, total_amount, status, created_by, created_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
        [sCode, bill_number, bill_date, vId, items.length, items.reduce((a,i) => a + parseInt(i.quantity || 1), 0), total_amount || 0, 'Completed', userId, nowStr()]);
      acqId = (acqRes.rows && acqRes.rows.length > 0) ? acqRes.rows[0].id : (acqRes.lastId || null);
      if (invoice_image) {
        await db.query('UPDATE acquisitions SET invoice_image = $1 WHERE id = $2', [invoice_image, acqId]);
      }
    }

    for (const item of items) {
      // find or create book
      let bookId = item.book_id;
      if (!bookId) {
        const existingBook = (await db.query('SELECT id FROM books WHERE isbn = $1 AND school_code = $2', [item.isbn || '', sCode])).rows[0];
        if (existingBook) {
          bookId = existingBook.id;
          await db.query('UPDATE books SET total_copies = total_copies + $1, available_copies = available_copies + $1 WHERE id = $2',
            [parseInt(item.quantity) || 1, bookId]);
        } else {
          const bRes = await db.query(
            'INSERT INTO books (title, author, genre, barcode_id, total_copies, available_copies, school_code, isbn) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
            [item.title, item.author || 'Unknown', item.category || 'General', 'ACC-' + Date.now() + Math.random().toString(36).slice(2,6), parseInt(item.quantity) || 1, parseInt(item.quantity) || 1, sCode, item.isbn || null]);
          bookId = (bRes.rows && bRes.rows.length > 0) ? bRes.rows[0].id : (bRes.lastId || null);
        }
      }
      const qty = parseInt(item.quantity) || 1;
      const totalPrice = parseFloat(item.unit_price || 0) * qty;
      await db.query(
        'INSERT INTO acquisition_items (acquisition_id, book_id, isbn, title, author, quantity, unit_price, total_price, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [acqId, bookId, item.isbn || null, item.title, item.author || null, qty, parseFloat(item.unit_price || 0), totalPrice, 'New']);
      // create individual copies with accession numbers
      for (let c = 0; c < qty; c++) {
        const accNum = `ACC-${sCode}-${String(Date.now()).slice(-6)}${c}`;
        await db.query(
          'INSERT INTO book_copies (book_id, accession_number, shelf, rack, status, condition, acquisition_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [bookId, accNum, item.shelf || null, item.rack || null, 'Available', 'Good', acqId]);
      }
    }
    res.json({ success: true, acquisition_id: acqId });
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: err.message }); }
});

router.post('/acquisitions/delete/:acqId', adminOnly, async (req, res) => {
  const { acqId } = req.params;
  try {
    const items = (await db.query('SELECT * FROM acquisition_items WHERE acquisition_id = $1', [acqId])).rows;
    for (const item of items) {
      const qty = parseInt(item.quantity) || 1;
      await db.query('UPDATE books SET total_copies = total_copies - $1, available_copies = available_copies - $1 WHERE id = $2', [qty, item.book_id]);
    }
    await db.query('DELETE FROM book_copies WHERE acquisition_id = $1', [acqId]);
    await db.query('DELETE FROM acquisition_items WHERE acquisition_id = $1', [acqId]);
    await db.query('DELETE FROM acquisitions WHERE id = $1', [acqId]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: err.message }); }
});


// ── Vendors ────────────────────────────────────────────────────────
router.post('/vendors/create', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const { name, email, phone, address } = req.body;
  try {
    await db.query('INSERT INTO vendors (school_code, name, email, phone, address, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [sCode, name, email || null, phone || null, address || null, 'active', nowStr()]);
    req.flash('success', 'Vendor added');
    res.redirect('/admin/acquisitions');
  } catch (err) { console.error(err); req.flash('error', 'Failed to add vendor'); res.redirect('/admin/acquisitions'); }
});


// ── Non-Acquisition Books API ────────────────────────────────────
router.get('/api/non-acquisition-books', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  try {
    const books = (await db.query(
      `SELECT b.* FROM books b
       WHERE b.school_code = $1 AND b.id NOT IN (
         SELECT DISTINCT ai.book_id FROM acquisition_items ai
         JOIN acquisitions a ON ai.acquisition_id = a.id
         WHERE a.school_code = $1 AND ai.book_id IS NOT NULL
       )`, [sCode])).rows;
    res.json({ books });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.post('/api/save-scanned', adminOnly, upload.single('cover'), async (req, res) => {
  const sCode = req.session.school_code;
  const { title, author, publisher, isbn, genre, class: cls, subject, language, description, copies, shelf, rack, acquisition_id } = req.body;
  try {
    const barcodeId = 'BC' + Date.now().toString().slice(-8);
    let coverUrl = null;
    if (req.file) {
      coverUrl = '/uploads/' + req.file.filename;
    }
    const bookRes = await db.query(
      'INSERT INTO books (title, author, genre, barcode_id, total_copies, available_copies, school_code, isbn, publisher, description, cover_url, class, subject, language) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id',
      [title, author, genre || 'General', barcodeId, parseInt(copies) || 1, parseInt(copies) || 1, sCode, isbn || null, publisher || null, description || null, coverUrl, cls || null, subject || null, language || null]);
    const bookId = (bookRes.rows && bookRes.rows.length > 0) ? bookRes.rows[0].id : (bookRes.lastId || null);
    // Generate barcode image
    const bwipjs = require('bwip-js');
    const barcodeDir = path.join(__dirname, '..', 'static', 'barcodes');
    if (!require('fs').existsSync(barcodeDir)) require('fs').mkdirSync(barcodeDir, { recursive: true });
    await new Promise((resolve, reject) => {
      bwipjs.toBuffer({ bcid: 'code128', text: barcodeId, scale: 3, height: 10, includetext: true, textxalign: 'center' }, (err, buf) => {
        if (err) return reject(err);
        require('fs').writeFileSync(path.join(barcodeDir, barcodeId + '.png'), buf);
        resolve();
      });
    });
    const qty = parseInt(copies) || 1;
    for (let c = 0; c < qty; c++) {
      const accNum = `ACC-${sCode}-${String(Date.now()).slice(-6)}${c}`;
      await db.query('INSERT INTO book_copies (book_id, accession_number, shelf, rack, status, acquisition_id) VALUES ($1,$2,$3,$4,$5,$6)',
        [bookId, accNum, shelf || null, rack || null, 'Available', acquisition_id || null]);
    }
    res.json({ success: true, book_id: bookId, barcode_id: barcodeId });
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: err.message }); }
});

router.post('/api/add-copy/:bookId', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const { bookId } = req.params;
  const { acquisition_id } = req.body;
  try {
    await db.query('UPDATE books SET total_copies = total_copies + 1, available_copies = available_copies + 1 WHERE id = $1', [bookId]);
    const accNum = `ACC-${sCode}-${String(Date.now()).slice(-8)}`;
    await db.query('INSERT INTO book_copies (book_id, accession_number, status, acquisition_id) VALUES ($1,$2,$3,$4)',
      [bookId, accNum, 'Available', acquisition_id || null]);
    res.json({ success: true, accession_number: accNum });
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: err.message }); }
});


// ── Review Queue ──────────────────────────────────────────────────
router.get('/review-queue', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  try {
    const contentList = (await db.query(
      `SELECT d.*, u.name as student_name, u.admission_no, u.class
       FROM digital_content d
       JOIN users u ON d.student_id = u.id
       WHERE d.school_code = $1 AND (d.status = 'Submitted' OR d.status = 'Under Review')
       ORDER BY d.created_at DESC`, [sCode])).rows;
    res.render('admin_review', { title: 'Review Queue - librika.in', content_list: contentList });
  } catch (err) { console.error(err); res.redirect('/admin'); }
});

router.post('/api/moderate', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const { content_id, action, rejection_reason, suggested_changes } = req.body;
  try {
    if (action === 'Approve') {
      await db.query("UPDATE digital_content SET status = 'Published' WHERE id = $1 AND school_code = $2",
        [content_id, sCode]);
      res.json({ status: 'success' });
    } else if (action === 'Reject') {
      await db.query("UPDATE digital_content SET status = 'Rejected', rejection_reason = $1, suggested_changes = $2 WHERE id = $3 AND school_code = $4",
        [rejection_reason || null, suggested_changes || null, content_id, sCode]);
      res.json({ status: 'success' });
    } else {
      res.status(400).json({ status: 'error', message: 'Invalid action' });
    }
  } catch (err) { console.error(err); res.status(500).json({ status: 'error', message: err.message }); }
});


// ── Book Review Moderation ─────────────────────────────────────────
router.post('/review/:reviewId/approve', adminOnly, async (req, res) => {
  if (!hasPerm(req, 'approve_content')) return res.redirect('/admin');
  const { reviewId } = req.params;
  try {
    const review = (await db.query("SELECT * FROM book_reviews WHERE id = $1 AND status = 'pending'", [reviewId])).rows[0];
    if (review) {
      await db.query("UPDATE book_reviews SET status = 'approved' WHERE id = $1", [reviewId]);
      await updateScore(pool, review.user_id, 'digital', 20, 'Review approved');
      req.flash('success', 'Review approved! +20 points to student.');
    }
    res.redirect('/admin');
  } catch (err) { console.error(err); res.redirect('/admin'); }
});

router.post('/review/:reviewId/reject', adminOnly, async (req, res) => {
  if (!hasPerm(req, 'approve_content')) return res.redirect('/admin');
  const { reviewId } = req.params;
  try {
    await db.query("UPDATE book_reviews SET status = 'rejected' WHERE id = $1", [reviewId]);
    req.flash('info', 'Review rejected.');
    res.redirect('/admin');
  } catch (err) { console.error(err); res.redirect('/admin'); }
});


// ── Mark Lost ──────────────────────────────────────────────────────
router.post('/transaction/:txId/lost', adminOnly, async (req, res) => {
  if (!hasPerm(req, 'manage_transactions')) return res.redirect('/admin');
  const sCode = req.session.school_code;
  const { txId } = req.params;
  try {
    const tx = (await db.query('SELECT * FROM transactions WHERE id = $1 AND school_code = $2', [txId, sCode])).rows[0];
    if (tx) {
      await db.query("UPDATE transactions SET return_date = 'LOST' WHERE id = $1", [txId]);
      await db.query('UPDATE books SET total_copies = total_copies - 1 WHERE id = $1', [tx.book_id]);
      await updateScore(pool, tx.user_id, 'physical', -50, 'Book marked as lost');
      req.flash('warning', 'Book marked as lost. -50 points deducted.');
    }
    res.redirect('/admin');
  } catch (err) { console.error(err); res.redirect('/admin'); }
});


// ── Smart Scanner ─────────────────────────────────────────────────
router.get('/scanner', adminOnly, (req, res) => {
  res.render('scanner_v2', { title: 'Scanner - librika.in' });
});

router.post('/api/upload-cover', adminOnly, upload.fields([{ name: 'front_cover' }, { name: 'back_cover' }]), async (req, res) => {
  try {
    const front = req.files && req.files['front_cover'] ? req.files['front_cover'][0] : null;
    const back = req.files && req.files['back_cover'] ? req.files['back_cover'][0] : null;
    const result = {};
    if (front) {
      result.front_image = '/uploads/' + front.filename;
      const fs = require('fs');
      const imgBuf = fs.readFileSync(front.path);
      result.front_base64 = 'data:image/jpeg;base64,' + imgBuf.toString('base64');
    }
    if (back) {
      result.back_image = '/uploads/' + back.filename;
      const fs = require('fs');
      const imgBuf = fs.readFileSync(back.path);
      result.back_base64 = 'data:image/jpeg;base64,' + imgBuf.toString('base64');
    }
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/api/book/:bookId', adminOnly, async (req, res) => {
  const { bookId } = req.params;
  try {
    const book = (await db.query('SELECT * FROM books WHERE id = $1', [bookId])).rows[0];
    if (book) res.json(book);
    else res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/api/update-book/:bookId', adminOnly, async (req, res) => {
  const { bookId } = req.params;
  const fields = ['title', 'author', 'publisher', 'isbn', 'genre', 'class', 'subject', 'language', 'description'];
  const updates = [];
  const values = [];
  let idx = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx++}`);
      values.push(req.body[f]);
    }
  }
  if (updates.length > 0) {
    values.push(bookId);
    await db.query(`UPDATE books SET ${updates.join(', ')} WHERE id = $${idx}`, values);
  }
  res.json({ success: true });
});

router.post('/api/delete-scanned-book/:bookId', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const { bookId } = req.params;
  try {
    await db.query('DELETE FROM book_copies WHERE book_id = $1', [bookId]);
    await db.query('DELETE FROM books WHERE id = $1 AND school_code = $2', [bookId, sCode]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/api/delete-book/:bookId', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const { bookId } = req.params;
  try {
    await db.query('BEGIN');
    await db.query("UPDATE transactions SET return_date = 'DELETED' WHERE book_id = $1 AND return_date IS NULL", [bookId]);
    await db.query('DELETE FROM book_copies WHERE book_id = $1', [bookId]);
    await db.query('DELETE FROM acquisition_items WHERE book_id = $1', [bookId]);
    await db.query('DELETE FROM reservations WHERE book_id = $1', [bookId]);
    await db.query('DELETE FROM books WHERE id = $1 AND school_code = $2', [bookId, sCode]);
    await db.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await db.query('ROLLBACK'); res.status(500).json({ error: err.message }); }
});

router.post('/api/delete-all-books', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  try {
    await db.query('BEGIN');
    await db.query("UPDATE transactions SET return_date = 'DELETED' WHERE school_code = $1 AND return_date IS NULL", [sCode]);
    await db.query('DELETE FROM book_copies WHERE book_id IN (SELECT id FROM books WHERE school_code = $1)', [sCode]);
    await db.query('DELETE FROM acquisition_items WHERE book_id IN (SELECT id FROM books WHERE school_code = $1)', [sCode]);
    await db.query('DELETE FROM reservations WHERE book_id IN (SELECT id FROM books WHERE school_code = $1)', [sCode]);
    await db.query('DELETE FROM books WHERE school_code = $1', [sCode]);
    await db.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await db.query('ROLLBACK'); res.status(500).json({ error: err.message }); }
});


// ── Book Availability API ─────────────────────────────────────────
router.post('/api/check-book-availability', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const { title, author, isbn } = req.body;
  try {
    let book = null;
    if (isbn) {
      book = (await db.query('SELECT * FROM books WHERE isbn = $1 AND school_code = $2', [isbn, sCode])).rows[0];
    }
    if (!book && title) {
      book = (await db.query('SELECT * FROM books WHERE title ILIKE $1 AND school_code = $2', [`%${title}%`, sCode])).rows[0];
    }
    res.json({ found: !!book, book: book || null });
  } catch (err) { res.json({ found: false }); }
});

router.post('/api/issue-scanned-book', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const { student_id, book_id } = req.body;
  try {
    const book = (await db.query('SELECT * FROM books WHERE id = $1 AND available_copies > 0 AND school_code = $2', [book_id, sCode])).rows[0];
    if (!book) return res.json({ success: false, error: 'Book not available' });
    const student = (await db.query('SELECT * FROM users WHERE id = $1 AND school_code = $2', [student_id, sCode])).rows[0];
    if (!student) return res.json({ success: false, error: 'Student not found' });
    await db.query('INSERT INTO transactions (user_id, book_id, issue_date, due_date, class, school_code) VALUES ($1,$2,$3,$4,$5,$6)',
      [student_id, book.id, renderDate(new Date()), dueDate(3), student.class, sCode]);
    await db.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book.id]);
    if (!(await check90DayCooldown(pool, student_id, book.id, 'physical'))) {
      await updateScore(pool, student_id, 'physical', 5, `Issued book '${book.title}'`);
    }
    res.json({ success: true, message: `'${book.title}' issued to ${student.name}` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/api/add-scanned-book', adminOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const { title, author, publisher, isbn, description } = req.body;
  if (!title || !author) return res.json({ success: false, error: 'Title and Author required' });
  try {
    const barcodeId = 'BC' + Date.now().toString().slice(-8);
    const bookRes = await db.query(
      'INSERT INTO books (title, author, genre, barcode_id, total_copies, available_copies, school_code, description, isbn, publisher) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [title, author, 'General', barcodeId, 5, 5, sCode, description || null, isbn || null, publisher || null]);
    res.json({ success: true, message: `Book '${title}' added`, book: bookRes.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Security & Authentication Handlers ──────────────────────────────
router.post('/security/password', adminOnly, async (req, res) => {
  const userId = req.session.user_id;
  const { current_password, new_password, confirm_password } = req.body;
  if (!current_password || !new_password) {
    return res.json({ success: false, error: 'Current and new password required.' });
  }
  if (new_password.length < 6) {
    return res.json({ success: false, error: 'New password must be at least 6 characters long.' });
  }
  if (confirm_password && new_password !== confirm_password) {
    return res.json({ success: false, error: 'Passwords do not match.' });
  }
  try {
    const uRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = uRes.rows && uRes.rows[0];
    if (!user) return res.json({ success: false, error: 'User not found.' });

    let match = false;
    const userPass = String(user.password || '').trim();
    if (userPass.startsWith('$2a$') || userPass.startsWith('$2b$')) {
      match = await bcrypt.compare(current_password, userPass).catch(() => false);
    } else {
      match = (userPass === current_password);
    }
    if (!match) return res.json({ success: false, error: 'Current password is incorrect.' });

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId]);
    await logActivity(req, {
      userId,
      action: 'Librarian changed account password',
      module: 'security',
      schoolCode: req.session.school_code
    });
    return res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/security/2fa', adminOnly, async (req, res) => {
  const userId = req.session.user_id;
  try {
    const uRes = await db.query('SELECT two_factor_enabled FROM users WHERE id = $1', [userId]);
    const user = uRes.rows && uRes.rows[0];
    const nowEnabled = user && user.two_factor_enabled ? 0 : 1;
    await db.query('UPDATE users SET two_factor_enabled = $1 WHERE id = $2', [nowEnabled, userId]);
    await logActivity(req, {
      userId,
      action: nowEnabled ? 'Enabled 2FA' : 'Disabled 2FA',
      module: 'security',
      schoolCode: req.session.school_code
    });
    return res.json({ success: true, enabled: !!nowEnabled });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/api/security-logs', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'GLOBAL';
  const userId = req.session.user_id;
  try {
    await ensureSecurityTables();
    const logsRes = await db.query(
      `SELECT l.*, u.name as user_name FROM logs l
       LEFT JOIN users u ON u.id = l.user_id
       WHERE l.school_code = $1 OR l.user_id = $2
       ORDER BY l.id DESC LIMIT 40`,
      [sCode, userId]
    ).catch(() => ({ rows: [] }));

    const loginRes = await db.query(
      `SELECT lh.*, u.name as user_name FROM login_history lh
       LEFT JOIN users u ON u.id = lh.user_id
       WHERE lh.school_code = $1 OR lh.user_id = $2
       ORDER BY lh.id DESC LIMIT 30`,
      [sCode, userId]
    ).catch(() => ({ rows: [] }));

    const devicesRes = await db.query(
      `SELECT * FROM student_devices WHERE user_id = $1 ORDER BY last_active DESC LIMIT 10`,
      [userId]
    ).catch(() => ({ rows: [] }));

    return res.json({
      success: true,
      logs: logsRes.rows || [],
      loginHistory: loginRes.rows || [],
      devices: devicesRes.rows || []
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── AI Assistant Route ──────────────────────────────────────────────
router.get(['/ai', '/ai-chat'], adminOnly, (req, res) => {
  try {
    res.render('student_ai', {
      title: 'AI Assistant - librika.in',
      active: 'ai',
      notifCount: 0,
      school_name: (req.session && req.session.school_name) ? req.session.school_name : 'E-Pathshala Network'
    });
  } catch(err) {
    res.redirect('/admin');
  }
});

// ── Admin Digital Library Redirect ──────────────────────────────────
router.get(['/digital', '/digital-library'], adminOnly, (req, res) => {
  res.redirect('/admin?tab=books');
});

module.exports = router;
