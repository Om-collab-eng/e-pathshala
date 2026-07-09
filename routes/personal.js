const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Parser } = require('json2csv');
const csv = require('csv-parser');
const fs = require('fs-extra');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const upload = multer({ dest: path.join(__dirname, '..', 'static', 'uploads') });

function ownerOnly(req, res, next) {
  if (req.session && req.session.user_id && req.session.role === 'personal') return next();
  req.flash('error', 'Unauthorized. Personal Owner login required.');
  return res.redirect('/login');
}

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function renderDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

function renderDt(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toISOString().slice(0, 19).replace('T', ' ');
}

async function ensureActiveLibrary(req) {
  if (!req.session.active_library_id) {
    const result = await pool.query('SELECT id FROM personal_libraries WHERE owner_id = $1 ORDER BY id ASC LIMIT 1', [req.session.user_id]);
    if (result.rows.length > 0) {
      req.session.active_library_id = result.rows[0].id;
    } else {
      const ins = await pool.query("INSERT INTO personal_libraries (owner_id, library_name, plan_name, created_at) VALUES ($1, 'My Private Library', 'FREE', $2) RETURNING id",
        [req.session.user_id, nowStr()]);
      req.session.active_library_id = ins.rows[0].id;
    }
  }
}

function getPlanLimit(planName) {
  const p = (planName || 'FREE').toUpperCase();
  if (p === 'BASIC') return 100;
  if (p === 'PRO' || p === 'PROFESSIONAL') return 1000;
  return 2;
}

async function checkBookLimit(conn, ownerId) {
  const libRes = await conn.query('SELECT plan_name FROM personal_libraries WHERE owner_id = $1', [ownerId]);
  const plan = libRes.rows.length > 0 ? libRes.rows[0].plan_name : 'FREE';
  let limit = 500;
  if (plan === 'BASIC') limit = 5000;
  else if (plan === 'PRO') limit = 99999999;
  const cnt = (await conn.query('SELECT COUNT(*) as c FROM personal_books WHERE owner_id = $1', [ownerId])).rows[0].c;
  return parseInt(cnt) < limit;
}

async function logActivity(conn, ownerId, action) {
  await conn.query('INSERT INTO personal_activity_logs (owner_id, action, created_at) VALUES ($1, $2, $3)',
    [ownerId, action, nowStr()]);
}

// ── Root Redirect ──────────────────────────────────────────────────
router.get('/', ownerOnly, (req, res) => {
  res.redirect('/personal/dashboard');
});

// ── Dashboard ────────────────────────────────────────────────────────
router.get('/dashboard', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  try {
    const libRes = await pool.query('SELECT * FROM personal_libraries WHERE owner_id = $1', [ownerId]);
    let lib = libRes.rows[0];
    if (!lib) {
      const ins = await pool.query("INSERT INTO personal_libraries (owner_id, library_name, plan_name, subscription_status, created_at) VALUES ($1, $2, 'FREE', 'active', $3) RETURNING *",
        [ownerId, `${req.session.user_name}'s Library`, nowStr()]);
      lib = ins.rows[0];
    }

    const totalBooks = (await pool.query("SELECT COUNT(*) as c FROM personal_books WHERE owner_id = $1 AND status != 'Archived'", [ownerId])).rows[0].c;
    const booksRead = (await pool.query("SELECT COUNT(*) as c FROM personal_reading_tracker WHERE owner_id = $1 AND reading_status = 'Completed'", [ownerId])).rows[0].c;
    const booksReading = (await pool.query("SELECT COUNT(*) as c FROM personal_reading_tracker WHERE owner_id = $1 AND reading_status = 'Reading'", [ownerId])).rows[0].c;
    const wishlistCount = (await pool.query('SELECT COUNT(*) as c FROM personal_wishlist WHERE owner_id = $1', [ownerId])).rows[0].c;

    const today = renderDate(new Date());
    const overdueLoans = (await pool.query(
      `SELECT pb.*, bk.title FROM personal_borrowings pb JOIN personal_books bk ON pb.book_id = bk.id WHERE pb.owner_id = $1 AND pb.status = 'Issued' AND pb.expected_return_date < $2`,
      [ownerId, today])).rows;

    const favs = (await pool.query('SELECT * FROM personal_favorites WHERE owner_id = $1 ORDER BY id DESC', [ownerId])).rows;

    const currentMonth = nowStr().slice(0, 7);
    const readThisMonth = (await pool.query(
      "SELECT COUNT(*) as c FROM personal_reading_tracker WHERE owner_id = $1 AND reading_status = 'Completed' AND SUBSTRING(finish_date, 1, 7) = $2",
      [ownerId, currentMonth])).rows[0].c;

    const pagesRead = (await pool.query('SELECT COALESCE(SUM(current_page), 0) as s FROM personal_reading_tracker WHERE owner_id = $1', [ownerId])).rows[0].s;

    const totalTracked = (await pool.query('SELECT COUNT(*) as c FROM personal_reading_tracker WHERE owner_id = $1', [ownerId])).rows[0].c;
    const completionRate = totalTracked > 0 ? Math.round((parseInt(booksRead) / parseInt(totalTracked)) * 100) : 0;

    const actLogs = (await pool.query('SELECT * FROM personal_activity_logs WHERE owner_id = $1 ORDER BY id DESC LIMIT 10', [ownerId])).rows;

    const logDates = (await pool.query(
      'SELECT DISTINCT SUBSTRING(created_at, 1, 10) as log_date FROM personal_activity_logs WHERE owner_id = $1 ORDER BY log_date DESC LIMIT 30',
      [ownerId])).rows;

    let streak = 0;
    if (logDates.length > 0) {
      const dates = logDates.map(r => new Date(r.log_date));
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const yesterdayDate = new Date(todayDate);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);

      const first = dates[0];
      if (first.getTime() === todayDate.getTime() || first.getTime() === yesterdayDate.getTime()) {
        streak = 1;
        for (let i = 0; i < dates.length - 1; i++) {
          const diff = Math.round((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
          if (diff === 1) streak++;
          else if (diff === 0) continue;
          else break;
        }
      }
    }

    res.render('personal_dashboard', {
      title: 'Personal Library Dashboard',
      lib,
      total_books: parseInt(totalBooks),
      books_read: parseInt(booksRead),
      books_reading: parseInt(booksReading),
      wishlist_count: parseInt(wishlistCount),
      overdue_loans: overdueLoans,
      favorites: favs,
      read_this_month: parseInt(readThisMonth),
      pages_read: parseInt(pagesRead),
      completion_rate: completionRate,
      activity_logs: actLogs,
      streak,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/');
  }
});

// ── Books List ───────────────────────────────────────────────────────
router.get('/books', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  try {
    const activeId = req.session.active_library_id;
    const libRes = await pool.query('SELECT * FROM personal_libraries WHERE id = $1', [activeId]);
    const lib = libRes.rows[0];
    let isShared = false;
    if (lib) {
      if (lib.owner_id !== ownerId) {
        const share = await pool.query('SELECT id FROM personal_library_shares WHERE library_id = $1 AND shared_with_user_id = $2', [activeId, ownerId]);
        if (share.rows.length === 0) {
          delete req.session.active_library_id;
          return res.redirect('/personal/dashboard');
        }
        isShared = true;
      }
    } else {
      return res.redirect('/personal/dashboard');
    }

    const booksRes = await pool.query(
      `SELECT pb.*, (SELECT 1 FROM personal_favorites pf WHERE pf.owner_id = $1 AND pf.item_type = 'book' AND pf.item_value = CAST(pb.id AS TEXT)) as is_fav
       FROM personal_books pb WHERE pb.library_id = $2 ORDER BY pb.id DESC`,
      [ownerId, activeId]);

    res.render('personal_books', { title: 'My Books', lib, books: booksRes.rows, is_shared: isShared });
  } catch (err) {
    console.error('Books list error:', err);
    req.flash('error', 'Failed to load books');
    res.redirect('/personal/dashboard');
  }
});

// ── Books Add ────────────────────────────────────────────────────────
router.get('/books/add', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  try {
    const activeId = req.session.active_library_id;
    const libRes = await pool.query('SELECT * FROM personal_libraries WHERE id = $1', [activeId]);
    const lib = libRes.rows[0];
    if (!lib || lib.owner_id !== ownerId) {
      req.flash('error', 'Unauthorized: Shared collections are read-only.');
      return res.redirect('/personal/books');
    }

    const mockBook = req.query.title ? {
      title: req.query.title || '',
      author: req.query.author || '',
      category: req.query.category || '',
      publisher: req.query.publisher || '',
      isbn: req.query.isbn || '',
      language: req.query.language || 'English',
      description: req.query.description || '',
      cover_image_url: req.query.cover_image_url || '',
      quantity: 1,
      book_condition: 'Good',
      purchase_date: renderDate(new Date()),
    } : null;

    res.render('personal_book_form', { title: 'Add New Book', lib, book: mockBook });
  } catch (err) {
    console.error('Book add form error:', err);
    req.flash('error', 'Failed to load form');
    res.redirect('/personal/books');
  }
});

