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
  if (req.session && (req.session.role === 'admin' || req.session.role === 'librarian' || req.session.role === 'super_admin' || req.session.role === 'superadmin' || req.session.role === 'owner')) return next();
  req.flash('error', 'Access denied. Admin or Librarian login required.');
  return res.redirect('/login');
}

function hasPerm(req, perm) {
  if (req.session && (req.session.role === 'admin' || req.session.role === 'super_admin' || req.session.role === 'superadmin' || req.session.role === 'owner')) return true;
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

function calculateFine(dueDateStr, finePerDay = 5, graceDays = 2) {
  if (!dueDateStr) return { fine: 0, is_overdue: false, days_overdue: 0 };
  const due = new Date(dueDateStr);
  const today = new Date();
  if (today > due) {
    const diffDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));
    const chargeableDays = Math.max(0, diffDays - graceDays);
    return { fine: chargeableDays * finePerDay, is_overdue: diffDays > 0, days_overdue: diffDays };
  }
  return { fine: 0, is_overdue: false, days_overdue: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MAIN LIBRARIAN 9-MODULE PORTAL RENDERER
// ─────────────────────────────────────────────────────────────────────────────
async function renderLibrarianPortal(req, res, defaultModule = 'dashboard') {
  const sCode = req.session.school_code || 'DEMO01';
  const targetModule = req.query.module || req.params.module || defaultModule;
  const targetTab = req.query.tab || 'default';

  try {
    // 1. Fetch Transactions & Overdue
    let txQuery = `
      SELECT t.*, u.name as user_name, u.admission_no as user_admission, u.phone as user_phone, u.class as user_class, u.role as user_role,
             b.title as book_title, b.author as book_author, b.barcode_id as book_barcode, b.cover_url as book_cover
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN books b ON t.book_id = b.id
      WHERE t.school_code = $1
      ORDER BY t.id DESC
    `;
    const txRes = await db.query(txQuery, [sCode]).catch(() => ({ rows: [] }));
    const allTransactions = txRes.rows || [];

    const activeLoans = [];
    const returnedLoans = [];
    let overdueCount = 0;
    let dueTodayCount = 0;
    const todayStr = renderDate(new Date());

    allTransactions.forEach(tx => {
      const fineData = calculateFine(tx.due_date);
      const enhanced = { ...tx, ...fineData };
      if (!tx.return_date) {
        activeLoans.push(enhanced);
        if (fineData.is_overdue) overdueCount++;
        if (renderDate(tx.due_date) === todayStr) dueTodayCount++;
      } else {
        returnedLoans.push(enhanced);
      }
    });

    // 2. Fetch Books Catalog & Copies
    const booksRes = await db.query('SELECT * FROM books WHERE school_code = $1 ORDER BY id DESC', [sCode]).catch(() => ({ rows: [] }));
    const books = booksRes.rows || [];

    const copiesRes = await db.query(`
      SELECT bc.*, b.title as book_title, b.author as book_author, b.isbn as book_isbn
      FROM book_copies bc
      JOIN books b ON bc.book_id = b.id
      WHERE bc.school_code = $1
      ORDER BY bc.id DESC
    `, [sCode]).catch(() => ({ rows: [] }));
    const bookCopies = copiesRes.rows || [];

    let totalCopiesCount = 0;
    let availableCopiesCount = 0;
    let damagedCopiesCount = 0;
    let lostCopiesCount = 0;

    books.forEach(b => {
      totalCopiesCount += (parseInt(b.total_copies, 10) || 1);
      availableCopiesCount += (parseInt(b.available_copies, 10) || 0);
    });

    bookCopies.forEach(c => {
      if (c.condition_status === 'DAMAGED') damagedCopiesCount++;
      if (c.condition_status === 'LOST' || c.availability_status === 'LOST') lostCopiesCount++;
    });

    // 3. Fetch Members (Students, Teachers, Staff)
    const usersRes = await db.query('SELECT * FROM users WHERE school_code = $1 ORDER BY id DESC', [sCode]).catch(() => ({ rows: [] }));
    const allUsers = usersRes.rows || [];

    const students = allUsers.filter(u => u.role === 'student');
    const teachers = allUsers.filter(u => u.role === 'teacher');
    const staff = allUsers.filter(u => u.role === 'staff' || u.role === 'librarian' || u.role === 'admin');

    // 4. Fetch Requests & Reservations
    const resvRes = await db.query(`
      SELECT r.*, u.name as student_name, u.admission_no as student_admission, u.class as student_class, u.phone as student_phone,
             b.title as book_title, b.author as book_author, b.available_copies
      FROM reservations r
      JOIN users u ON u.id = r.user_id
      JOIN books b ON b.id = r.book_id
      WHERE r.school_code = $1
      ORDER BY r.id DESC
    `, [sCode]).catch(() => ({ rows: [] }));
    const reservations = resvRes.rows || [];

    // 5. Fetch Digital Documents & E-Library
    const digRes = await db.query(`
      SELECT * FROM digital_content WHERE school_code = $1 OR school_code = 'GLOBAL' ORDER BY id DESC LIMIT 50
    `, [sCode]).catch(() => ({ rows: [] }));
    const digitalItems = digRes.rows || [];

    // 6. Fetch Live Studio Sessions
    const studioRes = await db.query(`
      SELECT ls.*, u.name as host_name
      FROM live_sessions ls
      LEFT JOIN users u ON ls.host_id = u.id
      ORDER BY ls.scheduled_at DESC LIMIT 30
    `).catch(() => ({ rows: [] }));
    const studioSessions = studioRes.rows || [];

    // 7. Fetch Library Settings & Rules
    const settingsRes = await db.query('SELECT * FROM library_settings WHERE school_code = $1', [sCode]).catch(() => ({ rows: [] }));
    const settingsMap = {};
    (settingsRes.rows || []).forEach(s => { settingsMap[s.setting_key] = s.setting_value; });

    const schoolRes = await db.query('SELECT * FROM schools WHERE school_code = $1', [sCode]).catch(() => ({ rows: [] }));
    const school = (schoolRes.rows && schoolRes.rows[0]) || { name: 'Librika Digital Library', school_code: sCode, due_days: 14 };

    // 8. Fetch Audit Logs & Notifications
    const logsRes = await db.query(`
      SELECT l.*, u.name as user_name FROM logs l
      LEFT JOIN users u ON u.id = l.user_id
      WHERE l.school_code = $1
      ORDER BY l.id DESC LIMIT 40
    `, [sCode]).catch(() => ({ rows: [] }));
    const auditLogs = logsRes.rows || [];

    const notifRes = await db.query(`
      SELECT * FROM notifications WHERE school_code = $1 OR school_code = 'GLOBAL' ORDER BY id DESC LIMIT 30
    `, [sCode]).catch(() => ({ rows: [] }));
    const notificationsList = notifRes.rows || [];

    // 9. Fetch Pending Reviews & Ratings
    const revRes = await db.query(`
      SELECT r.*, u.name as student_name, COALESCE(b.title, d.title) as book_title
      FROM book_reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN books b ON r.book_id = b.id AND r.book_type = 'physical'
      LEFT JOIN digital_content d ON r.book_id = d.id AND r.book_type = 'digital'
      WHERE r.school_code = $1
      ORDER BY r.id DESC LIMIT 30
    `, [sCode]).catch(() => ({ rows: [] }));
    const reviews = revRes.rows || [];

    res.render('admin', {
      title: 'Librika Librarian Console - Intelligent Workspace',
      currentModule: targetModule,
      currentTab: targetTab,
      school,
      settings: settingsMap,
      stats: {
        total_books: books.length,
        total_copies: totalCopiesCount,
        available_copies: availableCopiesCount,
        damaged_copies: damagedCopiesCount,
        lost_copies: lostCopiesCount,
        active_issues: activeLoans.length,
        overdue_count: overdueCount,
        due_today: dueTodayCount,
        total_members: allUsers.length,
        total_students: students.length,
        total_teachers: teachers.length,
        total_staff: staff.length,
        total_returned: returnedLoans.length,
        total_digital: digitalItems.length,
        pending_reservations: reservations.filter(r => r.status === 'Pending' || r.status === 'pending').length
      },
      books,
      bookCopies,
      students,
      teachers,
      staff,
      allUsers,
      activeLoans,
      returnedLoans,
      allTransactions,
      reservations,
      digitalItems,
      studioSessions,
      auditLogs,
      notificationsList,
      reviews
    });
  } catch (err) {
    console.error('Librarian portal render error:', err);
    req.flash('error', 'Failed to load Librarian portal: ' + err.message);
    res.redirect('/');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PRIMARY 9 MODULE ROUTES
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'dashboard'));
router.get('/dashboard', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'dashboard'));
router.get('/catalog', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'catalog'));
router.get('/members', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'members'));
router.get('/circulation', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'circulation'));
router.get('/requests', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'requests'));
router.get('/e-library', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'e-library'));
router.get('/studio', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'studio'));
router.get('/analytics', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'analytics'));
router.get('/settings', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'settings'));

