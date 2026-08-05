const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');
const aiService = require('../services/aiService');

const multer = require('multer');

const upload = multer({ dest: path.join(__dirname, '..', 'static', 'uploads') });

const pool = { query: (text, params) => db.query(text, params) };

function loggedIn(req, res, next) {
  if (req.session && req.session.user_id) return next();
  return res.redirect('/login');
}

function notFound(req, res) {
  res.status(404).render('error', { title: 'Not Found', message: 'Page not found' });
}

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function renderDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
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
  if (bookType === 'digital') {
    const pastComplete = (await conn.query(
      'SELECT completed_at FROM reading_progress WHERE student_id = $1 AND content_id = $2 AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 1',
      [userId, bookId])).rows[0];
    if (pastComplete && pastComplete.completed_at > cooldown) return true;
  }
  return false;
}

function getDateLimit(timeframe) {
  const now = new Date();
  if (timeframe === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().slice(0, 19).replace('T', ' ');
  }
  if (timeframe === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return first.toISOString().slice(0, 19).replace('T', ' ');
  }
  if (timeframe === 'year') {
    const first = new Date(now.getFullYear(), 0, 1);
    return first.toISOString().slice(0, 19).replace('T', ' ');
  }
  return null;
}

async function getRankings(schoolCode, typeFilter, timeframe, dateLimit, classFilter, sectionFilter) {
  let query, params;
  if (timeframe === 'all') {
    let scoreCol = 'overall_reader_score';
    if (typeFilter === 'physical') scoreCol = 'physical_reader_score';
    else if (typeFilter === 'digital') scoreCol = 'digital_reader_score';
    query = `SELECT u.id, u.name, u.class, u.section, u.badges, u.${scoreCol} as score FROM users u WHERE u.role = 'student' AND u.school_code = $1`;
    params = [schoolCode];
  } else {
    let scoreFilter = '';
    if (typeFilter === 'physical') scoreFilter = "AND p.score_type = 'physical'";
    else if (typeFilter === 'digital') scoreFilter = "AND p.score_type = 'digital'";
    query = `SELECT u.id, u.name, u.class, u.section, u.badges, COALESCE(SUM(p.points), 0) as score FROM users u LEFT JOIN points_log p ON u.id = p.user_id AND p.created_at >= $1 ${scoreFilter} WHERE u.role = 'student' AND u.school_code = $2`;
    params = [dateLimit, schoolCode];
  }
  let idx = params.length + 1;
  if (classFilter) {
    query += ` AND u.class = $${idx++}`;
    params.push(classFilter);
  }
  if (sectionFilter) {
    query += ` AND u.section = $${idx++}`;
    params.push(sectionFilter);
  }
  if (timeframe !== 'all') {
    query += ' GROUP BY u.id';
  }
  query += ' ORDER BY score DESC, u.name ASC';
  const result = await pool.query(query, params);
  const rankings = [];
  for (let i = 0; i < result.rows.length; i++) {
    const d = result.rows[i];
    let badges = [];
    try { badges = JSON.parse(d.badges || '[]'); } catch(e) {}
    const physC = (await pool.query("SELECT COUNT(*) as c FROM transactions WHERE user_id = $1 AND return_date IS NOT NULL AND return_date != 'LOST'", [d.id])).rows[0].c;
    const digC = (await pool.query('SELECT COUNT(*) as c FROM reading_progress WHERE student_id = $1 AND last_page >= total_pages AND total_pages > 1', [d.id])).rows[0].c;
    const totalAttempts = (await pool.query('SELECT COUNT(*) as c FROM quiz_attempts WHERE user_id = $1', [d.id])).rows[0].c;
    const passedAttempts = (await pool.query('SELECT COUNT(*) as c FROM quiz_attempts WHERE user_id = $1 AND passed = 1', [d.id])).rows[0].c;
    rankings.push({
      id: d.id,
      name: d.name,
      class: d.class,
      section: d.section,
      badges,
      score: parseInt(d.score) || 0,
      rank: i + 1,
      books_completed: parseInt(physC) + parseInt(digC),
      quiz_success_rate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
    });
  }
  return rankings;
}