router.post('/books/add', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  try {
    const activeId = req.session.active_library_id;
    const libRes = await pool.query('SELECT * FROM personal_libraries WHERE id = $1', [activeId]);
    const lib = libRes.rows[0];
    if (!lib || lib.owner_id !== ownerId) {
      req.flash('error', 'Unauthorized: Shared collections are read-only.');
      return res.redirect('/personal/books');
    }

    const canAdd = await checkBookLimit(pool, ownerId);
    if (!canAdd) {
      req.flash('error', `Upgrade your plan! You have reached the limit of books allowed on the ${lib.plan_name} plan.`);
      return res.redirect('/personal/books');
    }

    const { title, author, category, publisher, isbn, language, description, cover_image_url, quantity, book_condition, purchase_date } = req.body;

    await pool.query(
      `INSERT INTO personal_books (owner_id, library_id, title, author, category, publisher, isbn, language, description, cover_image_url, quantity, book_condition, purchase_date, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Available', $14)`,
      [ownerId, activeId, title, author, category, publisher, isbn, language, description, cover_image_url, parseInt(quantity), book_condition, purchase_date, nowStr()]);

    await logActivity(pool, ownerId, `Added book: '${title}'`);
    req.flash('success', 'Book added to collection successfully!');
    res.redirect('/personal/books');
  } catch (err) {
    console.error('Book add error:', err);
    req.flash('error', 'Failed to add book');
    res.redirect('/personal/books');
  }
});

// ── Books Edit ──────────────────────────────────────────────────────
router.get('/books/edit/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const bookId = parseInt(req.params.id);
  try {
    const bookRes = await pool.query('SELECT * FROM personal_books WHERE id = $1 AND owner_id = $2', [bookId, ownerId]);
    if (bookRes.rows.length === 0) {
      req.flash('error', 'Book not found.');
      return res.redirect('/personal/books');
    }
    const book = bookRes.rows[0];
    const libRes = await pool.query('SELECT * FROM personal_libraries WHERE id = $1', [book.library_id]);
    const lib = libRes.rows[0];
    if (!lib || lib.owner_id !== ownerId) {
      req.flash('error', 'Unauthorized: Shared collections are read-only.');
      return res.redirect('/personal/books');
    }
    res.render('personal_book_form', { title: 'Edit Book', lib, book });
  } catch (err) {
    console.error('Book edit form error:', err);
    req.flash('error', 'Failed to load form');
    res.redirect('/personal/books');
  }
});

router.post('/books/edit/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const bookId = parseInt(req.params.id);
  try {
    const { title, author, category, publisher, isbn, language, description, cover_image_url, quantity, book_condition, purchase_date } = req.body;
    await pool.query(
      `UPDATE personal_books SET title = $1, author = $2, category = $3, publisher = $4, isbn = $5, language = $6, description = $7, cover_image_url = $8, quantity = $9, book_condition = $10, purchase_date = $11
       WHERE id = $12 AND owner_id = $13`,
      [title, author, category, publisher, isbn, language, description, cover_image_url, parseInt(quantity), book_condition, purchase_date, bookId, ownerId]);
    await logActivity(pool, ownerId, `Edited book: '${title}'`);
    req.flash('success', 'Book updated successfully!');
    res.redirect('/personal/books');
  } catch (err) {
    console.error('Book edit error:', err);
    req.flash('error', 'Failed to update book');
    res.redirect(`/personal/books/edit/${bookId}`);
  }
});

// ── Books Delete ────────────────────────────────────────────────────
router.post('/books/delete/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const bookId = parseInt(req.params.id);
  try {
    const book = (await pool.query('SELECT title FROM personal_books WHERE id = $1 AND owner_id = $2', [bookId, ownerId])).rows[0];
    if (book) {
      await pool.query('DELETE FROM personal_books WHERE id = $1 AND owner_id = $2', [bookId, ownerId]);
      await logActivity(pool, ownerId, `Deleted book: '${book.title}'`);
      req.flash('success', 'Book removed from collection.');
    }
    res.redirect('/personal/books');
  } catch (err) {
    console.error('Book delete error:', err);
    req.flash('error', 'Failed to delete book');
    res.redirect('/personal/books');
  }
});

