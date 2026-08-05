const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const db = require('./db');

const pool = { query: (text, params) => db.query(text, params) };
const upload = multer({
  dest: path.join(__dirname, '..', 'static', 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // Strict 10MB upload limit for students
});
const DIGITAL_CONTENT_DIR = path.join(__dirname, '..', 'static', 'digital_content');

function studentOnly(req, res, next) {
  if (req.session && req.session.role === 'student') return next();
  req.flash('error', 'Please log in as a student');
  return res.redirect('/login');
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
  }
  return false;
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
}

function isTransactionEligibleForQuiz(tx, book) {
  if (!tx.return_date || tx.return_date === 'LOST') return { eligible: false, message: 'Book is not returned yet.' };
  const issueDate = new Date(tx.issue_date);
  const returnDate = new Date(tx.return_date);
  const daysKept = Math.floor((returnDate - issueDate) / (1000 * 60 * 60 * 24));
  const pages = parseInt(book.pages) || 120;
  if (pages < 100 && daysKept < 2) return { eligible: false, message: `Minimum reading period not met. For books under 100 pages, keep for at least 2 days (kept ${daysKept} days).` };
  if (pages <= 300 && daysKept < 5) return { eligible: false, message: `Minimum reading period not met. For books 100-300 pages, keep for at least 5 days (kept ${daysKept} days).` };
  if (pages > 300 && daysKept < 7) return { eligible: false, message: `Minimum reading period not met. For books over 300 pages, keep for at least 7 days (kept ${daysKept} days).` };
  return { eligible: true, message: '' };
}

function isDigitalEligibleForQuiz(progress) {
  if (!progress.started_reading_at) return { eligible: false, message: 'Not started reading.' };
  const startDate = new Date(progress.started_reading_at.split(' ')[0]);
  const now = new Date();
  const daysReading = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  const pages = parseInt(progress.total_pages) || 1;
  if (pages < 100 && daysReading < 2) return { eligible: false, message: `For digital books under 100 pages, read for at least 2 days (read ${daysReading} days).` };
  if (pages <= 300 && daysReading < 5) return { eligible: false, message: `For digital books 100-300 pages, read for at least 5 days (read ${daysReading} days).` };
  if (pages > 300 && daysReading < 7) return { eligible: false, message: `For digital books over 300 pages, read for at least 7 days (read ${daysReading} days).` };
  return { eligible: true, message: '' };
}

// ── Dashboard ──────────────────────────────────────────────────────
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

    const txsRows = await pool.query(
      'SELECT t.*, b.title, b.author, b.cover_url FROM transactions t JOIN books b ON b.id = t.book_id WHERE t.user_id = $1 AND t.return_date IS NULL',
      [userId]);
    const txs = txsRows.rows;

    const recommended = await pool.query(
      `SELECT * FROM books WHERE (school_code = $1 OR school_code = 'GLOBAL') AND available_copies > 0 AND (is_banned IS NULL OR is_banned != $2) ORDER BY RANDOM() LIMIT 4`,
      [sCode, '1']);
    const recommendedBooks = recommended.rows;

    const totalIssued = (await pool.query('SELECT COUNT(*) FROM transactions WHERE user_id = $1', [userId])).rows[0].count;
    const totalRead = (await pool.query("SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND return_date IS NOT NULL AND return_date != 'LOST'", [userId])).rows[0].count;

    let totalFine = 0;
    const dueSoon = [];
    const overdueBooks = [];
    const transactions = txs.map(tx => {
      const fine = calculateFine(tx.due_date);
      const dueDate = new Date(tx.due_date);
      const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
      totalFine += fine.fine;
      if (fine.is_overdue) overdueBooks.push({ ...tx, ...fine, days_until_due: daysUntilDue });
      else if (daysUntilDue >= 0 && daysUntilDue <= 7) dueSoon.push({ ...tx, ...fine, days_until_due: daysUntilDue });
      return { ...tx, ...fine, days_until_due: daysUntilDue };
    });

    const stats = {
      total_issued: parseInt(totalIssued),
      currently_borrowed: txs.length,
      due_soon_count: dueSoon.length,
      overdue_count: overdueBooks.length,
      total_read: parseInt(totalRead),
      pending_fines: totalFine,
    };

    const returnedRaw = await pool.query(
      `SELECT t.*, b.title, b.author, b.cover_url, b.pages,
              (SELECT passed FROM quiz_attempts WHERE user_id = t.user_id AND book_id = t.book_id AND book_type = 'physical' LIMIT 1) as quiz_passed,
              (SELECT status FROM book_reviews WHERE user_id = t.user_id AND book_id = t.book_id AND book_type = 'physical' LIMIT 1) as review_status
       FROM transactions t
       JOIN books b ON b.id = t.book_id
       WHERE t.user_id = $1 AND t.return_date IS NOT NULL AND t.return_date != 'LOST'
       ORDER BY t.return_date DESC LIMIT 5`, [userId]);
    const returnedTransactions = returnedRaw.rows;

    const digProgRaw = await pool.query(
      `SELECT p.*, d.title, d.category, d.subject, d.cover_url,
              (SELECT passed FROM quiz_attempts WHERE user_id = p.student_id AND book_id = p.content_id AND book_type = 'digital' LIMIT 1) as quiz_passed,
              (SELECT status FROM book_reviews WHERE user_id = p.student_id AND book_id = p.content_id AND book_type = 'digital' LIMIT 1) as review_status
       FROM reading_progress p
       JOIN digital_content d ON d.id = p.content_id
       WHERE p.student_id = $1
       ORDER BY p.updated_at DESC LIMIT 5`, [userId]);
    const digitalProgress = digProgRaw.rows;

    res.render('student', {
      title: 'Student Dashboard - librika.in',
      transactions,
      recommended_books: recommendedBooks,
      stats,
      due_soon: dueSoon,
      overdue_books: overdueBooks,
      school_name: req.session.school_name,
      returned_transactions: returnedTransactions,
      digital_progress: digitalProgress,
      reading_tx: transactions[0] || null,
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/');
  }
});

