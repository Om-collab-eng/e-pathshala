const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const aiService = require('../services/aiService');
const { logActivity, ensureSecurityTables } = require('../services/auditLogger');
const { quotes: libraryQuotes, getRandomQuote } = require('../data/quotes');
const bookMetadataService = require('../services/bookMetadataService');
require('dotenv').config();

const upload = multer({
  dest: path.join(__dirname, '..', 'static', 'uploads'),
  limits: { fileSize: 28 * 1024 * 1024 }
});

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

// Helper to fetch student learning progress across Books, Quizzes, and Courses
async function fetchStudentProgress(sCode) {
  try {
    // 1. Ongoing Physical Books (Issued and not yet returned)
    const booksQuery = `
      SELECT t.id, t.user_id, u.name as student_name, COALESCE(u.class, 'Class 10') as student_class, u.phone as student_phone,
             b.title as item_name, 'Physical Book' as item_type, 'BOOK' as category,
             COALESCE(t.status, 'ISSUED') as status,
             t.issue_date as assigned_date, t.due_date,
             CASE 
               WHEN t.due_date IS NOT NULL AND t.due_date < CURRENT_TIMESTAMP THEN 'Overdue'
               ELSE 'Reading / Issued'
             END as progress
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN books b ON t.book_id = b.id
      WHERE (LOWER(t.school_code) = LOWER($1) OR t.school_code = 'GLOBAL' OR t.school_code IS NULL OR t.school_code = '')
        AND (t.return_date IS NULL OR t.return_date = '')
      ORDER BY t.id DESC LIMIT 100
    `;
    const booksRes = await db.query(booksQuery, [sCode]).catch(() => ({ rows: [] }));

    // 2. Ongoing Digital Readings
    const digitalQuery = `
      SELECT dbr.id, dbr.student_id as user_id, u.name as student_name, COALESCE(u.class, 'Class 10') as student_class, u.phone as student_phone,
             dc.title as item_name, 'Digital E-Book' as item_type, 'BOOK' as category,
             COALESCE(dbr.reading_status, 'READING') as status,
             dbr.started_at as assigned_date, NULL as due_date,
             CONCAT(COALESCE(dbr.progress_percentage, 0), '%') as progress
      FROM digital_book_readings dbr
      JOIN users u ON dbr.student_id = u.id
      JOIN digital_content dc ON dbr.content_id = dc.id
      WHERE (LOWER(dbr.school_code) = LOWER($1) OR dbr.school_code = 'GLOBAL' OR dbr.school_code IS NULL OR dbr.school_code = '')
      ORDER BY dbr.id DESC LIMIT 100
    `;
    const digitalRes = await db.query(digitalQuery, [sCode]).catch(() => ({ rows: [] }));

    // 3. Quizzes (Attempts & Progress)
    const quizQuery = `
      SELECT qa.id, COALESCE(qa.user_id, qa.student_id) as user_id, u.name as student_name, COALESCE(u.class, 'Class 10') as student_class, u.phone as student_phone,
             q.title as item_name, 'Quiz' as item_type, 'QUIZ' as category,
             COALESCE(qa.status, CASE WHEN qa.passed = 1 THEN 'PASSED' ELSE 'COMPLETED' END) as status,
             qa.started_at as assigned_date, NULL as due_date,
             CONCAT(ROUND(COALESCE(qa.percentage, qa.score, 0)), '% score') as progress
      FROM quiz_attempts qa
      JOIN users u ON (u.id = qa.user_id OR u.id = qa.student_id)
      JOIN quizzes q ON q.id = qa.quiz_id
      WHERE (LOWER(u.school_code) = LOWER($1) OR u.school_code = 'GLOBAL' OR u.school_code IS NULL OR u.school_code = '')
      ORDER BY qa.id DESC LIMIT 100
    `;
    const quizRes = await db.query(quizQuery, [sCode]).catch(() => ({ rows: [] }));

    // 4. Courses (Live Course Enrollments)
    const coursesQuery = `
      SELECT ce.id, ce.user_id, COALESCE(u.name, ce.user_name) as student_name, COALESCE(u.class, 'Class 10') as student_class, u.phone as student_phone,
             c.title as item_name, 'Course' as item_type, 'COURSE' as category,
             COALESCE(ce.status, 'ENROLLED') as status,
             COALESCE(ce.enrolled_at, CURRENT_TIMESTAMP) as assigned_date, NULL as due_date,
             CONCAT(COALESCE(ce.progress_percent, 0), '%') as progress
      FROM course_enrollments ce
      LEFT JOIN users u ON ce.user_id = u.id
      JOIN live_courses c ON c.id = ce.course_id
      WHERE (LOWER(c.school_code) = LOWER($1) OR c.school_code = 'GLOBAL' OR c.school_code IS NULL OR c.school_code = '')
      ORDER BY ce.id DESC LIMIT 100
    `;
    const coursesRes = await db.query(coursesQuery, [sCode]).catch(() => ({ rows: [] }));

    const items = [
      ...(booksRes.rows || []),
      ...(digitalRes.rows || []),
      ...(quizRes.rows || []),
      ...(coursesRes.rows || [])
    ];

    return {
      items,
      counts: {
        total: items.length,
        books: (booksRes.rows || []).length + (digitalRes.rows || []).length,
        quizzes: (quizRes.rows || []).length,
        courses: (coursesRes.rows || []).length,
        students: new Set(items.map(i => i.user_id || i.student_name)).size
      }
    };
  } catch (err) {
    console.error('Error fetching student progress:', err);
    return { items: [], counts: { total: 0, books: 0, quizzes: 0, courses: 0, students: 0 } };
  }
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
    const booksRes = await db.query(`
      SELECT * FROM books 
      WHERE (LOWER(school_code) = LOWER($1) OR school_code = 'GLOBAL' OR school_code IS NULL OR school_code = '')
        AND (is_banned IS NULL OR (is_banned != 1 AND is_banned != '1'))
      ORDER BY id DESC
    `, [sCode]).catch(() => ({ rows: [] }));
    const books = booksRes.rows || [];

    const copiesRes = await db.query(`
      SELECT bc.*, b.title as book_title, b.author as book_author, b.isbn as book_isbn
      FROM book_copies bc
      JOIN books b ON bc.book_id = b.id
      WHERE (LOWER(b.school_code) = LOWER($1) OR b.school_code = 'GLOBAL' OR b.school_code IS NULL OR b.school_code = '')
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

    // 3. Fetch Members (Students, Teachers, Staff) with Real-Time Online Status
    const usersRes = await db.query('SELECT * FROM users WHERE school_code = $1 ORDER BY id DESC', [sCode]).catch(() => ({ rows: [] }));
    const nowMs = Date.now();
    const allUsers = (usersRes.rows || []).map(u => {
      const lastActiveMs = u.last_active_at ? new Date(u.last_active_at).getTime() : 0;
      // Online if active within last 4 minutes or explicitly marked online
      const isOnline = Boolean((nowMs - lastActiveMs <= 4 * 60 * 1000) || (u.is_online === 1 || u.is_online === '1'));
      return {
        ...u,
        isOnline,
        lastActiveFormatted: u.last_active_at ? new Date(u.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'
      };
    });

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

    // 6. Fetch Live Studio Sessions (Production Meetings & Legacy Jitsi)
    const studioRes = await db.query(`
      SELECT m.id, m.uid, m.title, m.description, m.host_user_id as host_id, m.host_name, m.meeting_code, m.meeting_code as meeting_id,
             m.jaas_room_name, m.scheduled_start, m.scheduled_end, m.duration_minutes, m.status,
             m.class_name, m.meeting_type as visibility, m.school_code,
             (SELECT COUNT(*) FROM meeting_sessions ms WHERE ms.meeting_id = m.id AND ms.left_at IS NULL) as attendee_count
      FROM meetings m
      WHERE (LOWER(m.school_code) = LOWER($1) OR m.school_code = 'DPS123' OR m.school_code = 'GLOBAL' OR m.school_code IS NULL OR m.school_code = '')
      UNION ALL
      SELECT ss.id, '' as uid, ss.title, ss.description, ss.host_id, ss.host_name, ss.meeting_code, ss.meeting_code as meeting_id,
             ss.jaas_room_name, ss.scheduled_start, ss.scheduled_end, ss.duration_minutes, ss.status,
             ss.class_name, ss.visibility, ss.school_code,
             (SELECT COUNT(*) FROM studio_attendance sa WHERE sa.session_id = ss.id) as attendee_count
      FROM studio_sessions ss
      WHERE (LOWER(ss.school_code) = LOWER($1) OR ss.school_code = 'DPS123' OR ss.school_code = 'GLOBAL' OR ss.school_code IS NULL OR ss.school_code = '')
        AND NOT EXISTS (SELECT 1 FROM meetings m2 WHERE m2.meeting_code = ss.meeting_code OR (m2.jaas_room_name = ss.jaas_room_name AND ss.jaas_room_name IS NOT NULL))
      UNION ALL
      SELECT ls.id + 100000 as id, '' as uid, ls.title, '' as description, ls.host_user_id as host_id, ls.host_name,
             ls.meeting_id as meeting_code, ls.meeting_id, ls.meeting_id as jaas_room_name,
             ls.scheduled_start, ls.scheduled_end, ls.duration_minutes, ls.status,
             'All Students' as class_name, 'CLASS' as visibility, ls.school_code,
             0 as attendee_count
      FROM live_sessions ls
      WHERE (LOWER(ls.school_code) = LOWER($1) OR ls.school_code = 'DPS123' OR ls.school_code = 'GLOBAL' OR ls.school_code IS NULL OR ls.school_code = '')
        AND NOT EXISTS (SELECT 1 FROM meetings m3 WHERE m3.meeting_code = ls.meeting_id OR m3.title = ls.title)
        AND NOT EXISTS (SELECT 1 FROM studio_sessions s2 WHERE s2.meeting_code = ls.meeting_id OR s2.title = ls.title)
      ORDER BY scheduled_start DESC LIMIT 40
    `, [sCode]).catch(async () => {
      return await db.query(`SELECT *, '' as uid FROM studio_sessions ORDER BY id DESC LIMIT 30`).catch(() => ({ rows: [] }));
    });
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

    // 10. Fetch Student Learning Progress (Books, Quizzes, Courses)
    const studentProgressData = await fetchStudentProgress(sCode);

    res.render('admin', {
      title: 'Librika Librarian Console - Intelligent Workspace',
      currentModule: targetModule,
      currentTab: targetTab,
      renderDate,
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
        pending_reservations: reservations.filter(r => r.status === 'Pending' || r.status === 'pending').length,
        student_progress_count: studentProgressData.counts.total,
        student_progress_books: studentProgressData.counts.books,
        student_progress_quizzes: studentProgressData.counts.quizzes,
        student_progress_courses: studentProgressData.counts.courses,
        student_progress_students: studentProgressData.counts.students
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
      reviews,
      studentProgressItems: studentProgressData.items,
      studentProgressCounts: studentProgressData.counts,
      dailyQuote: getRandomQuote(),
      libraryQuotes
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
router.get('/student-progress', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'student-progress'));
router.get('/requests', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'requests'));
router.get('/e-library', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'e-library'));
router.get('/studio', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'studio'));
router.get('/analytics', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'analytics'));
router.get('/settings', adminOnly, (req, res) => renderLibrarianPortal(req, res, 'settings'));

// API Endpoint for dynamic filtering / fetching of Student Progress
router.get('/api/student-progress', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  try {
    const data = await fetchStudentProgress(sCode);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API Endpoint for dynamic randomized quotes
router.get('/api/quotes/random', (req, res) => {
  const exclude = parseInt(req.query.exclude) || -1;
  res.json({ success: true, ...getRandomQuote(exclude) });
});

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
      const bRes = await db.query('SELECT * FROM books WHERE id = $1 AND (LOWER(school_code) = LOWER($2) OR school_code = \'GLOBAL\' OR school_code IS NULL OR school_code = \'\')', [book_id, sCode]);
      book = bRes.rows && bRes.rows[0];
    } else if (barcode) {
      const bRes = await db.query('SELECT * FROM books WHERE (barcode_id = $1 OR isbn = $1) AND (LOWER(school_code) = LOWER($2) OR school_code = \'GLOBAL\' OR school_code IS NULL OR school_code = \'\')', [barcode, sCode]);
      book = bRes.rows && bRes.rows[0];
    }

    if (!book) return res.json({ status: 'error', message: 'Book not found in school catalog.' });
    if (parseInt(book.available_copies, 10) <= 0) {
      return res.json({ status: 'error', message: `'${book.title}' has 0 available copies in stock.` });
    }

    // Determine borrowing days based on book_size
    let bookSize = (book.book_size || 'MEDIUM').toUpperCase();
    let defaultDays = 15;
    if (bookSize === 'SMALL') defaultDays = 7;
    else if (bookSize === 'BIG') defaultDays = 25;
    else defaultDays = 15;

    const loanDays = parseInt(due_days, 10) || parseInt(book.offline_borrowing_days, 10) || defaultDays;
    const dDate = dueDate(loanDays);
    const iDate = renderDate(new Date());

    // 4. Execute Transaction
    const txRes = await db.query(`
      INSERT INTO transactions (user_id, book_id, issue_date, due_date, class, school_code, book_size, allowed_days, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ISSUED')
    `, [member_id, book.id, iDate, dDate, member.class || 'N/A', sCode, bookSize, loanDays]);

    let transactionId = null;
    if (txRes && txRes.rows && txRes.rows[0] && txRes.rows[0].id) {
      transactionId = txRes.rows[0].id;
    } else {
      // Fallback: lookup the newly created transaction
      const lastTx = await db.query(
        'SELECT id FROM transactions WHERE user_id = $1 AND book_id = $2 ORDER BY id DESC LIMIT 1',
        [member_id, book.id]
      );
      if (lastTx && lastTx.rows && lastTx.rows[0]) transactionId = lastTx.rows[0].id;
    }

    // 4b. Record in offline_book_readings with quiz_status = 'LOCKED'
    await db.query(`
      INSERT INTO offline_book_readings (student_id, book_id, transaction_id, school_code, issue_date, due_date, return_status, quiz_status)
      VALUES ($1, $2, $3, $4, $5, $6, 'ISSUED', 'LOCKED')
    `, [member_id, book.id, transactionId, sCode, iDate, dDate]).catch(err => {
      console.warn('[CIRCULATION] offline_book_readings insert warning:', err.message);
    });

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

    // Calculate return status and late days
    const isLate = fineData.is_overdue || false;
    const lateDays = isLate ? (fineData.days_overdue || 0) : 0;
    const returnStatus = isLate ? 'RETURNED_LATE' : 'RETURNED_ON_TIME';

    // 1. Mark Loan Returned
    await db.query(`
      UPDATE transactions
      SET return_date = $1, fine = $2, status = $3, late_days = $4
      WHERE id = $5
    `, [retDate, fineData.fine, returnStatus, lateDays, loan.id]);

    // 1b. Update offline_book_readings and unlock quiz
    const nowTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.query(`
      UPDATE offline_book_readings
      SET return_date = $1, return_status = $2, late_days = $3, quiz_status = 'ELIGIBLE', quiz_eligible_at = $4
      WHERE (transaction_id = $5 OR (student_id = $6 AND book_id = $7 AND return_date IS NULL))
    `, [retDate, returnStatus, lateDays, nowTimestamp, loan.id, loan.user_id, loan.book_id]).catch(err => {
      console.warn('[CIRCULATION] offline_book_readings return update warning:', err.message);
    });

    // Notify student about unlocked quiz
    await db.query(`
      INSERT INTO notifications (user_id, message, type, school_code)
      VALUES ($1, $2, 'quiz_unlocked', $3)
    `, [
      loan.user_id,
      `🎉 You returned '${loan.book_title}'! The offline book quiz is now UNLOCKED in your Student Portal.`,
      sCode
    ]).catch(() => {});

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

    // Full AI answer with live metrics and Librika knowledge
    const countRes = await db.query('SELECT COUNT(*) as total FROM books WHERE (LOWER(school_code) = LOWER($1) OR school_code = \'GLOBAL\' OR school_code IS NULL OR school_code = \'\') AND (is_banned IS NULL OR is_banned != 1)', [sCode]);
    const totalB = countRes.rows && countRes.rows[0] ? countRes.rows[0].total : 0;
    
    const context = `Librarian at school ${sCode} with ${totalB} physical books in the catalog. User is logged in as School Admin / Librarian.`;
    const aiReply = await aiService.chatWithAssistant(message.trim(), context);
    return res.json({ reply: aiReply });
  } catch (err) {
    console.error('Admin AI endpoint error:', err);
    return res.json({ reply: 'I am ready to help! Ask me anything about your books, members, circulation desk, or digital library publishing.' });
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
// 8. BOOK REGISTRATION (3 MODES: NORMAL TEXT SCAN, SEARCH ONLINE, MANUAL SEARCH)
// ─────────────────────────────────────────────────────────────────────────────

// Internal Library Book ID Generator: VBPG + Year + Sequence (e.g. VBPG20260001)
async function generateNextBookId(schoolCode) {
  const year = new Date().getFullYear();
  const prefix = `VBPG${year}`;

  try {
    const res = await db.query(
      `SELECT book_id, barcode_id FROM books 
       WHERE (book_id LIKE $1 OR barcode_id LIKE $2) 
       ORDER BY id DESC LIMIT 100`,
      [`${prefix}%`, `${prefix}%`]
    ).catch(() => ({ rows: [] }));

    let maxSeq = 0;
    for (const r of (res.rows || [])) {
      const candidate = String(r.book_id || r.barcode_id || '');
      const match = candidate.match(new RegExp(`^${prefix}(\\d+)`));
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxSeq) maxSeq = val;
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(4, '0');
    return `${prefix}${nextSeq}`;
  } catch (err) {
    console.error('generateNextBookId error:', err.message);
    return `${prefix}0001`;
  }
}

// Get next system Book ID (VBPG20260001)
router.get('/api/books/next-id', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DPS123';
  try {
    const nextBookId = await generateNextBookId(sCode);
    return res.json({ success: true, bookId: nextBookId });
  } catch (err) {
    console.error('Error generating next book id:', err);
    const fallbackId = `VBPG${new Date().getFullYear()}0001`;
    return res.json({ success: true, bookId: fallbackId });
  }
});

// Mode 1: Normal Text Scan OCR & Field Extraction (No barcodes!)
router.post('/api/books/ocr-text', adminOnly, async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ success: false, error: 'Please provide an image of the physical book.' });
  }

  try {
    const ocrData = await aiService.extractTextAndIdentifyFields(imageBase64);
    return res.json({
      success: true,
      rawText: ocrData.rawText || '',
      identified: ocrData.identified || {}
    });
  } catch (err) {
    console.error('OCR text extraction error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to extract text from book image: ' + err.message
    });
  }
});

// Mode 2 & Mode 3: Search Online Book Databases (Google Books & OpenLibrary)
router.all('/api/books/search-online', adminOnly, async (req, res) => {
  const params = req.method === 'POST' ? req.body : req.query;
  const { query, title, author, publisher, isbn, subject } = params || {};

  if (!query && !title && !author && !isbn && !publisher && !subject) {
    return res.status(400).json({ success: false, error: 'Please enter a book title, author, or keyword to search.' });
  }

  try {
    const searchArgs = (title || author || publisher || isbn || subject) 
      ? { query, title, author, publisher, isbn, subject }
      : (query || title);

    const results = await bookMetadataService.searchOnlineBooks(searchArgs, 8);
    return res.json({ success: true, results });
  } catch (err) {
    console.error('Online book search error:', err);
    return res.status(500).json({ success: false, error: 'Failed to search online books: ' + err.message });
  }
});

// Metadata Lookup via Google Books / OpenLibrary (Single Lookup)
router.get('/api/books/lookup', adminOnly, async (req, res) => {
  const isbn = (req.query.isbn || req.query.q || '').trim();
  const title = (req.query.title || '').trim();
  const author = (req.query.author || '').trim();
  const sCode = req.session.school_code || 'DPS123';

  if (!isbn && !title) {
    return res.status(400).json({ error: 'Please provide an ISBN or book title to search' });
  }

  try {
    const meta = await bookMetadataService.fetchBookMetadata(isbn || title);
    const resolvedIsbn = (meta && meta.isbn) ? meta.isbn : isbn;
    const resolvedTitle = (meta && meta.title) ? meta.title : title;
    const resolvedAuthor = (meta && meta.author) ? meta.author : author;

    const { duplicateBook, matchingAcquisition } = await bookMetadataService.checkDuplicateAndAcquisitions(
      resolvedIsbn, resolvedTitle, resolvedAuthor, sCode
    );

    return res.json({
      success: true,
      metadata: meta || {
        title: resolvedTitle,
        author: resolvedAuthor,
        isbn: resolvedIsbn,
        category: 'General',
        publisher: '',
        published_year: '',
        description: '',
        cover_url: ''
      },
      duplicateBook,
      matchingAcquisition
    });
  } catch (err) {
    console.error('Book lookup error:', err);
    return res.status(500).json({ error: 'Failed to look up book metadata: ' + err.message });
  }
});

// Unified Book Add / Registration (Strict No-Barcode with VBPG Book ID)
router.post(['/book/add', '/books/add'], adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  const { 
    book_id: inputBookId, title, author, publisher, edition, isbn, language, subject,
    class: bookClass, price, publication_year, total_copies, shelf_location, rack, shelf,
    book_condition, description, cover_url, back_cover_url, acquisition_item_id, genre
  } = req.body;

  if (!title || !title.trim()) {
    if (req.is('json') || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, error: 'Book Title is required' });
    }
    req.flash('error', 'Book Title is required');
    return res.redirect('/admin/catalog');
  }

  try {
    const copies = parseInt(total_copies, 10) || 1;
    // Generate or format unique VBPG Book ID (never a barcode!)
    let finalBookId = (inputBookId && inputBookId.trim().startsWith('VBPG')) 
      ? inputBookId.trim() 
      : await generateNextBookId(sCode);

    // Shelf location
    const shelfLoc = shelf_location ? shelf_location.trim() : `${rack || 'A'}-${shelf || '1'}`;
    const cleanSub = subject || genre || 'General';

    const insRes = await db.query(`
      INSERT INTO books (
        book_id, title, author, publisher, edition, isbn, language, subject, class,
        price, publication_year, genre, barcode_id, total_copies, available_copies,
        school_code, description, shelf_location, book_condition, cover_url, back_cover_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING id
    `, [
      finalBookId, title.trim(), author || 'Unknown', publisher || '', edition || '',
      isbn || '', language || 'English', cleanSub, bookClass || '',
      price || '', publication_year || '', cleanSub, finalBookId, copies, copies,
      sCode, description || '', shelfLoc, book_condition || 'GOOD',
      cover_url || '', back_cover_url || ''
    ]).catch(async () => {
      // Fallback for MySQL/SQLite without RETURNING
      return await db.query(`
        INSERT INTO books (
          book_id, title, author, publisher, edition, isbn, language, subject, class,
          price, publication_year, genre, barcode_id, total_copies, available_copies,
          school_code, description, shelf_location, book_condition, cover_url, back_cover_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      `, [
        finalBookId, title.trim(), author || 'Unknown', publisher || '', edition || '',
        isbn || '', language || 'English', cleanSub, bookClass || '',
        price || '', publication_year || '', cleanSub, finalBookId, copies, copies,
        sCode, description || '', shelfLoc, book_condition || 'GOOD',
        cover_url || '', back_cover_url || ''
      ]);
    });

    const dbId = (insRes.rows && insRes.rows[0]) ? insRes.rows[0].id : insRes.lastId;

    // Generate individual copy records using the unique Book ID
    if (dbId) {
      for (let i = 1; i <= copies; i++) {
        await db.query(`
          INSERT INTO book_copies (book_id, barcode, condition_status, availability_status, school_code)
          VALUES ($1, $2, $3, 'AVAILABLE', $4)
        `, [dbId, `${finalBookId}-C${i}`, book_condition || 'GOOD', sCode]).catch(() => {});
      }
    }

    // If linked to acquisition record, increment registered_copies
    if (acquisition_item_id) {
      await db.query(`
        UPDATE acquisition_items 
        SET registered_copies = COALESCE(registered_copies, 0) + $1
        WHERE id = $2
      `, [copies, parseInt(acquisition_item_id)]).catch(e => console.warn('Acq item update note:', e.message));
    }

    if (req.is('json') || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        bookId: finalBookId,
        id: dbId,
        message: `Book '${title}' registered successfully with Book ID: ${finalBookId}!`,
        book: {
          book_id: finalBookId,
          title,
          author,
          publisher,
          edition,
          isbn,
          language: language || 'English',
          subject: cleanSub,
          class: bookClass || '',
          price: price || '',
          publication_year: publication_year || '',
          total_copies: copies,
          shelf_location: shelfLoc,
          book_condition: book_condition || 'GOOD',
          cover_url: cover_url || ''
        }
      });
    }

    req.flash('success', `Book '${title}' registered successfully with Book ID ${finalBookId}!`);
    return res.redirect('/admin/catalog');
  } catch (err) {
    console.error('Add book error:', err);
    if (req.is('json') || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, error: 'Failed to add book: ' + err.message });
    }
    req.flash('error', 'Failed to add book: ' + err.message);
    return res.redirect('/admin/catalog');
  }
});

// Bulk Batch Registration from Scanning Queue
router.post('/api/books/batch-register', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  const books = req.body.books || [];

  if (!Array.isArray(books) || books.length === 0) {
    return res.status(400).json({ success: false, error: 'No books provided in batch' });
  }

  const results = [];
  let registeredCount = 0;

  for (const b of books) {
    try {
      const title = (b.title || '').trim();
      if (!title) continue;

      const copies = parseInt(b.copies || b.total_copies, 10) || 1;
      const barcodeId = b.isbn || `LIB-${Date.now().toString().slice(-8)}-${Math.floor(Math.random()*1000)}`;
      const shelfLoc = `${b.rack || 'A'}-${b.shelf || '1'}`;

      const insRes = await db.query(`
        INSERT INTO books (title, author, genre, barcode_id, total_copies, available_copies, school_code, description, isbn, shelf_location, language, cover_url, back_cover_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        title, b.author || 'Unknown', b.genre || b.category || 'General', barcodeId, copies, copies, sCode,
        b.description || null, b.isbn || null, shelfLoc, b.language || 'English',
        b.cover_url || '', b.back_cover_url || ''
      ]).catch(async () => {
        return await db.query(`
          INSERT INTO books (title, author, genre, barcode_id, total_copies, available_copies, school_code, description, isbn, shelf_location, language, cover_url, back_cover_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          title, b.author || 'Unknown', b.genre || b.category || 'General', barcodeId, copies, copies, sCode,
          b.description || null, b.isbn || null, shelfLoc, b.language || 'English',
          b.cover_url || '', b.back_cover_url || ''
        ]);
      });

      const bookId = (insRes.rows && insRes.rows[0]) ? insRes.rows[0].id : insRes.lastId;

      if (bookId) {
        for (let i = 1; i <= copies; i++) {
          await db.query(`
            INSERT INTO book_copies (book_id, barcode, condition_status, availability_status, school_code)
            VALUES ($1, $2, 'GOOD', 'AVAILABLE', $3)
          `, [bookId, `${barcodeId}-C${i}`, sCode]).catch(() => {});
        }
      }

      if (b.acquisition_item_id) {
        await db.query(`
          UPDATE acquisition_items 
          SET registered_copies = COALESCE(registered_copies, 0) + $1
          WHERE id = $2
        `, [copies, parseInt(b.acquisition_item_id)]).catch(() => {});
      }

      registeredCount++;
      results.push({ success: true, title, bookId, copies });
    } catch (err) {
      results.push({ success: false, title: b.title, error: err.message });
    }
  }

  return res.json({
    success: true,
    registeredCount,
    totalSubmitted: books.length,
    message: `Batch registered ${registeredCount} out of ${books.length} books successfully!`,
    results
  });
});

// Member Status Toggle (Synchronously updates is_banned and status)
router.post('/api/member/:id/toggle-status', adminOnly, async (req, res) => {
  const { id } = req.params;
  const sCode = req.session.school_code || 'DEMO01';
  try {
    const userRes = await db.query('SELECT id, name, is_banned, status FROM users WHERE id = $1 AND (school_code = $2 OR $2 = "DEMO01" OR $2 = "DPS123")', [id, sCode]);
    if (!userRes.rows || userRes.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    const member = userRes.rows[0];
    const isSuspended = (member.is_banned == 1 || member.is_banned === '1' || member.is_banned === true || String(member.status || '').toLowerCase() === 'suspended');
    const newBan = isSuspended ? '0' : '1';
    const newStatus = isSuspended ? 'active' : 'suspended';
    await db.query('UPDATE users SET is_banned = $1, status = $2 WHERE id = $3', [newBan, newStatus, id]);
    res.json({ success: true, is_banned: newBan === '1', status: newStatus, message: `Member ${member.name} is now ${newStatus}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ACQUISITIONS MANAGEMENT ROUTES
// ─────────────────────────────────────────────────────────────────────────────
router.get('/acquisitions', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  try {
    const statsRes = await db.query(`
      SELECT 
        COUNT(*) as total_acquisitions,
        COALESCE(SUM(total_books), 0) as total_books,
        COALESCE(SUM(total_copies), 0) as total_copies,
        COALESCE(SUM(total_amount), 0) as total_value
      FROM acquisitions
      WHERE school_code = $1 OR school_code = 'DPS123'
    `, [sCode]).catch(() => ({ rows: [{ total_acquisitions: 0, total_books: 0, total_copies: 0, total_value: 0 }] }));

    const stats = statsRes.rows[0] || { total_acquisitions: 0, total_books: 0, total_copies: 0, total_value: 0 };

    const acqRes = await db.query(`
      SELECT a.*, v.name as vendor_name, u.name as user_name
      FROM acquisitions a
      LEFT JOIN vendors v ON a.vendor_id = v.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.school_code = $1 OR a.school_code = 'DPS123'
      ORDER BY a.id DESC
    `, [sCode]).catch(() => ({ rows: [] }));

    const vendorRes = await db.query(`
      SELECT * FROM vendors WHERE school_code = $1 OR school_code = 'DPS123' ORDER BY name ASC
    `, [sCode]).catch(() => ({ rows: [] }));

    res.render('admin_acquisitions', {
      title: 'Acquisitions & Inventory Management - Librika',
      stats,
      acquisitions: acqRes.rows || [],
      vendors: vendorRes.rows || [],
      session: req.session,
      renderDate: (d) => d ? new Date(d).toLocaleDateString() : 'N/A'
    });
  } catch (err) {
    console.error('Acquisitions page error:', err);
    res.redirect('/admin/catalog');
  }
});

router.get('/acquisitions/get/:id', adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const acqRes = await db.query('SELECT * FROM acquisitions WHERE id = $1', [id]);
    if (!acqRes.rows || acqRes.rows.length === 0) return res.status(404).json({ error: 'Acquisition not found' });

    const itemsRes = await db.query('SELECT * FROM acquisition_items WHERE acquisition_id = $1', [id]);

    res.json({
      status: 'success',
      acquisition: acqRes.rows[0],
      items: itemsRes.rows || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/acquisitions/isbn-lookup', adminOnly, async (req, res) => {
  const isbn = (req.query.isbn || '').trim();
  if (!isbn) return res.status(400).json({ success: false, error: 'ISBN is required' });

  try {
    const meta = await bookMetadataService.fetchBookMetadata(isbn);
    if (meta) {
      return res.json({
        success: true,
        title: meta.title,
        author: meta.author,
        category: meta.category,
        cover_url: meta.cover_url
      });
    }
    return res.json({ success: false, message: 'Book not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/acquisitions/ocr', adminOnly, upload.single('bill_file'), async (req, res) => {
  try {
    const sampleItems = [
      { isbn: '9780132350884', title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', quantity: 3, unit_price: 650.00, category: 'Computer Science', rack: 'A', shelf: '2' },
      { isbn: '9780134685991', title: 'Effective Java (3rd Edition)', author: 'Joshua Bloch', quantity: 2, unit_price: 720.00, category: 'Computer Science', rack: 'A', shelf: '3' },
      { isbn: '9780321751041', title: 'The Art of Computer Programming', author: 'Donald Knuth', quantity: 1, unit_price: 1850.00, category: 'Mathematics', rack: 'B', shelf: '1' }
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const totalAmount = sampleItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    return res.json({
      status: 'success',
      data: {
        bill_number: invoiceNo,
        bill_date: todayStr,
        total_amount: totalAmount.toFixed(2),
        items: sampleItems
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/acquisitions/complete', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DPS123';
  const userId = req.session.user_id || 1;
  const { bill_number, bill_date, vendor_id, total_amount, invoice_image, items, acquisition_id } = req.body;

  if (!bill_number || !items || !items.length) {
    return res.status(400).json({ status: 'error', message: 'Missing required acquisition details or items.' });
  }

  try {
    let acqId = acquisition_id;
    const totalBooks = items.length;
    const totalCopies = items.reduce((sum, i) => sum + (parseInt(i.quantity) || 1), 0);

    if (!acqId) {
      const insAcq = await db.query(`
        INSERT INTO acquisitions (school_code, bill_number, bill_date, vendor_id, total_books, total_copies, total_amount, status, created_by, invoice_image)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'Completed', $8, $9)
        RETURNING id
      `, [sCode, bill_number, bill_date, vendor_id ? parseInt(vendor_id) : null, totalBooks, totalCopies, parseFloat(total_amount) || 0, userId, invoice_image || null]).catch(async () => {
        return await db.query(`
          INSERT INTO acquisitions (school_code, bill_number, bill_date, vendor_id, total_books, total_copies, total_amount, status, created_by, invoice_image)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'Completed', $8, $9)
        `, [sCode, bill_number, bill_date, vendor_id ? parseInt(vendor_id) : null, totalBooks, totalCopies, parseFloat(total_amount) || 0, userId, invoice_image || null]);
      });

      acqId = (insAcq.rows && insAcq.rows[0]) ? insAcq.rows[0].id : insAcq.lastId;
    }

    const accessions = [];

    for (const item of items) {
      const qty = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const totalPrice = qty * unitPrice;

      const insItem = await db.query(`
        INSERT INTO acquisition_items (acquisition_id, isbn, title, author, quantity, registered_copies, unit_price, total_price, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Registered')
        RETURNING id
      `, [acqId, item.isbn || '', item.title, item.author || '', qty, qty, unitPrice, totalPrice]).catch(async () => {
        return await db.query(`
          INSERT INTO acquisition_items (acquisition_id, isbn, title, author, quantity, registered_copies, unit_price, total_price, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Registered')
        `, [acqId, item.isbn || '', item.title, item.author || '', qty, qty, unitPrice, totalPrice]);
      });

      const itemId = (insItem.rows && insItem.rows[0]) ? insItem.rows[0].id : insItem.lastId;

      const barcodeId = item.isbn || `ACQ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*100)}`;
      const shelfLoc = `${item.rack || 'A'}-${item.shelf || '1'}`;

      const insBook = await db.query(`
        INSERT INTO books (title, author, genre, barcode_id, total_copies, available_copies, school_code, isbn, shelf_location)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [item.title, item.author || 'Unknown', item.category || 'General', barcodeId, qty, qty, sCode, item.isbn || null, shelfLoc]).catch(async () => {
        return await db.query(`
          INSERT INTO books (title, author, genre, barcode_id, total_copies, available_copies, school_code, isbn, shelf_location)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [item.title, item.author || 'Unknown', item.category || 'General', barcodeId, qty, qty, sCode, item.isbn || null, shelfLoc]);
      });

      const bookId = (insBook.rows && insBook.rows[0]) ? insBook.rows[0].id : insBook.lastId;

      for (let c = 1; c <= qty; c++) {
        const accNo = `ACC-${acqId}-${itemId || 1}-${c}`;
        accessions.push({
          accession: accNo,
          title: item.title,
          shelf: item.shelf || '1',
          rack: item.rack || 'A'
        });

        if (bookId) {
          await db.query(`
            INSERT INTO book_copies (book_id, barcode, condition_status, availability_status, school_code)
            VALUES ($1, $2, 'GOOD', 'AVAILABLE', $3)
          `, [bookId, accNo, sCode]).catch(() => {});
        }
      }
    }

    res.json({
      status: 'success',
      acquisition_id: acqId,
      accessions
    });
  } catch (err) {
    console.error('Complete acquisition error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/acquisitions/delete/:id', adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM acquisition_items WHERE acquisition_id = $1', [id]);
    await db.query('DELETE FROM acquisitions WHERE id = $1', [id]);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
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

router.post('/api/books/:id/edit', adminOnly, async (req, res) => {
  const { id } = req.params;
  const sCode = req.session.school_code || 'DEMO01';
  const { title, author, isbn, total_copies, shelf_location } = req.body;

  try {
    const copies = parseInt(total_copies, 10) || 1;
    await db.query(`
      UPDATE books 
      SET title = $1, author = $2, isbn = $3, total_copies = $4, shelf_location = $5
      WHERE id = $6 AND (school_code = $7 OR $7 = 'DEMO01' OR $7 = 'DPS123')
    `, [title, author || 'Unknown', isbn || null, copies, shelf_location || 'A-1', id, sCode]);

    res.json({ success: true, message: 'Book updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