// ── Books Archive ───────────────────────────────────────────────────
router.post('/books/archive/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const bookId = parseInt(req.params.id);
  try {
    const book = (await pool.query('SELECT title FROM personal_books WHERE id = $1 AND owner_id = $2', [bookId, ownerId])).rows[0];
    if (book) {
      await pool.query("UPDATE personal_books SET status = 'Archived' WHERE id = $1 AND owner_id = $2", [bookId, ownerId]);
      await logActivity(pool, ownerId, `Archived book: '${book.title}'`);
      req.flash('success', 'Book archived.');
    }
    res.redirect('/personal/books');
  } catch (err) {
    console.error('Book archive error:', err);
    req.flash('error', 'Failed to archive book');
    res.redirect('/personal/books');
  }
});

// ── Books Restore ──────────────────────────────────────────────────
router.post('/books/restore/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const bookId = parseInt(req.params.id);
  try {
    const book = (await pool.query('SELECT title FROM personal_books WHERE id = $1 AND owner_id = $2', [bookId, ownerId])).rows[0];
    if (book) {
      await pool.query("UPDATE personal_books SET status = 'Available' WHERE id = $1 AND owner_id = $2", [bookId, ownerId]);
      await logActivity(pool, ownerId, `Restored book: '${book.title}'`);
      req.flash('success', 'Book restored to catalog.');
    }
    res.redirect('/personal/books');
  } catch (err) {
    console.error('Book restore error:', err);
    req.flash('error', 'Failed to restore book');
    res.redirect('/personal/books');
  }
});

// ── Reading Tracker List ───────────────────────────────────────────
router.get('/reading', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  try {
    const lib = (await pool.query('SELECT * FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0];

    const tracked = (await pool.query(
      `SELECT pr.*, pb.title, pb.author, pb.cover_image_url
       FROM personal_reading_tracker pr
       JOIN personal_books pb ON pr.book_id = pb.id
       WHERE pr.owner_id = $1
       ORDER BY pr.updated_at DESC`,
      [ownerId])).rows;

    const avail = (await pool.query(
      `SELECT id, title, author FROM personal_books
       WHERE owner_id = $1 AND status != 'Archived' AND id NOT IN (
         SELECT book_id FROM personal_reading_tracker WHERE owner_id = $2
       ) ORDER BY title ASC`,
      [ownerId, ownerId])).rows;

    res.render('personal_reading', { title: 'Reading Tracker', lib, tracked_books: tracked, available_books: avail });
  } catch (err) {
    console.error('Reading list error:', err);
    req.flash('error', 'Failed to load reading tracker');
    res.redirect('/personal/dashboard');
  }
});

// ── Reading Add ─────────────────────────────────────────────────────
router.post('/reading/add', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const bookId = parseInt(req.body.book_id);
  const totalPages = parseInt(req.body.total_pages || 0);
  const startDate = req.body.start_date;

  try {
    const book = (await pool.query('SELECT title FROM personal_books WHERE id = $1 AND owner_id = $2', [bookId, ownerId])).rows[0];
    if (book) {
      await pool.query(
        `INSERT INTO personal_reading_tracker (owner_id, book_id, start_date, total_pages, reading_status, updated_at)
         VALUES ($1, $2, $3, $4, 'Reading', $5)`,
        [ownerId, bookId, startDate, totalPages, nowStr()]);
      await logActivity(pool, ownerId, `Started reading: '${book.title}'`);
      req.flash('success', `Started tracking progress for: '${book.title}'!`);
    }
    res.redirect('/personal/reading');
  } catch (err) {
    console.error('Reading add error:', err);
    req.flash('error', 'Failed to start tracking');
    res.redirect('/personal/reading');
  }
});

// ── Reading Update ──────────────────────────────────────────────────
router.post('/reading/update', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const trackId = parseInt(req.body.track_id);
  let currentPage = parseInt(req.body.current_page || 0);
  let totalPages = parseInt(req.body.total_pages || 1);
  let readingStatus = req.body.reading_status;
  const startDate = req.body.start_date;
  let finishDate = req.body.finish_date;

  if (currentPage >= totalPages) {
    readingStatus = 'Completed';
    if (!finishDate) finishDate = renderDate(new Date());
  }

  try {
    const track = (await pool.query(
      `SELECT pr.book_id, pb.title FROM personal_reading_tracker pr
       JOIN personal_books pb ON pr.book_id = pb.id
       WHERE pr.id = $1 AND pr.owner_id = $2`,
      [trackId, ownerId])).rows[0];

    if (track) {
      await pool.query(
        `UPDATE personal_reading_tracker SET current_page = $1, total_pages = $2, reading_status = $3, start_date = $4, finish_date = $5, updated_at = $6
         WHERE id = $7 AND owner_id = $8`,
        [currentPage, totalPages, readingStatus, startDate, finishDate, nowStr(), trackId, ownerId]);

      let logMsg = `Updated reading progress for '${track.title}' (page ${currentPage}/${totalPages})`;
      if (readingStatus === 'Completed') logMsg = `Finished reading: '${track.title}'!`;
      await logActivity(pool, ownerId, logMsg);
      req.flash('success', `Progress updated for: '${track.title}'!`);
    }
    res.redirect('/personal/reading');
  } catch (err) {
    console.error('Reading update error:', err);
    req.flash('error', 'Failed to update progress');
    res.redirect('/personal/reading');
  }
});

// ── Borrowing List ─────────────────────────────────────────────────
router.get('/borrowing', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  try {
    const lib = (await pool.query('SELECT * FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0];

    const today = renderDate(new Date());
    await pool.query(
      "UPDATE personal_borrowings SET status = 'Overdue' WHERE owner_id = $1 AND status = 'Issued' AND expected_return_date < $2",
      [ownerId, today]);

    const activeLoans = (await pool.query(
      `SELECT pb.*, bk.title FROM personal_borrowings pb
       JOIN personal_books bk ON pb.book_id = bk.id
       WHERE pb.owner_id = $1 AND pb.status IN ('Issued', 'Overdue')
       ORDER BY pb.expected_return_date ASC`,
      [ownerId])).rows;

    const returnedLoans = (await pool.query(
      `SELECT pb.*, bk.title FROM personal_borrowings pb
       JOIN personal_books bk ON pb.book_id = bk.id
       WHERE pb.owner_id = $1 AND pb.status = 'Returned'
       ORDER BY pb.actual_return_date DESC`,
      [ownerId])).rows;

    const availBooks = (await pool.query(
      "SELECT id, title FROM personal_books WHERE owner_id = $1 AND status = 'Available' ORDER BY title ASC",
      [ownerId])).rows;

    res.render('personal_borrowing', {
      title: 'Lending System', lib, active_loans: activeLoans,
      returned_loans: returnedLoans, available_books: availBooks,
    });
  } catch (err) {
    console.error('Borrowing list error:', err);
    req.flash('error', 'Failed to load lending system');
    res.redirect('/personal/dashboard');
  }
});

// ── Borrowing Lend ──────────────────────────────────────────────────
router.post('/borrowing/lend', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const bookId = parseInt(req.body.book_id);
  const borrowerName = req.body.borrower_name;
  const phoneNumber = req.body.phone_number;
  const expectedReturnDate = req.body.expected_return_date;

  try {
    const book = (await pool.query("SELECT title, status FROM personal_books WHERE id = $1 AND owner_id = $2", [bookId, ownerId])).rows[0];
    if (book && book.status === 'Available') {
      await pool.query(
        `INSERT INTO personal_borrowings (owner_id, book_id, borrower_name, phone_number, issue_date, expected_return_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Issued')`,
        [ownerId, bookId, borrowerName, phoneNumber, renderDate(new Date()), expectedReturnDate]);
      await pool.query("UPDATE personal_books SET status = 'Lent' WHERE id = $1 AND owner_id = $2", [bookId, ownerId]);
      await logActivity(pool, ownerId, `Lent book '${book.title}' to ${borrowerName}`);
      req.flash('success', `Book '${book.title}' successfully lent to ${borrowerName}!`);
    } else {
      req.flash('error', 'Error: Book is not available for lending.');
    }
    res.redirect('/personal/borrowing');
  } catch (err) {
    console.error('Lend error:', err);
    req.flash('error', 'Failed to lend book');
    res.redirect('/personal/borrowing');
  }
});