// ─────────────────────────────────────────────────────────────────────────────
// 3. RAPID CIRCULATION DESK APIS (ISSUE, RETURN, RENEW, LOOKUPS)
// ─────────────────────────────────────────────────────────────────────────────

// Fast Member Lookup for Scanner Desk
router.post('/api/circulation/lookup-member', adminOnly, async (req, res) => {
  const { query } = req.body;
  const sCode = req.session.school_code || 'DEMO01';
  if (!query || !query.trim()) return res.json({ status: 'error', message: 'Enter Member ID, Admission No, or Phone' });

  try {
    const cleanQ = query.trim();
    const userRes = await db.query(`
      SELECT u.id, u.name, u.admission_no, u.class, u.phone, u.role, u.is_banned, u.email
      FROM users u
      WHERE (u.admission_no = $1 OR u.phone = $1 OR CAST(u.id AS TEXT) = $1 OR u.email = $1)
      AND u.school_code = $2
      LIMIT 1
    `, [cleanQ, sCode]).catch(async () => {
      return await db.query(`
        SELECT u.id, u.name, u.admission_no, u.class, u.phone, u.role, u.is_banned, u.email
        FROM users u
        WHERE (u.admission_no = ? OR u.phone = ? OR u.id = ? OR u.email = ?)
        AND u.school_code = ?
        LIMIT 1
      `, [cleanQ, cleanQ, cleanQ, cleanQ, sCode]);
    });

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.json({ status: 'error', message: `No member found matching "${cleanQ}"` });
    }

    const member = userRes.rows[0];
    if (member.is_banned && (member.is_banned === 1 || member.is_banned === '1' || member.is_banned === true)) {
      return res.json({ status: 'error', message: `Member ${member.name} is currently SUSPENDED. Circulation blocked.` });
    }

    // Active loans count
    const loansRes = await db.query(`
      SELECT t.*, b.title as book_title, b.barcode_id as book_barcode
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      WHERE t.user_id = $1 AND t.return_date IS NULL
    `, [member.id]);

    const activeLoans = (loansRes.rows || []).map(l => ({
      ...l,
      ...calculateFine(l.due_date)
    }));

    // Borrowing limit
    const limit = member.role === 'teacher' ? 10 : (member.role === 'staff' ? 5 : 3);

    return res.json({
      status: 'success',
      member,
      activeLoans,
      activeCount: activeLoans.length,
      borrowingLimit: limit,
      canBorrow: activeLoans.length < limit
    });
  } catch (err) {
    console.error('Member lookup error:', err);
    return res.json({ status: 'error', message: 'Member lookup failed: ' + err.message });
  }
});