// ── Browse Books ──────────────────────────────────────────────────
router.get('/browse', studentOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const genreFilter = req.query.genre;
  const searchQuery = (req.query.q || '').trim();
  const aiSearch = req.query.ai === 'true';
  try {
    let query = `SELECT * FROM books WHERE (is_banned IS NULL OR is_banned != '1') AND (school_code = $1 OR school_code = 'GLOBAL')`;
    const params = [sCode];
    if (genreFilter) { query += ' AND genre = $' + (params.length + 1); params.push(genreFilter); }
    if (searchQuery && !aiSearch) {
      query += ' AND (title ILIKE $' + (params.length + 1) + ' OR author ILIKE $' + (params.length + 2) + ' OR subject ILIKE $' + (params.length + 3) + ' OR genre ILIKE $' + (params.length + 4) + ')';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }
    const booksRaw = await pool.query(query, params);
    let books = booksRaw.rows.map(b => ({ ...b, book_type: 'physical' }));

    // Digital books
    let digQuery = `SELECT id, title, 'Manager' as author, category as genre, cover_url, 'GLOBAL' as school_code, 'digital' as book_type FROM digital_content WHERE school_code = 'GLOBAL' AND status = 'Published'`;
    const digParams = [];
    if (genreFilter) { digQuery += ' AND category = $' + (digParams.length + 1); digParams.push(genreFilter); }
    if (searchQuery && !aiSearch) {
      digQuery += ' AND (title ILIKE $' + (digParams.length + 1) + ' OR description ILIKE $' + (digParams.length + 2) + ' OR subject ILIKE $' + (digParams.length + 3) + ' OR category ILIKE $' + (digParams.length + 4) + ')';
      digParams.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }
    const digRows = await pool.query(digQuery, digParams);
    digRows.rows.forEach(d => books.push(d));

    if (!(searchQuery && aiSearch)) books.sort((a, b) => (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase()));

    const genreRows = await pool.query(
      `SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL AND (school_code = $1 OR school_code = 'GLOBAL') AND (is_banned IS NULL OR is_banned != '1')`,
      [sCode]);
    const genres = genreRows.rows.map(r => r.genre);
    const globalSections = (await pool.query('SELECT * FROM global_sections ORDER BY name ASC')).rows;

    res.render('student_browse', {
      title: 'Browse Books - librika.in',
      books, genres, active_genre: genreFilter || null,
      search_query: searchQuery, ai_search: aiSearch,
      global_sections: globalSections,
    });
  } catch (err) {
    console.error('Browse error:', err);
    req.flash('error', 'Failed to load catalog');
    res.redirect('/student');
  }
});