// ── Borrowing Return ────────────────────────────────────────────────
router.post('/borrowing/return/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const loanId = parseInt(req.params.id);

  try {
    const loan = (await pool.query('SELECT book_id, borrower_name FROM personal_borrowings WHERE id = $1 AND owner_id = $2', [loanId, ownerId])).rows[0];
    if (loan) {
      const book = (await pool.query('SELECT title FROM personal_books WHERE id = $1 AND owner_id = $2', [loan.book_id, ownerId])).rows[0];
      await pool.query("UPDATE personal_borrowings SET status = 'Returned', actual_return_date = $1 WHERE id = $2 AND owner_id = $3",
        [renderDate(new Date()), loanId, ownerId]);
      await pool.query("UPDATE personal_books SET status = 'Available' WHERE id = $1 AND owner_id = $2", [loan.book_id, ownerId]);
      await logActivity(pool, ownerId, `Friend ${loan.borrower_name} returned book: '${book.title}'`);
      req.flash('success', `Book '${book.title}' has been marked as returned.`);
    }
    res.redirect('/personal/borrowing');
  } catch (err) {
    console.error('Return error:', err);
    req.flash('error', 'Failed to process return');
    res.redirect('/personal/borrowing');
  }
});

// ── Wishlist List ──────────────────────────────────────────────────
router.get('/wishlist', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  try {
    const lib = (await pool.query('SELECT * FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0];
    const items = (await pool.query('SELECT * FROM personal_wishlist WHERE owner_id = $1 ORDER BY id DESC', [ownerId])).rows;
    res.render('personal_wishlist', { title: 'My Wishlist', lib, wishlist: items });
  } catch (err) {
    console.error('Wishlist error:', err);
    req.flash('error', 'Failed to load wishlist');
    res.redirect('/personal/dashboard');
  }
});

// ── Wishlist Add ───────────────────────────────────────────────────
router.post('/wishlist/add', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const { title, author, priority, purchase_link, notes } = req.body;
  const price = req.body.price ? parseFloat(req.body.price) : null;

  try {
    await pool.query(
      'INSERT INTO personal_wishlist (owner_id, title, author, priority, price, purchase_link, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [ownerId, title, author, priority, price, purchase_link, notes, nowStr()]);
    await logActivity(pool, ownerId, `Added to wishlist: '${title}'`);
    req.flash('success', `Book '${title}' added to your wishlist!`);
    res.redirect('/personal/wishlist');
  } catch (err) {
    console.error('Wishlist add error:', err);
    req.flash('error', 'Failed to add to wishlist');
    res.redirect('/personal/wishlist');
  }
});

// ── Wishlist Delete ────────────────────────────────────────────────
router.post('/wishlist/delete/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const itemId = parseInt(req.params.id);
  try {
    const item = (await pool.query('SELECT title FROM personal_wishlist WHERE id = $1 AND owner_id = $2', [itemId, ownerId])).rows[0];
    if (item) {
      await pool.query('DELETE FROM personal_wishlist WHERE id = $1 AND owner_id = $2', [itemId, ownerId]);
      await logActivity(pool, ownerId, `Removed from wishlist: '${item.title}'`);
      req.flash('success', 'Item removed from wishlist.');
    }
    res.redirect('/personal/wishlist');
  } catch (err) {
    console.error('Wishlist delete error:', err);
    req.flash('error', 'Failed to remove item');
    res.redirect('/personal/wishlist');
  }
});

// ── Wishlist Buy ──────────────────────────────────────────────────
router.post('/wishlist/buy/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const itemId = parseInt(req.params.id);
  try {
    const item = (await pool.query('SELECT * FROM personal_wishlist WHERE id = $1 AND owner_id = $2', [itemId, ownerId])).rows[0];
    if (item) {
      await pool.query('DELETE FROM personal_wishlist WHERE id = $1 AND owner_id = $2', [itemId, ownerId]);
      req.flash('success', `Book '${item.title}' marked as purchased! Let's catalog it in your library.`);
      return res.redirect(`/personal/books/add?title=${encodeURIComponent(item.title)}&author=${encodeURIComponent(item.author || '')}`);
    }
    res.redirect('/personal/wishlist');
  } catch (err) {
    console.error('Wishlist buy error:', err);
    req.flash('error', 'Failed to process purchase');
    res.redirect('/personal/wishlist');
  }
});

// ── Favorites List ─────────────────────────────────────────────────
router.get('/favorites', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  try {
    const lib = (await pool.query('SELECT * FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0];

    const favBooks = (await pool.query(
      `SELECT pf.id as fav_id, pb.title, pb.author FROM personal_favorites pf
       JOIN personal_books pb ON pf.item_value = CAST(pb.id AS TEXT)
       WHERE pf.owner_id = $1 AND pf.item_type = 'book' ORDER BY pf.id DESC`,
      [ownerId])).rows;

    const favAuthors = (await pool.query("SELECT * FROM personal_favorites WHERE owner_id = $1 AND item_type = 'author' ORDER BY id DESC", [ownerId])).rows;
    const favCategories = (await pool.query("SELECT * FROM personal_favorites WHERE owner_id = $1 AND item_type = 'category' ORDER BY id DESC", [ownerId])).rows;

    res.render('personal_favorites', { title: 'Favorites', lib, fav_books: favBooks, fav_authors: favAuthors, fav_categories: favCategories });
  } catch (err) {
    console.error('Favorites error:', err);
    req.flash('error', 'Failed to load favorites');
    res.redirect('/personal/dashboard');
  }
});

// ── Favorites Add ──────────────────────────────────────────────────
router.post('/favorites/add', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const itemType = req.body.item_type;
  const itemValue = (req.body.item_value || '').trim();

  if (!itemValue) return res.redirect('/personal/favorites');

  try {
    const exists = (await pool.query('SELECT id FROM personal_favorites WHERE owner_id = $1 AND item_type = $2 AND item_value = $3',
      [ownerId, itemType, itemValue])).rows[0];
    if (!exists) {
      await pool.query('INSERT INTO personal_favorites (owner_id, item_type, item_value, created_at) VALUES ($1, $2, $3, $4)',
        [ownerId, itemType, itemValue, nowStr()]);
      await logActivity(pool, ownerId, `Added favorite ${itemType}: '${itemValue}'`);
      req.flash('success', `Added to favorite ${itemType}s!`);
    } else {
      req.flash('info', `This ${itemType} is already in your favorites.`);
    }
    res.redirect('/personal/favorites');
  } catch (err) {
    console.error('Favorites add error:', err);
    req.flash('error', 'Failed to add favorite');
    res.redirect('/personal/favorites');
  }
});