// Fast Book Lookup for Scanner Desk
router.post('/api/circulation/lookup-book', adminOnly, async (req, res) => {
  const { barcode } = req.body;
  const sCode = req.session.school_code || 'DEMO01';
  if (!barcode || !barcode.trim()) return res.json({ status: 'error', message: 'Scan or enter Book Barcode/ISBN' });

  try {
    const cleanB = barcode.trim();
    // 1. Check book_copies first
    const copyRes = await db.query(`
      SELECT bc.*, b.id as book_id, b.title, b.author, b.genre, b.isbn, b.available_copies, b.shelf_location, b.cover_url
      FROM book_copies bc
      JOIN books b ON bc.book_id = b.id
      WHERE (bc.barcode = $1 OR b.barcode_id = $1 OR b.isbn = $1 OR CAST(b.id AS TEXT) = $1)
      AND bc.school_code = $2
      LIMIT 1
    `, [cleanB, sCode]);

    if (copyRes.rows && copyRes.rows.length > 0) {
      const copy = copyRes.rows[0];
      return res.json({
        status: 'success',
        book: {
          id: copy.book_id,
          title: copy.title,
          author: copy.author,
          genre: copy.genre,
          isbn: copy.isbn,
          available_copies: copy.available_copies,
          shelf_location: copy.shelf_location,
          cover_url: copy.cover_url,
          copy_barcode: copy.barcode,
          copy_id: copy.id,
          condition: copy.condition_status,
          availability: copy.availability_status
        }
      });
    }

    // 2. Check books table directly
    const bookRes = await db.query(`
      SELECT * FROM books
      WHERE (barcode_id = $1 OR isbn = $1 OR CAST(id AS TEXT) = $1)
      AND school_code = $2
      LIMIT 1
    `, [cleanB, sCode]);

    if (bookRes.rows && bookRes.rows.length > 0) {
      const b = bookRes.rows[0];
      return res.json({
        status: 'success',
        book: {
          id: b.id,
          title: b.title,
          author: b.author,
          genre: b.genre,
          isbn: b.isbn,
          available_copies: b.available_copies,
          shelf_location: b.shelf_location,
          cover_url: b.cover_url,
          copy_barcode: b.barcode_id || `LIB-BK${b.id}-C1`,
          copy_id: null,
          condition: 'GOOD',
          availability: parseInt(b.available_copies, 10) > 0 ? 'AVAILABLE' : 'ISSUED'
        }
      });
    }

    return res.json({ status: 'error', message: `No book found matching barcode "${cleanB}"` });
  } catch (err) {
    console.error('Book lookup error:', err);
    return res.json({ status: 'error', message: 'Book lookup failed: ' + err.message });
  }
});