// ── Book Details ──────────────────────────────────────────────────
router.get('/book/:bookId', studentOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const { bookId } = req.params;
  try {
    const book = (await pool.query('SELECT * FROM books WHERE id = $1 AND (school_code = $2 OR school_code = $3)', [bookId, sCode, 'GLOBAL'])).rows[0];
    if (!book) return res.status(404).send('Book not found');
    const existingRes = (await pool.query("SELECT * FROM reservations WHERE user_id = $1 AND book_id = $2 AND status = 'Pending'", [req.session.user_id, bookId])).rows[0];
    res.render('book_details', { title: book.title + ' - librika.in', book, has_reservation: !!existingRes });
  } catch (err) { console.error(err); res.redirect('/student'); }
});

// ── Reserve Book ──────────────────────────────────────────────────
router.post('/reserve/:bookId', studentOnly, async (req, res) => {
  const sCode = req.session.school_code;
  const userId = req.session.user_id;
  const { bookId } = req.params;
  try {
    const book = (await pool.query('SELECT * FROM books WHERE id = $1 AND (school_code = $2 OR school_code = $3)', [bookId, sCode, 'GLOBAL'])).rows[0];
    if (book) {
      const existing = (await pool.query("SELECT * FROM reservations WHERE user_id = $1 AND book_id = $2 AND status = 'Pending'", [userId, bookId])).rows[0];
      if (!existing) {
        await pool.query('INSERT INTO reservations (user_id, book_id, status, created_at, school_code) VALUES ($1,$2,$3,$4,$5)',
          [userId, bookId, 'Pending', nowStr(), sCode]);
        await pool.query('INSERT INTO notifications (user_id, message, type, created_at, school_code) VALUES ($1,$2,$3,$4,$5)',
          [userId, `Your reservation for '${book.title}' has been placed.`, 'reservation', nowStr(), sCode]);
      }
    }
    res.redirect('/student/book/' + bookId);
  } catch (err) { console.error(err); res.redirect('/student'); }
});

// ── Self-Issue ─────────────────────────────────────────────────────
router.get('/issue/:bookId', studentOnly, async (req, res) => {
  const { bookId } = req.params;
  try {
    const book = (await pool.query('SELECT * FROM books WHERE id = $1 AND available_copies > 0', [bookId])).rows[0];
    if (book) {
      const existing = (await pool.query('SELECT * FROM transactions WHERE user_id = $1 AND book_id = $2 AND return_date IS NULL', [req.session.user_id, bookId])).rows[0];
      if (!existing) {
        await pool.query('INSERT INTO transactions (user_id, book_id, issue_date, due_date, class, school_code) VALUES ($1,$2,$3,$4,$5,$6)',
          [req.session.user_id, book.id, renderDate(new Date()), dueDate(3), req.session.class, book.school_code]);
        await pool.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book.id]);
        if (!(await check90DayCooldown(pool, req.session.user_id, book.id, 'physical'))) {
          await updateScore(pool, req.session.user_id, 'physical', 5, `Self-issued book '${book.title}'`);
        }
      }
    }
    res.redirect('/student');
  } catch (err) { console.error(err); res.redirect('/student'); }
});

// ── Profile ────────────────────────────────────────────────────────
router.get('/profile', studentOnly, async (req, res) => {
  try {
    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [req.session.user_id])).rows[0];
    const totalRead = (await pool.query("SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND return_date IS NOT NULL AND return_date != 'LOST'", [req.session.user_id])).rows[0].count;
    const savedCount = (await pool.query('SELECT COUNT(*) FROM reading_progress WHERE student_id = $1', [req.session.user_id])).rows[0].count;
    const pubsCount = (await pool.query("SELECT COUNT(*) FROM digital_content WHERE student_id = $1 AND status = 'approved'", [req.session.user_id])).rows[0].count;
    const favGenre = (await pool.query(
      'SELECT b.genre, COUNT(*) as count FROM transactions t JOIN books b ON t.book_id = b.id WHERE t.user_id = $1 AND b.genre IS NOT NULL GROUP BY b.genre ORDER BY count DESC LIMIT 1',
      [req.session.user_id])).rows[0];
    const stats = {
      total_read: parseInt(totalRead),
      saved_count: parseInt(savedCount),
      publications_count: parseInt(pubsCount),
      favorite_category: favGenre ? favGenre.genre : 'General',
      days_streak: parseInt(user.reading_streak) || 0,
    };
    let badges = [];
    try { badges = JSON.parse(user.badges || '[]'); } catch(e) {}
    res.render('student_profile', { title: 'My Profile - librika.in', user, stats, badges });
  } catch (err) { console.error(err); res.redirect('/student'); }
});