// ── Browse Digital Library ──────────────────────────────────────────────
router.get('/', loggedIn, async (req, res) => {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate');
  const userId = req.session.user_id;
  const searchQuery = (req.query.q || '').trim();
  const aiSearch = req.query.ai === 'true';

  try {
    let queryStr = `SELECT d.*, u.name as student_name, u.class as student_class, (SELECT 1 FROM reading_progress rp WHERE rp.student_id = $1 AND rp.content_id = d.id) as is_bookmarked FROM digital_content d LEFT JOIN users u ON d.student_id = u.id WHERE d.school_code = 'GLOBAL' AND d.status = 'Published'`;
    const params = [userId];
    let paramIdx = 2;

    if (searchQuery && !aiSearch) {
      queryStr += ` AND (d.title ILIKE $${paramIdx} OR d.description ILIKE $${paramIdx} OR d.subject ILIKE $${paramIdx} OR d.category ILIKE $${paramIdx})`;
      params.push(`%${searchQuery}%`);
      paramIdx++;
    }

    queryStr += ' ORDER BY d.featured DESC, d.created_at DESC';
    const result = await pool.query(queryStr, params);
    let contentList = result.rows;

    contentList.forEach(item => {
      item.student_name = item.student_name || 'Manager';
      item.student_class = item.student_class || 'System';
    });

    if (aiSearch && searchQuery) {
      try {
        const aiRes = await performAISemanticSearch(searchQuery, contentList);
        if (aiRes && aiRes.length > 0) contentList = aiRes;
      } catch(e) {
        console.error('AI search error:', e);
      }
    }

    const contributors = (await pool.query("SELECT COUNT(DISTINCT student_id) as c FROM digital_content WHERE school_code = 'GLOBAL' AND status = 'Published'")).rows[0].c;
    const totalResources = contentList.length;

    res.render('digital_library', {
      title: 'Global Community Library - librika.in',
      content_list: contentList,
      contributors_count: contributors,
      total_resources: totalResources,
      search_query: searchQuery,
      ai_search: aiSearch,
    });
  } catch (err) {
    console.error('Digital library browse error:', err);
    req.flash('error', 'Failed to load digital library');
    res.redirect('/student');
  }
});

// ── View Content Detail ─────────────────────────────────────────────────
router.get('/content/:id', loggedIn, async (req, res) => {
  const contentId = parseInt(req.params.id);
  const userId = req.session.user_id;

  try {
    await pool.query('UPDATE digital_content SET views = views + 1 WHERE id = $1', [contentId]);

    const contentResult = await pool.query(
      `SELECT d.*, u.name as student_name, u.class as student_class, s.name as school_name FROM digital_content d LEFT JOIN users u ON d.student_id = u.id LEFT JOIN schools s ON d.school_code = s.school_code WHERE d.id = $1`,
      [contentId]
    );
    if (contentResult.rows.length === 0) return notFound(req, res);
    const content = contentResult.rows[0];

    if (content.school_code === 'GLOBAL' || content.student_id === -1) {
      content.student_name = 'Manager';
      content.student_class = 'System';
      content.school_name = 'Global Library Network';
    }

    const reviews = (await pool.query(
      `SELECT r.*, u.name as reviewer_name FROM content_reviews r JOIN users u ON r.student_id = u.id WHERE r.content_id = $1 ORDER BY r.created_at DESC`,
      [contentId]
    )).rows;

    const chapters = (await pool.query(
      'SELECT * FROM digital_chapters WHERE book_id = $1 ORDER BY chapter_num ASC',
      [contentId]
    )).rows;

    for (const ch of chapters) {
      const prog = (await pool.query(
        'SELECT progress, finished FROM chapter_reading_progress WHERE user_id = $1 AND chapter_id = $2',
        [userId, ch.id]
      )).rows[0];
      ch.progress = prog ? parseFloat(prog.progress) : 0;
      ch.finished = prog ? prog.finished : 0;

      const quiz = (await pool.query(
        'SELECT score, passed FROM chapter_quiz_attempts WHERE user_id = $1 AND chapter_id = $2 ORDER BY attempted_at DESC LIMIT 1',
        [userId, ch.id]
      )).rows[0];
      ch.quiz_score = quiz ? parseFloat(quiz.score) : null;
      ch.quiz_passed = quiz ? quiz.passed : 0;
    }

    res.render('content_view', { title: `${content.title} - librika.in`, content, reviews, chapters });
  } catch (err) {
    console.error('Content view error:', err);
    req.flash('error', 'Failed to load content');
    res.redirect('/digital-library');
  }
});