// ── Favorites Toggle ───────────────────────────────────────────────
router.post('/favorites/toggle', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const itemType = req.body.item_type;
  const itemValue = req.body.item_value;

  try {
    const existing = (await pool.query('SELECT id FROM personal_favorites WHERE owner_id = $1 AND item_type = $2 AND item_value = $3',
      [ownerId, itemType, itemValue])).rows[0];

    if (existing) {
      await pool.query('DELETE FROM personal_favorites WHERE id = $1', [existing.id]);
      req.flash('success', 'Removed from favorites.');
    } else {
      await pool.query('INSERT INTO personal_favorites (owner_id, item_type, item_value, created_at) VALUES ($1, $2, $3, $4)',
        [ownerId, itemType, itemValue, nowStr()]);
      const book = (await pool.query('SELECT title FROM personal_books WHERE id = $1', [parseInt(itemValue)])).rows[0];
      const bTitle = book ? book.title : `Book #${itemValue}`;
      await logActivity(pool, ownerId, `Starred book: '${bTitle}'`);
      req.flash('success', 'Added to favorites!');
    }
    res.redirect(req.get('Referrer') || '/personal/books');
  } catch (err) {
    console.error('Favorites toggle error:', err);
    req.flash('error', 'Failed to toggle favorite');
    res.redirect('/personal/books');
  }
});

// ── Favorites Delete ───────────────────────────────────────────────
router.post('/favorites/delete/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const favId = parseInt(req.params.id);
  try {
    const fav = (await pool.query('SELECT * FROM personal_favorites WHERE id = $1 AND owner_id = $2', [favId, ownerId])).rows[0];
    if (fav) {
      await pool.query('DELETE FROM personal_favorites WHERE id = $1 AND owner_id = $2', [favId, ownerId]);
      let val = fav.item_value;
      if (fav.item_type === 'book') {
        const book = (await pool.query('SELECT title FROM personal_books WHERE id = $1', [parseInt(val)])).rows[0];
        val = book ? book.title : `Book #${val}`;
      }
      await logActivity(pool, ownerId, `Removed favorite ${fav.item_type}: '${val}'`);
      req.flash('success', 'Removed from favorites.');
    }
    res.redirect('/personal/favorites');
  } catch (err) {
    console.error('Favorites delete error:', err);
    req.flash('error', 'Failed to remove favorite');
    res.redirect('/personal/favorites');
  }
});

