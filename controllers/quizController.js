/**
 * Librika Book-Based Quiz System — Quiz Controller
 * Complete AI-Powered Reading Verification Architecture
 * Physical & Digital Quizzes, 80% passing, automatic unlock schedules,
 * points deadlines, anti-farming verification, and librarian overrides.
 */

const { query } = require('../db');
const { generateQuizFromText, callAI } = require('../services/aiService');
const quizVerificationService = require('../services/quizVerificationService');

// Helper to format ISO timestamp
function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * 1. GET /api/quizzes/student
 * Returns student's accessible quizzes partitioned into Offline and Digital lists
 * Computes unlock dates, countdowns, deadline expiry, and verification states.
 */
async function getStudentQuizzes(req, res) {
  try {
    const studentId = req.session.user_id;
    const sCode = req.session.school_code || 'DPS123';
    if (!studentId) return res.status(401).json({ status: 'error', message: 'Authentication required' });

    const settings = await quizVerificationService.getQuizSettings(sCode);
    const now = new Date();

    // Fetch all published quizzes matching student's school or global
    const quizzesRes = await query(`
      SELECT q.*, 
             b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover, b.book_size, b.pages as book_pages,
             dc.title AS digital_title, COALESCE(dc.cover_url, '') AS digital_cover, NULL AS digital_author
      FROM quizzes q
      LEFT JOIN books b ON q.book_id = b.id
      LEFT JOIN digital_content dc ON q.digital_content_id = dc.id
      WHERE (q.status = 'PUBLISHED' OR q.status IS NULL OR q.status = '') 
        AND (LOWER(q.school_code) = LOWER($1) OR q.school_code = 'GLOBAL' OR q.school_code = 'DPS123' OR q.school_code = 'DEMO01' OR q.school_code IS NULL OR q.school_code = '')
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

    // Fetch reading verification events (confirmed points awarded)
    const verifRes = await query(`
      SELECT * FROM reading_verification_events
      WHERE student_id = $1 AND passed = 1
    `, [studentId]);
    const verifiedEvents = verifRes.rows || [];

    const offlineQuizzes = [];
    const digitalQuizzes = [];

    for (const qz of quizzes) {
      const isOffline = (qz.library_type || 'OFFLINE').toUpperCase() === 'OFFLINE';
      const maxAttempts = parseInt(qz.max_attempts, 10) || 3;
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

      // Check deadline & unlock dates
      const unlockDate = qz.unlock_date ? new Date(qz.unlock_date) : null;
      const deadlineDate = qz.points_deadline ? new Date(qz.points_deadline) : null;

      let isDateLocked = false;
      let unlockRemainingDays = 0;
      let isExpiredForPoints = false;
      let daysRemainingForPoints = 0;

      if (unlockDate && now < unlockDate && !qz.librarian_override) {
        isDateLocked = true;
        unlockRemainingDays = Math.ceil((unlockDate - now) / (1000 * 60 * 60 * 24));
      }

      if (deadlineDate) {
        if (now > deadlineDate) {
          isExpiredForPoints = true;
        } else {
          daysRemainingForPoints = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
        }
      }

      // Check Verification Points Status
      const isVerified = verifiedEvents.some(v =>
        (isOffline && qz.book_id && v.book_id === qz.book_id) ||
        (!isOffline && qz.digital_content_id && v.digital_content_id === qz.digital_content_id)
      );

      // Check Reading Eligibility
      let eligible = false;
      let lockReason = '';
      let readingProgress = 0;
      let readingTimeMinutes = 0;

      if (isOffline) {
        if (!qz.book_id) {
          // If no specific book attached, skip from offline reading list
          continue;
        } else {
          // Strict user requirement: ONLY show the quiz for books which are issued or returned for this student!
          const reading = offlineReadings.find(r => r.book_id === qz.book_id);
          if (!reading) {
            // Student has never borrowed or been issued this book -> DO NOT SHOW
            continue;
          }

          // Use reading-specific unlock date or override if set
          const studentUnlockDate = reading.unlock_date ? new Date(reading.unlock_date) : unlockDate;
          const studentOverride = reading.librarian_override === 1;
          const isReturned = (reading.return_date || String(reading.return_status).includes('RETURNED'));

          if (reading.quiz_status === 'LOCKED' && !studentOverride) {
            eligible = false;
            isDateLocked = true;
            if (studentUnlockDate && now < studentUnlockDate) {
              unlockRemainingDays = Math.ceil((studentUnlockDate - now) / (1000 * 60 * 60 * 24));
              lockReason = `Scheduled reading duration: unlocks in ${unlockRemainingDays} day(s) on ${studentUnlockDate.toLocaleDateString()}.`;
            } else {
              lockReason = 'Quiz is locked by the librarian for ongoing reading verification.';
            }
          } else if (studentOverride || reading.quiz_status === 'UNLOCKED' || reading.quiz_status === 'ELIGIBLE') {
            eligible = true;
            isDateLocked = false;
            lockReason = '';
          } else if (studentUnlockDate && now < studentUnlockDate && !isReturned) {
            isDateLocked = true;
            unlockRemainingDays = Math.ceil((studentUnlockDate - now) / (1000 * 60 * 60 * 24));
            lockReason = `Scheduled reading duration: unlocks in ${unlockRemainingDays} day(s) on ${studentUnlockDate.toLocaleDateString()}.`;
          } else {
            eligible = true;
            isDateLocked = false;
          }
        }
      } else {
        // Digital reading eligibility
        const reading = digitalReadings.find(r => r.content_id === qz.digital_content_id);
        if (!reading) {
          lockReason = 'Read this digital book in the E-Library to unlock its verification quiz.';
        } else if (reading.librarian_override === 1 || qz.librarian_override === 1) {
          eligible = true;
        } else if (reading.retry_locked === 1) {
          lockReason = 'Quiz failed (<80%). Please reread the chapter to unlock a new quiz variant.';
        } else {
          readingProgress = parseInt(reading.progress_percentage, 10) || 0;
          readingTimeMinutes = Math.round((parseInt(reading.total_reading_time, 10) || 0) / 60);
          if (reading.quiz_status === 'ELIGIBLE' || readingProgress >= 80) {
            eligible = true;
          } else {
            lockReason = `Requires at least 80% meaningful reading (Current progress: ${readingProgress}%).`;
          }
        }
      }

      // Overall Card Status & User Filtering State: LOCKED, UNLOCKED, TRASHED, COMPLETED
      let cardStatus = 'LOCKED';
      let filterStatus = 'LOCKED'; // 'UNLOCKED' | 'LOCKED' | 'TRASHED' | 'COMPLETED'

      if (hasPassed && isVerified) {
        cardStatus = 'PASSED';
        filterStatus = 'COMPLETED';
      } else if (hasPassed) {
        cardStatus = 'COMPLETED_NO_POINTS';
        filterStatus = 'COMPLETED';
      } else if (inProgressAttempt) {
        cardStatus = 'IN_PROGRESS';
        filterStatus = 'UNLOCKED';
      } else if (isExpiredForPoints) {
        cardStatus = 'EXPIRED_AVAILABLE';
        filterStatus = 'TRASHED';
      } else if (attemptsRemaining <= 0) {
        cardStatus = 'MAX_ATTEMPTS_REACHED';
        filterStatus = 'COMPLETED';
      } else if (eligible && !isDateLocked) {
        cardStatus = 'AVAILABLE';
        filterStatus = 'UNLOCKED';
      } else {
        cardStatus = 'LOCKED';
        filterStatus = 'LOCKED';
      }

      const quizCard = {
        id: qz.id,
        title: qz.title,
        description: qz.description,
        library_type: qz.library_type,
        difficulty: qz.difficulty || 'MEDIUM',
        time_limit: qz.time_limit || 20,
        passing_percentage: qz.passing_percentage || settings.passing_percentage || 80,
        max_attempts: maxAttempts,
        attempts_used: attemptsUsed,
        attempts_remaining: attemptsRemaining,
        best_score: bestScore,
        has_passed: hasPassed,
        is_verified: isVerified,
        points_available: isExpiredForPoints ? 0 : settings.points_awarded,
        is_expired_for_points: isExpiredForPoints,
        days_remaining_for_points: daysRemainingForPoints,
        unlock_date: qz.unlock_date,
        points_deadline: qz.points_deadline,
        card_status: cardStatus,
        filter_status: filterStatus,
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
 * Prepares quiz session, verifies unlock date & retry locks, resumes active attempts
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
        AND (LOWER(q.school_code) = LOWER($2) OR q.school_code = 'GLOBAL' OR q.school_code = 'DPS123' OR q.school_code = 'DEMO01' OR q.school_code IS NULL OR q.school_code = '')
    `, [quizId, sCode]);

    if (!qzRes.rows || qzRes.rows.length === 0) {
      req.flash('error', 'Quiz not found or not published for your school');
      return res.redirect('/student?module=learn');
    }
    const quiz = qzRes.rows[0];
    const isOffline = (quiz.library_type || 'OFFLINE').toUpperCase() === 'OFFLINE';
    const now = new Date();

    // Check Unlock Date
    if (quiz.unlock_date && !quiz.librarian_override) {
      const unlockDate = new Date(quiz.unlock_date);
      if (now < unlockDate) {
        const remainingDays = Math.ceil((unlockDate - now) / (1000 * 60 * 60 * 24));
        return res.render('quiz_locked', {
          title: 'Quiz Locked - Librika',
          quiz,
          message: `This quiz unlocks in ${remainingDays} day(s) on ${unlockDate.toLocaleDateString()} to allow adequate reading time. Return to the book and take the quiz once unlocked!`
        });
      }
    }

    // Verify Eligibility
    if (isOffline) {
      if (quiz.book_id) {
        const obrRes = await query(
          'SELECT * FROM offline_book_readings WHERE student_id = $1 AND book_id = $2',
          [studentId, quiz.book_id]
        );
        const obr = obrRes.rows && obrRes.rows[0];
        if (!obr && !quiz.librarian_override) {
          return res.render('quiz_locked', {
            title: 'Quiz Locked - Librika',
            quiz,
            message: 'You have not borrowed this book. Please issue this physical book from the library desk to unlock verification.'
          });
        }
      }
    } else {
      const dbrRes = await query(
        'SELECT * FROM digital_book_readings WHERE student_id = $1 AND content_id = $2',
        [studentId, quiz.digital_content_id]
      );
      const dbr = dbrRes.rows && dbrRes.rows[0];
      if (dbr && dbr.retry_locked === 1 && !quiz.librarian_override) {
        return res.render('quiz_locked', {
          title: 'Quiz Retry Locked - Librika',
          quiz,
          message: 'You scored below 80% on this quiz. To protect reading integrity, please reread this book before attempting a new quiz variant.'
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
    const maxAttempts = parseInt(quiz.max_attempts, 10) || 3;
    if (!activeAttempt && previousAttempts.length >= maxAttempts) {
      req.flash('error', `You have reached the maximum attempt limit (${maxAttempts}) for this quiz.`);
      return res.redirect('/student?module=learn');
    }

    const nowFormatted = nowIso();

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
        nowFormatted
      ]);

      const lastAttRes = await query(
        'SELECT * FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2 AND status = \'IN_PROGRESS\' ORDER BY id DESC LIMIT 1',
        [quiz.id, studentId]
      );
      activeAttempt = lastAttRes.rows && lastAttRes.rows[0];
    }

    // Fetch quiz questions
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

    const timeLimitMinutes = parseInt(quiz.time_limit, 10) || 20;
    const startTime = new Date(activeAttempt.started_at).getTime();
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const totalAllowedSeconds = timeLimitMinutes * 60;
    const secondsRemaining = Math.max(0, totalAllowedSeconds - elapsedSeconds);

    // Check Points Expiry State
    const deadlineDate = quiz.points_deadline ? new Date(quiz.points_deadline) : null;
    const isPointsExpired = deadlineDate ? (now > deadlineDate) : false;

    return res.render('take_quiz', {
      title: `${quiz.title} - Librika Quiz`,
      quiz,
      attempt: activeAttempt,
      questions,
      secondsRemaining,
      timeLimitMinutes,
      isPointsExpired,
      pointsDeadline: quiz.points_deadline,
      passingPercentage: quiz.passing_percentage || 80
    });
  } catch (err) {
    console.error('getTakeQuiz error:', err);
    req.flash('error', 'Unable to start quiz: ' + err.message);
    return res.redirect('/student?module=learn');
  }
}

/**
 * 3. POST /api/quizzes/:id/submit
 * Comprehensive Grading Engine via quizVerificationService
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

    // Grade and verify through service
    const gradingResult = await quizVerificationService.processQuizSubmissionGrading({
      quizId,
      attemptId: attempt_id,
      studentId,
      schoolCode: sCode,
      answers,
      timeTakenSeconds: parseInt(time_taken_seconds, 10) || 0
    });

    return res.json({
      status: 'success',
      passed: gradingResult.passed,
      percentage: gradingResult.percentage,
      score: gradingResult.score,
      total_marks: gradingResult.totalMarks,
      points_awarded: gradingResult.pointsAwarded,
      is_expired: gradingResult.isExpired,
      message: gradingResult.verificationMessage,
      evaluated_questions: gradingResult.evaluatedQuestions,
      redirect_url: `/quizzes/${quizId}/results/${attempt_id}`
    });
  } catch (err) {
    console.error('postSubmitQuizAttempt error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/**
 * 4. GET /quizzes/:id/results/:attemptId
 * Renders quiz result review screen
 */
async function getQuizResult(req, res) {
  try {
    const studentId = req.session.user_id;
    const { id, attemptId } = req.params;

    if (!studentId) return res.redirect('/login');

    const attRes = await query(`
      SELECT qa.*, q.title as quiz_title, q.passing_percentage, q.points_deadline,
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

    // Check if points were awarded for this attempt
    const verifRes = await query(`
      SELECT points_awarded FROM reading_verification_events WHERE attempt_id = $1
    `, [attemptId]).catch(() => ({ rows: [] }));
    const pointsAwarded = (verifRes.rows && verifRes.rows[0]) ? verifRes.rows[0].points_awarded : (attempt.points_awarded || 0);

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
      attempt: {
        ...attempt,
        points_awarded: pointsAwarded
      },
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
 * AI Quiz Generator for Librarians/Admins with page distribution
 */
async function postGenerateAiQuiz(req, res) {
  try {
    const { book_id, digital_content_id, library_type = 'OFFLINE', num_questions = 10, difficulty = 'MEDIUM' } = req.body;
    let title = '';
    let author = '';
    let summary = '';
    let bookObj = null;

    if (library_type === 'OFFLINE' && book_id) {
      const bRes = await query('SELECT * FROM books WHERE id = $1', [book_id]);
      if (bRes.rows && bRes.rows[0]) {
        bookObj = bRes.rows[0];
        title = bookObj.title;
        author = bookObj.author;
        summary = bookObj.description || bookObj.subject || '';
      }
    } else if (digital_content_id) {
      const dcRes = await query('SELECT * FROM digital_content WHERE id = $1', [digital_content_id]);
      if (dcRes.rows && dcRes.rows[0]) {
        title = dcRes.rows[0].title;
        author = dcRes.rows[0].author;
        summary = dcRes.rows[0].description || dcRes.rows[0].category || '';
      }
    }

    if (!title) {
      return res.status(400).json({ status: 'error', message: 'Valid book or digital content ID required' });
    }

    let questions = [];
    if (bookObj) {
      questions = await quizVerificationService.generateUniqueQuestionsForBook(bookObj, parseInt(num_questions, 10) || 10);
    } else {
      const prompt = `Generate a ${num_questions}-question multiple-choice quiz of ${difficulty} difficulty for students reading:
Title: "${title}"
Author: "${author}"
Context: "${summary}"
Ensure 4 options per question, correct answer, explanation, and broad coverage. Return ONLY JSON array of objects.`;
      const aiRes = await callAI(prompt, { jsonMode: true, temperature: 0.3 });
      const clean = aiRes.replace(/```json/gi, '').replace(/```/g, '').trim();
      questions = JSON.parse(clean);
    }

    return res.json({
      status: 'success',
      title: `${title} - Reading Verification Quiz`,
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
      passing_percentage = 80,
      time_limit = 20,
      max_attempts = 3,
      status = 'PUBLISHED',
      unlock_date,
      points_deadline,
      questions = []
    } = req.body;

    if (!title) return res.status(400).json({ status: 'error', message: 'Quiz title is required' });

    let quizId = id;
    const now = nowIso();

    if (quizId) {
      await query(`
        UPDATE quizzes
        SET title = $1, description = $2, library_type = $3, book_id = $4, digital_content_id = $5,
            difficulty = $6, passing_percentage = $7, time_limit = $8, max_attempts = $9, status = $10,
            unlock_date = $11, points_deadline = $12, updated_at = $13
        WHERE id = $14
      `, [title, description, library_type, book_id || null, digital_content_id || null, difficulty, passing_percentage, time_limit, max_attempts, status, unlock_date || null, points_deadline || null, now, quizId]);
    } else {
      const insertRes = await query(`
        INSERT INTO quizzes (title, description, library_type, book_id, digital_content_id, school_code, difficulty, passing_percentage, time_limit, max_attempts, status, unlock_date, points_deadline, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [title, description, library_type, book_id || null, digital_content_id || null, sCode, difficulty, passing_percentage, time_limit, max_attempts, status, unlock_date || null, points_deadline || null, librarianId, now, now]);

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
 * Admin list of active issued and returned student quizzes & readings
 * Shows the exact student (e.g. Ananya Gupta), book, quiz status, and override controls.
 */
async function getAdminQuizzesList(req, res) {
  try {
    const sCode = req.session.school_code || 'GLOBAL';

    // Fetch active student-specific book readings and their linked quizzes
    const studentQuizzesRes = await query(`
      SELECT obr.id as reading_id, obr.student_id, obr.book_id, obr.transaction_id,
             obr.issue_date, obr.due_date, obr.return_date, obr.return_status,
             obr.quiz_status, obr.librarian_override, obr.unlock_date, obr.points_deadline,
             u.name as student_name, COALESCE(u.class, 'Class 10') as student_class, u.phone as student_phone,
             b.title as book_title, b.author as book_author, b.pages as book_pages, b.cover_url as book_cover,
             qz.id as quiz_id, qz.title as quiz_title, qz.passing_percentage, qz.question_count,
             (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = qz.id AND qa.student_id = obr.student_id) as student_attempts,
             (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = qz.id AND qa.student_id = obr.student_id AND qa.passed = 1) as student_passed
      FROM offline_book_readings obr
      JOIN users u ON obr.student_id = u.id
      JOIN books b ON obr.book_id = b.id
      LEFT JOIN quizzes qz ON qz.id = (
        SELECT id FROM quizzes 
        WHERE (id = obr.quiz_variant_id OR book_id = b.id)
        ORDER BY id ASC LIMIT 1
      )
      WHERE (LOWER(obr.school_code) = LOWER($1) OR obr.school_code = 'GLOBAL' OR obr.school_code = 'DPS123' OR obr.school_code = 'DEMO01' OR obr.school_code IS NULL OR obr.school_code = '')
      ORDER BY obr.id DESC
    `, [sCode]);

    return res.json({ status: 'success', quizzes: studentQuizzesRes.rows || [] });
  } catch (err) {
    console.error('getAdminQuizzesList error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/**
 * 8. POST /admin/api/quizzes/:id/override
 * Librarian Override: Unlocks or manages quiz for a specific student's issued reading!
 */
async function postLibrarianQuizOverride(req, res) {
  try {
    const quizOrReadingId = req.params.id;
    const { action, reading_id, student_id, custom_unlock_date, extend_days } = req.body;
    const now = nowIso();

    const targetReadingId = reading_id || quizOrReadingId;

    // Check if matching offline_book_readings row exists
    let obrRes = await query('SELECT * FROM offline_book_readings WHERE id = $1', [targetReadingId]);
    if (!obrRes.rows || obrRes.rows.length === 0) {
      if (student_id) {
        obrRes = await query('SELECT * FROM offline_book_readings WHERE student_id = $1 AND book_id = $2 ORDER BY id DESC LIMIT 1', [student_id, quizOrReadingId]);
      }
    }

    const reading = obrRes.rows && obrRes.rows[0];

    if (action === 'UNLOCK_NOW') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Manual quiz unlocking is disabled. Quizzes automatically unlock according to book page reading duration schedules.' 
      });
    }

    if (action === 'LOCK') {
      if (reading) {
        await query(`
          UPDATE offline_book_readings
          SET quiz_status = 'LOCKED', librarian_override = 0, unlock_date = NULL
          WHERE id = $1
        `, [reading.id]);
        return res.json({ status: 'success', message: `Quiz locked for this student.` });
      } else {
        await query(`UPDATE quizzes SET librarian_override = 0, status = 'DRAFT' WHERE id = $1`, [quizOrReadingId]);
        return res.json({ status: 'success', message: 'Quiz locked.' });
      }
    }

    if (action === 'EXTEND_DEADLINE') {
      const days = parseInt(extend_days, 10) || 7;
      if (reading) {
        const curDeadline = reading.points_deadline ? new Date(reading.points_deadline) : new Date();
        const newDeadline = new Date(curDeadline.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
        await query(`
          UPDATE offline_book_readings
          SET points_deadline = $1
          WHERE id = $2
        `, [newDeadline, reading.id]);
        return res.json({ status: 'success', message: `Deadline extended by ${days} days for this student!` });
      }
    }

    return res.status(400).json({ status: 'error', message: 'Invalid override action specified' });
  } catch (err) {
    console.error('postLibrarianQuizOverride error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/**
 * 9. GET /admin/api/quiz-settings
 * Fetch configurable quiz settings for Librarian Settings Panel
 */
async function getAdminQuizSettings(req, res) {
  try {
    const sCode = req.session.school_code || 'DPS123';
    const settings = await quizVerificationService.getQuizSettings(sCode);
    return res.json({ status: 'success', settings });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/**
 * 10. POST /admin/api/quiz-settings
 * Update configurable quiz settings from Librarian Settings Panel
 */
async function postAdminQuizSettings(req, res) {
  try {
    const sCode = req.session.school_code || 'DPS123';
    const settingsToSave = req.body;

    for (const [key, val] of Object.entries(settingsToSave)) {
      if (!key.startsWith('quiz_')) continue;
      const sVal = String(val);
      const ex = await query('SELECT id FROM library_settings WHERE school_code = $1 AND setting_key = $2', [sCode, key]);
      if (ex.rows && ex.rows.length > 0) {
        await query('UPDATE library_settings SET setting_value = $1 WHERE id = $2', [sVal, ex.rows[0].id]);
      } else {
        await query('INSERT INTO library_settings (school_code, setting_key, setting_value) VALUES ($1, $2, $3)', [sCode, key, sVal]);
      }
    }

    const updated = await quizVerificationService.getQuizSettings(sCode);
    return res.json({
      status: 'success',
      message: 'Quiz & Reading Verification rules saved successfully!',
      settings: updated
    });
  } catch (err) {
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
  getAdminQuizzesList,
  postLibrarianQuizOverride,
  getAdminQuizSettings,
  postAdminQuizSettings
};
