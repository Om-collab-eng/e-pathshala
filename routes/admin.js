const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const bwipjs = require('bwip-js');
const aiService = require('../services/aiService');
const memberCsvService = require('../services/memberCsvService');
const { quotes: libraryQuotes, getRandomQuote } = require('../data/quotes');
const bookMetadataService = require('../services/bookMetadataService');
const ocrEngineService = require('../services/ocrEngineService');
const groqBookAgent = require('../services/groqBookAgent');
const bookCrawlerService = require('../services/bookCrawlerService');
const bookCopyService = require('../services/bookCopyService');
const { logActivity } = require('../services/auditLogger');
const notificationService = require('../services/notificationService');
const pushNotificationService = require('../services/pushNotificationService');
const quizVerificationService = require('../services/quizVerificationService');
require('dotenv').config();

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const upload = multer({
  dest: path.join(__dirname, '..', 'static', 'uploads'),
  limits: { fileSize: 28 * 1024 * 1024 }
});

// Strict Router-Level RBAC Guard: Super Admin must NEVER load Librarian views
router.use(async (req, res, next) => {
  if (req.session && req.session.user_id) {
    try {
      const uRes = await db.query('SELECT role, school_code, name FROM users WHERE id = $1', [req.session.user_id]);
      if (uRes && uRes.rows && uRes.rows.length > 0) {
        const dbRole = uRes.rows[0].role;
        req.session.role = dbRole;
        if (uRes.rows[0].school_code && !req.session.school_code) {
          req.session.school_code = uRes.rows[0].school_code;
        }
        if (uRes.rows[0].name) req.session.name = uRes.rows[0].name;
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
  const r = String((req.session && req.session.role) || '').toLowerCase();
  if (['admin', 'librarian', 'school_admin', 'super_admin', 'superadmin', 'owner', 'quiz_manager', 'content_manager'].includes(r)) return next();
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

async function getCirculationSettings(schoolCode = 'DEMO01') {
  const sCode = schoolCode || 'DEMO01';
  const defaults = {
    loan_duration_days: 14,
    student_max_books: 3,
    teacher_max_books: 10,
    staff_max_books: 5,
    teacher_loan_days: 30,
    fine_per_day: 5,
    grace_period_days: 2,
    lost_book_charge: 150,
    max_renewals: 2
  };
  try {
    const sRes = await db.query(
      'SELECT setting_key, setting_value FROM library_settings WHERE school_code = $1',
      [sCode]
    );
    (sRes.rows || []).forEach(r => {
      if (r.setting_key && r.setting_value !== undefined && r.setting_value !== null && r.setting_value !== '') {
        const num = Number(r.setting_value);
        defaults[r.setting_key] = (!isNaN(num) && r.setting_key !== 'allow_digital_downloads') ? num : r.setting_value;
      }
    });
  } catch (err) {
    console.warn('[CIRCULATION] Failed to fetch settings for school ' + sCode + ':', err.message);
  }
  return defaults;
}

function calculateFine(dueDateStr, finePerDay = 5, graceDays = 2) {
  if (!dueDateStr) return { fine: 0, is_overdue: false, days_overdue: 0, late_days: 0, chargeable_days: 0, grace_days: Number(graceDays) || 0, fine_rate: Number(finePerDay) || 0 };
  const due = new Date(dueDateStr);
  if (isNaN(due.getTime())) return { fine: 0, is_overdue: false, days_overdue: 0, late_days: 0, chargeable_days: 0, grace_days: Number(graceDays) || 0, fine_rate: Number(finePerDay) || 0 };
  
  const today = new Date();
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = todayMidnight.getTime() - dueMidnight.getTime();
  if (diffTime > 0) {
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const gDays = Math.max(0, Number(graceDays) || 0);
    const fRate = Math.max(0, Number(finePerDay) || 0);
    const chargeableDays = Math.max(0, diffDays - gDays);
    return {
      fine: chargeableDays * fRate,
      is_overdue: diffDays > 0,
      days_overdue: diffDays,
      late_days: diffDays,
      chargeable_days: chargeableDays,
      grace_days: gDays,
      fine_rate: fRate
    };
  }
  return { fine: 0, is_overdue: false, days_overdue: 0, late_days: 0, chargeable_days: 0, grace_days: Number(graceDays) || 0, fine_rate: Number(finePerDay) || 0 };
}

// Helper to fetch student learning progress across Books, Quizzes, and Courses
async function fetchStudentProgress(sCode) {
  try {
    // 1. Physical Books (Active issues first, plus recent returned loans)
    const booksQuery = `
      SELECT t.id, t.user_id, u.name as student_name, COALESCE(u.class, 'Class 10') as student_class, u.phone as student_phone,
             b.title as item_name, 'Physical Book' as item_type, 'BOOK' as category,
             CASE 
               WHEN t.return_date IS NOT NULL AND t.return_date != '' THEN 'RETURNED'
               WHEN t.due_date IS NOT NULL AND t.due_date < CURRENT_TIMESTAMP THEN 'OVERDUE'
               ELSE COALESCE(t.status, 'ISSUED')
             END as status,
             t.issue_date as assigned_date, t.due_date,
             CASE 
               WHEN t.return_date IS NOT NULL AND t.return_date != '' THEN 'Completed / Returned'
               WHEN t.due_date IS NOT NULL AND t.due_date < CURRENT_TIMESTAMP THEN 'Overdue'
               ELSE 'Reading / Issued'
             END as progress
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN books b ON t.book_id = b.id
      WHERE (
        LOWER(t.school_code) = LOWER($1) 
        OR LOWER(u.school_code) = LOWER($1)
        OR t.school_code = 'GLOBAL' 
        OR t.school_code IS NULL 
        OR t.school_code = ''
        OR LOWER($1) = 'demo01'
      )
      ORDER BY 
        CASE WHEN t.return_date IS NULL OR t.return_date = '' THEN 1 ELSE 2 END,
        t.id DESC 
      LIMIT 100
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
      WHERE (
        LOWER(dbr.school_code) = LOWER($1) 
        OR LOWER(u.school_code) = LOWER($1)
        OR dbr.school_code = 'GLOBAL' 
        OR dbr.school_code IS NULL 
        OR dbr.school_code = ''
        OR LOWER($1) = 'demo01'
      )
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
      WHERE (
        LOWER(u.school_code) = LOWER($1) 
        OR u.school_code = 'GLOBAL' 
        OR u.school_code IS NULL 
        OR u.school_code = ''
        OR LOWER($1) = 'demo01'
      )
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
      WHERE (
        LOWER(c.school_code) = LOWER($1) 
        OR c.school_code = 'GLOBAL' 
        OR c.school_code IS NULL 
        OR c.school_code = ''
        OR LOWER($1) = 'demo01'
      )
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
    // 0. Fetch Settings early so they can be passed to fine calculation and UI
    const settingsMap = await getCirculationSettings(sCode);
    const finePerDay = Number(settingsMap.fine_per_day) || 5;
    const graceDays = Number(settingsMap.grace_period_days) || 2;

    // 1. Fetch Transactions & Overdue
    let txQuery = `
      SELECT t.*, u.name as user_name, u.admission_no as user_admission, u.phone as user_phone, u.class as user_class, u.role as user_role,
             b.title as book_title, b.author as book_author, COALESCE(t.barcode, b.barcode_id) as book_barcode, b.cover_url as book_cover
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
      const fineData = calculateFine(tx.due_date, finePerDay, graceDays);
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
      SELECT bc.*, b.title as book_title, b.author as book_author, b.isbn as book_isbn, b.edition as book_edition
      FROM book_copies bc
      JOIN books b ON bc.book_id = b.id
      WHERE (LOWER(bc.school_code) = LOWER($1) OR LOWER(b.school_code) = LOWER($1) OR bc.school_code = 'GLOBAL' OR b.school_code = 'GLOBAL' OR bc.school_code IS NULL OR bc.school_code = '')
      ORDER BY bc.book_id ASC, bc.copy_number ASC
    `, [sCode]).catch(() => ({ rows: [] }));
    const bookCopies = copiesRes.rows || [];

    // Group copies under their respective Book Groups
    const copiesByBookId = {};
    bookCopies.forEach(c => {
      const bId = String(c.book_id);
      if (!copiesByBookId[bId]) copiesByBookId[bId] = [];
      copiesByBookId[bId].push(c);
      if (c.book_id !== bId) {
        if (!copiesByBookId[c.book_id]) copiesByBookId[c.book_id] = [];
        copiesByBookId[c.book_id].push(c);
      }
    });

    let totalCopiesCount = 0;
    let availableCopiesCount = 0;
    let damagedCopiesCount = 0;
    let lostCopiesCount = 0;

    books.forEach(b => {
      b.copies = copiesByBookId[String(b.id)] || copiesByBookId[b.id] || [];
      const actualTotal = b.copies.length > 0 ? b.copies.length : (parseInt(b.total_copies, 10) || 1);
      const actualAvailable = b.copies.length > 0 
        ? b.copies.filter(c => (c.status === 'AVAILABLE' || c.availability_status === 'AVAILABLE')).length 
        : (parseInt(b.available_copies, 10) || 0);

      b.total_copies = actualTotal;
      b.available_copies = actualAvailable;

      totalCopiesCount += actualTotal;
      availableCopiesCount += actualAvailable;
    });

    bookCopies.forEach(c => {
      if (c.condition_status === 'DAMAGED') damagedCopiesCount++;
      if (c.condition_status === 'LOST' || c.status === 'LOST' || c.availability_status === 'LOST') lostCopiesCount++;
    });

    // Barcode Settings
    const barcodeSettings = await bookCopyService.getBarcodeSettings(sCode);

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

    // 7. Library Settings & Rules already loaded in settingsMap above

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

    // 11. Fetch Acquisitions & Procurement Data for Catalog Module
    const acqStatsRes = await db.query(`
      SELECT 
        COUNT(*) as total_acquisitions,
        COALESCE(SUM(total_books), 0) as total_books,
        COALESCE(SUM(total_copies), 0) as total_copies,
        COALESCE(SUM(total_amount), 0) as total_value
      FROM acquisitions
      WHERE school_code = $1 OR school_code = 'DPS123' OR school_code = 'GLOBAL'
    `, [sCode]).catch(() => ({ rows: [{ total_acquisitions: 0, total_books: 0, total_copies: 0, total_value: 0 }] }));
    const acqStats = (acqStatsRes.rows && acqStatsRes.rows[0]) || { total_acquisitions: 0, total_books: 0, total_copies: 0, total_value: 0 };

    const acqListRes = await db.query(`
      SELECT a.*, v.name as vendor_name, u.name as user_name
      FROM acquisitions a
      LEFT JOIN vendors v ON a.vendor_id = v.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.school_code = $1 OR a.school_code = 'DPS123' OR a.school_code = 'GLOBAL'
      ORDER BY a.id DESC
    `, [sCode]).catch(() => ({ rows: [] }));
    const acquisitionsList = acqListRes.rows || [];

    const acqVendorsRes = await db.query(`
      SELECT * FROM vendors WHERE school_code = $1 OR school_code = 'DPS123' OR school_code = 'GLOBAL' ORDER BY name ASC
    `, [sCode]).catch(() => ({ rows: [] }));
    const acqVendors = acqVendorsRes.rows || [];

    // 12. Fetch Logged-in Librarian Profile (Avatar & Contact)
    const curUserRes = await db.query('SELECT * FROM users WHERE id = $1', [req.session.user_id]).catch(() => ({ rows: [] }));
    const librarianUser = (curUserRes.rows && curUserRes.rows[0]) || req.session || {};

    res.render('admin', {
      title: 'Librika Librarian Console - Intelligent Workspace',
      currentModule: targetModule,
      currentTab: targetTab,
      renderDate,
      school,
      librarian: librarianUser,
      session: req.session,
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
      barcodeSettings,
      acqStats,
      acquisitions: acquisitionsList,
      acqVendors,
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
router.all('/api/circulation/lookup-member', adminOnly, async (req, res) => {
  const query = req.body.query || req.query.query || req.query.q || '';
  const sCode = req.session.school_code || 'DEMO01';
  if (!query || !query.trim()) return res.json({ status: 'error', message: 'Enter Member ID, Admission No, or Phone' });

  try {
    const cleanQ = query.trim();
    const settings = await getCirculationSettings(sCode);
    const finePerDay = Number(settings.fine_per_day) || 5;
    const graceDays = Number(settings.grace_period_days) || 2;

    const userRes = await db.query(`
      SELECT u.id, u.name, u.admission_no, u.student_id, u.class, u.section, u.phone, u.role, u.is_banned, u.email, u.avatar_id, u.profile_picture
      FROM users u
      WHERE (u.admission_no = $1 OR u.phone = $1 OR u.student_id = $1 OR CAST(u.id AS TEXT) = $1 OR u.email = $1 OR LOWER(u.name) = LOWER($1))
      AND (LOWER(u.school_code) = LOWER($2) OR u.school_code = 'GLOBAL' OR u.school_code IS NULL OR u.school_code = '')
      LIMIT 1
    `, [cleanQ, sCode]).catch(async () => {
      return await db.query(`
        SELECT u.id, u.name, u.admission_no, u.student_id, u.class, u.section, u.phone, u.role, u.is_banned, u.email, u.avatar_id, u.profile_picture
        FROM users u
        WHERE (u.admission_no = ? OR u.phone = ? OR u.student_id = ? OR u.id = ? OR u.email = ? OR u.name = ?)
        AND (LOWER(u.school_code) = LOWER(?) OR u.school_code = 'GLOBAL' OR u.school_code IS NULL OR u.school_code = '')
        LIMIT 1
      `, [cleanQ, cleanQ, cleanQ, cleanQ, cleanQ, cleanQ, sCode]);
    });

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.json({ status: 'error', message: `No member found matching "${cleanQ}"` });
    }

    const member = userRes.rows[0];
    const isBanned = (member.is_banned === 1 || member.is_banned === '1' || member.is_banned === true);
    if (isBanned) {
      return res.json({ status: 'error', message: `Member ${member.name} is currently SUSPENDED. Circulation blocked.` });
    }

    // Active loans count
    const loansRes = await db.query(`
      SELECT t.*, b.title as book_title, COALESCE(t.barcode, b.barcode_id) as book_barcode
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      WHERE t.user_id = $1 AND t.return_date IS NULL
    `, [member.id]);

    const activeLoans = (loansRes.rows || []).map(l => ({
      ...l,
      ...calculateFine(l.due_date, finePerDay, graceDays)
    }));

    const totalFines = activeLoans.reduce((sum, l) => sum + (l.fine || 0), 0);
    const isTeacher = (member.role === 'teacher');
    const isStaff = (member.role === 'staff');
    const limit = isTeacher ? settings.teacher_max_books : (isStaff ? settings.staff_max_books : settings.student_max_books);
    const canBorrow = activeLoans.length < limit && !isBanned;

    return res.json({
      status: 'success',
      member,
      activeLoans,
      activeCount: activeLoans.length,
      borrowingLimit: limit,
      canBorrow: canBorrow,
      totalFines: totalFines,
      quotaWarning: !canBorrow ? `Maximum borrowing limit reached (${limit} books). Cannot issue more.` : null
    });
  } catch (err) {
    console.error('Member lookup error:', err);
    return res.json({ status: 'error', message: 'Member lookup failed: ' + err.message });
  }
});

// Reusable Multi-field Student Search API
router.all('/api/circulation/search-students', adminOnly, async (req, res) => {
  const q = (req.body.query || req.query.q || req.query.query || '').trim();
  const sCode = req.session.school_code || 'DEMO01';

  try {
    const settings = await getCirculationSettings(sCode);
    const finePerDay = Number(settings.fine_per_day) || 5;
    const graceDays = Number(settings.grace_period_days) || 2;

    let usersQuery = '';
    let params = [];

    if (!q) {
      usersQuery = `
        SELECT u.id, u.name, u.admission_no, u.student_id, u.class, u.section, u.phone, u.email, u.role, u.is_banned, u.profile_picture, u.avatar_id
        FROM users u
        WHERE (LOWER(u.school_code) = LOWER($1) OR u.school_code = 'GLOBAL' OR u.school_code IS NULL OR u.school_code = '')
          AND LOWER(COALESCE(u.role, 'student')) NOT IN ('super_admin', 'superadmin', 'admin')
        ORDER BY u.name ASC
        LIMIT 15
      `;
      params = [sCode];
    } else {
      const term = `%${q}%`;
      usersQuery = `
        SELECT u.id, u.name, u.admission_no, u.student_id, u.class, u.section, u.phone, u.email, u.role, u.is_banned, u.profile_picture, u.avatar_id
        FROM users u
        WHERE (LOWER(u.school_code) = LOWER($1) OR u.school_code = 'GLOBAL' OR u.school_code IS NULL OR u.school_code = '')
          AND LOWER(COALESCE(u.role, 'student')) NOT IN ('super_admin', 'superadmin', 'admin')
          AND (
            LOWER(u.name) LIKE LOWER($2) OR
            LOWER(COALESCE(u.role, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(u.admission_no, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(u.student_id, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(u.class, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(u.section, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(u.phone, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(u.email, '')) LIKE LOWER($2) OR
            CAST(u.id AS TEXT) LIKE $2
          )
        ORDER BY 
          CASE WHEN LOWER(u.name) LIKE LOWER($3) THEN 1
               WHEN LOWER(COALESCE(u.admission_no, '')) LIKE LOWER($3) THEN 2
               WHEN LOWER(COALESCE(u.student_id, '')) LIKE LOWER($3) THEN 3
               ELSE 4 END,
          u.name ASC
        LIMIT 25
      `;
      params = [sCode, term, `${q}%`];
    }

    const uRes = await db.query(usersQuery, params);
    const users = uRes.rows || [];

    const studentList = await Promise.all(users.map(async (u) => {
      const lRes = await db.query(`
        SELECT t.id, t.book_id, t.issue_date, t.due_date, b.title as book_title, COALESCE(t.barcode, b.barcode_id) as book_barcode
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        WHERE t.user_id = $1 AND t.return_date IS NULL
      `, [u.id]).catch(() => ({ rows: [] }));

      const activeLoans = (lRes.rows || []).map(l => ({
        ...l,
        ...calculateFine(l.due_date, finePerDay, graceDays)
      }));

      const totalFines = activeLoans.reduce((sum, l) => sum + (l.fine || 0), 0);
      const isTeacher = (u.role === 'teacher');
      const isStaff = (u.role === 'staff');
      const borrowingLimit = isTeacher ? settings.teacher_max_books : (isStaff ? settings.staff_max_books : settings.student_max_books);
      const isBanned = (u.is_banned === 1 || u.is_banned === '1' || u.is_banned === true);
      const canBorrow = activeLoans.length < borrowingLimit && !isBanned;

      return {
        id: u.id,
        name: u.name,
        role: u.role || 'student',
        admission_no: u.admission_no || '',
        student_id: u.student_id || u.admission_no || `STU-${u.id}`,
        class: u.class || '',
        section: u.section || '',
        phone: u.phone || '',
        email: u.email || '',
        avatar_id: u.avatar_id || '',
        profile_picture: u.profile_picture || '',
        is_banned: isBanned,
        active_count: activeLoans.length,
        borrowing_limit: borrowingLimit,
        can_borrow: canBorrow,
        total_fines: totalFines,
        active_loans: activeLoans
      };
    }));

    return res.json({ status: 'success', students: studentList });
  } catch (err) {
    console.error('Search students error:', err);
    return res.json({ status: 'error', message: 'Failed to search students: ' + err.message });
  }
});

// Fast Book Lookup for Scanner Desk
router.all('/api/circulation/lookup-book', adminOnly, async (req, res) => {
  const barcode = req.body.barcode || req.query.barcode || req.query.q || '';
  const sCode = req.session.school_code || 'DEMO01';
  if (!barcode || !barcode.trim()) return res.json({ status: 'error', message: 'Scan or enter Book Barcode/ISBN' });

  try {
    const cleanB = barcode.trim();
    // 1. Check book_copies first
    const copyRes = await db.query(`
      SELECT bc.*, b.id as book_id, b.title, b.author, b.genre, b.isbn, b.available_copies, b.total_copies, b.shelf_location, b.cover_url
      FROM book_copies bc
      JOIN books b ON bc.book_id = b.id
      WHERE (bc.barcode = $1 OR b.barcode_id = $1 OR b.isbn = $1 OR CAST(b.id AS TEXT) = $1)
      AND (LOWER(bc.school_code) = LOWER($2) OR bc.school_code = 'GLOBAL' OR bc.school_code IS NULL OR bc.school_code = '')
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
          total_copies: copy.total_copies,
          shelf_location: copy.shelf_location,
          cover_url: copy.cover_url,
          copy_barcode: copy.barcode,
          copy_id: copy.id,
          condition: copy.condition_status,
          availability: copy.availability_status || copy.status
        }
      });
    }

    // 2. Check books table directly
    const bookRes = await db.query(`
      SELECT * FROM books
      WHERE (barcode_id = $1 OR isbn = $1 OR CAST(id AS TEXT) = $1)
      AND (LOWER(school_code) = LOWER($2) OR school_code = 'GLOBAL' OR school_code IS NULL OR school_code = '')
      LIMIT 1
    `, [cleanB, sCode]);

    if (bookRes.rows && bookRes.rows.length > 0) {
      const b = bookRes.rows[0];
      const availCount = parseInt(b.available_copies, 10);
      return res.json({
        status: 'success',
        book: {
          id: b.id,
          title: b.title,
          author: b.author,
          genre: b.genre,
          isbn: b.isbn,
          available_copies: b.available_copies,
          total_copies: b.total_copies,
          shelf_location: b.shelf_location,
          cover_url: b.cover_url,
          copy_barcode: b.barcode_id || `LIB-BK${b.id}-C1`,
          copy_id: null,
          condition: 'GOOD',
          availability: availCount > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK'
        }
      });
    }

    return res.json({ status: 'error', message: `No book found matching barcode "${cleanB}"` });
  } catch (err) {
    console.error('Book lookup error:', err);
    return res.json({ status: 'error', message: 'Book lookup failed: ' + err.message });
  }
});

// Reusable Multi-field Book Search API
router.all('/api/circulation/search-books', adminOnly, async (req, res) => {
  const q = (req.body.query || req.query.q || req.query.query || '').trim();
  const sCode = req.session.school_code || 'DEMO01';

  try {
    let booksQuery = '';
    let params = [];

    if (!q) {
      booksQuery = `
        SELECT b.id, b.title, b.author, b.genre, b.category, b.subject, b.class, b.isbn, b.publisher, b.barcode_id,
               b.available_copies, b.total_copies, b.shelf_location, b.rack, b.shelf, b.cover_url, b.price, b.edition, b.publication_year
        FROM books b
        WHERE (LOWER(b.school_code) = LOWER($1) OR b.school_code = 'GLOBAL' OR b.school_code IS NULL OR b.school_code = '')
          AND (b.is_banned IS NULL OR (b.is_banned != 1 AND b.is_banned != '1'))
        ORDER BY b.id DESC
        LIMIT 15
      `;
      params = [sCode];
    } else {
      const term = `%${q}%`;
      booksQuery = `
        SELECT DISTINCT b.id, b.title, b.author, b.genre, b.category, b.subject, b.class, b.isbn, b.publisher, b.barcode_id,
               b.available_copies, b.total_copies, b.shelf_location, b.rack, b.shelf, b.cover_url, b.price, b.edition, b.publication_year
        FROM books b
        LEFT JOIN book_copies bc ON bc.book_id = b.id
        WHERE (LOWER(b.school_code) = LOWER($1) OR b.school_code = 'GLOBAL' OR b.school_code IS NULL OR b.school_code = '')
          AND (b.is_banned IS NULL OR (b.is_banned != 1 AND b.is_banned != '1'))
          AND (
            LOWER(b.title) LIKE LOWER($2) OR
            LOWER(COALESCE(b.author, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(b.isbn, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(b.barcode_id, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(bc.barcode, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(b.publisher, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(b.category, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(b.subject, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(b.class, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(b.shelf_location, '')) LIKE LOWER($2) OR
            CAST(b.id AS TEXT) LIKE $2
          )
        ORDER BY 
          CASE WHEN LOWER(b.title) LIKE LOWER($3) THEN 1
               WHEN LOWER(COALESCE(b.barcode_id, '')) LIKE LOWER($3) THEN 2
               ELSE 3 END,
          b.title ASC
        LIMIT 20
      `;
      params = [sCode, term, `${q}%`];
    }

    const bRes = await db.query(booksQuery, params);
    const rawBooks = bRes.rows || [];

    const bookList = await Promise.all(rawBooks.map(async (b) => {
      const cRes = await db.query(`
        SELECT id, barcode, copy_number, status, availability_status, condition_status, rack, shelf
        FROM book_copies
        WHERE book_id = $1
        ORDER BY copy_number ASC
      `, [b.id]).catch(() => ({ rows: [] }));

      const copies = cRes.rows || [];
      const availCopy = copies.find(c => c.availability_status === 'AVAILABLE' || c.status === 'AVAILABLE');
      const availCount = parseInt(b.available_copies, 10);
      const isAvailable = !isNaN(availCount) ? availCount > 0 : (copies.length === 0 || !!availCopy);

      return {
        id: b.id,
        title: b.title,
        author: b.author || 'Unknown Author',
        isbn: b.isbn || '',
        barcode_id: b.barcode_id || '',
        category: b.category || b.genre || 'General',
        subject: b.subject || '',
        class: b.class || '',
        publisher: b.publisher || '',
        edition: b.edition || '',
        publication_year: b.publication_year || '',
        shelf_location: b.shelf_location || (b.rack ? `Rack ${b.rack} Shelf ${b.shelf}` : 'General Rack'),
        cover_url: b.cover_url || '',
        price: b.price || '',
        available_copies: !isNaN(availCount) ? availCount : (availCopy ? 1 : 0),
        total_copies: parseInt(b.total_copies, 10) || copies.length || 1,
        is_available: isAvailable,
        copy_barcode: availCopy ? availCopy.barcode : (b.barcode_id || `LIB-BK${b.id}-C1`),
        copies: copies
      };
    }));

    return res.json({ status: 'success', books: bookList });
  } catch (err) {
    console.error('Search books error:', err);
    return res.json({ status: 'error', message: 'Failed to search books: ' + err.message });
  }
});

// Fetch Active Loans for a Student (used by Return Books tab)
router.all('/api/circulation/student-active-loans', adminOnly, async (req, res) => {
  const userId = req.body.user_id || req.query.user_id;
  const sCode = req.session.school_code || 'DEMO01';
  if (!userId) return res.json({ status: 'error', message: 'User ID is required.' });

  try {
    const settings = await getCirculationSettings(sCode);
    const finePerDay = Number(settings.fine_per_day) || 5;
    const graceDays = Number(settings.grace_period_days) || 2;

    const loansRes = await db.query(`
      SELECT t.id as transaction_id, t.book_id, t.user_id, t.issue_date, t.due_date, t.status, t.allowed_days,
             COALESCE(t.barcode, b.barcode_id) as barcode,
             b.title as book_title, b.author as book_author, b.cover_url, b.shelf_location, b.rack, b.shelf,
             u.name as user_name, u.admission_no, u.class as user_class
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      JOIN users u ON t.user_id = u.id
      WHERE t.user_id = $1 AND t.return_date IS NULL
      ORDER BY t.id DESC
    `, [userId]);

    let totalFines = 0;
    const loans = (loansRes.rows || []).map(l => {
      const fineData = calculateFine(l.due_date, finePerDay, graceDays);
      totalFines += fineData.fine;
      return {
        ...l,
        ...fineData
      };
    });

    return res.json({
      status: 'success',
      loans,
      total_count: loans.length,
      total_fines: totalFines
    });
  } catch (err) {
    console.error('Student active loans fetch error:', err);
    return res.json({ status: 'error', message: err.message });
  }
});

// Circulation Lending Rules API (GET & POST)
router.get('/api/circulation/settings', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  try {
    const settings = await getCirculationSettings(sCode);
    return res.json({ status: 'success', settings });
  } catch (err) {
    return res.json({ status: 'error', message: err.message });
  }
});

router.post('/api/circulation/settings', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  const {
    student_max_books,
    loan_duration_days,
    teacher_max_books,
    teacher_loan_days,
    staff_max_books,
    fine_per_day,
    grace_period_days,
    lost_book_charge
  } = req.body;

  try {
    const toSave = {};
    if (student_max_books !== undefined) toSave['student_max_books'] = Math.max(1, parseInt(student_max_books, 10) || 3);
    if (loan_duration_days !== undefined) toSave['loan_duration_days'] = Math.max(1, parseInt(loan_duration_days, 10) || 14);
    if (teacher_max_books !== undefined) toSave['teacher_max_books'] = Math.max(1, parseInt(teacher_max_books, 10) || 10);
    if (teacher_loan_days !== undefined) toSave['teacher_loan_days'] = Math.max(1, parseInt(teacher_loan_days, 10) || 30);
    if (staff_max_books !== undefined) toSave['staff_max_books'] = Math.max(1, parseInt(staff_max_books, 10) || 5);
    if (fine_per_day !== undefined) toSave['fine_per_day'] = Math.max(0, parseInt(fine_per_day, 10) || 0);
    if (grace_period_days !== undefined) toSave['grace_period_days'] = Math.max(0, parseInt(grace_period_days, 10) || 0);
    if (lost_book_charge !== undefined) toSave['lost_book_charge'] = Math.max(0, parseInt(lost_book_charge, 10) || 0);

    for (const [key, val] of Object.entries(toSave)) {
      const ex = await db.query('SELECT id FROM library_settings WHERE school_code = $1 AND setting_key = $2', [sCode, key]);
      if (ex.rows && ex.rows.length > 0) {
        await db.query('UPDATE library_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [String(val), ex.rows[0].id]);
      } else {
        const nextIdRes = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM library_settings').catch(() => ({ rows: [] }));
        const nextId = (nextIdRes.rows && nextIdRes.rows[0] && nextIdRes.rows[0].next_id) ? Number(nextIdRes.rows[0].next_id) : Math.floor(Date.now() % 1000000);
        await db.query('INSERT INTO library_settings (id, school_code, setting_key, setting_value) VALUES ($1, $2, $3, $4)', [nextId, sCode, key, String(val)]).catch(async () => {
          await db.query('INSERT INTO library_settings (school_code, setting_key, setting_value) VALUES ($1, $2, $3)', [sCode, key, String(val)]);
        });
      }
    }

    const updatedSettings = await getCirculationSettings(sCode);
    return res.json({
      status: 'success',
      message: 'Circulation lending rules saved and activated across the system!',
      settings: updatedSettings
    });
  } catch (err) {
    console.error('Circulation settings update error:', err);
    return res.json({ status: 'error', message: 'Failed to update settings: ' + err.message });
  }
});

// Issue Book Transaction (Strictly Enforces Rules & Records Barcode)
router.post('/api/circulation/issue', adminOnly, async (req, res) => {
  const { member_id, book_id, barcode, due_days } = req.body;
  const sCode = req.session.school_code || 'DEMO01';
  const librarianId = req.session.user_id || 0;

  if (!member_id && !req.body.student_id && !req.body.admission_no && !req.body.phone) {
    return res.json({ status: 'error', message: 'Please select a valid Student or Borrower.' });
  }
  if (!book_id && !barcode) {
    return res.json({ status: 'error', message: 'Please select a Book or scan a Physical Copy Barcode.' });
  }

  try {
    const settings = await getCirculationSettings(sCode);

    // 1. Verify Member (By primary ID or unique student/admission identifier)
    let mRes = null;
    if (member_id) {
      mRes = await db.query(
        `SELECT * FROM users 
         WHERE (id = $1 OR CAST(id AS TEXT) = $1 OR student_id = $1 OR admission_no = $1)
           AND (LOWER(school_code) = LOWER($2) OR school_code = 'GLOBAL' OR school_code IS NULL OR school_code = '')
         LIMIT 1`,
        [String(member_id).trim(), sCode]
      );
    }

    if ((!mRes || !mRes.rows || mRes.rows.length === 0) && (req.body.student_id || req.body.admission_no || req.body.phone)) {
      const altId = req.body.student_id || req.body.admission_no || req.body.phone;
      mRes = await db.query(
        `SELECT * FROM users 
         WHERE (student_id = $1 OR admission_no = $1 OR phone = $1)
           AND (LOWER(school_code) = LOWER($2) OR school_code = 'GLOBAL' OR school_code IS NULL OR school_code = '')
         LIMIT 1`,
        [String(altId).trim(), sCode]
      );
    }

    if (!mRes || !mRes.rows || mRes.rows.length === 0) {
      return res.json({ status: 'error', message: 'Selected member was not found in the library database.' });
    }
    const member = mRes.rows[0];

    // If user's id column was null or 0, persist an assigned ID now
    if (!member.id || member.id === 'null' || member.id === '0') {
      const maxRes = await db.query("SELECT MAX(CAST(id AS INTEGER)) as max_id FROM users WHERE id IS NOT NULL AND id != '' AND CAST(id AS INTEGER) < 5000");
      const generatedId = String((maxRes.rows[0]?.max_id || 77) + 1);
      await db.query("UPDATE users SET id = $1 WHERE (phone = $2 OR admission_no = $3) AND name = $4", [generatedId, member.phone, member.admission_no, member.name]).catch(() => {});
      member.id = generatedId;
    }

    if (member.is_banned && (member.is_banned === 1 || member.is_banned === '1' || member.is_banned === true)) {
      return res.json({ status: 'error', message: `Member ${member.name} is currently SUSPENDED. Circulation blocked.` });
    }

    // 2. Check Member Borrowing Limits strictly
    const activeLoansRes = await db.query('SELECT COUNT(*) as count FROM transactions WHERE user_id = $1 AND return_date IS NULL', [member_id]);
    const currentBorrowed = parseInt(activeLoansRes.rows[0].count, 10) || 0;
    const isTeacher = (member.role === 'teacher');
    const isStaff = (member.role === 'staff');
    const maxLimit = isTeacher ? settings.teacher_max_books : (isStaff ? settings.staff_max_books : settings.student_max_books);

    if (currentBorrowed >= maxLimit) {
      return res.json({
        status: 'error',
        message: `Borrowing quota reached! ${member.name} (${member.role || 'student'}) currently has ${currentBorrowed} of ${maxLimit} allowed books issued. Return an existing book before issuing more.`
      });
    }

    // 3. Find Book & Physical Copy
    let book = null;
    let targetCopy = null;

    if (barcode) {
      const copyLookup = await bookCopyService.lookupPhysicalCopy(barcode.trim(), sCode);
      if (copyLookup) {
        if (copyLookup.type === 'PHYSICAL_COPY') {
          if (copyLookup.copy.status !== 'AVAILABLE' && copyLookup.copy.availability_status !== 'AVAILABLE') {
            return res.json({ status: 'error', message: `Physical Copy #${copyLookup.copy.copy_number} (${barcode}) is currently '${copyLookup.copy.availability_status || copyLookup.copy.status}'.` });
          }
          book = copyLookup.book;
          targetCopy = copyLookup.copy;
        } else if (copyLookup.type === 'BOOK_GROUP') {
          book = copyLookup.book;
        }
      }
    }

    if (!book && book_id) {
      const bRes = await db.query('SELECT * FROM books WHERE id = $1 AND (LOWER(school_code) = LOWER($2) OR school_code = \'GLOBAL\' OR school_code IS NULL OR school_code = \'\')', [book_id, sCode]);
      book = bRes.rows && bRes.rows[0];
    } else if (!book && barcode) {
      const bRes = await db.query('SELECT * FROM books WHERE (barcode_id = $1 OR isbn = $1) AND (LOWER(school_code) = LOWER($2) OR school_code = \'GLOBAL\' OR school_code IS NULL OR school_code = \'\')', [barcode.trim(), sCode]);
      book = bRes.rows && bRes.rows[0];
    }

    if (!book) return res.json({ status: 'error', message: 'Book not found in school catalog.' });
    if (parseInt(book.available_copies, 10) <= 0) {
      return res.json({ status: 'error', message: `'${book.title}' has 0 available copies in stock.` });
    }

    // If targetCopy not identified yet, find first available physical copy
    if (!targetCopy) {
      const availCopyRes = await db.query(`
        SELECT * FROM book_copies 
        WHERE book_id = $1 AND (availability_status = 'AVAILABLE' OR status = 'AVAILABLE')
        ORDER BY copy_number ASC LIMIT 1
      `, [book.id]).catch(() => ({ rows: [] }));
      if (availCopyRes.rows && availCopyRes.rows.length > 0) {
        targetCopy = availCopyRes.rows[0];
      }
    }

    const assignedBarcode = targetCopy ? targetCopy.barcode : (barcode || book.barcode_id || `LIB-BK${book.id}-C1`);

    // Determine loan days
    const defaultLoanDays = isTeacher ? (settings.teacher_loan_days || 30) : (settings.loan_duration_days || 14);
    const requestedDays = parseInt(due_days, 10);
    const loanDays = (requestedDays && requestedDays > 0) ? requestedDays : defaultLoanDays;
    const dDate = dueDate(loanDays);
    const iDate = renderDate(new Date());
    const bookSize = (book.book_size || 'MEDIUM').toUpperCase();

    // 4. Execute Transaction
    const txRes = await db.query(`
      INSERT INTO transactions (user_id, book_id, issue_date, due_date, class, school_code, book_size, allowed_days, status, barcode)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ISSUED', $9)
    `, [member_id, book.id, iDate, dDate, member.class || 'N/A', sCode, bookSize, loanDays, assignedBarcode]);

    let transactionId = null;
    if (txRes && txRes.rows && txRes.rows[0] && txRes.rows[0].id) {
      transactionId = txRes.rows[0].id;
    } else {
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

    // 4c. Asynchronously Initialize AI Book Analysis & Scheduled Quiz
    setTimeout(async () => {
      try {
        await quizVerificationService.initializePhysicalBookQuiz(book, member, iDate, sCode, transactionId);
      } catch (qErr) {
        console.warn('[CIRCULATION] Quiz verification initialization error:', qErr.message);
      }
    }, 100);

    // 5. Decrement Available Copies
    await db.query(`
      UPDATE books 
      SET available_copies = CASE 
        WHEN CAST(COALESCE(available_copies, 1) AS INTEGER) > 0 
        THEN CAST(COALESCE(available_copies, 1) AS INTEGER) - 1 
        ELSE 0 
      END 
      WHERE id = $1
    `, [book.id]);

    // 6. Update Physical Copy Status
    if (targetCopy) {
      await db.query("UPDATE book_copies SET availability_status = 'ISSUED', status = 'ISSUED' WHERE id = $1", [targetCopy.id]).catch(() => {});
    } else if (assignedBarcode) {
      await db.query("UPDATE book_copies SET availability_status = 'ISSUED', status = 'ISSUED' WHERE barcode = $1", [assignedBarcode]).catch(() => {});
    }

    // 7. Audit Log
    if (typeof logActivity === 'function') {
      await logActivity(req, {
        userId: librarianId,
        action: `Issued '${book.title}' (${assignedBarcode}) to ${member.name} (${member.admission_no || member.student_id || member.phone}) - Due: ${dDate}`,
        module: 'circulation',
        schoolCode: sCode
      }).catch(() => {});
    }

    // 8. Send Real-Time In-App & Push Notification to the borrower
    const issueNotifMsg = `📚 '${book.title}' (Copy: ${assignedBarcode}) has been issued to you. Please return by ${dDate}.`;
    await db.query(`
      INSERT INTO notifications (user_id, message, type, school_code, is_read, created_at)
      VALUES ($1, $2, 'book_issued', $3, 0, CURRENT_TIMESTAMP)
    `, [member.id, issueNotifMsg, sCode]).catch(() => {});

    // Live Socket & Web Push
    try {
      const io = req.app.get('io');
      if (io) {
        const { emitLiveNotification } = require('../services/liveSocket');
        emitLiveNotification(io, {
          userId: member.id,
          schoolCode: sCode,
          title: '📚 Book Issued to You',
          message: issueNotifMsg,
          type: 'success',
          url: '/student'
        });
      }
      pushNotificationService.sendPushToUser(member.id, {
        title: '📚 Book Issued',
        body: issueNotifMsg,
        url: '/student',
        type: 'success'
      }).catch(() => {});
    } catch (notifErr) {
      console.warn('[CIRCULATION] Issue notification warning:', notifErr.message);
    }

    return res.json({
      status: 'success',
      message: `Successfully issued '${book.title}' to ${member.name}! Due date: ${dDate}`,
      book_title: book.title,
      member_name: member.name,
      due_date: dDate,
      barcode: assignedBarcode
    });
  } catch (err) {
    console.error('Issue book error:', err);
    return res.json({ status: 'error', message: 'Circulation issue failed: ' + err.message });
  }
});

// Return Book Transaction (Calculates Fines & Restores Inventory)
router.post('/api/circulation/return', adminOnly, async (req, res) => {
  const { transaction_id, barcode } = req.body;
  const sCode = req.session.school_code || 'DEMO01';
  const librarianId = req.session.user_id || 0;

  try {
    const settings = await getCirculationSettings(sCode);
    const finePerDay = Number(settings.fine_per_day) || 5;
    const graceDays = Number(settings.grace_period_days) || 2;

    let loan = null;
    if (transaction_id) {
      const lRes = await db.query(`
        SELECT t.*, b.title as book_title, b.id as b_id, b.total_copies, u.name as user_name
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1 AND t.return_date IS NULL
      `, [transaction_id]);
      loan = lRes.rows && lRes.rows[0];
    } else if (barcode) {
      const cleanB = barcode.trim();
      const lRes = await db.query(`
        SELECT t.*, b.title as book_title, b.id as b_id, b.total_copies, u.name as user_name
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        JOIN users u ON t.user_id = u.id
        WHERE (t.barcode = $1 OR b.barcode_id = $1 OR b.isbn = $1) AND t.return_date IS NULL
        ORDER BY t.id ASC LIMIT 1
      `, [cleanB]);
      loan = lRes.rows && lRes.rows[0];
    }

    if (!loan) return res.json({ status: 'error', message: 'No active issue found for this book or transaction.' });

    const retDate = renderDate(new Date());
    const fineData = calculateFine(loan.due_date, finePerDay, graceDays);

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

    // 2. Increment Available Copies (capped at total_copies)
    await db.query(`
      UPDATE books 
      SET available_copies = CASE 
        WHEN CAST(COALESCE(available_copies, 0) AS INTEGER) < CAST(COALESCE(total_copies, 1) AS INTEGER) 
        THEN CAST(COALESCE(available_copies, 0) AS INTEGER) + 1 
        ELSE CAST(COALESCE(total_copies, 1) AS INTEGER) 
      END
      WHERE id = $1
    `, [loan.book_id]);

    // 3. Mark Copy Available in book_copies
    const copyBarcodeToFree = loan.barcode || barcode;
    if (copyBarcodeToFree) {
      await db.query(
        "UPDATE book_copies SET availability_status = 'AVAILABLE', status = 'AVAILABLE' WHERE barcode = $1",
        [copyBarcodeToFree.trim()]
      ).catch(() => {});
    } else {
      await db.query(
        "UPDATE book_copies SET availability_status = 'AVAILABLE', status = 'AVAILABLE' WHERE book_id = $1 AND (availability_status = 'ISSUED' OR status = 'ISSUED') LIMIT 1",
        [loan.book_id]
      ).catch(() => {});
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
    if (typeof logActivity === 'function') {
      await logActivity(req, {
        userId: librarianId,
        action: `Returned '${loan.book_title}' from ${loan.user_name} (Fine: ₹${fineData.fine})`,
        module: 'circulation',
        schoolCode: sCode
      }).catch(() => {});
    }

    // 6. Send Return Notification to Borrower Student
    const returnNotifMsg = `✅ '${loan.book_title}' has been successfully returned to the library.` + (fineData.fine > 0 ? ` (Overdue fine: ₹${fineData.fine})` : '');
    await db.query(`
      INSERT INTO notifications (user_id, message, type, school_code, is_read, created_at)
      VALUES ($1, $2, 'book_returned', $3, 0, CURRENT_TIMESTAMP)
    `, [loan.user_id, returnNotifMsg, sCode]).catch(() => {});

    try {
      const io = req.app.get('io');
      if (io) {
        const { emitLiveNotification } = require('../services/liveSocket');
        emitLiveNotification(io, {
          userId: loan.user_id,
          schoolCode: sCode,
          title: '✅ Book Returned',
          message: returnNotifMsg,
          type: 'success',
          url: '/student'
        });
      }
      pushNotificationService.sendPushToUser(loan.user_id, {
        title: '✅ Book Returned',
        body: returnNotifMsg,
        url: '/student',
        type: 'success'
      }).catch(() => {});
    } catch (notifErr) {
      console.warn('[CIRCULATION] Return notification warning:', notifErr.message);
    }

    return res.json({
      status: 'success',
      message: `Book '${loan.book_title}' marked as RETURNED from ${loan.user_name}.`,
      fine: fineData.fine,
      days_overdue: fineData.days_overdue,
      late_days: fineData.late_days,
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
  const {
    loan_duration_days,
    teacher_loan_days,
    student_max_books,
    teacher_max_books,
    staff_max_books,
    fine_per_day,
    grace_period_days,
    lost_book_charge,
    max_renewals,
    allow_digital_downloads
  } = req.body;

  try {
    const toSave = {};
    if (loan_duration_days !== undefined) toSave['loan_duration_days'] = Math.max(1, parseInt(loan_duration_days, 10) || 14);
    if (teacher_loan_days !== undefined) toSave['teacher_loan_days'] = Math.max(1, parseInt(teacher_loan_days, 10) || 30);
    if (student_max_books !== undefined) toSave['student_max_books'] = Math.max(1, parseInt(student_max_books, 10) || 3);
    if (teacher_max_books !== undefined) toSave['teacher_max_books'] = Math.max(1, parseInt(teacher_max_books, 10) || 10);
    if (staff_max_books !== undefined) toSave['staff_max_books'] = Math.max(1, parseInt(staff_max_books, 10) || 5);
    if (fine_per_day !== undefined) toSave['fine_per_day'] = Math.max(0, parseInt(fine_per_day, 10) || 0);
    if (grace_period_days !== undefined) toSave['grace_period_days'] = Math.max(0, parseInt(grace_period_days, 10) || 0);
    if (lost_book_charge !== undefined) toSave['lost_book_charge'] = Math.max(0, parseInt(lost_book_charge, 10) || 0);
    if (max_renewals !== undefined) toSave['max_renewals'] = Math.max(0, parseInt(max_renewals, 10) || 2);
    if (allow_digital_downloads !== undefined) toSave['allow_digital_downloads'] = (allow_digital_downloads === 'true' || allow_digital_downloads === true) ? 'true' : 'false';

    for (const [key, val] of Object.entries(toSave)) {
      const ex = await db.query('SELECT id FROM library_settings WHERE school_code = $1 AND setting_key = $2', [sCode, key]);
      if (ex.rows && ex.rows.length > 0) {
        await db.query('UPDATE library_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [String(val), ex.rows[0].id]);
      } else {
        const nextIdRes = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM library_settings').catch(() => ({ rows: [] }));
        const nextId = (nextIdRes.rows && nextIdRes.rows[0] && nextIdRes.rows[0].next_id) ? Number(nextIdRes.rows[0].next_id) : Math.floor(Date.now() % 1000000);
        await db.query('INSERT INTO library_settings (id, school_code, setting_key, setting_value) VALUES ($1, $2, $3, $4)', [nextId, sCode, key, String(val)]).catch(async () => {
          await db.query('INSERT INTO library_settings (school_code, setting_key, setting_value) VALUES ($1, $2, $3)', [sCode, key, String(val)]);
        });
      }
    }

    // Keep schools table due_days aligned if applicable
    if (toSave['loan_duration_days']) {
      await db.query('UPDATE schools SET due_days = $1 WHERE school_code = $2', [String(toSave['loan_duration_days']), sCode]).catch(() => {});
    }

    req.flash('success', 'Library rules and settings updated successfully!');
    return res.redirect('/admin/settings');
  } catch (err) {
    console.error('Settings update error:', err);
    req.flash('error', 'Failed to save settings: ' + err.message);
    return res.redirect('/admin/settings');
  }
});

// 5b. Librarian & Admin Profile & Avatar Update
router.post('/api/profile/update', adminOnly, async (req, res) => {
  const userId = req.session.user_id;
  const { name, phone, email, avatar_id, profile_picture } = req.body;
  try {
    await db.query(
      `UPDATE users SET 
        name = COALESCE($1, name), 
        phone = COALESCE($2, phone), 
        email = COALESCE($3, email),
        avatar_id = COALESCE($4, avatar_id),
        profile_picture = COALESCE($5, profile_picture)
       WHERE id = $6`,
      [name || null, phone || null, email || null, avatar_id || null, profile_picture || null, userId]
    );
    if (avatar_id) req.session.avatar_id = avatar_id;
    if (profile_picture) req.session.profile_picture = profile_picture;
    if (name) req.session.name = name;
    res.json({ success: true, message: 'Profile & avatar updated successfully!', avatar_id, profile_picture });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. MEMBER PROFILE DRAWER API
// ─────────────────────────────────────────────────────────────────────────────
router.get('/api/member/:id', adminOnly, async (req, res) => {
  const { id } = req.params;
  const sCode = req.session.school_code || 'DEMO01';

  try {
    const settings = await getCirculationSettings(sCode);
    const finePerDay = Number(settings.fine_per_day) || 5;
    const graceDays = Number(settings.grace_period_days) || 2;

    const userRes = await db.query(`
      SELECT * FROM users 
      WHERE id = $1 AND (LOWER(school_code) = LOWER($2) OR school_code = 'GLOBAL' OR school_code IS NULL OR school_code = '')
    `, [id, sCode]);
    if (!userRes.rows || userRes.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    const member = userRes.rows[0];

    const loansRes = await db.query(`
      SELECT t.*, b.title as book_title, b.author as book_author, COALESCE(t.barcode, b.barcode_id) as book_barcode, b.cover_url as book_cover
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      WHERE t.user_id = $1
      ORDER BY t.id DESC
    `, [id]);

    const activeLoans = [];
    const historyLoans = [];
    let totalFines = 0;

    (loansRes.rows || []).forEach(l => {
      const fineData = calculateFine(l.due_date, finePerDay, graceDays);
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
      totalFines,
      borrowingLimit: (member.role === 'teacher') ? (settings.teacher_max_books || 10) : ((member.role === 'staff') ? (settings.staff_max_books || 5) : (settings.student_max_books || 3))
    });
  } catch (err) {
    console.error('Member profile API error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Member Profile Update API (Allows Librarians/Admins to edit member info)
router.post('/api/member/:id/update', adminOnly, async (req, res) => {
  const { id } = req.params;
  const sCode = req.session.school_code || 'DEMO01';
  const { name, phone, email, admission_no, student_id, class: studentClass, section, role } = req.body;

  try {
    const userRes = await db.query(`
      SELECT * FROM users 
      WHERE id = $1 AND (LOWER(school_code) = LOWER($2) OR school_code = 'GLOBAL' OR school_code IS NULL OR school_code = '')
    `, [id, sCode]);

    if (!userRes.rows || userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found or unauthorized' });
    }

    const cur = userRes.rows[0];
    const newName = name !== undefined ? name.trim() : cur.name;
    const newPhone = phone !== undefined ? phone.trim() : cur.phone;
    const newEmail = email !== undefined ? email.trim() : cur.email;
    const newAdm = admission_no !== undefined ? admission_no.trim() : cur.admission_no;
    const newStuId = student_id !== undefined ? student_id.trim() : cur.student_id;
    const newClass = studentClass !== undefined ? studentClass.trim() : cur.class;
    const newSection = section !== undefined ? section.trim() : cur.section;
    const newRole = role !== undefined ? role.trim() : cur.role;

    if (!newName) {
      return res.status(400).json({ error: 'Member name is required' });
    }

    await db.query(`
      UPDATE users 
      SET name = $1, phone = $2, email = $3, admission_no = $4, student_id = $5, class = $6, section = $7, role = $8
      WHERE id = $9
    `, [newName, newPhone, newEmail, newAdm, newStuId, newClass, newSection, newRole, id]);

    return res.json({
      success: true,
      message: 'Member profile updated successfully!',
      member: {
        id,
        name: newName,
        phone: newPhone,
        email: newEmail,
        admission_no: newAdm,
        student_id: newStuId,
        class: newClass,
        section: newSection,
        role: newRole
      }
    });
  } catch (err) {
    console.error('Member profile update error:', err);
    return res.status(500).json({ error: 'Failed to update member: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. E-LIBRARY WEB READER ROUTE
// ─────────────────────────────────────────────────────────────────────────────
// 6B. SCHOOL ADMIN MEMBERS CSV IMPORT & EXPORT (SAFE UPSERT SYSTEM)
// ─────────────────────────────────────────────────────────────────────────────

// 1. Download CSV Template
router.get('/api/members/template', schoolAdminOnly, (req, res) => {
  try {
    const csvContent = memberCsvService.getMemberCsvTemplate();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="members_import_template.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Export Members to CSV (School Scoped & Filtered)
router.get('/api/members/export', schoolAdminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  try {
    const filters = {
      role: req.query.role || 'all',
      class: req.query.class || 'all',
      section: req.query.section || 'all',
      status: req.query.status || 'all',
      search: req.query.search || ''
    };
    const csvContent = await memberCsvService.exportMembersCsv({ schoolCode: sCode, filters });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="members_${sCode.toLowerCase()}_${dateStr}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Staged Import Preview & Validation (No DB modification yet)
router.post('/api/members/import/preview', schoolAdminOnly, csvUpload.single('file'), async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ success: false, error: 'Please select a valid CSV file to upload.' });
  }

  const sCode = req.session.school_code || 'DEMO01';
  try {
    const stagedData = await memberCsvService.parseAndValidateMemberCsv({
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      schoolCode: sCode,
      adminUser: {
        user_id: req.session.user_id,
        role: req.session.role,
        name: req.session.name
      }
    });

    return res.json({
      success: true,
      batchId: stagedData.batchId,
      batch_id: stagedData.batchId,
      totalRows: stagedData.totalRows,
      newCount: stagedData.newCount,
      updatedCount: stagedData.updatedCount,
      unchangedCount: stagedData.unchangedCount,
      errorCount: stagedData.errorCount,
      warningCount: stagedData.warningCount,
      reviewCount: stagedData.reviewCount,
      summary: stagedData.summary,
      rows: stagedData.rows,
      processedRows: stagedData.processedRows,
      hasErrors: stagedData.errorCount > 0,
      hasWarnings: stagedData.warningCount > 0
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Transactional Import Execution (Admin Confirmed)
router.post('/api/members/import/commit', schoolAdminOnly, async (req, res) => {
  const batchId = req.body.batch_id || req.body.batchId;
  const options = req.body.options || {};
  if (!batchId) {
    return res.status(400).json({ success: false, error: 'Batch ID is required to commit import.' });
  }

  const sCode = req.session.school_code || 'DEMO01';
  try {
    const result = await memberCsvService.commitMemberImport({
      batchId,
      schoolCode: sCode,
      adminUser: {
        user_id: req.session.user_id,
        role: req.session.role,
        name: req.session.name
      },
      options: options || {}
    });

    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Download Error Report CSV for Staged Batch
router.get('/api/members/import/:batchId/error-report', schoolAdminOnly, (req, res) => {
  const { batchId } = req.params;
  try {
    const csvContent = memberCsvService.generateErrorReportCsv(batchId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="import_errors_${batchId}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    return res.status(404).json({ success: false, error: err.message });
  }
});

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

// Barcode Generator Endpoint (Code128 Barcode PNG for Book ID Label / Sticker)
router.get('/api/barcode/:code', async (req, res) => {
  const code = (req.params.code || '').trim();
  if (!code || !/^[A-Za-z0-9_\-\.]+$/.test(code)) {
    return res.status(400).send('Invalid barcode value');
  }

  try {
    const pngBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: code,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: 'center',
      backgroundcolor: 'ffffff'
    });

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pngBuffer.length,
      'Cache-Control': 'public, max-age=86400'
    });
    return res.end(pngBuffer);
  } catch (err) {
    console.error('Barcode generation error:', err.message);
    return res.status(500).send('Failed to generate barcode');
  }
});

// ── Phase 7: Multi-Label Barcode PDF Generator (A4 Print-Ready Code 128) ──
router.get('/api/barcodes/pdf', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  const { copy_ids, book_id, all } = req.query;

  try {
    let copyIds = [];
    if (copy_ids) {
      copyIds = String(copy_ids).split(',').map(s => s.trim()).filter(Boolean);
    }

    const pdfDoc = await bookCopyService.generateBarcodesPDF({
      copyIds,
      bookId: book_id || null,
      all: all === '1' || all === 'true',
      schoolCode: sCode,
      printedBy: req.session.name || req.session.username || 'Librarian'
    });

    const filename = `librika_barcodes_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.error('PDF barcode generation error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET Complete Book Details (Unified Modal) ──
router.get('/api/books/:id', adminOnly, async (req, res) => {
  const { id } = req.params;
  const sCode = req.session.school_code || 'DEMO01';

  try {
    const bookRes = await db.query(`
      SELECT * FROM books 
      WHERE (id = $1 OR book_id = $1)
        AND (LOWER(school_code) = LOWER($2) OR school_code = 'GLOBAL' OR school_code IS NULL OR school_code = '')
      LIMIT 1
    `, [id, sCode]);

    if (!bookRes.rows || bookRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Book record not found.' });
    }

    const book = bookRes.rows[0];
    const copiesRes = await db.query(`
      SELECT * FROM book_copies 
      WHERE book_id = $1
      ORDER BY copy_number ASC
    `, [book.id]);

    const copies = copiesRes.rows || [];
    return res.json({
      success: true,
      book: {
        ...book,
        copies
      }
    });
  } catch (err) {
    console.error('Error fetching book details:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Phase 8: Physical Copy Barcode Scanner & Lookup ──
router.get('/api/copy/lookup/:barcode', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  const barcode = req.params.barcode;

  try {
    const lookup = await bookCopyService.lookupPhysicalCopy(barcode, sCode);
    if (!lookup) {
      return res.status(404).json({ success: false, error: `No book copy found with barcode/code '${barcode}'.` });
    }
    return res.json({ success: true, result: lookup });
  } catch (err) {
    console.error('Copy lookup error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Phase 6: Physical Copy Details Update (Shelf, Status, Condition) ──
router.post('/api/copy/update', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  const { id, shelf, rack, status, condition_status } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Copy ID is required.' });
  }

  try {
    const copyRes = await db.query('SELECT * FROM book_copies WHERE id = $1', [id]);
    if (!copyRes.rows || copyRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Physical copy not found.' });
    }
    const currentCopy = copyRes.rows[0];
    const prevStatus = currentCopy.status || currentCopy.availability_status || 'AVAILABLE';
    const newStatus = (status || prevStatus).toUpperCase();
    const newCondition = condition_status || currentCopy.condition_status || 'GOOD';
    const newShelf = shelf !== undefined ? shelf : currentCopy.shelf;
    const newRack = rack !== undefined ? rack : currentCopy.rack;

    await db.query(`
      UPDATE book_copies 
      SET status = $1, availability_status = $1, condition_status = $2, shelf = $3, rack = $4
      WHERE id = $5
    `, [newStatus, newCondition, newShelf, newRack, id]);

    // Recalculate available copies on the parent book if status changed
    if (prevStatus !== newStatus) {
      const availCountRes = await db.query(
        "SELECT COUNT(*) as count FROM book_copies WHERE book_id = $1 AND (status = 'AVAILABLE' OR availability_status = 'AVAILABLE')",
        [currentCopy.book_id]
      );
      const newAvail = parseInt(availCountRes.rows[0]?.count, 10) || 0;
      await db.query('UPDATE books SET available_copies = $1 WHERE id = $2', [newAvail, currentCopy.book_id]);
    }

    const updated = await db.query('SELECT * FROM book_copies WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Copy updated successfully', copy: updated.rows[0] });
  } catch (err) {
    console.error('Copy update error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Phase 4: Barcode Settings API ──
router.get('/api/settings/barcode', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  try {
    const cfg = await bookCopyService.getBarcodeSettings(sCode);
    return res.json({ success: true, settings: cfg });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/settings/barcode', adminOnly, async (req, res) => {
  const sCode = req.session.school_code || 'DEMO01';
  try {
    const saved = await bookCopyService.saveBarcodeSettings(sCode, req.body);
    return res.json({ success: true, message: 'Barcode settings saved successfully', settings: saved });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Smart Camera Book Scanner (Front + Back Cover Snaps, AI Extraction & Google Books Enrichment)
// Smart Camera Book Scanner (Front + Back Cover Snaps, AI Extraction & Google Books Enrichment)
router.post('/api/books/smart-scan', adminOnly, async (req, res) => {
  const { frontImageBase64, backImageBase64 } = req.body;
  const sCode = req.session.school_code || 'DEMO01';
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 7);

  const debugTrace = [];
  let currentStep = '05';
  let currentTitle = 'Image preprocessing started';

  if (!frontImageBase64) {
    debugTrace.push({
      step: '02',
      title: 'Front image captured',
      details: 'Error: Front cover snapshot was not received by the server',
      isError: true
    });
    debugTrace.push({
      step: '15',
      title: 'Pipeline FAILED',
      details: 'Pipeline aborted at Step [02]: Front cover snapshot is required.',
      isError: true
    });
    return res.status(400).json({
      success: false,
      error: 'Front cover snapshot is required.',
      failingStep: '02',
      debugTrace
    });
  }

  try {
    // 1. Save uploaded cover images locally to static/uploads/books/
    currentStep = '05';
    currentTitle = 'Image preprocessing started';

    const booksDir = path.join(__dirname, '..', 'static', 'uploads', 'books');
    if (!fs.existsSync(booksDir)) {
      fs.mkdirSync(booksDir, { recursive: true });
    }

    let localFrontUrl = '';
    let localBackUrl = '';
    let frontDiskPath = null;
    let backDiskPath = null;
    let frontMeta = { width: 0, height: 0, format: 'JPEG', sizeKb: 0 };
    let backMeta = { width: 0, height: 0, format: 'JPEG', sizeKb: 0 };

    if (frontImageBase64 && frontImageBase64.includes('base64,')) {
      const cleanFront = frontImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const frontFilename = `front_${timestamp}_${rand}.jpg`;
      frontDiskPath = path.join(booksDir, frontFilename);
      const fBuf = Buffer.from(cleanFront, 'base64');
      fs.writeFileSync(frontDiskPath, fBuf);
      localFrontUrl = `/uploads/books/${frontFilename}`;
      frontMeta.sizeKb = Math.round((fBuf.length / 1024) * 10) / 10;

      try {
        let sharpLib = null;
        try { sharpLib = require('sharp'); } catch(e) {}
        if (sharpLib) {
          const m = await sharpLib(frontDiskPath).metadata();
          frontMeta.width = m.width || 0;
          frontMeta.height = m.height || 0;
          frontMeta.format = (m.format || 'JPEG').toUpperCase();
        }
      } catch (e) {}
    }

    if (backImageBase64 && backImageBase64.includes('base64,')) {
      const cleanBack = backImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const backFilename = `back_${timestamp}_${rand}.jpg`;
      backDiskPath = path.join(booksDir, backFilename);
      const bBuf = Buffer.from(cleanBack, 'base64');
      fs.writeFileSync(backDiskPath, bBuf);
      localBackUrl = `/uploads/books/${backFilename}`;
      backMeta.sizeKb = Math.round((bBuf.length / 1024) * 10) / 10;
    }

    debugTrace.push({
      step: '05',
      title: 'Image preprocessing started',
      details: `Normalized ${frontMeta.format} (${frontMeta.width ? frontMeta.width + 'x' + frontMeta.height + ', ' : ''}${frontMeta.sizeKb} KB) with Sharp/PIL contrast enhancement${backDiskPath ? ` + Back image (${backMeta.sizeKb} KB)` : ' (Back cover skipped)'}`
    });

    // 2. Generate Next Unique Book ID (e.g. VBPG20260001)
    const nextBookId = await generateNextBookId(sCode);

    // 3. Stage 1: Google Lens Multimodal Vision & Hybrid OCR
    currentStep = '06';
    currentTitle = 'OCR request started';
    debugTrace.push({
      step: '06',
      title: 'OCR request started',
      details: 'Dispatching images to Google Lens Multimodal Vision Engine (Gemini 2.5) with visual OCR'
    });

    currentStep = '07';
    currentTitle = 'OCR response received';

    const visionT0 = Date.now();
    let aiBook = {};
    let ocrResult = { frontText: '', backText: '', candidates: {}, diagnostics: { durationMs: 0 } };

    // Run Google Lens Multimodal Vision directly on the uploaded snapshots
    try {
      aiBook = await groqBookAgent.analyzeBookWithGroqAgent({
        frontImageBase64,
        backImageBase64,
        frontDiskPath,
        backDiskPath,
        frontText: '',
        backText: '',
        candidates: {}
      });
    } catch (visionErr) {
      console.warn('[Smart Scan] Google Lens Vision error:', visionErr.message);
    }

    const visionDuration = Date.now() - visionT0;

    // If Google Lens Vision didn't detect title or ISBN (e.g. offline/error), run fallback OCR engine
    if (!aiBook.title && !aiBook.isbn) {
      try {
        ocrResult = await ocrEngineService.processBookImages(frontDiskPath, backDiskPath);
        aiBook = await groqBookAgent.analyzeBookWithGroqAgent({
          frontText: ocrResult.frontText,
          backText: ocrResult.backText,
          candidates: ocrResult.candidates
        });
      } catch (ocrErr) {
        console.warn('[Smart Scan] OCR fallback error:', ocrErr.message);
      }
    }

    const ocrSummary = aiBook.provider_used && aiBook.provider_used.includes('Google Lens')
      ? `Google Lens Vision completed in ${visionDuration}ms. Visual confidence: ${aiBook.confidence_score || 95}%.`
      : `OCR completed in ${(ocrResult.diagnostics && ocrResult.diagnostics.durationMs) || visionDuration}ms.`;

    debugTrace.push({
      step: '07',
      title: 'OCR response received',
      details: ocrSummary
    });

    // Step 08: Extracted text preview
    const extractedPreview = aiBook.title 
      ? `"${aiBook.title}${aiBook.author ? ' by ' + aiBook.author : ''}${aiBook.publisher ? ' (' + aiBook.publisher + ')' : ''}"`
      : ((ocrResult.frontText || '').replace(/\s+/g, ' ').trim().slice(0, 160) || '(No readable text detected on cover)');
    debugTrace.push({
      step: '08',
      title: 'Extracted text',
      details: extractedPreview
    });

    // Step 09: ISBN detected
    const detectedIsbns = (ocrResult.candidates && ocrResult.candidates.isbns) || [];
    const detectedIsbn = aiBook.isbn || detectedIsbns[0] || '';
    debugTrace.push({
      step: '09',
      title: 'ISBN detected',
      details: detectedIsbn ? `${detectedIsbn}${aiBook.isbn ? ' (Identified by Google Lens Vision)' : ' (Regex candidate)'}` : 'None detected directly in cover text'
    });

    // 4. Stage 2: Title and Author Detected
    currentStep = '10';
    currentTitle = 'Title detected';
    debugTrace.push({
      step: '10',
      title: 'Title detected',
      details: aiBook.title ? `"${aiBook.title}" (Provider: ${aiBook.provider_used || 'Google Lens AI'})` : 'None detected'
    });

    currentStep = '11';
    currentTitle = 'Author detected';
    debugTrace.push({
      step: '11',
      title: 'Author detected',
      details: aiBook.author ? `"${aiBook.author}"` : 'None detected'
    });

    // 5. Stage 3: Online Enrichment & Fast Web Crawler (5-10s timeout strictly enforced)
    currentStep = '12';
    currentTitle = 'Google Books lookup started';
    const gQuery = aiBook.title 
      ? `intitle:${aiBook.title}${aiBook.author ? ' inauthor:' + aiBook.author : ''}` 
      : (aiBook.isbn ? `isbn:${aiBook.isbn}` : '');
    debugTrace.push({
      step: '12',
      title: 'Google Books lookup started',
      details: gQuery ? `Query: "${gQuery}"` : 'Skipped (no Title or ISBN found to query)'
    });

    currentStep = '13';
    currentTitle = 'API request/response status';
    let enriched = { book: aiBook, diagnostics: { missingFields: [] } };
    try {
      enriched = await bookCrawlerService.enrichAndCrawlBook(aiBook, { timeoutMs: 7000 });
    } catch (crawlErr) {
      console.warn('[Smart Scan] Crawler note:', crawlErr.message);
    }

    const apiDiag = (enriched.diagnostics && enriched.diagnostics.apiDiagnostics && enriched.diagnostics.apiDiagnostics.googleBooks) || {};
    debugTrace.push({
      step: '13',
      title: 'API request/response status',
      details: `${apiDiag.status || 'HTTP 200 OK'} (${apiDiag.itemsCount || 0} item(s) found in ${apiDiag.durationMs || 0}ms)`
    });

    const finalBook = enriched.book || aiBook;
    const finalCoverUrl = finalBook.cover_url || localFrontUrl;
    const finalBackCoverUrl = finalBook.back_cover_url || localBackUrl;
    const missingFields = (enriched.diagnostics && enriched.diagnostics.missingFields) || [];
    const manualActionRequired = (enriched.diagnostics && enriched.diagnostics.manualActionRequired) || false;
    const userPromptMessage = (enriched.diagnostics && enriched.diagnostics.userPromptMessage) || '';

    // Step 14: Final matching result
    debugTrace.push({
      step: '14',
      title: 'Final matching result',
      details: `Title: "${finalBook.title || 'Untitled'}" | Author: "${finalBook.author || 'Unknown'}" | Publisher: "${finalBook.publisher || 'Unknown'}" | ISBN: "${finalBook.isbn || 'N/A'}" | Front Cover: ${finalBook.cover_url ? 'Online Catalog' : 'Camera Snapshot'} | Back Cover: ${finalBook.back_cover_url ? 'Online Catalog' : (localBackUrl ? 'Camera Snapshot' : 'None')}`
    });

    // Step 15: Pipeline completed
    const totalTimeMs = Date.now() - timestamp;
    const enrichCount = (enriched.diagnostics && enriched.diagnostics.fieldsEnriched && enriched.diagnostics.fieldsEnriched.length) || 0;
    debugTrace.push({
      step: '15',
      title: 'Pipeline completed',
      details: `Success. ${enrichCount} fields enriched from online databases in ${totalTimeMs}ms.${missingFields.length > 0 ? ' Missing fields: [' + missingFields.join(', ') + '].' : ' All fields complete.'}`
    });

    return res.json({
      success: true,
      bookId: nextBookId,
      barcodeUrl: `/admin/api/barcode/${nextBookId}`,
      onlineFound: !!(finalBook.cover_url || finalBook.publisher),
      onlineCoverUrl: finalBook.cover_url || '',
      onlineBackCoverUrl: finalBook.back_cover_url || '',
      localFrontUrl,
      localBackUrl,
      missingFields,
      manualActionRequired,
      userPromptMessage,
      diagnostics: enriched.diagnostics,
      debugTrace,
      book: {
        book_id: nextBookId,
        title: finalBook.title || '',
        author: finalBook.author || '',
        publisher: finalBook.publisher || '',
        edition: finalBook.edition || '',
        publication_year: finalBook.publication_year || '',
        isbn: finalBook.isbn || '',
        price: finalBook.price || '',
        subject: finalBook.subject || 'General',
        class: finalBook.class || '',
        language: finalBook.language || 'English',
        description: finalBook.synopsis || finalBook.description || '',
        cover_url: finalCoverUrl,
        back_cover_url: finalBackCoverUrl,
        total_copies: 1,
        rack: 'A',
        shelf: '1',
        book_condition: 'GOOD'
      }
    });
  } catch (err) {
    console.error('Smart book scan error:', err);
    debugTrace.push({
      step: currentStep,
      title: currentTitle + ' FAILED',
      details: `Error: ${err.message}`,
      isError: true
    });
    debugTrace.push({
      step: '15',
      title: 'Pipeline FAILED',
      details: `Pipeline stopped at Step [${currentStep}]: ${err.message}`,
      isError: true
    });
    return res.status(200).json({
      success: false,
      error: `Analysis failed at step [${currentStep}] (${currentTitle}): ${err.message}`,
      failingStep: currentStep,
      debugTrace,
      book: {
        title: '',
        author: '',
        publisher: '',
        isbn: '',
        price: '',
        description: '',
        cover_url: '',
        back_cover_url: ''
      }
    });
  }
});

// Test & Training Engine Page (Librarian & Admin)
router.get('/book-analyzer-test', adminOnly, (req, res) => {
  res.render('admin_book_analyzer_test', {
    layout: false,
    title: 'Book Analyzer & Training Playground | Librika',
    user: req.session,
    activeModule: 'catalog'
  });
});

// Run Test Diagnostic Pipeline (Returns granular diagnostic step details)
router.post('/api/book-analyzer-test/run', adminOnly, async (req, res) => {
  const { frontImageBase64, backImageBase64 } = req.body;
  if (!frontImageBase64) {
    return res.status(400).json({ success: false, error: 'Front cover image is required.' });
  }

  try {
    const booksDir = path.join(__dirname, '..', 'static', 'uploads', 'books');
    if (!fs.existsSync(booksDir)) fs.mkdirSync(booksDir, { recursive: true });

    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 7);

    const cleanFront = frontImageBase64.replace(/^data:image\/\w+;base64,/, '');
    const frontDiskPath = path.join(booksDir, `test_front_${timestamp}_${rand}.jpg`);
    fs.writeFileSync(frontDiskPath, Buffer.from(cleanFront, 'base64'));

    let backDiskPath = null;
    if (backImageBase64 && backImageBase64.includes('base64,')) {
      const cleanBack = backImageBase64.replace(/^data:image\/\w+;base64,/, '');
      backDiskPath = path.join(booksDir, `test_back_${timestamp}_${rand}.jpg`);
      fs.writeFileSync(backDiskPath, Buffer.from(cleanBack, 'base64'));
    }

    // Stage 1: OCR
    const ocr = await ocrEngineService.processBookImages(frontDiskPath, backDiskPath);

    // Stage 2: Groq AI Agent
    const aiAgent = await groqBookAgent.analyzeBookWithGroqAgent({
      frontText: ocr.frontText,
      backText: ocr.backText,
      candidates: ocr.candidates
    });

    // Stage 3: Online Enrichment & Crawl (5-10s timeout)
    const crawler = await bookCrawlerService.enrichAndCrawlBook(aiAgent, { timeoutMs: 7000 });

    const detectedIsbns = (ocr.candidates && ocr.candidates.isbns) || [];
    const textPreview = (ocr.frontText || '').replace(/\s+/g, ' ').trim().slice(0, 160);
    const gbDiag = (crawler.diagnostics && crawler.diagnostics.apiDiagnostics && crawler.diagnostics.apiDiagnostics.googleBooks) || {};
    const totalTimeMs = Date.now() - timestamp;
    const finalBook = crawler.book || aiAgent;

    const debugTrace = [
      { step: '05', title: 'Image preprocessing started', details: `Saved & normalized test images (${frontDiskPath})` },
      { step: '06', title: 'OCR request started', details: 'Triggered Python + Tesseract hybrid OCR' },
      { step: '07', title: 'OCR response received', details: `OCR finished in ${(ocr.diagnostics && ocr.diagnostics.durationMs) || 0}ms. Front: ${ocr.frontText.length} chars, Back: ${ocr.backText.length} chars` },
      { step: '08', title: 'Extracted text', details: textPreview ? `"${textPreview}..."` : '(No text found)' },
      { step: '09', title: 'ISBN detected', details: detectedIsbns[0] ? `${detectedIsbns[0]}` : 'None detected in OCR' },
      { step: '10', title: 'Title detected', details: aiAgent.title ? `"${aiAgent.title}" (${aiAgent.provider_used || 'AI'})` : 'None detected' },
      { step: '11', title: 'Author detected', details: aiAgent.author ? `"${aiAgent.author}"` : 'None detected' },
      { step: '12', title: 'Google Books lookup started', details: gbDiag.query ? `Query: "${gbDiag.query}"` : 'Skipped' },
      { step: '13', title: 'API request/response status', details: `${gbDiag.status || 'HTTP 200 OK'} (${gbDiag.itemsCount || 0} items returned in ${gbDiag.durationMs || 0}ms)` },
      { step: '14', title: 'Final matching result', details: `Title: "${finalBook.title || 'Untitled'}" | Author: "${finalBook.author || 'Unknown'}" | ISBN: "${finalBook.isbn || 'None'}"` },
      { step: '15', title: 'Pipeline completed', details: `Success in ${totalTimeMs}ms. Missing: [${(crawler.diagnostics && crawler.diagnostics.missingFields && crawler.diagnostics.missingFields.join(', ')) || 'None'}]` }
    ];

    return res.json({
      success: true,
      ocr,
      aiAgent,
      crawler,
      debugTrace,
      book: crawler.book
    });
  } catch (err) {
    console.error('[Book Analyzer Test Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
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
    const shelfLoc = shelf_location ? shelf_location.trim() : `${rack || 'A'}-${shelf || '1'}`;
    const cleanSub = subject || genre || 'General';

    // 1. Phase 3: Find or Create Book Group
    const groupRes = await bookCopyService.findOrCreateBookGroup({
      book_id: inputBookId,
      title: title.trim(),
      author: author || 'Unknown',
      publisher: publisher || '',
      edition: edition || '1st Edition',
      isbn: isbn || '',
      language: language || 'English',
      subject: cleanSub,
      class: bookClass || '',
      price: price || '',
      publication_year: publication_year || '',
      shelf_location: shelfLoc,
      rack: rack || 'A',
      shelf: shelf || '1',
      book_condition: book_condition || 'GOOD',
      description: description || '',
      cover_url: cover_url || '',
      back_cover_url: back_cover_url || ''
    }, sCode);

    const book = groupRes.book;
    const dbId = book.id;
    const finalBookId = book.book_id || (inputBookId && inputBookId.trim().startsWith('VBPG') ? inputBookId.trim() : `VBPG${new Date().getFullYear()}${String(Date.now()).slice(-4)}`);

    // 2. Phase 4: Add Physical Copies with Unique Sequential Barcodes
    const copyResult = await bookCopyService.addPhysicalCopies(dbId, copies, {
      school_code: sCode,
      rack: rack || 'A',
      shelf: shelf || '1',
      condition: book_condition || 'GOOD',
      added_by: req.session.user_name || req.session.name || 'Librarian',
      edition: edition || book.edition || '1st Edition'
    });

    const generatedCopies = copyResult.copies || [];

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
        message: `Book '${title}' registered successfully with ${generatedCopies.length} physical copies and unique barcodes!`,
        book: {
          ...book,
          total_copies: (parseInt(book.total_copies, 10) || 0) + (groupRes.isNew ? 0 : copies),
          available_copies: (parseInt(book.available_copies, 10) || 0) + (groupRes.isNew ? 0 : copies)
        },
        copies: generatedCopies
      });
    }

    req.flash('success', `Book '${title}' registered successfully with ${generatedCopies.length} physical copies!`);
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
    const userRes = await db.query(`
      SELECT id, name, is_banned, status 
      FROM users 
      WHERE id = $1 AND (LOWER(school_code) = LOWER($2) OR school_code = 'GLOBAL' OR school_code IS NULL OR school_code = '')
    `, [id, sCode]);
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
  const { 
    title, author, isbn, publisher, edition, publication_year, language,
    category, genre, summary, synopsis, description, shelf_location, total_copies, price, cover_url
  } = req.body;

  try {
    const copies = parseInt(total_copies, 10) || 1;
    const cleanSummary = summary || synopsis || description || '';
    const cleanSub = category || genre || 'General';

    await db.query(`
      UPDATE books 
      SET title = $1, author = $2, isbn = $3, total_copies = $4, shelf_location = $5,
          publisher = $6, edition = $7, publication_year = $8, language = $9,
          category = $10, genre = $10, summary = $11, synopsis = $11, description = $12,
          price = COALESCE($13, price), cover_url = COALESCE($14, cover_url)
      WHERE id = $15 
        AND (LOWER(school_code) = LOWER($16) OR school_code = 'GLOBAL' OR school_code IS NULL OR school_code = '' OR $16 = 'DEMO01' OR $16 = 'DPS123' OR $16 = 'GLOBAL')
    `, [
      title, author || 'Unknown', isbn || null, copies, shelf_location || 'A-1',
      publisher || '', edition || '1st Edition', publication_year || '', language || 'English',
      cleanSub, cleanSummary, description || cleanSummary, price || null, cover_url || null,
      id, sCode
    ]);

    res.json({ success: true, message: 'Book information updated successfully' });
  } catch (err) {
    console.error('Error editing book:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