// ── Libraries List ─────────────────────────────────────────────────
router.get('/libraries', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  try {
    const lib = (await pool.query('SELECT * FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0];
    const plan = lib ? lib.plan_name : 'FREE';
    const maxLibraries = getPlanLimit(plan);

    const myLibs = (await pool.query(
      `SELECT pl.*, COUNT(pb.id) as book_count FROM personal_libraries pl
       LEFT JOIN personal_books pb ON pl.id = pb.library_id
       WHERE pl.owner_id = $1 GROUP BY pl.id ORDER BY pl.id ASC`,
      [ownerId])).rows;

    const sharedLibs = (await pool.query(
      `SELECT pl.*, COUNT(pb.id) as book_count, u.name as owner_name FROM personal_libraries pl
       JOIN personal_library_shares pls ON pl.id = pls.library_id
       JOIN users u ON pl.owner_id = u.id
       LEFT JOIN personal_books pb ON pl.id = pb.library_id
       WHERE pls.shared_with_user_id = $1 GROUP BY pl.id ORDER BY pl.id ASC`,
      [ownerId])).rows;

    const sharedOut = (await pool.query(
      `SELECT pls.id as share_id, pl.library_name, u.name as friend_name FROM personal_library_shares pls
       JOIN personal_libraries pl ON pls.library_id = pl.id
       JOIN users u ON pls.shared_with_user_id = u.id
       WHERE pl.owner_id = $1 ORDER BY pls.id DESC`,
      [ownerId])).rows;

    res.render('personal_libraries', {
      title: 'Manage Collections', lib, my_libraries: myLibs,
      shared_libraries: sharedLibs, shared_out_records: sharedOut, max_libraries: maxLibraries,
    });
  } catch (err) {
    console.error('Libraries error:', err);
    req.flash('error', 'Failed to load collections');
    res.redirect('/personal/dashboard');
  }
});

// ── Libraries Create ──────────────────────────────────────────────
router.post('/libraries/create', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const libraryName = (req.body.library_name || '').trim();
  if (!libraryName) {
    req.flash('error', 'Library name cannot be empty.');
    return res.redirect('/personal/libraries');
  }

  try {
    const lib = (await pool.query('SELECT plan_name FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0];
    const plan = lib ? lib.plan_name : 'FREE';
    const maxLibs = getPlanLimit(plan);
    const cnt = (await pool.query('SELECT COUNT(*) as c FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0].c;
    if (parseInt(cnt) >= maxLibs) {
      req.flash('error', 'Collection limit reached! Upgrading plan allows more libraries.');
      return res.redirect('/personal/libraries');
    }

    await pool.query('INSERT INTO personal_libraries (owner_id, library_name, plan_name, created_at) VALUES ($1, $2, $3, $4)',
      [ownerId, libraryName, plan, nowStr()]);
    await logActivity(pool, ownerId, `Created collection '${libraryName}'`);
    req.flash('success', 'New collection created successfully!');
    res.redirect('/personal/libraries');
  } catch (err) {
    console.error('Create library error:', err);
    req.flash('error', 'Failed to create collection');
    res.redirect('/personal/libraries');
  }
});

// ── Libraries Rename ──────────────────────────────────────────────
router.post('/libraries/rename/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const libId = parseInt(req.params.id);
  const libraryName = (req.body.library_name || '').trim();
  if (!libraryName) {
    req.flash('error', 'Collection name cannot be empty.');
    return res.redirect('/personal/libraries');
  }

  try {
    const lib = (await pool.query('SELECT library_name FROM personal_libraries WHERE id = $1 AND owner_id = $2', [libId, ownerId])).rows[0];
    if (!lib) {
      req.flash('error', 'Collection not found or unauthorized.');
      return res.redirect('/personal/libraries');
    }
    const oldName = lib.library_name;
    await pool.query('UPDATE personal_libraries SET library_name = $1 WHERE id = $2', [libraryName, libId]);
    await logActivity(pool, ownerId, `Renamed collection '${oldName}' to '${libraryName}'`);
    req.flash('success', 'Collection renamed successfully!');
    res.redirect('/personal/libraries');
  } catch (err) {
    console.error('Rename library error:', err);
    req.flash('error', 'Failed to rename collection');
    res.redirect('/personal/libraries');
  }
});

// ── Libraries Delete ──────────────────────────────────────────────
router.post('/libraries/delete/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const libId = parseInt(req.params.id);

  try {
    const lib = (await pool.query('SELECT * FROM personal_libraries WHERE id = $1 AND owner_id = $2', [libId, ownerId])).rows[0];
    if (!lib) {
      req.flash('error', 'Collection not found or unauthorized.');
      return res.redirect('/personal/libraries');
    }

    const cnt = (await pool.query('SELECT COUNT(*) as c FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0].c;
    if (parseInt(cnt) <= 1) {
      req.flash('error', 'You cannot delete your only collection.');
      return res.redirect('/personal/libraries');
    }

    await pool.query('DELETE FROM personal_libraries WHERE id = $1', [libId]);
    await pool.query('DELETE FROM personal_books WHERE library_id = $1', [libId]);
    await pool.query('DELETE FROM personal_library_shares WHERE library_id = $1', [libId]);

    if (req.session.active_library_id === libId) {
      const first = (await pool.query('SELECT id FROM personal_libraries WHERE owner_id = $1 ORDER BY id ASC LIMIT 1', [ownerId])).rows[0];
      req.session.active_library_id = first ? first.id : undefined;
    }

    await logActivity(pool, ownerId, `Deleted collection '${lib.library_name}'`);
    req.flash('success', 'Collection deleted successfully.');
    res.redirect('/personal/libraries');
  } catch (err) {
    console.error('Delete library error:', err);
    req.flash('error', 'Failed to delete collection');
    res.redirect('/personal/libraries');
  }
});

// ── Libraries Switch ──────────────────────────────────────────────
router.get('/libraries/switch/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const libId = parseInt(req.params.id);

  try {
    const lib = (await pool.query('SELECT owner_id FROM personal_libraries WHERE id = $1', [libId])).rows[0];
    if (!lib) {
      req.flash('error', 'Collection not found.');
      return res.redirect('/personal/libraries');
    }
    if (lib.owner_id !== ownerId) {
      const share = (await pool.query('SELECT id FROM personal_library_shares WHERE library_id = $1 AND shared_with_user_id = $2', [libId, ownerId])).rows[0];
      if (!share) {
        req.flash('error', 'Unauthorized view access to collection.');
        return res.redirect('/personal/libraries');
      }
    }
    req.session.active_library_id = libId;
    req.flash('success', 'Switched active collection view.');
    res.redirect('/personal/dashboard');
  } catch (err) {
    console.error('Switch library error:', err);
    req.flash('error', 'Failed to switch collection');
    res.redirect('/personal/libraries');
  }
});

// ── Libraries Share ───────────────────────────────────────────────
router.post('/libraries/share', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const libId = req.body.library_id;
  const shareIdentity = (req.body.share_identity || '').trim();

  if (!libId || !shareIdentity) {
    req.flash('error', 'Missing collection or friend info.');
    return res.redirect('/personal/libraries');
  }

  try {
    const lib = (await pool.query('SELECT plan_name, library_name FROM personal_libraries WHERE id = $1 AND owner_id = $2', [libId, ownerId])).rows[0];
    if (!lib) {
      req.flash('error', 'Collection not found or unauthorized.');
      return res.redirect('/personal/libraries');
    }
    if (lib.plan_name === 'FREE') {
      req.flash('error', 'Sharing is blocked on the Free Plan. Upgrade to share.');
      return res.redirect('/personal/libraries');
    }

    const friend = (await pool.query("SELECT id, name FROM users WHERE role = 'owner' AND (phone = $1 OR email = $1)", [shareIdentity])).rows[0];
    if (!friend) {
      req.flash('error', "Friend not found. Ensure they registered for a Personal Library.");
      return res.redirect('/personal/libraries');
    }
    if (friend.id === ownerId) {
      req.flash('error', 'You cannot share a collection with yourself.');
      return res.redirect('/personal/libraries');
    }

    const exists = (await pool.query('SELECT id FROM personal_library_shares WHERE library_id = $1 AND shared_with_user_id = $2', [libId, friend.id])).rows[0];
    if (exists) {
      req.flash('error', 'Already shared with this user.');
      return res.redirect('/personal/libraries');
    }

    await pool.query("INSERT INTO personal_library_shares (library_id, shared_with_user_id, permission_level, created_at) VALUES ($1, $2, 'view', $3)",
      [libId, friend.id, nowStr()]);
    await logActivity(pool, ownerId, `Shared collection '${lib.library_name}' with ${friend.name}`);
    req.flash('success', `Successfully shared collection with ${friend.name}!`);
    res.redirect('/personal/libraries');
  } catch (err) {
    console.error('Share library error:', err);
    req.flash('error', 'Failed to share collection');
    res.redirect('/personal/libraries');
  }
});

// ── Libraries Revoke ──────────────────────────────────────────────
router.post('/libraries/revoke/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const shareId = parseInt(req.params.id);

  try {
    const share = (await pool.query(
      `SELECT pls.*, pl.library_name, u.name as friend_name FROM personal_library_shares pls
       JOIN personal_libraries pl ON pls.library_id = pl.id
       JOIN users u ON pls.shared_with_user_id = u.id
       WHERE pls.id = $1 AND pl.owner_id = $2`,
      [shareId, ownerId])).rows[0];

    if (!share) {
      req.flash('error', 'Share record not found or unauthorized.');
      return res.redirect('/personal/libraries');
    }

    await pool.query('DELETE FROM personal_library_shares WHERE id = $1', [shareId]);
    await logActivity(pool, ownerId, `Revoked share of collection '${share.library_name}' with ${share.friend_name}`);
    req.flash('success', 'Share revoked successfully.');
    res.redirect('/personal/libraries');
  } catch (err) {
    console.error('Revoke share error:', err);
    req.flash('error', 'Failed to revoke share');
    res.redirect('/personal/libraries');
  }
});

// ── Scan ────────────────────────────────────────────────────────────
router.get('/scan', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  try {
    const lib = (await pool.query('SELECT * FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0];
    const plan = lib ? lib.plan_name : 'FREE';
    if (plan === 'FREE') {
      req.flash('error', 'AI Cover Scanner is not available on the Free Plan. Please upgrade to Basic or Pro.');
      return res.redirect('/personal/dashboard');
    }
    res.render('personal_scanner', { title: 'AI Cover Scanner', lib });
  } catch (err) {
    console.error('Scan error:', err);
    req.flash('error', 'Failed to load scanner');
    res.redirect('/personal/dashboard');
  }
});

// ── Settings View ──────────────────────────────────────────────────
router.get('/settings', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  try {
    const lib = (await pool.query('SELECT * FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0];
    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [ownerId])).rows[0];
    res.render('personal_settings', { title: 'Settings & Subscription', lib, user });
  } catch (err) {
    console.error('Settings error:', err);
    req.flash('error', 'Failed to load settings');
    res.redirect('/personal/dashboard');
  }
});

// ── Settings Update ────────────────────────────────────────────────
router.post('/settings/update', upload.single('profile_photo'), ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const libraryName = (req.body.library_name || '').trim();
  const name = (req.body.owner_name || '').trim();
  const email = (req.body.email || '').trim();
  const phone = (req.body.phone || '').trim();
  const password = (req.body.password || '').trim();

  try {
    const lib = (await pool.query('SELECT * FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0];

    let photoUrl = lib ? lib.profile_photo : null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'librika/profile_photos',
        resource_type: 'image',
      });
      photoUrl = result.secure_url;
      fs.removeSync(req.file.path);
    }

    if (lib) {
      await pool.query('UPDATE personal_libraries SET library_name = $1, profile_photo = COALESCE($2, profile_photo) WHERE owner_id = $3',
        [libraryName, photoUrl, ownerId]);
    }

    if (password) {
      const bcrypt = require('bcryptjs');
      const hashedPw = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET name = $1, email = $2, phone = $3, password = $4 WHERE id = $5',
        [name, email, phone, hashedPw, ownerId]);
    } else {
      await pool.query('UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4',
        [name, email, phone, ownerId]);
    }

    req.session.user_name = name;
    await logActivity(pool, ownerId, 'Updated profile settings');
    req.flash('success', 'Profile settings saved successfully!');
    res.redirect('/personal/settings');
  } catch (err) {
    console.error('Settings update error:', err);
    req.flash('error', 'Failed to update settings');
    res.redirect('/personal/settings');
  }
});