router.post('/profile', studentOnly, async (req, res) => {
  const { name, admission_no, class: cls, section, stream, dob, email, password } = req.body;
  try {
    const updates = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
    if (admission_no !== undefined) { updates.push(`admission_no = $${idx++}`); values.push(admission_no); }
    if (cls !== undefined) { updates.push(`class = $${idx++}`); values.push(cls); }
    if (section !== undefined) { updates.push(`section = $${idx++}`); values.push(section); }
    if (stream !== undefined) { updates.push(`stream = $${idx++}`); values.push(stream); }
    if (dob !== undefined) { updates.push(`dob = $${idx++}`); values.push(dob); }
    if (email !== undefined) { updates.push(`email = $${idx++}`); values.push(email); }
    values.push(req.session.user_id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);
    if (password) await pool.query('UPDATE users SET password = $1 WHERE id = $2', [password, req.session.user_id]);
    if (name) req.session.name = name;
    if (cls) req.session.class = cls;
    req.flash('success', 'Profile updated successfully!');
    res.redirect('/student/profile');
  } catch (err) { console.error(err); req.flash('error', 'Failed to update profile'); res.redirect('/student/profile'); }
});

// ── Bookmarks ──────────────────────────────────────────────────────
router.get('/bookmarks', studentOnly, async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT p.last_page, p.updated_at, d.*, u.name as student_name
       FROM reading_progress p
       JOIN digital_content d ON p.content_id = d.id
       LEFT JOIN users u ON d.student_id = u.id
       WHERE p.student_id = $1
       ORDER BY p.updated_at DESC`, [req.session.user_id]);
    res.render('student_bookmarks', { title: 'My Bookmarks - librika.in', bookmarks: rows.rows });
  } catch (err) { console.error(err); res.redirect('/student'); }
});

// ── API Toggle Bookmark ───────────────────────────────────────────
router.post('/api/toggle-bookmark', studentOnly, async (req, res) => {
  const contentId = req.body.content_id;
  if (!contentId) return res.status(400).json({ status: 'error', message: 'Missing content_id' });
  try {
    const exists = (await pool.query('SELECT id FROM reading_progress WHERE student_id = $1 AND content_id = $2', [req.session.user_id, contentId])).rows[0];
    if (exists) {
      await pool.query('DELETE FROM reading_progress WHERE id = $1', [exists.id]);
      return res.json({ status: 'success', bookmarked: false });
    } else {
      await pool.query('INSERT INTO reading_progress (student_id, content_id, last_page, updated_at) VALUES ($1,$2,$3,$4)',
        [req.session.user_id, contentId, 1, nowStr()]);
      return res.json({ status: 'success', bookmarked: true });
    }
  } catch (err) { console.error(err); res.status(500).json({ status: 'error', message: err.message }); }
});

// ── Publish ────────────────────────────────────────────────────────
router.get('/publish', studentOnly, async (req, res) => {
  const draftId = req.query.draft_id;
  let draft = null;
  if (draftId) {
    draft = (await pool.query('SELECT * FROM digital_content WHERE id = $1 AND student_id = $2', [draftId, req.session.user_id])).rows[0];
  }
  res.render('student_publish', { title: 'Publish Content - librika.in', draft });
});

router.post('/publish', studentOnly, upload.fields([{ name: 'cover' }, { name: 'document' }]), async (req, res) => {
  const sCode = req.session.school_code;
  const userId = req.session.user_id;
  const { title, category, description, subject, class: cls, tags, draft_id } = req.body;
  const coverFile = req.files && req.files['cover'] ? req.files['cover'][0] : null;
  const docFile = req.files && req.files['document'] ? req.files['document'][0] : null;

  let coverUrl = '';
  let fileUrl = '';
  const fs = require('fs');

  try {
    if (coverFile) {
      const ext = path.extname(coverFile.originalname);
      const coverName = `c_${userId}_${Date.now()}${ext}`;
      fs.renameSync(coverFile.path, path.join(__dirname, '..', 'static', 'uploads', coverName));
      coverUrl = '/uploads/' + coverName;
    }
    if (docFile) {
      const ext = path.extname(docFile.originalname);
      const docName = `d_${userId}_${Date.now()}${ext}`;
      if (!fs.existsSync(DIGITAL_CONTENT_DIR)) fs.mkdirSync(DIGITAL_CONTENT_DIR, { recursive: true });
      fs.renameSync(docFile.path, path.join(DIGITAL_CONTENT_DIR, docName));
      fileUrl = '/digital_content/' + docName;

      // Extract PDF cover if no cover uploaded
      if (!coverUrl && ext.toLowerCase() === '.pdf') {
        try {
          // Simple fallback - just use a placeholder
          coverUrl = '';
        } catch(pdfErr) {}
      }
    }

    if (draft_id) {
      const old = (await pool.query('SELECT cover_url, file_url FROM digital_content WHERE id = $1 AND student_id = $2', [draft_id, userId])).rows[0];
      if (old) {
        if (!coverUrl) coverUrl = old.cover_url || '';
        if (!fileUrl) fileUrl = old.file_url || '';
      }
      await pool.query(
        'UPDATE digital_content SET title=$1, category=$2, description=$3, subject=$4, class=$5, tags=$6, cover_url=$7, file_url=$8 WHERE id=$9 AND student_id=$10',
        [title, category, description, subject, cls || null, tags || null, coverUrl, fileUrl, draft_id, userId]);
    } else {
      await pool.query(
        `INSERT INTO digital_content (title, category, description, subject, class, tags, cover_url, file_url, student_id, school_code, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
        [title, category, description, subject, cls || null, tags || null, coverUrl, fileUrl, userId, sCode, 'Draft', nowStr()]);
    }

    if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({ status: 'success', draft_id: draft_id || 'new', redirect: '/student/my-publications' });
    }
    req.flash('success', 'Content published!');
    res.redirect('/student/my-publications');
  } catch (err) {
    console.error('Publish error:', err);
    if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(500).json({ status: 'error', message: err.message });
    }
    req.flash('error', 'Failed to publish content');
    res.redirect('/student/publish');
  }
});