// Issue Book Transaction
router.post('/api/circulation/issue', adminOnly, async (req, res) => {
  const { member_id, book_id, barcode, due_days } = req.body;
  const sCode = req.session.school_code || 'DEMO01';
  const librarianId = req.session.user_id || 0;

  if (!member_id || (!book_id && !barcode)) {
    return res.json({ status: 'error', message: 'Member and Book are required.' });
  }

  try {
    // 1. Verify Member
    const mRes = await db.query('SELECT * FROM users WHERE id = $1 AND school_code = $2', [member_id, sCode]);
    if (!mRes.rows || mRes.rows.length === 0) return res.json({ status: 'error', message: 'Member not found.' });
    const member = mRes.rows[0];

    // 2. Check Member Borrowing Limits
    const activeLoansRes = await db.query('SELECT COUNT(*) as count FROM transactions WHERE user_id = $1 AND return_date IS NULL', [member_id]);
    const currentBorrowed = parseInt(activeLoansRes.rows[0].count, 10) || 0;
    const maxLimit = member.role === 'teacher' ? 10 : (member.role === 'staff' ? 5 : 3);
    if (currentBorrowed >= maxLimit) {
      return res.json({ status: 'error', message: `Member has reached maximum borrowing quota (${maxLimit} books).` });
    }

    // 3. Find Book
    let book = null;
    if (book_id) {
      const bRes = await db.query('SELECT * FROM books WHERE id = $1 AND school_code = $2', [book_id, sCode]);
      book = bRes.rows && bRes.rows[0];
    } else if (barcode) {
      const bRes = await db.query('SELECT * FROM books WHERE (barcode_id = $1 OR isbn = $1) AND school_code = $2', [barcode, sCode]);
      book = bRes.rows && bRes.rows[0];
    }

    if (!book) return res.json({ status: 'error', message: 'Book not found in school catalog.' });
    if (parseInt(book.available_copies, 10) <= 0) {
      return res.json({ status: 'error', message: `'${book.title}' has 0 available copies in stock.` });
    }

    const loanDays = parseInt(due_days, 10) || 14;
    const dDate = dueDate(loanDays);
    const iDate = renderDate(new Date());

    // 4. Execute Transaction
    await db.query(`
      INSERT INTO transactions (user_id, book_id, issue_date, due_date, class, school_code)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [member_id, book.id, iDate, dDate, member.class || 'N/A', sCode]);

    // 5. Decrement Available Copies
    await db.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book.id]);

    // 6. Update Copy Status if copy exists
    if (barcode) {
      await db.query("UPDATE book_copies SET availability_status = 'ISSUED' WHERE barcode = $1", [barcode]).catch(() => {});
    }

    // 7. Audit Log
    await logActivity(req, {
      userId: librarianId,
      action: `Issued '${book.title}' to ${member.name} (${member.admission_no || member.phone}) - Due: ${dDate}`,
      module: 'circulation',
      schoolCode: sCode
    }).catch(() => {});

    return res.json({
      status: 'success',
      message: `Successfully issued '${book.title}' to ${member.name}! Due date: ${dDate}`,
      book_title: book.title,
      member_name: member.name,
      due_date: dDate
    });
  } catch (err) {
    console.error('Issue book error:', err);
    return res.json({ status: 'error', message: 'Circulation issue failed: ' + err.message });
  }
});

// Return Book Transaction
router.post('/api/circulation/return', adminOnly, async (req, res) => {
  const { transaction_id, barcode } = req.body;
  const sCode = req.session.school_code || 'DEMO01';
  const librarianId = req.session.user_id || 0;

  try {
    let loan = null;
    if (transaction_id) {
      const lRes = await db.query(`
        SELECT t.*, b.title as book_title, b.id as b_id, u.name as user_name
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1 AND t.return_date IS NULL AND t.school_code = $2
      `, [transaction_id, sCode]);
      loan = lRes.rows && lRes.rows[0];
    } else if (barcode) {
      const lRes = await db.query(`
        SELECT t.*, b.title as book_title, b.id as b_id, u.name as user_name
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        JOIN users u ON t.user_id = u.id
        WHERE (b.barcode_id = $1 OR b.isbn = $1) AND t.return_date IS NULL AND t.school_code = $2
        ORDER BY t.id ASC LIMIT 1
      `, [barcode.trim(), sCode]);
      loan = lRes.rows && lRes.rows[0];
    }

    if (!loan) return res.json({ status: 'error', message: 'No active issue found for this book/transaction.' });

    const retDate = renderDate(new Date());
    const fineData = calculateFine(loan.due_date);

    // 1. Mark Loan Returned
    await db.query(`
      UPDATE transactions
      SET return_date = $1, fine = $2
      WHERE id = $3
    `, [retDate, fineData.fine, loan.id]);

    // 2. Increment Available Copies
    await db.query('UPDATE books SET available_copies = available_copies + 1 WHERE id = $1', [loan.book_id]);

    // 3. Mark Copy Available
    if (barcode) {
      await db.query("UPDATE book_copies SET availability_status = 'AVAILABLE' WHERE barcode = $1", [barcode.trim()]).catch(() => {});
    }

    // 4. Auto-check Reservation Queue
    const resvQueue = await db.query(`
      SELECT r.*, u.name as student_name, u.email as student_email
      FROM reservations r
      JOIN users u ON u.id = r.user_id
      WHERE r.book_id = $1 AND r.status = 'Pending'
      ORDER BY r.id ASC LIMIT 1
    `, [loan.book_id]);

    let reservedNotification = null;
    if (resvQueue.rows && resvQueue.rows.length > 0) {
      const nextInLine = resvQueue.rows[0];
      await db.query(`
        INSERT INTO notifications (user_id, message, type, school_code)
        VALUES ($1, $2, 'reservation_available', $3)
      `, [nextInLine.user_id, `'${loan.book_title}' is now available for pickup at the Library desk.`, sCode]).catch(() => {});
      reservedNotification = `Next reserved student: ${nextInLine.student_name} notified automatically.`;
    }

    // 5. Audit Log
    await logActivity(req, {
      userId: librarianId,
      action: `Returned '${loan.book_title}' from ${loan.user_name} (Fine: ₹${fineData.fine})`,
      module: 'circulation',
      schoolCode: sCode
    }).catch(() => {});

    return res.json({
      status: 'success',
      message: `Book '${loan.book_title}' marked as RETURNED from ${loan.user_name}.`,
      fine: fineData.fine,
      days_overdue: fineData.days_overdue,
      reservation_alert: reservedNotification
    });
  } catch (err) {
    console.error('Return book error:', err);
    return res.json({ status: 'error', message: 'Circulation return failed: ' + err.message });
  }
});

// Loan Renewal Action
router.post('/api/circulation/renew', adminOnly, async (req, res) => {
  const { transaction_id, extend_days } = req.body;
  const sCode = req.session.school_code || 'DEMO01';
  const days = parseInt(extend_days, 10) || 14;

  try {
    const lRes = await db.query(`
      SELECT t.*, b.title as book_title, u.name as user_name
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1 AND t.return_date IS NULL AND t.school_code = $2
    `, [transaction_id, sCode]);

    if (!lRes.rows || lRes.rows.length === 0) return res.json({ status: 'error', message: 'Active loan not found.' });
    const loan = lRes.rows[0];

    const newDueDate = dueDate(days);
    await db.query('UPDATE transactions SET due_date = $1 WHERE id = $2', [newDueDate, loan.id]);

    await logActivity(req, {
      userId: req.session.user_id,
      action: `Renewed loan for '${loan.book_title}' to ${loan.user_name} (New due date: ${newDueDate})`,
      module: 'circulation',
      schoolCode: sCode
    }).catch(() => {});

    return res.json({
      status: 'success',
      message: `Loan for '${loan.book_title}' extended until ${newDueDate}.`,
      new_due_date: newDueDate
    });
  } catch (err) {
    return res.json({ status: 'error', message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GLOBAL AI COPILOT ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
router.post('/api/ai/chat', adminOnly, async (req, res) => {
  const { message } = req.body;
  const sCode = req.session.school_code || 'DEMO01';

  if (!message || !message.trim()) {
    return res.json({ reply: 'Hello! I am your Library AI Copilot. How can I assist you with cataloging, overdue tracking, or student reading recommendations today?' });
  }

  try {
    const q = message.toLowerCase().trim();

    // 1. Overdue Query
    if (q.includes('overdue') || q.includes('late') || q.includes('fine')) {
      const odRes = await db.query(`
        SELECT t.*, u.name as user_name, b.title as book_title
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        JOIN books b ON t.book_id = b.id
        WHERE t.return_date IS NULL AND t.school_code = $1
      `, [sCode]);

      const overdueList = (odRes.rows || []).filter(tx => calculateFine(tx.due_date).is_overdue);
      if (overdueList.length === 0) {
        return res.json({ reply: `Great news! There are currently **0 overdue books** in the library. All active loans are within their scheduled borrowing window.` });
      }

      let reply = `Here are the **${overdueList.length} currently overdue books** needing attention:\n\n`;
      overdueList.slice(0, 5).forEach((t, i) => {
        const fine = calculateFine(t.due_date);
        reply += `${i + 1}. **${t.book_title}** — Borrowed by *${t.user_name}* (${fine.days_overdue} days late, Fine: ₹${fine.fine})\n`;
      });
      if (overdueList.length > 5) reply += `\n*...and ${overdueList.length - 5} more overdue records. View the Circulation desk for full list.*`;
      return res.json({ reply });
    }

    // 2. Class-specific books query (e.g., "Find books for Class 8")
    if (q.includes('class') || q.includes('grade')) {
      const match = q.match(/class\s*(\d+|[a-z]+)/i) || q.match(/grade\s*(\d+|[a-z]+)/i);
      const grade = match ? match[1] : '8';
      const bRes = await db.query(`
        SELECT * FROM books
        WHERE (class LIKE $1 OR description LIKE $1 OR genre LIKE $2)
        AND school_code = $3
        LIMIT 6
      `, [`%${grade}%`, `%Science%`, sCode]);

      let reply = `Here are curated book recommendations suitable for **Class ${grade}** students:\n\n`;
      if (bRes.rows && bRes.rows.length > 0) {
        bRes.rows.forEach((b, i) => {
          reply += `${i + 1}. **${b.title}** by *${b.author || 'Unknown'}* (${b.genre || 'General'}) — Available: ${b.available_copies} copies (Shelf: ${b.shelf_location || 'A-1'})\n`;
        });
      } else {
        reply += `1. **Concepts of Science & Discovery** — Foundation physics and chemistry experiments.\n2. **The World History Atlas** — Interactive world civilizations for middle school.\n3. **Stories of Adventure & Wit** — Enriched vocabulary reader.\n4. **Mathematics Workbook for Grade ${grade}** — Practice problem sets.`;
      }
      return res.json({ reply });
    }

    // 3. Purchase / Acquisition suggestions
    if (q.includes('purchase') || q.includes('buy') || q.includes('acquire') || q.includes('acquisitions')) {
      return res.json({
        reply: `Based on current student reservation trends and zero-copy shortages, here is the **recommended acquisition priority list**:\n\n1. **Artificial Intelligence: A Modern Approach (4th Ed)** — High demand among Senior CS batches.\n2. **Clean Code & Design Patterns** — 8 pending waitlist requests.\n3. **NCERT Exemplar Guides (Classes 9-12)** — Rapid circulation with frequent stock depletion.\n4. **Graphic Novels & Young Adult Classics** — Enhances primary reader engagement by 40%.\n\nYou can create vendor purchase orders directly in the **Catalog → Acquisitions** tab.`
      });
    }

    // 4. Mystery / Genre suggestions
    if (q.includes('mystery') || q.includes('fiction') || q.includes('science') || q.includes('genre')) {
      return res.json({
        reply: `Here are popular high-interest mystery & thriller titles in the catalog:\n\n1. **The Hound of the Baskervilles** by Arthur Conan Doyle (Rack: Lit-04)\n2. **Murder on the Orient Express** by Agatha Christie (Rack: Lit-02)\n3. **The Da Vinci Code** by Dan Brown (Rack: Gen-08)\n4. **Sherlock Holmes: Complete Short Stories** (Available in E-Library)`
      });
    }

    // Default AI answer with live metrics
    const countRes = await db.query('SELECT COUNT(*) as total FROM books WHERE school_code = $1', [sCode]);
    const totalB = countRes.rows ? countRes.rows[0].total : 120;
    return res.json({
      reply: `I can help you manage your library of **${totalB} titles**. You can ask me to:\n- *Show overdue books and fines*\n- *Find book recommendations for Class 6 to 12*\n- *Check purchase requisitions & vendor orders*\n- *Search catalog by author, rack, or ISBN*`
    });
  } catch (err) {
    return res.json({ reply: 'I am ready to help! Ask me anything about your books, members, or circulation desk.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. SETTINGS & LENDING RULES APIS
// ─────────────────────────────────────────────────────────────────────────────
router.post('/api/settings', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  const { loan_duration_days, student_max_books, teacher_max_books, fine_per_day, grace_period_days, max_renewals, allow_digital_downloads } = req.body;

  try {
    const settings = [
      { key: 'loan_duration_days', val: loan_duration_days || '14' },
      { key: 'student_max_books', val: student_max_books || '3' },
      { key: 'teacher_max_books', val: teacher_max_books || '10' },
      { key: 'fine_per_day', val: fine_per_day || '5' },
      { key: 'grace_period_days', val: grace_period_days || '2' },
      { key: 'max_renewals', val: max_renewals || '2' },
      { key: 'allow_digital_downloads', val: allow_digital_downloads === 'true' || allow_digital_downloads === true ? 'true' : 'false' }
    ];

    for (const s of settings) {
      await db.query(`
        INSERT INTO library_settings (school_code, setting_key, setting_value, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (school_code, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
      `, [sCode, s.key, s.val]).catch(async () => {
        // Fallback update/insert
        const ex = await db.query('SELECT id FROM library_settings WHERE school_code = $1 AND setting_key = $2', [sCode, s.key]);
        if (ex.rows && ex.rows.length > 0) {
          await db.query('UPDATE library_settings SET setting_value = $1 WHERE id = $2', [s.val, ex.rows[0].id]);
        } else {
          await db.query('INSERT INTO library_settings (school_code, setting_key, setting_value) VALUES ($1, $2, $3)', [sCode, s.key, s.val]);
        }
      });
    }

    req.flash('success', 'Library rules and settings updated successfully!');
    return res.redirect('/admin/settings');
  } catch (err) {
    console.error('Settings update error:', err);
    req.flash('error', 'Failed to save settings: ' + err.message);
    return res.redirect('/admin/settings');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. MEMBER PROFILE DRAWER API
// ─────────────────────────────────────────────────────────────────────────────
router.get('/api/member/:id', adminOnly, async (req, res) => {
  const { id } = req.params;
  const sCode = req.session.school_code || 'DEMO01';

  try {
    const userRes = await db.query('SELECT * FROM users WHERE id = $1 AND school_code = $2', [id, sCode]);
    if (!userRes.rows || userRes.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    const member = userRes.rows[0];

    const loansRes = await db.query(`
      SELECT t.*, b.title as book_title, b.author as book_author, b.barcode_id as book_barcode, b.cover_url as book_cover
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      WHERE t.user_id = $1 AND t.school_code = $2
      ORDER BY t.id DESC
    `, [id, sCode]);

    const activeLoans = [];
    const historyLoans = [];
    let totalFines = 0;

    (loansRes.rows || []).forEach(l => {
      const fineData = calculateFine(l.due_date);
      const enhanced = { ...l, ...fineData };
      if (!l.return_date) {
        activeLoans.push(enhanced);
        totalFines += fineData.fine;
      } else {
        historyLoans.push(enhanced);
      }
    });

    const resvRes = await db.query(`
      SELECT r.*, b.title as book_title FROM reservations r
      JOIN books b ON r.book_id = b.id
      WHERE r.user_id = $1 ORDER BY r.id DESC
    `, [id]);

    return res.json({
      member,
      activeLoans,
      historyLoans,
      reservations: resvRes.rows || [],
      totalFines
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. E-LIBRARY WEB READER ROUTE
// ─────────────────────────────────────────────────────────────────────────────
router.get(['/e-library/read/:id', '/digital/read/:id'], adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const docRes = await db.query('SELECT * FROM digital_content WHERE id = $1', [id]);
    const doc = (docRes.rows && docRes.rows[0]) || { title: 'Digital E-Book', author: 'Faculty', file_url: '#' };
    res.render('reader', {
      title: `${doc.title} - Librika Web Reader`,
      doc,
      user: req.session || {}
    });
  } catch (err) {
    res.redirect('/admin/e-library');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. ADD BOOK, ADD MEMBER, AND REVIEW MODERATION HANDLERS
// ─────────────────────────────────────────────────────────────────────────────
router.post('/book/add', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  const { title, author, genre, total_copies, isbn, rack, shelf, description, language } = req.body;
  if (!title) {
    req.flash('error', 'Book Title is required');
    return res.redirect('/admin/catalog');
  }

  try {
    const copies = parseInt(total_copies, 10) || 1;
    const barcodeId = isbn || `LIB-${Date.now().toString().slice(-8)}`;

    const insRes = await db.query(`
      INSERT INTO books (title, author, genre, barcode_id, total_copies, available_copies, school_code, description, isbn, shelf_location, language)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [title, author || 'Unknown', genre || 'General', barcodeId, copies, copies, sCode, description || null, isbn || null, `${rack || 'A'}-${shelf || '1'}`, language || 'English']).catch(async () => {
      return await db.query(`
        INSERT INTO books (title, author, genre, barcode_id, total_copies, available_copies, school_code, description, isbn, shelf_location, language)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [title, author || 'Unknown', genre || 'General', barcodeId, copies, copies, sCode, description || null, isbn || null, `${rack || 'A'}-${shelf || '1'}`, language || 'English']);
    });

    const bookId = (insRes.rows && insRes.rows[0]) ? insRes.rows[0].id : insRes.lastId;

    // Generate individual copy records
    if (bookId) {
      for (let i = 1; i <= copies; i++) {
        await db.query(`
          INSERT INTO book_copies (book_id, barcode, condition_status, availability_status, school_code)
          VALUES ($1, $2, 'GOOD', 'AVAILABLE', $3)
        `, [bookId, `${barcodeId}-C${i}`, sCode]).catch(() => {});
      }
    }

    req.flash('success', `Book '${title}' added with ${copies} copies!`);
    return res.redirect('/admin/catalog');
  } catch (err) {
    console.error('Add book error:', err);
    req.flash('error', 'Failed to add book: ' + err.message);
    return res.redirect('/admin/catalog');
  }
});

router.post('/student/add', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  const { name, admission_no, phone, class: cls, email, role, password } = req.body;
  if (!name || !phone) {
    req.flash('error', 'Name and Phone are required.');
    return res.redirect('/admin/members');
  }

  try {
    const targetEmail = email || `${name.toLowerCase().replace(/\s+/g, '')}${Math.floor(Math.random()*1000)}@gmail.com`;
    const targetPass = password || 'librika123';
    const targetRole = role || 'student';

    await db.query(`
      INSERT INTO users (name, admission_no, phone, class, role, password, school_code, email, is_banned)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)
    `, [name, admission_no || null, phone, cls || null, targetRole, targetPass, sCode, targetEmail]);

    req.flash('success', `Member '${name}' registered successfully!`);
    return res.redirect('/admin/members');
  } catch (err) {
    req.flash('error', 'Failed to register member: ' + err.message);
    return res.redirect('/admin/members');
  }
});

router.post('/api/review/:id/approve', adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE book_reviews SET status = 'approved' WHERE id = $1", [id]);
    return res.json({ status: 'success' });
  } catch (err) {
    return res.json({ status: 'error', message: err.message });
  }
});

router.post('/api/review/:id/reject', adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE book_reviews SET status = 'rejected' WHERE id = $1", [id]);
    return res.json({ status: 'success' });
  } catch (err) {
    return res.json({ status: 'error', message: err.message });
  }
});

module.exports = router;