// ── PDF Reader (standalone) ─────────────────────────────────────────────
router.get('/read/:id', loggedIn, async (req, res) => {
  const contentId = parseInt(req.params.id);
  const userId = req.session.user_id;

  try {
    const result = await pool.query('SELECT * FROM digital_content WHERE id = $1', [contentId]);
    if (result.rows.length === 0) return notFound(req, res);
    const content = result.rows[0];

    if (content.file_url && !content.file_url.toLowerCase().endsWith('.pdf')) {
      return res.redirect(`/digital-library/content/${contentId}`);
    }

    const prog = (await pool.query(
      'SELECT last_page FROM reading_progress WHERE student_id = $1 AND content_id = $2',
      [userId, contentId]
    )).rows[0];
    const startPage = prog ? parseInt(prog.last_page) : 1;

    res.render('reader', { content, start_page: startPage });
  } catch (err) {
    console.error('Reader error:', err);
    req.flash('error', 'Failed to load reader');
    res.redirect('/digital-library');
  }
});

// ── Chapter Reader ──────────────────────────────────────────────────────
router.get('/chapter/:chapterId', loggedIn, async (req, res) => {
  const chapterId = parseInt(req.params.chapterId);
  const userId = req.session.user_id;

  try {
    const chResult = await pool.query('SELECT * FROM digital_chapters WHERE id = $1', [chapterId]);
    if (chResult.rows.length === 0) return notFound(req, res);
    const chapter = chResult.rows[0];

    const bookResult = await pool.query('SELECT * FROM digital_content WHERE id = $1', [chapter.book_id]);
    if (bookResult.rows.length === 0) return notFound(req, res);
    const book = bookResult.rows[0];

    const prevCh = (await pool.query(
      'SELECT id, title FROM digital_chapters WHERE book_id = $1 AND chapter_num < $2 ORDER BY chapter_num DESC LIMIT 1',
      [chapter.book_id, chapter.chapter_num]
    )).rows[0] || null;

    const nextCh = (await pool.query(
      'SELECT id, title FROM digital_chapters WHERE book_id = $1 AND chapter_num > $2 ORDER BY chapter_num ASC LIMIT 1',
      [chapter.book_id, chapter.chapter_num]
    )).rows[0] || null;

    const prog = (await pool.query(
      'SELECT * FROM chapter_reading_progress WHERE user_id = $1 AND chapter_id = $2',
      [userId, chapterId]
    )).rows[0];

    if (!prog) {
      const now = nowStr();
      await pool.query(
        'INSERT INTO chapter_reading_progress (user_id, chapter_id, progress, finished, last_read) VALUES ($1, $2, 10.0, 0, $3)',
        [userId, chapterId, now]
      );
      chapter.current_progress = 10.0;
      chapter.finished = 0;
    } else {
      chapter.current_progress = parseFloat(prog.progress);
      chapter.finished = prog.finished;
    }

    try { chapter.notes = JSON.parse(chapter.notes || '[]'); } catch(e) { chapter.notes = []; }
    try { chapter.vocabulary = JSON.parse(chapter.vocabulary || '[]'); } catch(e) { chapter.vocabulary = []; }
    try { chapter.qna = JSON.parse(chapter.qna || '[]'); } catch(e) { chapter.qna = []; }

    res.render('chapter_reader', { title: `Reading: ${chapter.title} - librika.in`, chapter, book, prev_ch: prevCh, next_ch: nextCh });
  } catch (err) {
    console.error('Chapter reader error:', err);
    req.flash('error', 'Failed to load chapter');
    res.redirect('/digital-library');
  }
});