// ── API Finalize Publication ──────────────────────────────────────
router.post('/api/publish-finalize/:pubId', studentOnly, async (req, res) => {
  const { pubId } = req.params;
  try {
    await pool.query("UPDATE digital_content SET status = 'Submitted' WHERE id = $1 AND student_id = $2", [pubId, req.session.user_id]);
    res.json({ status: 'success' });
  } catch (err) { console.error(err); res.status(500).json({ status: 'error', message: err.message }); }
});

// ── My Publications ──────────────────────────────────────────────
router.get('/my-publications', studentOnly, async (req, res) => {
  try {
    const pubs = await pool.query(
      `SELECT d.*, (SELECT COUNT(*) FROM reading_progress rp WHERE rp.content_id = d.id) as bookmarks_count
       FROM digital_content d
       WHERE d.student_id = $1 AND d.school_code = $2
       ORDER BY d.id DESC`, [req.session.user_id, req.session.school_code]);
    res.render('student_my_publications', { title: 'My Publications - librika.in', publications: pubs.rows });
  } catch (err) { console.error(err); res.redirect('/student'); }
});

// ── Quiz ───────────────────────────────────────────────────────────
router.get('/quiz/:book_type/:bookId', studentOnly, async (req, res) => {
  const userId = req.session.user_id;
  const sCode = req.session.school_code;
  const { book_type, bookId } = req.params;
  try {
    const attempt = (await pool.query('SELECT * FROM quiz_attempts WHERE user_id = $1 AND book_id = $2 AND book_type = $3', [userId, bookId, book_type])).rows[0];
    if (attempt) {
      req.flash('error', 'You have already attempted this quiz.');
      return res.redirect('/student');
    }

    let book = null;
    if (book_type === 'physical') {
      book = (await pool.query('SELECT * FROM books WHERE id = $1 AND school_code = $2', [bookId, sCode])).rows[0];
    } else {
      book = (await pool.query('SELECT * FROM digital_content WHERE id = $1 AND school_code = $2', [bookId, sCode])).rows[0];
    }
    if (!book) { req.flash('error', 'Book not found'); return res.redirect('/student'); }

    // Check eligibility
    let eligible = false, message = '';
    if (book_type === 'physical') {
      const tx = (await pool.query("SELECT * FROM transactions WHERE user_id = $1 AND book_id = $2 AND return_date IS NOT NULL AND return_date != 'LOST' ORDER BY return_date DESC LIMIT 1", [userId, bookId])).rows[0];
      if (!tx) {
        message = 'Quiz is locked. Return this book first.';
      } else {
        const result = isTransactionEligibleForQuiz(tx, book);
        eligible = result.eligible; message = result.message;
      }
    } else {
      const progress = (await pool.query('SELECT * FROM reading_progress WHERE student_id = $1 AND content_id = $2', [userId, bookId])).rows[0];
      if (!progress) {
        message = 'Quiz is locked. Start reading this book first.';
      } else {
        const totalP = parseInt(progress.total_pages) || 1;
        const lastP = parseInt(progress.last_page) || 1;
        const pct = (lastP / totalP) * 100;
        if (pct < 80) {
          message = `Quiz is locked. Read at least 80% (currently ${Math.round(pct)}%).`;
        } else {
          const result = isDigitalEligibleForQuiz(progress);
          eligible = result.eligible; message = result.message;
        }
      }
    }

    if (!eligible) return res.render('quiz_locked', { title: 'Quiz Locked - librika.in', book, book_type, message });

    // Get or generate quiz
    let quiz = (await pool.query('SELECT * FROM book_quizzes WHERE book_id = $1 AND book_type = $2', [bookId, book_type])).rows[0];
    if (!quiz) {
      const defaultQs = JSON.stringify([
        { question: `Who is the author of '${book.title}'?`, options: [book.author || 'Unknown', 'Unknown', 'Another Author', 'Editor'], correct_index: 0 },
        { question: `What is the main subject of '${book.title}'?`, options: ['Fiction', 'Non-Fiction / Educational', 'Biography', 'Poetry'], correct_index: 1 },
        { question: `Which best describes the message of '${book.title}'?`, options: ['Exploring knowledge and learning', 'Unrelated topics', 'Pure entertainment', 'History of publishing'], correct_index: 0 },
        { question: `What can a reader learn from '${book.title}'?`, options: ['Valuable skills and insights', 'How to draw', 'Foreign languages', 'Nothing specific'], correct_index: 0 },
        { question: `Would you recommend '${book.title}' to other students?`, options: ['Yes, it is highly educational', 'No, it is boring', 'Maybe', 'Only for teachers'], correct_index: 0 }
      ]);
      await pool.query('INSERT INTO book_quizzes (book_id, book_type, questions, created_at) VALUES ($1,$2,$3,$4)',
        [bookId, book_type, defaultQs, nowStr()]);
      quiz = (await pool.query('SELECT * FROM book_quizzes WHERE book_id = $1 AND book_type = $2', [bookId, book_type])).rows[0];
    }

    let questions = [];
    try { questions = JSON.parse(quiz.questions); } catch(e) { questions = []; }

    if (req.method === 'POST') {
      // Already handled below via separate POST route
    }

    res.render('take_quiz', { title: 'Quiz - ' + book.title, book, book_type, questions });
  } catch (err) { console.error(err); res.redirect('/student'); }
});

