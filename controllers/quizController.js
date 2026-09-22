/**
 * Librika Book-Based Quiz System — Quiz Controller
 * Clean, production-grade implementation supporting both OFFLINE and DIGITAL quizzes.
 * Enforces server-side authority, strict anti-bypass, resume on reload, and AI generation.
 */

const { query } = require('../db');
const { generateQuizFromText, callAI } = require('../services/aiService');

// Helper to format ISO timestamp
function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * 1. GET /api/quizzes/student
 * Returns student's accessible quizzes partitioned into Offline and Digital lists
 */
async function getStudentQuizzes(req, res) {
  try {
    const studentId = req.session.user_id;
    const sCode = req.session.school_code || 'DPS123';
    if (!studentId) return res.status(401).json({ status: 'error', message: 'Authentication required' });

    // Fetch all published quizzes matching student's school or global
    const quizzesRes = await query(`
      SELECT q.*, 
             b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover, b.book_size,
             dc.title AS digital_title, COALESCE(dc.cover_url, '') AS digital_cover, NULL AS digital_author
      FROM quizzes q
      LEFT JOIN books b ON q.book_id = b.id
      LEFT JOIN digital_content dc ON q.digital_content_id = dc.id
      WHERE (q.status = 'PUBLISHED' OR q.published = 1 OR q.status IS NULL) 
        AND (LOWER(q.school_code) = LOWER($1) OR q.school_code = 'GLOBAL' OR q.school_code = 'DPS123' OR q.school_code IS NULL OR q.school_code = '')
      ORDER BY q.id DESC
    `, [sCode]);

    const quizzes = quizzesRes.rows || [];

    // Fetch student's offline book readings
    const offlineReadingsRes = await query(`
      SELECT * FROM offline_book_readings
      WHERE student_id = $1
    `, [studentId]);
    const offlineReadings = offlineReadingsRes.rows || [];

    // Fetch student's digital book readings
    const digitalReadingsRes = await query(`
      SELECT * FROM digital_book_readings
      WHERE student_id = $1
    `, [studentId]);
    const digitalReadings = digitalReadingsRes.rows || [];

    // Fetch student's previous quiz attempts
    const attemptsRes = await query(`
      SELECT * FROM quiz_attempts
      WHERE student_id = $1
      ORDER BY started_at DESC
    `, [studentId]);
    const allAttempts = attemptsRes.rows || [];

    const offlineQuizzes = [];
    const digitalQuizzes = [];

    for (const qz of quizzes) {
      const isOffline = (qz.library_type || 'OFFLINE').toUpperCase() === 'OFFLINE';
      const maxAttempts = parseInt(qz.max_attempts, 10) || 2;
      const attempts = allAttempts.filter(a => a.quiz_id === qz.id);
      const attemptsUsed = attempts.length;
      const attemptsRemaining = Math.max(0, maxAttempts - attemptsUsed);

      // Best score & pass status
      let bestScore = 0;
      let hasPassed = false;
      let inProgressAttempt = null;

      for (const att of attempts) {
        const score = parseFloat(att.percentage || att.score || 0);
        if (score > bestScore) bestScore = score;
        if (att.passed === 1 || att.passed === true) hasPassed = true;
        if (att.status === 'IN_PROGRESS') inProgressAttempt = att;
      }

      // Check Reading Eligibility
      let eligible = false;
      let lockReason = '';
      let readingProgress = 0;
      let readingTimeMinutes = 0;

      if (isOffline) {
        if (!qz.book_id) {
          // General curriculum quiz without specific physical book linkage
          eligible = true;
        } else {
          // Must match offline_book_readings
          const reading = offlineReadings.find(r => r.book_id === qz.book_id);
          if (!reading) {
            lockReason = 'You must borrow and return this physical book to unlock its quiz.';
          } else if (reading.quiz_status === 'ELIGIBLE' || reading.return_status === 'RETURNED_ON_TIME' || reading.return_status === 'RETURNED_LATE') {
            eligible = true;
          } else {
            lockReason = 'Quiz unlocks once this borrowed book is returned to the library.';
          }
        }
      } else {
        // Digital reading check
        const reading = digitalReadings.find(r => r.content_id === qz.digital_content_id);
        if (!reading) {
          lockReason = 'You must read at least 80% and 20 mins of this book to unlock its quiz.';
        } else {
          readingProgress = parseInt(reading.progress_percentage, 10) || 0;
          readingTimeMinutes = Math.round((parseInt(reading.total_reading_time, 10) || 0) / 60);
          if (reading.quiz_status === 'ELIGIBLE' || (readingProgress >= 80 && readingTimeMinutes >= 20)) {
            eligible = true;
          } else {
            lockReason = `Requires 80% progress and 20 mins read (Currently: ${readingProgress}%, ${readingTimeMinutes} mins).`;
          }
        }
      }

      // Overall Card Status
      let cardStatus = 'LOCKED';
      if (hasPassed) cardStatus = 'PASSED';
      else if (inProgressAttempt) cardStatus = 'IN_PROGRESS';
      else if (attemptsRemaining <= 0) cardStatus = 'MAX_ATTEMPTS_REACHED';
      else if (eligible) cardStatus = 'AVAILABLE';
      else cardStatus = 'LOCKED';

      const quizCard = {
        id: qz.id,
        title: qz.title,
        description: qz.description,
        library_type: qz.library_type,
        difficulty: qz.difficulty || 'MEDIUM',
        time_limit: qz.time_limit || 15,
        passing_percentage: qz.passing_percentage || 60,
        max_attempts: maxAttempts,
        attempts_used: attemptsUsed,
        attempts_remaining: attemptsRemaining,
        best_score: bestScore,
        has_passed: hasPassed,
        card_status: cardStatus,
        lock_reason: lockReason,
        book_title: isOffline ? qz.book_title : qz.digital_title,
        book_author: isOffline ? qz.book_author : qz.digital_author,
        book_cover: isOffline ? qz.book_cover : qz.digital_cover,
        reading_progress: readingProgress,
        reading_time_minutes: readingTimeMinutes,
        in_progress_attempt_id: inProgressAttempt ? inProgressAttempt.id : null
      };

      if (isOffline) {
        offlineQuizzes.push(quizCard);
      } else {
        digitalQuizzes.push(quizCard);
      }
    }

    return res.json({
      status: 'success',
      offlineQuizzes,
      digitalQuizzes
    });
  } catch (err) {
    console.error('getStudentQuizzes error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/**
 * 2. GET /quizzes/:id/take
 * Prepares quiz session, recovers active attempt on refresh, or validates eligibility
 */
async function getTakeQuiz(req, res) {
  try {
    const studentId = req.session.user_id;
    const sCode = req.session.school_code || 'DPS123';
    const quizId = req.params.id;

    if (!studentId) {
      req.flash('error', 'Please log in to take quizzes');
      return res.redirect('/login');
    }

    // Fetch quiz metadata
    const qzRes = await query(`
      SELECT q.*, 
             b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover,
             dc.title AS digital_title, NULL AS digital_author, COALESCE(dc.cover_url, '') AS digital_cover
      FROM quizzes q
      LEFT JOIN books b ON q.book_id = b.id
      LEFT JOIN digital_content dc ON q.digital_content_id = dc.id
      WHERE q.id = $1 
        AND (LOWER(q.school_code) = LOWER($2) OR q.school_code = 'GLOBAL' OR q.school_code = 'DPS123' OR q.school_code IS NULL OR q.school_code = '')
    `, [quizId, sCode]);

    if (!qzRes.rows || qzRes.rows.length === 0) {
      req.flash('error', 'Quiz not found or not published for your school');
      return res.redirect('/student?module=learn');
    }
    const quiz = qzRes.rows[0];
    const isOffline = (quiz.library_type || 'OFFLINE').toUpperCase() === 'OFFLINE';

    // Verify Eligibility
    if (isOffline) {
      if (quiz.book_id) {
        const obrRes = await query(
          'SELECT * FROM offline_book_readings WHERE student_id = $1 AND book_id = $2',
          [studentId, quiz.book_id]
        );
        const obr = obrRes.rows && obrRes.rows[0];
        const eligible = obr && (obr.quiz_status === 'ELIGIBLE' || obr.return_status === 'RETURNED_ON_TIME' || obr.return_status === 'RETURNED_LATE');
        if (!eligible) {
          return res.render('quiz_locked', {
            title: 'Quiz Locked - Librika',
            quiz,
            message: 'This quiz is locked. Return the issued book to the library desk first to unlock.'
          });
        }
      }
    } else {
      const dbrRes = await query(
        'SELECT * FROM digital_book_readings WHERE student_id = $1 AND content_id = $2',
        [studentId, quiz.digital_content_id]
      );
      const dbr = dbrRes.rows && dbrRes.rows[0];
      const progress = dbr ? (parseInt(dbr.progress_percentage, 10) || 0) : 0;
      const readingTime = dbr ? (parseInt(dbr.total_reading_time, 10) || 0) : 0;
      const eligible = dbr && (dbr.quiz_status === 'ELIGIBLE' || (progress >= 80 && readingTime >= 1200));
      if (!eligible) {
        return res.render('quiz_locked', {
          title: 'Quiz Locked - Librika',
          quiz,
          message: `This quiz is locked. Read at least 80% and 20 minutes (Currently: ${progress}%, ${Math.round(readingTime / 60)} mins).`
        });
      }
    }

    // Check existing attempts
    const attemptsRes = await query(`
      SELECT * FROM quiz_attempts
      WHERE quiz_id = $1 AND student_id = $2
      ORDER BY started_at DESC
    `, [quizId, studentId]);
    const previousAttempts = attemptsRes.rows || [];

    // Resume active attempt if present
    let activeAttempt = previousAttempts.find(a => a.status === 'IN_PROGRESS');

    const maxAttempts = parseInt(quiz.max_attempts, 10) || 2;
    if (!activeAttempt && previousAttempts.length >= maxAttempts) {
      req.flash('error', `You have reached the maximum attempt limit (${maxAttempts}) for this quiz.`);
      return res.redirect('/student?module=learn');
    }

    const now = nowIso();

    if (!activeAttempt) {
      // Start a new attempt
      const attemptNumber = previousAttempts.length + 1;
      await query(`
        INSERT INTO quiz_attempts (quiz_id, book_id, digital_content_id, student_id, user_id, school_code, library_type, attempt_number, started_at, status, score, total_marks, percentage, passed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'IN_PROGRESS', 0, 10, 0, 0)
      `, [
        quiz.id,
        quiz.book_id || null,
        quiz.digital_content_id || null,
        studentId,
        studentId,
        sCode,
        quiz.library_type || 'OFFLINE',
        attemptNumber,
        now
      ]);

      const lastAttRes = await query(
        'SELECT * FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2 AND status = \'IN_PROGRESS\' ORDER BY id DESC LIMIT 1',
        [quiz.id, studentId]
      );
      activeAttempt = lastAttRes.rows && lastAttRes.rows[0];
    }

    // Fetch quiz questions (DO NOT EXPOSE correct_answer OR explanation)
    const questionsRes = await query(`
      SELECT id, question, question_type, options, marks, difficulty, order_index
      FROM quiz_questions
      WHERE quiz_id = $1
      ORDER BY order_index ASC, id ASC
    `, [quizId]);

    let rawQuestions = questionsRes.rows || [];
    const questions = rawQuestions.map(q => {
      let opts = [];
      try {
        opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      } catch (e) {
        opts = [];
      }
      return {
        id: q.id,
        question: q.question,
        options: opts,
        marks: q.marks || 1,
        question_type: q.question_type || 'MCQ'
      };
    });

    // Calculate time remaining based on activeAttempt.started_at
    const timeLimitMinutes = parseInt(quiz.time_limit, 10) || 15;
    const startTime = new Date(activeAttempt.started_at).getTime();
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const totalAllowedSeconds = timeLimitMinutes * 60;
    const secondsRemaining = Math.max(0, totalAllowedSeconds - elapsedSeconds);

    return res.render('take_quiz', {
      title: `${quiz.title} - Librika Quiz`,
      quiz,
      attempt: activeAttempt,
      questions,
      secondsRemaining,
      timeLimitMinutes
    });
  } catch (err) {
    console.error('getTakeQuiz error:', err);
    req.flash('error', 'Unable to start quiz: ' + err.message);
    return res.redirect('/student?module=learn');
  }
}

/**
 * 3. POST /api/quizzes/:id/submit
 * Server-side score calculation, records quiz_answers, awards leaderboard points
 */
async function postSubmitQuizAttempt(req, res) {
  try {
    const studentId = req.session.user_id;
    const sCode = req.session.school_code || 'DPS123';
    const quizId = req.params.id;
    const { attempt_id, answers, time_taken_seconds } = req.body;

    if (!studentId) return res.status(401).json({ status: 'error', message: 'Authentication required' });

    // Validate attempt
    const attRes = await query(`
      SELECT * FROM quiz_attempts
      WHERE id = $1 AND quiz_id = $2 AND student_id = $3
    `, [attempt_id, quizId, studentId]);

    if (!attRes.rows || attRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Active quiz attempt not found' });
    }
    const attempt = attRes.rows[0];
    if (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED') {
      return res.status(400).json({ status: 'error', message: 'This quiz attempt was already submitted.' });
    }

    // Fetch correct answers from DB
    const questionsRes = await query(`
      SELECT id, question, options, correct_answer, explanation, marks
      FROM quiz_questions
      WHERE quiz_id = $1
      ORDER BY order_index ASC, id ASC
    `, [quizId]);
    const questions = questionsRes.rows || [];

    let totalMarks = 0;
    let marksObtained = 0;
    const evaluatedQuestions = [];

    for (const q of questions) {
      const qMarks = parseFloat(q.marks || 1);
      totalMarks += qMarks;

      const studentAns = answers ? answers[q.id] : null;
      let isCorrect = false;

      if (studentAns !== undefined && studentAns !== null) {
        // Compare case-insensitively & trimmed
        if (String(studentAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()) {
          isCorrect = true;
          marksObtained += qMarks;
        }
      }

      // Record in quiz_answers table
      await query(`
        INSERT INTO quiz_answers (attempt_id, question_id, selected_answer, is_correct, marks_obtained)
        VALUES ($1, $2, $3, $4, $5)
      `, [attempt_id, q.id, studentAns || '', isCorrect ? 1 : 0, isCorrect ? qMarks : 0]).catch(() => {});

      let parsedOpts = [];
      try {
        parsedOpts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      } catch (e) {
        parsedOpts = [];
      }

      evaluatedQuestions.push({
        id: q.id,
        question: q.question,
        options: parsedOpts,
        student_answer: studentAns || null,
        correct_answer: q.correct_answer,
        explanation: q.explanation || 'No explanation provided.',
        is_correct: isCorrect,
        marks_obtained: isCorrect ? qMarks : 0,
        marks: qMarks
      });
    }

    const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
    const passingPercentage = parseInt(attempt.passing_percentage, 10) || 60;
    const passed = percentage >= passingPercentage ? 1 : 0;
    const now = nowIso();

    // Mark attempt completed
    await query(`
      UPDATE quiz_attempts
      SET submitted_at = $1, status = 'SUBMITTED', score = $2, total_marks = $3, percentage = $4, passed = $5, time_taken_seconds = $6
      WHERE id = $7
    `, [now, marksObtained, totalMarks, percentage, passed, parseInt(time_taken_seconds, 10) || 0, attempt_id]);

    // Update Points & Leaderboard Score
    const libraryType = (attempt.library_type || 'OFFLINE').toUpperCase();
    const scoreType = libraryType === 'OFFLINE' ? 'physical' : 'digital';
    let pointsAwarded = 0;

    if (passed) {
      // 50 points for passing quiz
      pointsAwarded = 50;
      const userRes = await query('SELECT physical_reader_score, digital_reader_score, overall_reader_score FROM users WHERE id = $1', [studentId]);
      if (userRes.rows && userRes.rows[0]) {
        let phys = parseInt(userRes.rows[0].physical_reader_score, 10) || 0;
        let dig = parseInt(userRes.rows[0].digital_reader_score, 10) || 0;
        if (scoreType === 'physical') phys += pointsAwarded;
        else dig += pointsAwarded;
        const overall = phys + dig;

        await query(`
          UPDATE users SET physical_reader_score = $1, digital_reader_score = $2, overall_reader_score = $3 WHERE id = $4
        `, [phys, dig, overall, studentId]);

        await query(`
          INSERT INTO points_log (user_id, points, score_type, description, school_code)
          VALUES ($1, $2, $3, $4, $5)
        `, [studentId, pointsAwarded, scoreType, `Passed ${libraryType} Quiz (${percentage}%)`, sCode]).catch(() => {});
      }
    }

    return res.json({
      status: 'success',
      passed: !!passed,
      percentage,
      score: marksObtained,
      total_marks: totalMarks,
      points_awarded: pointsAwarded,
      evaluated_questions: evaluatedQuestions,
      redirect_url: `/quizzes/${quizId}/results/${attempt_id}`
    });
  } catch (err) {
    console.error('postSubmitQuizAttempt error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/**
 * 4. GET /quizzes/:id/results/:attemptId
 * Renders modern quiz result review screen
 */
async function getQuizResult(req, res) {
  try {
    const studentId = req.session.user_id;
    const { id, attemptId } = req.params;

    if (!studentId) return res.redirect('/login');

    const attRes = await query(`
      SELECT qa.*, q.title as quiz_title, q.passing_percentage,
             b.title as book_title, dc.title as digital_title
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      LEFT JOIN books b ON q.book_id = b.id
      LEFT JOIN digital_content dc ON q.digital_content_id = dc.id
      WHERE qa.id = $1 AND qa.student_id = $2
    `, [attemptId, studentId]);

    if (!attRes.rows || attRes.rows.length === 0) {
      req.flash('error', 'Quiz result not found');
      return res.redirect('/student?module=learn');
    }
    const attempt = attRes.rows[0];

    // Fetch answered questions with review details
    const reviewRes = await query(`
      SELECT qq.id, qq.question, qq.options, qq.correct_answer, qq.explanation, qq.marks,
             ans.selected_answer, ans.is_correct, ans.marks_obtained
      FROM quiz_questions qq
      LEFT JOIN quiz_answers ans ON ans.question_id = qq.id AND ans.attempt_id = $1
      WHERE qq.quiz_id = $2
      ORDER BY qq.order_index ASC, qq.id ASC
    `, [attemptId, id]);

    const questions = (reviewRes.rows || []).map(q => {
      let opts = [];
      try {
        opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      } catch (e) {
        opts = [];
      }
      return {
        ...q,
        options: opts
      };
    });

    res.render('quiz_result', {
      title: 'Quiz Results - Librika',
      attempt,
      questions,
      bookTitle: attempt.book_title || attempt.digital_title || attempt.quiz_title
    });
  } catch (err) {
    console.error('getQuizResult error:', err);
    res.redirect('/student?module=learn');
  }
}

/**
 * 5. POST /admin/api/quizzes/generate-ai
 * AI Quiz Generator for Librarians/Admins via Gemini API
 */
async function postGenerateAiQuiz(req, res) {
  try {
    const { book_id, digital_content_id, library_type = 'OFFLINE', num_questions = 5, difficulty = 'MEDIUM' } = req.body;
    let title = '';
    let author = '';
    let summary = '';

    if (library_type === 'OFFLINE' && book_id) {
      const bRes = await query('SELECT title, author, description, subject FROM books WHERE id = $1', [book_id]);
      if (bRes.rows && bRes.rows[0]) {
        title = bRes.rows[0].title;
        author = bRes.rows[0].author;
        summary = bRes.rows[0].description || bRes.rows[0].subject || '';
      }
    } else if (digital_content_id) {
      const dcRes = await query('SELECT title, author, description, category FROM digital_content WHERE id = $1', [digital_content_id]);
      if (dcRes.rows && dcRes.rows[0]) {
        title = dcRes.rows[0].title;
        author = dcRes.rows[0].author;
        summary = dcRes.rows[0].description || dcRes.rows[0].category || '';
      }
    }

    if (!title) {
      return res.status(400).json({ status: 'error', message: 'Valid book or digital content ID required' });
    }

    const prompt = `You are an expert school educator and librarian for Librika.
Create a ${num_questions}-question multiple-choice quiz of ${difficulty} difficulty for students reading:
Title: "${title}"
Author: "${author}"
Summary/Context: "${summary}"

Requirements:
- Each question must have exactly 4 plausible options.
- Identify the correct answer (matching one of the options).
- Provide a brief, encouraging educational explanation for students.
- Return ONLY a valid JSON array of objects with NO markdown or extraneous commentary.

Example schema:
[
  {
    "question": "What is the primary theme explored in the book?",
    "options": ["Courage and perseverance", "Technological disruption", "Economic inflation", "Oceanic navigation"],
    "correct_answer": "Courage and perseverance",
    "explanation": "The narrative prominently highlights how facing adversity builds character.",
    "marks": 1
  }
]`;

    const aiRes = await callAI(prompt, { jsonMode: true, temperature: 0.4 });
    let questions = [];
    try {
      questions = JSON.parse(aiRes);
    } catch (e) {
      const clean = aiRes.replace(/```json/gi, '').replace(/```/g, '').trim();
      questions = JSON.parse(clean);
    }

    return res.json({
      status: 'success',
      title: `${title} - Comprehension Quiz`,
      questions
    });
  } catch (err) {
    console.error('postGenerateAiQuiz error:', err);
    return res.status(500).json({ status: 'error', message: 'AI generation failed: ' + err.message });
  }
}

/**
 * 6. POST /admin/api/quizzes/save
 * Admin creates or updates a complete Quiz and its Question set
 */
async function postSaveQuiz(req, res) {
  try {
    const librarianId = req.session.user_id;
    const sCode = req.session.school_code || 'GLOBAL';
    const {
      id,
      title,
      description,
      library_type = 'OFFLINE',
      book_id,
      digital_content_id,
      difficulty = 'MEDIUM',
      passing_percentage = 60,
      time_limit = 15,
      max_attempts = 2,
      status = 'PUBLISHED',
      questions = []
    } = req.body;

    if (!title) return res.status(400).json({ status: 'error', message: 'Quiz title is required' });

    let quizId = id;
    const now = nowIso();

    if (quizId) {
      await query(`
        UPDATE quizzes
        SET title = $1, description = $2, library_type = $3, book_id = $4, digital_content_id = $5,
            difficulty = $6, passing_percentage = $7, time_limit = $8, max_attempts = $9, status = $10, updated_at = $11
        WHERE id = $12
      `, [title, description, library_type, book_id || null, digital_content_id || null, difficulty, passing_percentage, time_limit, max_attempts, status, now, quizId]);
    } else {
      const insertRes = await query(`
        INSERT INTO quizzes (title, description, library_type, book_id, digital_content_id, school_code, difficulty, passing_percentage, time_limit, max_attempts, status, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [title, description, library_type, book_id || null, digital_content_id || null, sCode, difficulty, passing_percentage, time_limit, max_attempts, status, librarianId, now, now]);

      const lastQuiz = await query('SELECT id FROM quizzes ORDER BY id DESC LIMIT 1');
      quizId = (insertRes.rows && insertRes.rows[0] && insertRes.rows[0].id) || (lastQuiz.rows && lastQuiz.rows[0].id);
    }

    // Save Questions if provided
    if (Array.isArray(questions) && questions.length > 0) {
      await query('DELETE FROM quiz_questions WHERE quiz_id = $1', [quizId]);
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const optsStr = typeof q.options === 'string' ? q.options : JSON.stringify(q.options || []);
        await query(`
          INSERT INTO quiz_questions (quiz_id, question, question_type, options, correct_answer, explanation, marks, difficulty, order_index)
          VALUES ($1, $2, 'MCQ', $3, $4, $5, $6, $7, $8)
        `, [quizId, q.question, optsStr, q.correct_answer, q.explanation || '', q.marks || 1, difficulty, i + 1]);
      }
    }

    return res.json({
      status: 'success',
      message: `Quiz '${title}' saved successfully!`,
      quiz_id: quizId
    });
  } catch (err) {
    console.error('postSaveQuiz error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/**
 * 7. GET /admin/api/quizzes/list
 * Admin list of all quizzes with participant stats
 */
async function getAdminQuizzesList(req, res) {
  try {
    const sCode = req.session.school_code || 'GLOBAL';
    const qzRes = await query(`
      SELECT q.*, 
             b.title AS book_title,
             dc.title AS digital_title,
             (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id) AS total_attempts,
             (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id AND passed = 1) AS total_passes
      FROM quizzes q
      LEFT JOIN books b ON q.book_id = b.id
      LEFT JOIN digital_content dc ON q.digital_content_id = dc.id
      WHERE q.school_code = $1 OR q.school_code = 'GLOBAL'
      ORDER BY q.id DESC
    `, [sCode]);

    return res.json({ status: 'success', quizzes: qzRes.rows || [] });
  } catch (err) {
    console.error('getAdminQuizzesList error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

module.exports = {
  getStudentQuizzes,
  getTakeQuiz,
  postSubmitQuizAttempt,
  getQuizResult,
  postGenerateAiQuiz,
  postSaveQuiz,
  getAdminQuizzesList
};
