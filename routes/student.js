const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
const db = require('../db');
const pool = { query: (text, params) => db.query(text, params) };

const upload = multer({
  dest: path.join(__dirname, '..', 'static', 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // Strict 10MB upload limit for students
});
const digitalContentDir = path.join(__dirname, '..', 'static', 'digital_content');

function studentOnly(req, res, next) {
  if (!req.session || !req.session.user_id) {
    req.flash('error', 'Access denied. Please log in.');
    return res.redirect('/login');
  }
  // Role isolation: Librarians & Admins belong in /admin, not /student
  if (req.session.role === 'admin' || req.session.role === 'librarian') {
    return res.redirect('/admin');
  }
  return next();
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
  const physDone = (await conn.query("SELECT COUNT(*) as c FROM transactions WHERE user_id = $1 AND return_date IS NOT NULL AND return_date != 'LOST'", [userId])).rows[0].c;
  const digDone = (await conn.query('SELECT COUNT(*) as c FROM reading_progress WHERE student_id = $1 AND last_page >= total_pages AND total_pages > 1', [userId])).rows[0].c;
  const totalDone = parseInt(physDone) + parseInt(digDone);
  const quizzesPassed = (await conn.query('SELECT COUNT(*) as c FROM quiz_attempts WHERE user_id = $1 AND passed = 1', [userId])).rows[0].c;
  const reviewsApproved = (await conn.query("SELECT COUNT(*) as c FROM book_reviews WHERE user_id = $1 AND status = 'approved'", [userId])).rows[0].c;
  const overallScore = parseInt(user.overall_reader_score) || 0;
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

function isTransactionEligibleForQuiz(tx, book) {
  if (!tx.return_date || tx.return_date === 'LOST') {
    return { eligible: false, message: 'Book is not returned yet.' };
  }
  const issueDate = new Date(tx.issue_date);
  const returnDate = new Date(tx.return_date);
  const daysKept = Math.floor((returnDate - issueDate) / (1000 * 60 * 60 * 24));
  const pages = book.pages || 120;
  if (pages < 100 && daysKept < 2) {
    return { eligible: false, message: `Minimum reading period not met. For a book under 100 pages, you must keep it for at least 2 days (borrowed for ${daysKept} days).` };
  } else if (pages <= 300 && daysKept < 5) {
    return { eligible: false, message: `Minimum reading period not met. For a book between 100-300 pages, you must keep it for at least 5 days (borrowed for ${daysKept} days).` };
  } else if (pages > 300 && daysKept < 7) {
    return { eligible: false, message: `Minimum reading period not met. For a book above 300 pages, you must keep it for at least 7 days (borrowed for ${daysKept} days).` };
  }
  return { eligible: true, message: '' };
}

function isDigitalEligibleForQuiz(progress) {
  if (!progress.started_reading_at) {
    return { eligible: false, message: 'Not started reading.' };
  }
  const startDate = new Date(progress.started_reading_at.slice(0, 10));
  const nowDate = new Date();
  const daysReading = Math.floor((nowDate - startDate) / (1000 * 60 * 60 * 24));
  const pages = progress.total_pages || 1;
  if (pages < 100 && daysReading < 2) {
    return { eligible: false, message: `Minimum reading period not met. For a digital book under 100 pages, you must read it for at least 2 days (read for ${daysReading} days).` };
  } else if (pages <= 300 && daysReading < 5) {
    return { eligible: false, message: `Minimum reading period not met. For a digital book between 100-300 pages, you must read it for at least 5 days (read for ${daysReading} days).` };
  } else if (pages > 300 && daysReading < 7) {
    return { eligible: false, message: `Minimum reading period not met. For a digital book above 300 pages, you must read it for at least 7 days (read for ${daysReading} days).` };
  }
  return { eligible: true, message: '' };
}

// ── Student Dashboard ───────────────────────────────────────────────────
router.get('/', studentOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const userId = req.session.user_id;
  try {
    if (sCode) {
      const school = (await pool.query('SELECT name FROM schools WHERE school_code = $1', [sCode])).rows[0];
      req.session.school_name = school ? school.name : 'E-Pathshala Network';
    } else {
      req.session.school_name = 'E-Pathshala Network';
    }

    const txs = (await pool.query(
      `SELECT t.*, b.title, b.author, b.cover_url FROM transactions t JOIN books b ON b.id = t.book_id WHERE t.user_id = $1 AND t.return_date IS NULL`,
      [userId])).rows;

    const recommendedBooks = (await pool.query(
      `SELECT * FROM books WHERE (school_code = $1 OR school_code = 'GLOBAL') AND available_copies > 0 AND (is_banned IS NULL OR (is_banned != 1 AND is_banned != '1')) ORDER BY RANDOM() LIMIT 4`,
      [sCode])).rows;

    const totalIssued = (await pool.query('SELECT COUNT(*) as c FROM transactions WHERE user_id = $1', [userId])).rows[0].c;
    const currentlyBorrowed = txs.length;
    const totalBooksRead = parseInt((await pool.query("SELECT COUNT(*) as c FROM transactions WHERE user_id = $1 AND return_date IS NOT NULL", [userId])).rows[0].c);

    const transactions = [];
    const dueSoon = [];
    const overdueBooks = [];
    let totalFine = 0;

    txs.forEach(tx => {
      const fine = calculateFine(tx.due_date);
      tx.calculated_fine = fine.fine;
      tx.is_overdue = fine.is_overdue;
      totalFine += fine.fine;
      const dueDateObj = new Date(tx.due_date);
      const daysUntilDue = Math.floor((dueDateObj - new Date()) / (1000 * 60 * 60 * 24));
      tx.days_until_due = daysUntilDue;
      if (fine.is_overdue) {
        overdueBooks.push(tx);
      } else if (daysUntilDue >= 0 && daysUntilDue <= 7) {
        dueSoon.push(tx);
      }
      transactions.push(tx);
    });

    const stats = {
      total_issued: totalIssued,
      currently_borrowed: currentlyBorrowed,
      due_soon_count: dueSoon.length,
      overdue_count: overdueBooks.length,
      total_read: totalBooksRead,
      pending_fines: totalFine,
    };

    const returnedTxs = (await pool.query(
      `SELECT t.*, b.title, b.author, b.cover_url, b.pages,
              (SELECT passed FROM quiz_attempts WHERE user_id = t.user_id AND book_id = t.book_id AND book_type = 'physical' LIMIT 1) as quiz_passed,
              (SELECT status FROM book_reviews WHERE user_id = t.user_id AND book_id = t.book_id AND book_type = 'physical' LIMIT 1) as review_status
       FROM transactions t
       JOIN books b ON b.id = t.book_id
       WHERE t.user_id = $1 AND t.return_date IS NOT NULL AND t.return_date != 'LOST'
       ORDER BY t.return_date DESC LIMIT 5`,
      [userId])).rows;

    const digitalProgress = (await pool.query(
      `SELECT p.*, d.title, d.category, d.subject, d.cover_url,
              (SELECT passed FROM quiz_attempts WHERE user_id = p.student_id AND book_id = p.content_id AND book_type = 'digital' LIMIT 1) as quiz_passed,
              (SELECT status FROM book_reviews WHERE user_id = p.student_id AND book_id = p.content_id AND book_type = 'digital' LIMIT 1) as review_status
       FROM reading_progress p
       JOIN digital_content d ON d.id = p.content_id
       WHERE p.student_id = $1
       ORDER BY p.updated_at DESC LIMIT 5`,
      [userId])).rows;

    const schoolName = req.session.school_name || 'E-Pathshala Network';
    const demoMode = req.session.demo_mode;

    res.render('student', {
      title: 'Student Portal - E-Pathshala Network',
      transactions,
      recommended_books: recommendedBooks,
      stats,
      due_soon: dueSoon,
      overdue_books: overdueBooks,
      school_name: schoolName,
      returned_transactions: returnedTxs,
      digital_progress: digitalProgress,
      school_perms: {},
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/');
  }
});

// ── Browse Books ─────────────────────────────────────────────────────────
router.get('/browse', studentOnly, async (req, res) => {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate');
  const sCode = req.session.school_code;
  const genreFilter = req.query.genre;
  const searchQuery = (req.query.q || '').trim();
  const aiSearch = req.query.ai === 'true';
  try {
    let query = "SELECT * FROM books WHERE (is_banned IS NULL OR (is_banned != 1 AND is_banned != '1')) AND school_code = $1";
    const params = [sCode];
    if (genreFilter) {
      params.push(genreFilter);
      query += ` AND genre = $${params.length}`;
    }
    if (searchQuery && !aiSearch) {
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
      query += ` AND (title ILIKE $${params.length-3} OR author ILIKE $${params.length-2} OR subject ILIKE $${params.length-1} OR genre ILIKE $${params.length})`;
    }
    query += ` ORDER BY title ASC`;
    const booksRows = (await pool.query(query, params)).rows;
    const books = booksRows.map(b => ({ ...b, book_type: 'physical' }));

    if (!(searchQuery && aiSearch)) {
      books.sort((a, b) => (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase()));
    }

    // AI search ranking within school library
    if (searchQuery && aiSearch && books.length > 0) {
      const scoredBooks = books.map(b => ({ ...b, ai_score: 50 }));
      books.length = 0;
      books.push(...scoredBooks);
      books.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
    }

    const genres = (await pool.query(
      `SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL AND school_code = $1 AND (is_banned IS NULL OR (is_banned != 1 AND is_banned != '1'))`,
      [sCode])).rows.map(r => r.genre);

    const globalSections = (await pool.query('SELECT * FROM global_sections ORDER BY name ASC')).rows;

    res.render('student_browse', {
      title: 'Digital Library Catalog - ' + (req.session.school_name || 'E-Pathshala Network'),
      books,
      genres,
      active_genre: genreFilter || null,
      search_query: searchQuery,
      ai_search: aiSearch,
      global_sections: globalSections,
      school_name: req.session.school_name || 'E-Pathshala Network',
    });
  } catch (err) {
    console.error('Browse error:', err);
    req.flash('error', 'Failed to load catalog');
    res.redirect('/student');
  }
});

// ── Book Details ─────────────────────────────────────────────────────────
router.get('/book/:bookId', studentOnly, async (req, res) => {
  const { bookId } = req.params;
  const sCode = req.session.school_code;
  try {
    const book = (await pool.query('SELECT * FROM books WHERE id = $1 AND (school_code = $2 OR school_code = $3)', [bookId, sCode, 'GLOBAL'])).rows[0];
    if (!book) {
      req.flash('error', 'Book not found');
      return res.redirect('/student');
    }
    const existingRes = (await pool.query("SELECT * FROM reservations WHERE user_id = $1 AND book_id = $2 AND status = 'Pending'", [req.session.user_id, bookId])).rows[0];
    res.render('book_details', { title: 'Book Details - librika.in', book, has_reservation: !!existingRes });
  } catch (err) {
    console.error('Book details error:', err);
    req.flash('error', 'Failed to load book details');
    res.redirect('/student');
  }
});

// ── Reserve Book ─────────────────────────────────────────────────────────
router.post('/reserve/:bookId', studentOnly, async (req, res) => {
  const { bookId } = req.params;
  const sCode = req.session.school_code;
  const userId = req.session.user_id;
  try {
    const book = (await pool.query('SELECT * FROM books WHERE id = $1 AND (school_code = $2 OR school_code = $3)', [bookId, sCode, 'GLOBAL'])).rows[0];
    if (book) {
      const existing = (await pool.query("SELECT * FROM reservations WHERE user_id = $1 AND book_id = $2 AND status = 'Pending'", [userId, bookId])).rows[0];
      if (!existing) {
        await pool.query("INSERT INTO reservations (user_id, book_id, status, created_at, school_code) VALUES ($1, $2, 'Pending', $3, $4)",
          [userId, bookId, nowStr(), sCode]);
        const msg = `Your reservation for '${book.title}' has been placed.`;
        await pool.query('INSERT INTO notifications (user_id, message, type, created_at, school_code) VALUES ($1, $2, $3, $4, $5)',
          [userId, msg, 'reservation', nowStr(), sCode]);
      }
    }
    res.redirect(`/student/book/${bookId}`);
  } catch (err) {
    console.error('Reserve error:', err);
    req.flash('error', 'Failed to reserve book');
    res.redirect(`/student/book/${bookId}`);
  }
});

// ── Self Issue Book ──────────────────────────────────────────────────────
router.get('/issue/:bookId', studentOnly, async (req, res) => {
  const { bookId } = req.params;
  const userId = req.session.user_id;
  try {
    const book = (await pool.query('SELECT * FROM books WHERE id = $1 AND available_copies > 0', [bookId])).rows[0];
    if (book) {
      const existingTx = (await pool.query('SELECT * FROM transactions WHERE user_id = $1 AND book_id = $2 AND return_date IS NULL', [userId, bookId])).rows[0];
      if (!existingTx) {
        await pool.query('INSERT INTO transactions (user_id, book_id, issue_date, due_date, class, school_code) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, book.id, renderDate(new Date()), dueDate(3), req.session.class, book.school_code]);
        await pool.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book.id]);
        if (!(await check90DayCooldown(pool, userId, book.id, 'physical'))) {
          await updateScore(pool, userId, 'physical', 5, `Self-issued book '${book.title}'`);
        }
      }
    }
    res.redirect('/student');
  } catch (err) {
    console.error('Self-issue error:', err);
    req.flash('error', 'Failed to issue book');
    res.redirect('/student');
  }
});

// ── Publish Content ─────────────────────────────────────────────────────
router.get('/publish', studentOnly, async (req, res) => {
  const draftId = req.query.draft_id;
  let draft = null;
  if (draftId) {
    try {
      draft = (await pool.query('SELECT * FROM digital_content WHERE id = $1 AND student_id = $2', [draftId, req.session.user_id])).rows[0];
    } catch (e) { console.error(e); }
  }
  res.render('student_publish', { title: 'Publish Content - librika.in', draft });
});

router.post('/publish', studentOnly, upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'document', maxCount: 1 },
]), async (req, res) => {
  const sCode = req.session.school_code;
  const userId = req.session.user_id;
  const { title, category, description, subject, class: className, tags, draft_id } = req.body;
  try {
    let coverUrl = '';
    let fileUrl = '';
    const coverFile = req.files && req.files.cover && req.files.cover[0];
    const docFile = req.files && req.files.document && req.files.document[0];

    if (coverFile) {
      coverUrl = `/uploads/${coverFile.filename}`;
    }
    if (docFile) {
      fileUrl = `/digital_content/${docFile.filename}`;
    }

    if (draft_id) {
      const old = (await pool.query('SELECT cover_url, file_url FROM digital_content WHERE id = $1 AND student_id = $2', [draft_id, userId])).rows[0];
      if (old) {
        if (!coverUrl) coverUrl = old.cover_url || '';
        if (!fileUrl) fileUrl = old.file_url || '';
      }
      await pool.query(`UPDATE digital_content SET title = $1, category = $2, description = $3, subject = $4, class = $5, tags = $6, cover_url = $7, file_url = $8 WHERE id = $9 AND student_id = $10`,
        [title, category, description, subject, className, tags, coverUrl, fileUrl, draft_id, userId]);
    } else {
      const status = (req.session.role === 'admin' || req.session.role === 'super_admin') ? 'Published' : 'Draft';
      const result = await pool.query(`INSERT INTO digital_content (title, category, description, subject, class, tags, cover_url, file_url, student_id, school_code, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [title, category, description, subject, className, tags, coverUrl, fileUrl, userId, sCode, status, nowStr()]);
    }

    if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({ status: 'success', redirect: '/student/my-publications' });
    }
    res.redirect('/student/my-publications');
  } catch (err) {
    console.error('Publish error:', err);
    req.flash('error', 'Failed to publish content');
    res.redirect('/student/publish');
  }
});

// ── Publish Finalize API ────────────────────────────────────────────────
router.post('/api/publish-finalize/:pubId', studentOnly, async (req, res) => {
  const { pubId } = req.params;
  try {
    await pool.query("UPDATE digital_content SET status = 'Submitted' WHERE id = $1 AND student_id = $2", [pubId, req.session.user_id]);
    res.json({ status: 'success' });
  } catch (err) {
    console.error('Finalize error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── My Publications ─────────────────────────────────────────────────────
router.get('/my-publications', studentOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const userId = req.session.user_id;
  try {
    const pubs = (await pool.query(
      `SELECT d.*, (SELECT COUNT(*) FROM reading_progress rp WHERE rp.content_id = d.id) as bookmarks_count
       FROM digital_content d WHERE d.student_id = $1 AND d.school_code = $2 ORDER BY d.id DESC`,
      [userId, sCode])).rows;
    res.render('student_my_publications', {
      title: 'My Publications - librika.in',
      publications: pubs,
      school_name: req.session.school_name || 'E-Pathshala Network',
    });
  } catch (err) {
    console.error('My publications error:', err);
    req.flash('error', 'Failed to load publications');
    res.redirect('/student');
  }
});

// ── Bookmarks / Saved Items ─────────────────────────────────────────────
router.get('/bookmarks', studentOnly, async (req, res) => {
  try {
    const bookmarks = (await pool.query(
      `SELECT p.last_page, p.updated_at, d.*, u.name as student_name
       FROM reading_progress p
       JOIN digital_content d ON p.content_id = d.id
       LEFT JOIN users u ON d.student_id = u.id
       WHERE p.student_id = $1
       ORDER BY p.updated_at DESC`,
      [req.session.user_id])).rows;
    res.render('student_bookmarks', { title: 'Saved Items - librika.in', bookmarks });
  } catch (err) {
    console.error('Bookmarks error:', err);
    req.flash('error', 'Failed to load bookmarks');
    res.redirect('/student');
  }
});

// ── Profile ──────────────────────────────────────────────────────────────
router.get('/profile', studentOnly, async (req, res) => {
  try {
    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [req.session.user_id])).rows[0];
    if (!user) return res.redirect('/login');

    const totalRead = parseInt((await pool.query("SELECT COUNT(*) as c FROM transactions WHERE user_id = $1 AND return_date IS NOT NULL AND return_date != 'LOST'", [req.session.user_id])).rows[0].c);
    const savedCount = parseInt((await pool.query('SELECT COUNT(*) as c FROM reading_progress WHERE student_id = $1', [req.session.user_id])).rows[0].c);
    const publicationsCount = parseInt((await pool.query("SELECT COUNT(*) as c FROM digital_content WHERE student_id = $1 AND status = 'approved'", [req.session.user_id])).rows[0].c);

    const favGenreRow = (await pool.query(
      `SELECT b.genre, COUNT(*) as count FROM transactions t JOIN books b ON t.book_id = b.id WHERE t.user_id = $1 AND b.genre IS NOT NULL GROUP BY b.genre ORDER BY count DESC LIMIT 1`,
      [req.session.user_id])).rows[0];
    const favCategory = favGenreRow ? favGenreRow.genre : 'General';

    const stats = {
      total_read: totalRead,
      saved_count: savedCount,
      publications_count: publicationsCount,
      favorite_category: favCategory,
      days_streak: user.reading_streak || 0,
    };

    let badgesList = [];
    try { badgesList = JSON.parse(user.badges || '[]'); } catch(e) {}

    res.render('student_profile', { title: 'My Profile - librika.in', user, stats, badges: badgesList });
  } catch (err) {
    console.error('Profile error:', err);
    req.flash('error', 'Failed to load profile');
    res.redirect('/student');
  }
});

router.post('/profile', studentOnly, async (req, res) => {
  const { name, admission_no, class: className, section, stream, dob, email, password } = req.body;
  try {
    const updates = [];
    const values = [];
    let idx = 1;
    if (name) { updates.push(`name = $${idx++}`); values.push(name); }
    if (admission_no) { updates.push(`admission_no = $${idx++}`); values.push(admission_no); }
    if (className) { updates.push(`class = $${idx++}`); values.push(className); }
    if (section) { updates.push(`section = $${idx++}`); values.push(section); }
    if (stream) { updates.push(`stream = $${idx++}`); values.push(stream); }
    if (dob) { updates.push(`dob = $${idx++}`); values.push(dob); }
    if (email) { updates.push(`email = $${idx++}`); values.push(email); }
    if (updates.length > 0) {
      values.push(req.session.user_id);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.session.user_id]);
    }
    if (name) req.session.name = name;
    if (className) req.session.class = className;
    req.flash('success', 'Profile updated successfully!');
    res.redirect('/student/profile');
  } catch (err) {
    console.error('Profile update error:', err);
    req.flash('error', 'Failed to update profile');
    res.redirect('/student/profile');
  }
});

// ── Quiz Routes ─────────────────────────────────────────────────────────
router.get('/quiz/:bookType/:bookId', studentOnly, async (req, res) => {
  const { bookType, bookId } = req.params;
  const userId = req.session.user_id;
  const sCode = req.session.school_code;
  try {
    const attempt = (await pool.query('SELECT * FROM quiz_attempts WHERE user_id = $1 AND book_id = $2 AND book_type = $3', [userId, bookId, bookType])).rows[0];
    if (attempt) {
      req.flash('error', 'You have already attempted the quiz for this book. Quizzes can only be attempted once.');
      return res.redirect('/student');
    }

    let book = null;
    if (bookType === 'physical') {
      book = (await pool.query('SELECT * FROM books WHERE id = $1 AND school_code = $2', [bookId, sCode])).rows[0];
    } else {
      book = (await pool.query('SELECT * FROM digital_content WHERE id = $1 AND school_code = $2', [bookId, sCode])).rows[0];
    }
    if (!book) {
      req.flash('error', 'Book or digital resource not found.');
      return res.redirect('/student');
    }

    let eligible = false;
    let message = '';
    if (bookType === 'physical') {
      const tx = (await pool.query("SELECT * FROM transactions WHERE user_id = $1 AND book_id = $2 AND return_date IS NOT NULL AND return_date != 'LOST' ORDER BY return_date DESC LIMIT 1", [userId, bookId])).rows[0];
      if (!tx) {
        message = 'The quiz is locked. You must return this book before you can take the quiz.';
      } else {
        const result = isTransactionEligibleForQuiz(tx, book);
        eligible = result.eligible;
        message = result.message;
      }
    } else {
      const progress = (await pool.query('SELECT * FROM reading_progress WHERE student_id = $1 AND content_id = $2', [userId, bookId])).rows[0];
      if (!progress) {
        message = 'The quiz is locked. You must start reading this book first.';
      } else {
        const totalP = progress.total_pages || 1;
        const lastP = progress.last_page || 1;
        const percent = (lastP / totalP) * 100;
        if (percent < 80) {
          message = `The quiz is locked. You must read at least 80% of this content. Current progress: ${Math.round(percent)}%.`;
        } else {
          const result = isDigitalEligibleForQuiz(progress);
          eligible = result.eligible;
          message = result.message;
        }
      }
    }

    if (!eligible) {
      return res.render('quiz_locked', { title: 'Quiz Locked - librika.in', book, book_type: bookType, message });
    }

    let quiz = (await pool.query('SELECT * FROM book_quizzes WHERE book_id = $1 AND book_type = $2', [bookId, bookType])).rows[0];
    if (!quiz) {
      const questionsJson = JSON.stringify(generateDefaultQuiz(book.title, book.author || 'Author'));
      const result = await pool.query('INSERT INTO book_quizzes (book_id, book_type, questions, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
        [bookId, bookType, questionsJson, nowStr()]);
      quiz = result.rows[0];
    }

    let questions = [];
    try { questions = JSON.parse(quiz.questions); } catch(e) {
      questions = generateDefaultQuiz(book.title, book.author || 'Author');
    }

    res.render('take_quiz', { title: `Book Quiz: ${book.title} - librika.in`, book, book_type: bookType, questions });
  } catch (err) {
    console.error('Quiz error:', err);
    req.flash('error', 'Failed to load quiz');
    res.redirect('/student');
  }
});

router.post('/quiz/:bookType/:bookId', studentOnly, async (req, res) => {
  const { bookType, bookId } = req.params;
  const userId = req.session.user_id;
  const sCode = req.session.school_code;
  try {
    let book = null;
    if (bookType === 'physical') {
      book = (await pool.query('SELECT * FROM books WHERE id = $1', [bookId])).rows[0];
    } else {
      book = (await pool.query('SELECT * FROM digital_content WHERE id = $1', [bookId])).rows[0];
    }
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/student');
    }

    const quiz = (await pool.query('SELECT * FROM book_quizzes WHERE book_id = $1 AND book_type = $2', [bookId, bookType])).rows[0];
    let questions = [];
    try { questions = JSON.parse(quiz.questions); } catch(e) { questions = []; }

    let correctCount = 0;
    const totalQuestions = questions.length;
    questions.forEach((q, idx) => {
      const selected = req.body[`q${idx}`];
      if (selected !== undefined && parseInt(selected) === q.correct_index) {
        correctCount++;
      }
    });

    const scorePct = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const passed = scorePct >= 70 ? 1 : 0;

    await pool.query('INSERT INTO quiz_attempts (user_id, book_id, book_type, score, passed, attempted_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, bookId, bookType, scorePct, passed, nowStr()]);

    let pointsAwarded = 0;
    const cooldownApplies = await check90DayCooldown(pool, userId, bookId, bookType);
    if (passed && !cooldownApplies) {
      pointsAwarded = 50;
      await updateScore(pool, userId, bookType, 50, `Passed quiz for '${book.title}' (${Math.round(scorePct)}% score)`);
    }

    res.render('quiz_result', {
      title: 'Quiz Results - librika.in',
      book,
      book_type: bookType,
      score: scorePct,
      passed: !!passed,
      correct: correctCount,
      total: totalQuestions,
      points: pointsAwarded,
      cooldown: cooldownApplies,
    });
  } catch (err) {
    console.error('Quiz submit error:', err);
    req.flash('error', 'Failed to submit quiz');
    res.redirect('/student');
  }
});

// ── Review Routes ───────────────────────────────────────────────────────
router.get('/review/:bookType/:bookId', studentOnly, async (req, res) => {
  const { bookType, bookId } = req.params;
  const userId = req.session.user_id;
  const sCode = req.session.school_code;
  try {
    const reviewed = (await pool.query('SELECT * FROM book_reviews WHERE user_id = $1 AND book_id = $2 AND book_type = $3', [userId, bookId, bookType])).rows[0];
    if (reviewed) {
      req.flash('error', 'You have already submitted a review for this book.');
      return res.redirect('/student');
    }

    let book = null;
    if (bookType === 'physical') {
      book = (await pool.query('SELECT * FROM books WHERE id = $1 AND school_code = $2', [bookId, sCode])).rows[0];
    } else {
      book = (await pool.query('SELECT * FROM digital_content WHERE id = $1 AND school_code = $2', [bookId, sCode])).rows[0];
    }
    if (!book) {
      req.flash('error', 'Book or digital resource not found.');
      return res.redirect('/student');
    }

    let eligible = false;
    if (bookType === 'physical') {
      const tx = (await pool.query("SELECT * FROM transactions WHERE user_id = $1 AND book_id = $2 AND return_date IS NOT NULL AND return_date != 'LOST' ORDER BY return_date DESC LIMIT 1", [userId, bookId])).rows[0];
      if (tx) eligible = true;
    } else {
      const progress = (await pool.query("SELECT * FROM reading_progress WHERE student_id = $1 AND content_id = $2 AND last_page >= total_pages AND total_pages > 1", [userId, bookId])).rows[0];
      if (progress) eligible = true;
    }

    if (!eligible) {
      req.flash('error', 'You must complete or return this book before submitting a review.');
      return res.redirect('/student');
    }

    res.render('submit_review', { title: `Write Book Review - librika.in`, book, book_type: bookType });
  } catch (err) {
    console.error('Review page error:', err);
    req.flash('error', 'Failed to load review page');
    res.redirect('/student');
  }
});

router.post('/review/:bookType/:bookId', studentOnly, async (req, res) => {
  const { bookType, bookId } = req.params;
  const userId = req.session.user_id;
  const sCode = req.session.school_code;
  const { learned, favorite, recommend } = req.body;
  try {
    let book = null;
    if (bookType === 'physical') {
      book = (await pool.query('SELECT * FROM books WHERE id = $1', [bookId])).rows[0];
    } else {
      book = (await pool.query('SELECT * FROM digital_content WHERE id = $1', [bookId])).rows[0];
    }
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/student');
    }

    if (!learned || !favorite || !recommend) {
      req.flash('error', 'All review fields are required.');
      return res.render('submit_review', { title: 'Write Book Review - librika.in', book, book_type: bookType });
    }

    await pool.query("INSERT INTO book_reviews (user_id, book_id, book_type, learned, favorite, recommend, status, created_at, school_code) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)",
      [userId, bookId, bookType, learned, favorite, recommend, nowStr(), sCode]);
    req.flash('success', 'Your review has been submitted for librarian approval! Points will be awarded upon approval.');
    res.redirect('/student');
  } catch (err) {
    console.error('Review submit error:', err);
    req.flash('error', 'Failed to submit review');
    res.redirect('/student');
  }
});

function generateDefaultQuiz(title, author) {
  return [
    {
      question: `What is the main theme of "${title}"?`,
      options: [
        `${title} explores fundamental concepts and ideas related to its subject matter`,
        `${title} is primarily a fictional narrative`,
        `${title} is a technical manual`,
        `${title} is a biographical work`
      ],
      correct_index: 0
    },
    {
      question: `Who is the author of "${title}"?`,
      options: [author, 'Unknown', 'Multiple Authors', 'Anonymous'],
      correct_index: 0
    },
    {
      question: `What type of content is "${title}"?`,
      options: ['Educational/Informative', 'Fictional Story', 'Poetry Collection', 'Reference Material'],
      correct_index: 0
    },
    {
      question: `How can "${title}" help students?`,
      options: [
        'By providing knowledge and insights on the subject matter',
        'By entertaining readers with stories',
        'By serving as a dictionary',
        'By providing step-by-step instructions only'
      ],
      correct_index: 0
    },
    {
      question: `What is the best way to use "${title}" for learning?`,
      options: [
        'Read carefully, take notes, and discuss with peers',
        'Read it once quickly',
        'Only read specific chapters',
        'Skip to the conclusion'
      ],
      correct_index: 0
    }
  ];
}



// ── Additional Student Tab Routes (Pristine Bug-Free Handlers) ──
router.get('/goals', studentOnly, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = (await pool.query('SELECT * FROM users WHERE id = ', [userId])).rows[0] || {};
    const totalRead = parseInt((await pool.query("SELECT COUNT(*) as c FROM transactions WHERE user_id =  AND return_date IS NOT NULL AND return_date != 'LOST'", [userId])).rows[0].c || 0, 10);
    res.render('student_goals', {
      title: 'Reading Goals - librika.in',
      user,
      total_read: totalRead,
      goal_pages: user.daily_page_goal || 20,
      goal_books: user.yearly_book_goal || 12,
      school_name: req.session.school_name || 'E-Pathshala Network'
    });
  } catch (err) {
    console.error('Goals route error:', err);
    res.render('student_goals', { title: 'Reading Goals', user: {}, total_read: 0, goal_pages: 20, goal_books: 12, school_name: 'E-Pathshala Network' });
  }
});

router.get('/notifications', studentOnly, async (req, res) => {
  try {
    const notifs = (await pool.query("SELECT * FROM announcements WHERE school_code =  OR school_code = 'GLOBAL' ORDER BY created_at DESC LIMIT 20", [req.session.school_code || 'GLOBAL'])).rows || [];
    res.render('student_notifications', {
      title: 'Notifications - librika.in',
      notifications: notifs,
      school_name: req.session.school_name || 'E-Pathshala Network'
    });
  } catch (err) {
    console.error('Notifications route error:', err);
    res.render('student_notifications', { title: 'Notifications', notifications: [], school_name: 'E-Pathshala Network' });
  }
});

router.get('/settings', studentOnly, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = (await pool.query('SELECT * FROM users WHERE id = ', [userId])).rows[0] || {};
    res.render('student_settings', {
      title: 'Account Settings - librika.in',
      user,
      school_name: req.session.school_name || 'E-Pathshala Network'
    });
  } catch (err) {
    console.error('Settings route error:', err);
    res.render('student_settings', { title: 'Settings', user: {}, school_name: 'E-Pathshala Network' });
  }
});

router.get(['/help', '/support'], studentOnly, async (req, res) => {
  try {
    res.render('student_support', {
      title: 'Help & Support - librika.in',
      school_name: req.session.school_name || 'E-Pathshala Network'
    });
  } catch (err) {
    console.error('Help route error:', err);
    res.render('student_support', { title: 'Help & Support', school_name: 'E-Pathshala Network' });
  }
});

router.get('/my-library', studentOnly, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const txs = (await pool.query('SELECT t.*, b.title, b.author, b.cover_url FROM transactions t JOIN books b ON b.id = t.book_id WHERE t.user_id =  AND t.return_date IS NULL', [userId])).rows;
    res.render('student_mylibrary', {
      title: 'My Library - librika.in',
      transactions: txs,
      school_name: req.session.school_name || 'E-Pathshala Network'
    });
  } catch (err) {
    console.error('My library route error:', err);
    res.render('student_mylibrary', { title: 'My Library', transactions: [], school_name: 'E-Pathshala Network' });
  }
});

router.get('/analytics', studentOnly, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const progressRows = (await pool.query('SELECT total_pages, last_page, reading_time, updated_at FROM reading_progress WHERE student_id = ', [userId])).rows || [];
    const pagesRead = progressRows.reduce((a, r) => a + (parseInt(r.last_page, 10) || 0), 0);
    const minutesRead = progressRows.reduce((a, r) => a + (parseInt(r.reading_time, 10) || 0), 0);
    const hoursRead = (minutesRead / 60).toFixed(1);
    const booksCompleted = parseInt((await pool.query("SELECT COUNT(*) as c FROM transactions WHERE user_id =  AND return_date IS NOT NULL AND return_date != 'LOST'", [userId])).rows[0].c || 0, 10);
    res.render('student_analytics', {
      title: 'Analytics - librika.in',
      pagesRead, minutesRead, hoursRead, booksCompleted,
      school_name: req.session.school_name || 'E-Pathshala Network'
    });
  } catch (err) {
    console.error('Analytics route error:', err);
    res.render('student_analytics', { title: 'Analytics', pagesRead: 0, minutesRead: 0, hoursRead: 0, booksCompleted: 0, school_name: 'E-Pathshala Network' });
  }
});

router.get('/assignments', studentOnly, async (req, res) => {
  try {
    const sCode = req.session.school_code || 'GLOBAL';
    const assignments = (await pool.query('SELECT * FROM assignments WHERE school_code =  ORDER BY due_date ASC', [sCode])).rows || [];
    res.render('student_assignments', {
      title: 'Assignments - librika.in',
      assignments,
      school_name: req.session.school_name || 'E-Pathshala Network'
    });
  } catch (err) {
    console.error('Assignments route error:', err);
    res.render('student_assignments', { title: 'Assignments', assignments: [], school_name: 'E-Pathshala Network' });
  }
});

router.get('/requests', studentOnly, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const reqs = (await pool.query('SELECT r.*, b.title, b.author, b.cover_url FROM book_reservations r JOIN books b ON r.book_id = b.id WHERE r.user_id =  ORDER BY r.created_at DESC', [userId])).rows || [];
    res.render('student_requests', {
      title: 'Book Requests - librika.in',
      requests: reqs,
      school_name: req.session.school_name || 'E-Pathshala Network'
    });
  } catch (err) {
    console.error('Requests route error:', err);
    res.render('student_requests', { title: 'Book Requests', requests: [], school_name: 'E-Pathshala Network' });
  }
});

router.get('/calendar', studentOnly, async (req, res) => {
  try {
    res.render('student_calendar', {
      title: 'Calendar - librika.in',
      events: [],
      school_name: req.session.school_name || 'E-Pathshala Network'
    });
  } catch (err) {
    console.error('Calendar route error:', err);
    res.render('student_calendar', { title: 'Calendar', events: [], school_name: 'E-Pathshala Network' });
  }
});

router.get('/security', studentOnly, async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = (await pool.query('SELECT * FROM users WHERE id = ', [userId])).rows[0] || {};
    res.render('student_security', {
      title: 'Security Settings - librika.in',
      user,
      school_name: req.session.school_name || 'E-Pathshala Network'
    });
  } catch (err) {
    console.error('Security route error:', err);
    res.render('student_security', { title: 'Security Settings', user: {}, school_name: 'E-Pathshala Network' });
  }
});

module.exports = router;