router.post('/quiz/:book_type/:bookId', studentOnly, async (req, res) => {
  const userId = req.session.user_id;
  const sCode = req.session.school_code;
  const { book_type, bookId } = req.params;
  try {
    let book = book_type === 'physical'
      ? (await pool.query('SELECT * FROM books WHERE id = $1 AND school_code = $2', [bookId, sCode])).rows[0]
      : (await pool.query('SELECT * FROM digital_content WHERE id = $1 AND school_code = $2', [bookId, sCode])).rows[0];
    if (!book) { req.flash('error', 'Book not found'); return res.redirect('/student'); }

    const quiz = (await pool.query('SELECT * FROM book_quizzes WHERE book_id = $1 AND book_type = $2', [bookId, book_type])).rows[0];
    if (!quiz) { req.flash('error', 'Quiz not found'); return res.redirect('/student'); }

    let questions = [];
    try { questions = JSON.parse(quiz.questions); } catch(e) { questions = []; }

    let correctCount = 0;
    for (let idx = 0; idx < questions.length; idx++) {
      const selected = req.body['q' + idx];
      if (selected !== undefined && parseInt(selected) === questions[idx].correct_index) correctCount++;
    }

    const totalQuestions = questions.length;
    const scorePct = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const passed = scorePct >= 70 ? 1 : 0;

    await pool.query('INSERT INTO quiz_attempts (user_id, book_id, book_type, score, passed, attempted_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [userId, bookId, book_type, scorePct, passed, nowStr()]);

    let pointsAwarded = 0;
    const cooldownApplies = await check90DayCooldown(pool, userId, bookId, book_type);
    if (passed && !cooldownApplies) {
      pointsAwarded = 50;
      await updateScore(pool, userId, book_type, 50, `Passed quiz for '${book.title}' (${Math.round(scorePct)}% score)`);
    }

    res.render('quiz_result', {
      title: 'Quiz Result - librika.in',
      book, book_type,
      score: scorePct, passed,
      correct: correctCount, total: totalQuestions,
      points: pointsAwarded, cooldown: cooldownApplies,
    });
  } catch (err) { console.error(err); res.redirect('/student'); }
});

// ── Review ─────────────────────────────────────────────────────────
router.get('/review/:book_type/:bookId', studentOnly, async (req, res) => {
  const userId = req.session.user_id;
  const sCode = req.session.school_code;
  const { book_type, bookId } = req.params;
  try {
    const reviewed = (await pool.query('SELECT * FROM book_reviews WHERE user_id = $1 AND book_id = $2 AND book_type = $3', [userId, bookId, book_type])).rows[0];
    if (reviewed) { req.flash('error', 'You have already submitted a review.'); return res.redirect('/student'); }

    let book = book_type === 'physical'
      ? (await pool.query('SELECT * FROM books WHERE id = $1 AND school_code = $2', [bookId, sCode])).rows[0]
      : (await pool.query('SELECT * FROM digital_content WHERE id = $1 AND school_code = $2', [bookId, sCode])).rows[0];
    if (!book) { req.flash('error', 'Book not found'); return res.redirect('/student'); }

    let eligible = false;
    if (book_type === 'physical') {
      const tx = (await pool.query("SELECT * FROM transactions WHERE user_id = $1 AND book_id = $2 AND return_date IS NOT NULL AND return_date != 'LOST' ORDER BY return_date DESC LIMIT 1", [userId, bookId])).rows[0];
      if (tx) eligible = true;
    } else {
      const progress = (await pool.query('SELECT * FROM reading_progress WHERE student_id = $1 AND content_id = $2 AND last_page >= total_pages AND total_pages > 1', [userId, bookId])).rows[0];
      if (progress) eligible = true;
    }

    if (!eligible) { req.flash('error', 'Complete or return this book before reviewing.'); return res.redirect('/student'); }

    res.render('submit_review', { title: 'Submit Review - librika.in', book, book_type });
  } catch (err) { console.error(err); res.redirect('/student'); }
});

router.post('/review/:book_type/:bookId', studentOnly, async (req, res) => {
  const userId = req.session.user_id;
  const sCode = req.session.school_code;
  const { book_type, bookId } = req.params;
  const { learned, favorite, recommend } = req.body;
  if (!learned || !favorite || !recommend) {
    req.flash('error', 'All review fields are required.');
    return res.redirect(`/student/review/${book_type}/${bookId}`);
  }
  try {
    await pool.query(
      'INSERT INTO book_reviews (user_id, book_id, book_type, learned, favorite, recommend, status, created_at, school_code) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [userId, bookId, book_type, learned, favorite, recommend, 'pending', nowStr(), sCode]);
    req.flash('success', 'Your review has been submitted for approval!');
    res.redirect('/student');
  } catch (err) { console.error(err); req.flash('error', 'Failed to submit review'); res.redirect('/student'); }
});

module.exports = router;