// ── Chapter Quiz ────────────────────────────────────────────────────────
router.get('/chapter/:chapterId/quiz', loggedIn, async (req, res) => {
  const chapterId = parseInt(req.params.chapterId);
  const userId = req.session.user_id;

  try {
    const chResult = await pool.query('SELECT * FROM digital_chapters WHERE id = $1', [chapterId]);
    if (chResult.rows.length === 0) {
      req.flash('error', 'Chapter not found');
      return res.redirect('/digital-library');
    }
    const chapter = chResult.rows[0];

    const bookResult = await pool.query('SELECT * FROM digital_content WHERE id = $1', [chapter.book_id]);
    if (bookResult.rows.length === 0) return notFound(req, res);
    const book = bookResult.rows[0];

    let questions = [];
    try { questions = JSON.parse(chapter.quiz || '[]'); } catch(e) { questions = []; }

    if (questions.length === 0 && chapter.content) {
      questions = await aiService.generateQuizFromText(chapter.content);
      if (questions.length > 0) {
        await pool.query('UPDATE digital_chapters SET quiz = $1 WHERE id = $2', [JSON.stringify(questions), chapterId]);
      }
    }

    // Check if already attempted
    const attempt = (await pool.query(
      'SELECT * FROM chapter_quiz_attempts WHERE user_id = $1 AND chapter_id = $2 ORDER BY attempted_at DESC LIMIT 1',
      [userId, chapterId]
    )).rows[0];

    if (attempt) {
      // Render result page
      const gradedQuestions = questions.map((q, idx) => {
        const userAns = req.query[`q_${idx}`] || attempt[`q_${idx}`] || '';
        const isCorrect = attempt[`q_${idx}_correct`] === true || attempt[`q_${idx}_correct`] === 1;
        let correctAnswer = '';
        if (q.type === 'mcq' || q.type === 'tf') {
          correctAnswer = q.options ? q.options[q.correct_index] : '';
        } else {
          correctAnswer = q.correct_answer || '';
        }
        return { question: q.question, user_answer: userAns, correct_answer: correctAnswer, is_correct: isCorrect, ai_graded: q.type === 'sa' };
      });

      return res.render('chapter_quiz_result', {
        title: `Quiz Results: ${chapter.title} - librika.in`,
        chapter,
        book,
        score: parseFloat(attempt.score),
        passed: attempt.passed === 1 || attempt.passed === true,
        correct: 0, total: 0,
        questions: gradedQuestions,
        already_taken: true,
      });
    }

    // Check eligibility
    const prog = (await pool.query(
      'SELECT progress, finished FROM chapter_reading_progress WHERE user_id = $1 AND chapter_id = $2',
      [userId, chapterId]
    )).rows[0];

    const progress = prog ? parseFloat(prog.progress) : 0;
    const finished = prog ? prog.finished : 0;
    if (progress < 80.0 && finished !== 1) {
      req.flash('error', 'Please read at least 80% of this chapter first to unlock the quiz');
      return res.redirect(`/digital-library/chapter/${chapterId}`);
    }

    res.render('chapter_quiz', { title: `Quiz: ${chapter.title} - librika.in`, chapter, book, questions });
  } catch (err) {
    console.error('Chapter quiz error:', err);
    req.flash('error', 'Failed to load quiz');
    res.redirect('/digital-library');
  }
});

router.post('/chapter/:chapterId/quiz', loggedIn, async (req, res) => {
  const chapterId = parseInt(req.params.chapterId);
  const userId = req.session.user_id;

  try {
    const chResult = await pool.query('SELECT * FROM digital_chapters WHERE id = $1', [chapterId]);
    if (chResult.rows.length === 0) {
      req.flash('error', 'Chapter not found');
      return res.redirect('/digital-library');
    }
    const chapter = chResult.rows[0];

    const bookResult = await pool.query('SELECT * FROM digital_content WHERE id = $1', [chapter.book_id]);
    if (bookResult.rows.length === 0) return notFound(req, res);
    const book = bookResult.rows[0];

    let questions = [];
    try { questions = JSON.parse(chapter.quiz || '[]'); } catch(e) { questions = []; }

    if (questions.length === 0 && chapter.content) {
      questions = await aiService.generateQuizFromText(chapter.content);
      if (questions.length > 0) {
        await pool.query('UPDATE digital_chapters SET quiz = $1 WHERE id = $2', [JSON.stringify(questions), chapterId]);
      }
    }

    // Check if already attempted
    const existing = (await pool.query(
      'SELECT id FROM chapter_quiz_attempts WHERE user_id = $1 AND chapter_id = $2',
      [userId, chapterId]
    )).rows[0];

    if (existing) {
      req.flash('error', 'You have already attempted this quiz');
      return res.redirect(`/digital-library/chapter/${chapterId}/quiz`);
    }

    let correctCount = 0;
    const gradedQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const userAnswer = req.body[`q_${i}`] || '';
      let isCorrect = false;
      let correctAnswer = '';

      if (q.type === 'mcq' || q.type === 'tf') {
        correctAnswer = q.options ? q.options[q.correct_index] : '';
        isCorrect = parseInt(userAnswer) === q.correct_index;
      } else if (q.type === 'fib') {
        correctAnswer = q.correct_answer || '';
        isCorrect = userAnswer.trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase();
      } else if (q.type === 'sa') {
        correctAnswer = q.correct_answer || '';
        isCorrect = await aiGradeShortAnswer(q.question, q.correct_answer, userAnswer);
      }

      if (isCorrect) correctCount++;

      gradedQuestions.push({
        question: q.question,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        ai_graded: q.type === 'sa',
      });
    }

    const totalQuestions = questions.length;
    const scorePct = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const passed = scorePct >= 70.0;

    await pool.query(
      'INSERT INTO chapter_quiz_attempts (user_id, chapter_id, score, passed, attempted_at) VALUES ($1, $2, $3, $4, $5)',
      [userId, chapterId, scorePct, passed ? 1 : 0, nowStr()]
    );

    if (passed) {
      await updateScore(pool, userId, 'digital', 20, `Passed quiz for chapter '${chapter.title}' (${Math.round(scorePct)}% score)`);
    }

    res.render('chapter_quiz_result', {
      title: `Quiz Results: ${chapter.title} - librika.in`,
      chapter,
      book,
      score: scorePct,
      passed,
      correct: correctCount,
      total: totalQuestions,
      questions: gradedQuestions,
      already_taken: false,
    });
  } catch (err) {
    console.error('Chapter quiz submit error:', err);
    req.flash('error', 'Failed to submit quiz');
    res.redirect(`/digital-library/chapter/${chapterId}/quiz`);
  }
});