// ── Settings Update Plan ──────────────────────────────────────────
router.post('/settings/update_plan', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const planName = (req.body.plan_name || 'FREE').toUpperCase();

  try {
    await pool.query('UPDATE personal_libraries SET plan_name = $1 WHERE owner_id = $2', [planName, ownerId]);
    await logActivity(pool, ownerId, `Changed plan to ${planName}`);
    req.flash('success', `Plan updated to ${planName}!`);
    res.redirect('/personal/settings');
  } catch (err) {
    console.error('Plan update error:', err);
    req.flash('error', 'Failed to update plan');
    res.redirect('/personal/settings');
  }
});

// ── Export CSV ────────────────────────────────────────────────────
router.get('/export/:module', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const mod = req.params.module;

  const moduleMap = {
    books: { table: 'personal_books', columns: ['id', 'title', 'author', 'category', 'publisher', 'isbn', 'language', 'description', 'cover_image_url', 'quantity', 'book_condition', 'purchase_date', 'status', 'created_at'] },
    reading: { table: 'personal_reading_tracker', columns: ['id', 'book_id', 'start_date', 'finish_date', 'current_page', 'total_pages', 'reading_status', 'updated_at'] },
    borrowing: { table: 'personal_borrowings', columns: ['id', 'book_id', 'borrower_name', 'phone_number', 'issue_date', 'expected_return_date', 'actual_return_date', 'status'] },
    wishlist: { table: 'personal_wishlist', columns: ['id', 'title', 'author', 'priority', 'price', 'purchase_link', 'notes', 'created_at'] },
  };

  const cfg = moduleMap[mod];
  if (!cfg) {
    req.flash('error', 'Invalid export module.');
    return res.redirect('/personal/settings');
  }

  try {
    const data = (await pool.query(`SELECT ${cfg.columns.join(', ')} FROM ${cfg.table} WHERE owner_id = $1 ORDER BY id DESC`, [ownerId])).rows;
    const parser = new Parser({ fields: cfg.columns });
    const csv = parser.parse(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${mod}_export.csv`);
    res.send(csv);
  } catch (err) {
    console.error('Export error:', err);
    req.flash('error', 'Failed to export data');
    res.redirect('/personal/settings');
  }
});

// ── Import CSV ────────────────────────────────────────────────────
router.post('/import/:module', upload.single('csv_file'), ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const mod = req.params.module;

  if (!req.file) {
    req.flash('error', 'Please upload a CSV file.');
    return res.redirect('/personal/settings');
  }

  const importMap = {
    books: { table: 'personal_books', columns: ['title', 'author', 'category', 'publisher', 'isbn', 'language', 'description', 'cover_image_url', 'quantity', 'book_condition', 'purchase_date'] },
    reading: { table: 'personal_reading_tracker', columns: ['book_id', 'start_date', 'finish_date', 'current_page', 'total_pages', 'reading_status'] },
    wishlist: { table: 'personal_wishlist', columns: ['title', 'author', 'priority', 'price', 'purchase_link', 'notes'] },
  };

  const cfg = importMap[mod];
  if (!cfg) {
    req.flash('error', 'Invalid import module.');
    return res.redirect('/personal/settings');
  }

  const lib = (await pool.query('SELECT * FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0];
  const activeId = lib ? (req.session.active_library_id || lib.id) : null;

  if (!activeId && mod === 'books') {
    req.flash('error', 'No active library found.');
    return res.redirect('/personal/settings');
  }

  try {
    const results = [];
    await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    let importedCount = 0;
    const placeholders = cfg.columns.map((_, i) => `$${i + 1}`).join(', ');
    const extraCols = mod === 'books' ? ', owner_id, library_id, status, created_at' : ', owner_id, created_at';
    const extraVals = mod === 'books' ? [ownerId, activeId, 'Available', nowStr()] : [ownerId, nowStr()];
    const colList = cfg.columns.join(', ') + (mod === 'books' ? ', owner_id, library_id, status, created_at' : ', owner_id, created_at');

    for (const row of results) {
      const vals = cfg.columns.map(c => row[c] || null);
      if (mod === 'books' && !vals[0]) continue; // title required
      if (mod === 'books' && vals[vals.length - 1] !== undefined) {
        try {
          await pool.query(`INSERT INTO ${cfg.table} (${colList}) VALUES (${placeholders}${mod === 'books' ? ', $' + (cfg.columns.length + 1) + ', $' + (cfg.columns.length + 2) + ', $' + (cfg.columns.length + 3) + ', $' + (cfg.columns.length + 4) : ', $' + (cfg.columns.length + 1) + ', $' + (cfg.columns.length + 2)})`,
            [...vals, ...extraVals]);
          importedCount++;
        } catch (e) {
          console.error('Import row error:', e.message);
        }
      }
    }

    fs.removeSync(req.file.path);
    await logActivity(pool, ownerId, `Imported ${importedCount} records from ${mod} CSV`);
    req.flash('success', `Successfully imported ${importedCount} records!`);
    res.redirect('/personal/settings');
  } catch (err) {
    console.error('Import error:', err);
    req.flash('error', 'Failed to import CSV. Check file format.');
    res.redirect('/personal/settings');
  }
});

// ── E-Library Browse ──────────────────────────────────────────────
router.get('/elibrary', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  const query = (req.query.q || '').trim();

  try {
    const lib = (await pool.query('SELECT * FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0];
    const plan = lib ? lib.plan_name : 'FREE';

    let sql = "SELECT d.* FROM digital_content d WHERE d.school_code = 'PERSONAL' AND d.status = 'Published'";
    const params = [];
    if (query) {
      sql += " AND (d.title ILIKE $" + (params.length + 1) + " OR d.description ILIKE $" + (params.length + 1) + " OR d.subject ILIKE $" + (params.length + 1) + " OR d.category ILIKE $" + (params.length + 1) + " OR d.tags ILIKE $" + (params.length + 1) + ")";
      params.push(`%${query}%`);
    }
    sql += ' ORDER BY d.featured DESC, d.created_at DESC';
    const books = (await pool.query(sql, params)).rows;

    let myPubs = [];
    if (plan === 'PRO') {
      myPubs = (await pool.query("SELECT * FROM digital_content WHERE student_id = $1 AND school_code = 'PERSONAL' ORDER BY id DESC", [ownerId])).rows;
    }

    res.render('personal_elibrary', { title: 'E-Library Browser', lib, books, my_publications: myPubs, query });
  } catch (err) {
    console.error('E-Library error:', err);
    req.flash('error', 'Failed to load E-Library');
    res.redirect('/personal/dashboard');
  }
});

// ── E-Library Publish ─────────────────────────────────────────────
router.get('/elibrary/publish', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  try {
    const lib = (await pool.query('SELECT * FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0];
    if (!lib || lib.plan_name !== 'PRO') {
      req.flash('error', 'E-Library publishing requires the Pro plan.');
      return res.redirect('/personal/elibrary');
    }
    res.render('personal_elibrary_publish', { title: 'Publish Digital Book', lib });
  } catch (err) {
    console.error('Publish form error:', err);
    req.flash('error', 'Failed to load publish form');
    res.redirect('/personal/elibrary');
  }
});

router.post('/elibrary/publish', upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'document', maxCount: 1 }]), ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  await ensureActiveLibrary(req);
  try {
    const lib = (await pool.query('SELECT * FROM personal_libraries WHERE owner_id = $1', [ownerId])).rows[0];
    if (!lib || lib.plan_name !== 'PRO') {
      req.flash('error', 'E-Library publishing requires the Pro plan.');
      return res.redirect('/personal/elibrary');
    }

    const { title, subject, category, tags, description } = req.body;
    if (!title || !subject || !category) {
      req.flash('error', 'Title, Author, and Category are required.');
      return res.redirect('/personal/elibrary/publish');
    }

    const docFile = req.files && req.files['document'] ? req.files['document'][0] : null;
    const coverFile = req.files && req.files['cover'] ? req.files['cover'][0] : null;

    if (!docFile) {
      req.flash('error', 'Document (PDF) file is required.');
      return res.redirect('/personal/elibrary/publish');
    }

    let coverUrl = '';
    let fileUrl = '';

    const DIGITAL_CONTENT_DIR = path.join(__dirname, '..', 'static', 'digital_content');
    const UPLOADS_DIR = path.join(__dirname, '..', 'static', 'uploads');
    fs.ensureDirSync(DIGITAL_CONTENT_DIR);
    fs.ensureDirSync(UPLOADS_DIR);

    if (coverFile) {
      const ext = path.extname(coverFile.originalname);
      const coverName = `c_pers_${Date.now()}_${path.basename(coverFile.filename)}${ext}`;
      const coverPath = path.join(UPLOADS_DIR, coverName);
      fs.moveSync(coverFile.path, coverPath, { overwrite: true });
      coverUrl = `/static/uploads/${coverName}`;
    }

    if (docFile) {
      const ext = path.extname(docFile.originalname);
      const docName = `d_pers_${Date.now()}_${path.basename(docFile.filename)}${ext}`;
      const docPath = path.join(DIGITAL_CONTENT_DIR, docName);
      fs.moveSync(docFile.path, docPath, { overwrite: true });
      fileUrl = `/static/digital_content/${docName}`;

      if (!coverUrl && docFile.originalname.toLowerCase().endsWith('.pdf')) {
        try {
          const sharp = require('sharp');
          const pdf2pic = require('pdf2pic');
          // fallback: use a default cover image
          coverUrl = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&q=80';
        } catch (e) {
          coverUrl = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&q=80';
        }
      }
    }

    const result = await pool.query(
      `INSERT INTO digital_content (title, category, description, subject, tags, cover_url, file_url, student_id, school_code, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PERSONAL', 'Published', $9) RETURNING id`,
      [title, category, description, subject, tags, coverUrl, fileUrl, ownerId, nowStr()]);

    await logActivity(pool, ownerId, `Published digital book '${title}' to E-Library`);
    req.flash('success', 'Book published to E-Library successfully!');
    res.redirect('/personal/elibrary');
  } catch (err) {
    console.error('Publish error:', err);
    req.flash('error', 'Failed to publish book');
    res.redirect('/personal/elibrary/publish');
  }
});

// ── E-Library Delete ─────────────────────────────────────────────
router.post('/elibrary/delete/:id', ownerOnly, async (req, res) => {
  const ownerId = req.session.user_id;
  const contentId = parseInt(req.params.id);

  try {
    const pub = (await pool.query("SELECT title FROM digital_content WHERE id = $1 AND student_id = $2 AND school_code = 'PERSONAL'", [contentId, ownerId])).rows[0];
    if (pub) {
      await pool.query('DELETE FROM digital_content WHERE id = $1', [contentId]);
      await logActivity(pool, ownerId, `Deleted publication '${pub.title}' from E-Library`);
      req.flash('success', 'Publication deleted.');
    }
    res.redirect('/personal/elibrary');
  } catch (err) {
    console.error('E-Library delete error:', err);
    req.flash('error', 'Failed to delete publication');
    res.redirect('/personal/elibrary');
  }
});

module.exports = router;