// ── API: Save Reading Progress (PDF reader) ────────────────────────────
router.post('/api/save-progress', loggedIn, async (req, res) => {
  const userId = req.session.user_id;
  const { content_id, page, total_pages = 1 } = req.body;

  try {
    const existing = (await pool.query(
      'SELECT id FROM reading_progress WHERE student_id = $1 AND content_id = $2',
      [userId, content_id]
    )).rows[0];

    const now = nowStr();
    if (existing) {
      await pool.query(
        'UPDATE reading_progress SET last_page = $1, total_pages = $2, updated_at = $3 WHERE id = $4',
        [page, total_pages, now, existing.id]
      );
    } else {
      await pool.query(
        'INSERT INTO reading_progress (student_id, content_id, last_page, total_pages, started_reading_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, content_id, page, total_pages, now, now]
      );
    }

    const percent = Math.round((page / total_pages) * 100);
    const onCooldown = await check90DayCooldown(pool, userId, content_id, 'digital');

    if (!onCooldown) {
      if (percent >= 50) {
        const currentProg = (await pool.query(
          'SELECT awarded_50, awarded_100 FROM reading_progress WHERE student_id = $1 AND content_id = $2',
          [userId, content_id]
        )).rows[0];
        if (currentProg && !currentProg.awarded_50) {
          await updateScore(pool, userId, 'digital', 10, 'Reached 50% digital reading progress');
          await pool.query('UPDATE reading_progress SET awarded_50 = 1 WHERE student_id = $1 AND content_id = $2', [userId, content_id]);
        }
        if (percent >= 100) {
          if (currentProg && !currentProg.awarded_100) {
            await updateScore(pool, userId, 'digital', 20, 'Completed digital reading (100% progress)');
            await pool.query('UPDATE reading_progress SET awarded_100 = 1, completed_at = $1 WHERE student_id = $2 AND content_id = $3', [now, userId, content_id]);
          }
        }
      }
    }

    // Daily streak logic
    const user = (await pool.query('SELECT last_read_date, reading_streak, longest_streak FROM users WHERE id = $1', [userId])).rows[0];
    if (user) {
      const today = nowStr().slice(0, 10);
      let streak = parseInt(user.reading_streak) || 0;
      let longest = parseInt(user.longest_streak) || 0;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const lastRead = user.last_read_date ? user.last_read_date.slice(0, 10) : null;

      if (lastRead === yesterday) {
        streak += 1;
      } else if (lastRead !== today) {
        streak = 1;
      }

      if (streak > longest) longest = streak;

      if (!onCooldown && lastRead !== today) {
        await updateScore(pool, userId, 'digital', 5, `Daily reading streak day ${streak}`);
      }

      await pool.query(
        'UPDATE users SET last_read_date = $1, reading_streak = $2, longest_streak = $3 WHERE id = $4',
        [today, streak, longest, userId]
      );
    }

    res.json({ status: 'success' });
  } catch (err) {
    console.error('Save progress error:', err);
    res.json({ status: 'error' });
  }
});

// ── API: Save Chapter Reading Progress ──────────────────────────────────
router.post('/api/chapter/save-progress', loggedIn, async (req, res) => {
  const userId = req.session.user_id;
  const { chapter_id, progress = 0.0, finished = 0 } = req.body;

  try {
    const existing = (await pool.query(
      'SELECT id, finished FROM chapter_reading_progress WHERE user_id = $1 AND chapter_id = $2',
      [userId, chapter_id]
    )).rows[0];

    const now = nowStr();
    if (existing) {
      const maxFinished = Math.max(existing.finished, finished);
      await pool.query(
        'UPDATE chapter_reading_progress SET progress = $1, finished = $2, last_read = $3 WHERE id = $4',
        [progress, maxFinished, now, existing.id]
      );
    } else {
      await pool.query(
        'INSERT INTO chapter_reading_progress (user_id, chapter_id, progress, finished, last_read) VALUES ($1, $2, $3, $4, $5)',
        [userId, chapter_id, progress, finished, now]
      );
    }

    res.json({ status: 'success' });
  } catch (err) {
    console.error('Chapter save progress error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── PDF Proxy ───────────────────────────────────────────────────────────
// PDF Proxy - serves PDFs avoiding CORS issues for PDF.js viewer
router.get('/pdf-proxy/:contentId', loggedIn, async (req, res) => {
    try {
        const { contentId } = req.params;
        const result = await db.query(
            'SELECT file_url, title, content_type FROM digital_content WHERE id = $1',
            [contentId]
        );
        if (result.rows.length === 0) return res.status(404).send('Content not found');
        
        const content = result.rows[0];
        const filePath = path.join(__dirname, '..', content.file_url);
        
        // Check if file exists locally
        if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${content.title}.pdf"`);
            return fs.createReadStream(filePath).pipe(res);
        }
        
        // If not local, try proxying from Cloudinary URL
        if (content.file_url && content.file_url.startsWith('http')) {
            const response = await axios.get(content.file_url, { responseType: 'stream' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${content.title}.pdf"`);
            return response.data.pipe(res);
        }
        
        res.status(404).send('PDF file not found');
    } catch (err) {
        console.error('PDF proxy error:', err);
        res.status(500).send('Error loading PDF');
    }
});

// ── API: Track Download ─────────────────────────────────────────────────
router.post('/api/track-download', loggedIn, async (req, res) => {
  const { content_id } = req.body;

  try {
    await pool.query('UPDATE digital_content SET downloads = downloads + 1 WHERE id = $1', [content_id]);
    res.json({ status: 'success' });
  } catch (err) {
    console.error('Track download error:', err);
    res.json({ status: 'error' });
  }
});

// ── API: Submit Review ──────────────────────────────────────────────────
router.post('/api/submit-review', loggedIn, async (req, res) => {
  const userId = req.session.user_id;
  const { content_id, rating, title, comment } = req.body;

  try {
    const content = (await pool.query('SELECT school_code FROM digital_content WHERE id = $1', [content_id])).rows[0];
    let schoolCode = content ? content.school_code : null;

    if (!schoolCode) {
      const book = (await pool.query('SELECT school_code FROM books WHERE id = $1', [content_id])).rows[0];
      schoolCode = book ? book.school_code : req.session.school_code;
    }

    await pool.query(
      'INSERT INTO content_reviews (content_id, student_id, rating, review_title, review_comment, school_code, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [content_id, userId, rating, title, comment, schoolCode, nowStr()]
    );

    res.json({ status: 'success' });
  } catch (err) {
    console.error('Submit review error:', err);
    res.json({ status: 'error', message: 'Failed to submit review' });
  }
});

// ── API: Report Content ─────────────────────────────────────────────────
router.post('/api/report', loggedIn, async (req, res) => {
  const userId = req.session.user_id;
  const { content_id, reason } = req.body;

  try {
    const content = (await pool.query('SELECT school_code FROM digital_content WHERE id = $1', [content_id])).rows[0];
    const schoolCode = content ? content.school_code : req.session.school_code;

    await pool.query(
      'INSERT INTO content_reports (content_id, reported_by, reason, school_code, created_at) VALUES ($1, $2, $3, $4, $5)',
      [content_id, userId, reason, schoolCode, nowStr()]
    );

    res.json({ status: 'success' });
  } catch (err) {
    console.error('Report content error:', err);
    res.json({ status: 'error' });
  }
});

// ── API: Toggle Bookmark ────────────────────────────────────────────────
router.post('/api/toggle-bookmark', loggedIn, async (req, res) => {
  const userId = req.session.user_id;
  const { content_id } = req.body;

  if (!content_id) {
    return res.json({ status: 'error', message: 'Missing content_id' });
  }

  try {
    const existing = (await pool.query(
      'SELECT id FROM reading_progress WHERE student_id = $1 AND content_id = $2',
      [userId, content_id]
    )).rows[0];

    let bookmarked = false;
    if (existing) {
      await pool.query('DELETE FROM reading_progress WHERE id = $1', [existing.id]);
      bookmarked = false;
    } else {
      const now = nowStr();
      await pool.query(
        'INSERT INTO reading_progress (student_id, content_id, last_page, updated_at) VALUES ($1, $2, 1, $3)',
        [userId, content_id, now]
      );
      bookmarked = true;
    }

    res.json({ status: 'success', bookmarked });
  } catch (err) {
    console.error('Toggle bookmark error:', err);
    res.json({ status: 'error', message: 'Failed to toggle bookmark' });
  }
});

// ── Author Profile ──────────────────────────────────────────────────────
router.get('/author/:authorId', loggedIn, async (req, res) => {
  const authorId = parseInt(req.params.authorId);

  try {
    const authorResult = await pool.query('SELECT id, name, class, school_code FROM users WHERE id = $1', [authorId]);
    if (authorResult.rows.length === 0) return notFound(req, res);
    const author = authorResult.rows[0];

    const stats = (await pool.query(
      `SELECT COUNT(*) as total_pubs, COALESCE(SUM(views), 0) as total_views, COALESCE(SUM(downloads), 0) as total_downloads FROM digital_content WHERE student_id = $1 AND status = 'Published'`,
      [authorId]
    )).rows[0];

    const publications = (await pool.query(
      `SELECT * FROM digital_content WHERE student_id = $1 AND status = 'Published' ORDER BY created_at DESC`,
      [authorId]
    )).rows;

    res.render('author_profile', { title: `${author.name} - Author Profile`, author, stats, publications });
  } catch (err) {
    console.error('Author profile error:', err);
    req.flash('error', 'Failed to load author profile');
    res.redirect('/digital-library');
  }
});

// ── Leaderboard ─────────────────────────────────────────────────────────
router.get('/leaderboard', loggedIn, async (req, res) => {
  const sCode = req.session.school_code;
  const userId = req.session.user_id;
  const timeframe = req.query.timeframe || 'all';
  const classFilter = (req.query.class || '').trim() || null;
  const sectionFilter = (req.query.section || '').trim() || null;
  const dateLimit = getDateLimit(timeframe);

  try {
    const [overallRankings, physicalRankings, digitalRankings, classesResult, sectionsResult] = await Promise.all([
      getRankings(sCode, 'overall', timeframe, dateLimit, classFilter, sectionFilter),
      getRankings(sCode, 'physical', timeframe, dateLimit, classFilter, sectionFilter),
      getRankings(sCode, 'digital', timeframe, dateLimit, classFilter, sectionFilter),
      pool.query('SELECT DISTINCT class FROM users WHERE school_code = $1 AND class IS NOT NULL', [sCode]),
      pool.query('SELECT DISTINCT section FROM users WHERE school_code = $1 AND section IS NOT NULL', [sCode]),
    ]);

    const classes = classesResult.rows.map(r => r.class);
    const sections = sectionsResult.rows.map(r => r.section);

    const myRanks = {
      overall: overallRankings.find(u => u.id === userId) || null,
      physical: physicalRankings.find(u => u.id === userId) || null,
      digital: digitalRankings.find(u => u.id === userId) || null,
    };

    res.render('leaderboard', {
      title: 'Leaderboard - librika.in',
      overall_rankings: overallRankings.slice(0, 10),
      physical_rankings: physicalRankings.slice(0, 10),
      digital_rankings: digitalRankings.slice(0, 10),
      timeframe,
      active_class: classFilter,
      active_section: sectionFilter,
      classes,
      sections,
      my_ranks: myRanks,
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    req.flash('error', 'Failed to load leaderboard');
    res.redirect('/student');
  }
});

// ── API: Live Stats ─────────────────────────────────────────────────────
router.get('/api/live-stats', async (req, res) => {
  try {
    const stats = (await pool.query('SELECT id, views FROM digital_content WHERE status = $1', ['Published'])).rows;
    const statsObj = {};
    stats.forEach(row => { statsObj[row.id] = parseInt(row.views); });
    res.json({ status: 'success', stats: statsObj });
  } catch (err) {
    console.error('Live stats error:', err);
    res.json({ status: 'error' });
  }
});

// ── AI Semantic Search (stub/placeholder) ───────────────────────────────
async function performAISemanticSearch(query, contentList) {
  const q = query.toLowerCase();
  return contentList
    .map(item => {
      let score = 0;
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const subject = (item.subject || '').toLowerCase();
      const tags = (item.tags || '').toLowerCase();

      if (title.includes(q)) score += 10;
      if (subject.includes(q)) score += 8;
      if (tags.includes(q)) score += 6;
      if (desc.includes(q)) score += 3;

      if (q.split(' ').some(w => w.length > 2 && (title.includes(w) || subject.includes(w)))) score += 5;

      return { ...item, ai_score: Math.min(100, score * 10) };
    })
    .filter(item => item.ai_score > 0)
    .sort((a, b) => b.ai_score - a.ai_score);
}

// ── AI Short Answer Grader (stub/placeholder) ──────────────────────────
async function aiGradeShortAnswer(question, suggestedAnswer, studentAnswer) {
  const result = await aiService.gradeShortAnswer(question, suggestedAnswer, studentAnswer);
  return result.score >= 70;
}

router.post('/upload-zip/:bookId', loggedIn, upload.single('zip_file'), async (req, res) => {
  const { bookId } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  let AdmZip;
  try {
    AdmZip = require('adm-zip');
  } catch (e) {
    return res.status(500).json({ error: 'ZIP processing requires adm-zip package. Please run npm install adm-zip.' });
  }

  try {
    const zip = new AdmZip(req.file.path);

    const zipEntries = zip.getEntries();
    
    let chapters = [];
    zipEntries.forEach(entry => {
      const name = entry.entryName;
      if (name.includes('__MACOSX') || name.includes('.DS_Store') || entry.isDirectory || name.startsWith('.')) return;
      
      const chapterMatch = name.match(/(?:chapter|ch|unit|lesson)[^0-9]*([0-9]+)/i);
      const fallbackMatch = name.match(/([0-9]+)/);
      let chapterNum = null;
      
      if (chapterMatch) chapterNum = parseInt(chapterMatch[1], 10);
      else if (fallbackMatch) chapterNum = parseInt(fallbackMatch[1], 10);
      
      if (chapterNum !== null) {
        const contentText = entry.getData().toString('utf8');
        const title = name.split('/').pop().replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
        chapters.push({ chapter_num: chapterNum, title: title, content: contentText });
      }
    });
    
    if (chapters.length === 0) return res.status(400).json({ error: 'No valid chapters found in ZIP' });
    chapters.sort((a, b) => a.chapter_num - b.chapter_num);
    
    await pool.query('DELETE FROM digital_chapters WHERE book_id = $1', [bookId]);
    
    for (const ch of chapters) {
      const cleanedText = ch.content.trim();
      const aiData = await aiService.processChapter(cleanedText, ch.title);
      
      const summary = aiData.summary || '';
      const notesJson = JSON.stringify(aiData.notes || []);
      const vocabJson = JSON.stringify(aiData.vocabulary || []);
      const qnaJson = JSON.stringify(aiData.qna || []);
      const quizJson = JSON.stringify(aiData.quiz || []);
      
      await pool.query(
        'INSERT INTO digital_chapters (book_id, chapter_num, title, content, summary, notes, vocabulary, qna, quiz, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [bookId, ch.chapter_num, ch.title, cleanedText, summary, notesJson, vocabJson, qnaJson, quizJson, nowStr()]
      );
    }
    
    res.json({ status: 'success', message: `Processed ${chapters.length} chapters` });
  } catch (error) {
    console.error('ZIP process error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
