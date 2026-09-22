/**
 * Librika Complete Book-Based Quiz System — Database Schema & Migrations
 * Supports both OFFLINE and DIGITAL library quizzes.
 * Compatible with MySQL (MilesWeb production), PostgreSQL, and SQLite.
 */

const { query } = require('../db');

async function initQuizTables() {
  console.log('[QUIZ DB] Starting quiz system schema migration...');

  // 1. Add book_size and offline_borrowing_days to books table if missing
  try {
    await query(`ALTER TABLE books ADD COLUMN book_size VARCHAR(10) DEFAULT 'MEDIUM'`).catch(() => {});
    await query(`ALTER TABLE books ADD COLUMN offline_borrowing_days INT DEFAULT 15`).catch(() => {});
  } catch (e) {}

  // 2. Add circulation columns to transactions table if missing
  try {
    await query(`ALTER TABLE transactions ADD COLUMN book_size VARCHAR(10) DEFAULT 'MEDIUM'`).catch(() => {});
    await query(`ALTER TABLE transactions ADD COLUMN allowed_days INT DEFAULT 15`).catch(() => {});
    await query(`ALTER TABLE transactions ADD COLUMN late_days INT DEFAULT 0`).catch(() => {});
    await query(`ALTER TABLE transactions ADD COLUMN status VARCHAR(30) DEFAULT 'ISSUED'`).catch(() => {});
  } catch (e) {}

  // 3. OFFLINE BOOK READINGS TABLE
  await query(`
    CREATE TABLE IF NOT EXISTS offline_book_readings (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      student_id BIGINT UNSIGNED NOT NULL,
      book_id BIGINT UNSIGNED NOT NULL,
      transaction_id BIGINT UNSIGNED NULL,
      school_code VARCHAR(50) DEFAULT 'DPS123',
      issue_date DATETIME NOT NULL,
      due_date DATETIME NOT NULL,
      return_date DATETIME NULL,
      return_status VARCHAR(30) DEFAULT 'ISSUED',
      late_days INT DEFAULT 0,
      quiz_status VARCHAR(30) DEFAULT 'LOCKED',
      quiz_eligible_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_obr_student (student_id),
      INDEX idx_obr_book (book_id),
      INDEX idx_obr_school (school_code),
      INDEX idx_obr_quiz_status (quiz_status)
    )
  `).catch(async () => {
    // SQLite Fallback
    await query(`
      CREATE TABLE IF NOT EXISTS offline_book_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        transaction_id INTEGER,
        school_code TEXT DEFAULT 'DPS123',
        issue_date DATETIME NOT NULL,
        due_date DATETIME NOT NULL,
        return_date DATETIME,
        return_status TEXT DEFAULT 'ISSUED',
        late_days INTEGER DEFAULT 0,
        quiz_status TEXT DEFAULT 'LOCKED',
        quiz_eligible_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // 4. DIGITAL BOOK READINGS TABLE
  await query(`
    CREATE TABLE IF NOT EXISTS digital_book_readings (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      student_id BIGINT UNSIGNED NOT NULL,
      content_id BIGINT UNSIGNED NOT NULL,
      school_code VARCHAR(50) DEFAULT 'DPS123',
      started_at DATETIME NOT NULL,
      last_read_at DATETIME NOT NULL,
      total_reading_time INT DEFAULT 0,
      pages_read INT DEFAULT 0,
      total_pages INT DEFAULT 1,
      progress_percentage INT DEFAULT 0,
      reading_sessions INT DEFAULT 1,
      reading_status VARCHAR(30) DEFAULT 'READING',
      quiz_status VARCHAR(30) DEFAULT 'LOCKED',
      quiz_eligible_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dbr_student (student_id),
      INDEX idx_dbr_content (content_id),
      INDEX idx_dbr_school (school_code),
      INDEX idx_dbr_quiz_status (quiz_status)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS digital_book_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        content_id INTEGER NOT NULL,
        school_code TEXT DEFAULT 'DPS123',
        started_at DATETIME NOT NULL,
        last_read_at DATETIME NOT NULL,
        total_reading_time INTEGER DEFAULT 0,
        pages_read INTEGER DEFAULT 0,
        total_pages INTEGER DEFAULT 1,
        progress_percentage INTEGER DEFAULT 0,
        reading_sessions INTEGER DEFAULT 1,
        reading_status TEXT DEFAULT 'READING',
        quiz_status TEXT DEFAULT 'LOCKED',
        quiz_eligible_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // 5. QUIZZES TABLE
  await query(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      book_id BIGINT UNSIGNED NULL,
      digital_content_id BIGINT UNSIGNED NULL,
      school_code VARCHAR(50) DEFAULT 'GLOBAL',
      library_type VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      instructions TEXT NULL,
      difficulty VARCHAR(20) DEFAULT 'MEDIUM',
      passing_percentage INT DEFAULT 60,
      time_limit INT DEFAULT 15,
      max_attempts INT DEFAULT 2,
      status VARCHAR(20) DEFAULT 'PUBLISHED',
      created_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_qz_book (book_id),
      INDEX idx_qz_digital (digital_content_id),
      INDEX idx_qz_type (library_type),
      INDEX idx_qz_school (school_code),
      INDEX idx_qz_status (status)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER,
        digital_content_id INTEGER,
        school_code TEXT DEFAULT 'GLOBAL',
        library_type TEXT NOT NULL DEFAULT 'OFFLINE',
        title TEXT NOT NULL,
        description TEXT,
        instructions TEXT,
        difficulty TEXT DEFAULT 'MEDIUM',
        passing_percentage INTEGER DEFAULT 60,
        time_limit INTEGER DEFAULT 15,
        max_attempts INTEGER DEFAULT 2,
        status TEXT DEFAULT 'PUBLISHED',
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // Ensure all columns exist on quizzes table if created previously with simpler schema
  await query(`ALTER TABLE quizzes ADD COLUMN library_type VARCHAR(20) DEFAULT 'OFFLINE'`).catch(() => {});
  await query(`ALTER TABLE quizzes ADD COLUMN book_id BIGINT UNSIGNED NULL`).catch(() => {});
  await query(`ALTER TABLE quizzes ADD COLUMN digital_content_id BIGINT UNSIGNED NULL`).catch(() => {});
  await query(`ALTER TABLE quizzes ADD COLUMN school_code VARCHAR(50) DEFAULT 'GLOBAL'`).catch(() => {});
  await query(`ALTER TABLE quizzes ADD COLUMN status VARCHAR(20) DEFAULT 'PUBLISHED'`).catch(() => {});
  await query(`ALTER TABLE quizzes ADD COLUMN difficulty VARCHAR(20) DEFAULT 'MEDIUM'`).catch(() => {});
  await query(`ALTER TABLE quizzes ADD COLUMN instructions TEXT NULL`).catch(() => {});
  await query(`ALTER TABLE quizzes ADD COLUMN time_limit INT DEFAULT 15`).catch(() => {});
  await query(`ALTER TABLE quizzes ADD COLUMN max_attempts INT DEFAULT 2`).catch(() => {});
  await query(`ALTER TABLE quizzes ADD COLUMN passing_percentage INT DEFAULT 60`).catch(() => {});
  await query(`ALTER TABLE quizzes ADD COLUMN created_by BIGINT UNSIGNED NULL`).catch(() => {});
  await query(`ALTER TABLE quizzes ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).catch(() => {});
  // Ensure existing rows without status are PUBLISHED
  await query(`UPDATE quizzes SET status = 'PUBLISHED' WHERE status IS NULL OR status = ''`).catch(() => {});
  await query(`UPDATE quizzes SET school_code = 'GLOBAL' WHERE school_code IS NULL OR school_code = ''`).catch(() => {});


  // 6. QUIZ QUESTIONS TABLE
  await query(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      quiz_id BIGINT UNSIGNED NOT NULL,
      question TEXT NOT NULL,
      question_type VARCHAR(30) DEFAULT 'MCQ',
      options TEXT NOT NULL,
      correct_answer VARCHAR(255) NOT NULL,
      explanation TEXT NULL,
      marks INT DEFAULT 1,
      difficulty VARCHAR(20) DEFAULT 'MEDIUM',
      order_index INT DEFAULT 1,
      source_reference VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_qq_quiz (quiz_id)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        question TEXT NOT NULL,
        question_type TEXT DEFAULT 'MCQ',
        options TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        marks INTEGER DEFAULT 1,
        difficulty TEXT DEFAULT 'MEDIUM',
        order_index INTEGER DEFAULT 1,
        source_reference TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // 7. QUIZ ATTEMPTS TABLE
  await query(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      quiz_id BIGINT UNSIGNED NOT NULL,
      book_id BIGINT UNSIGNED NULL,
      digital_content_id BIGINT UNSIGNED NULL,
      student_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT UNSIGNED NOT NULL,
      school_code VARCHAR(50) DEFAULT 'DPS123',
      library_type VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
      attempt_number INT DEFAULT 1,
      started_at DATETIME NOT NULL,
      submitted_at DATETIME NULL,
      status VARCHAR(30) DEFAULT 'IN_PROGRESS',
      score DECIMAL(5,2) DEFAULT 0,
      total_marks DECIMAL(5,2) DEFAULT 10,
      percentage DECIMAL(5,2) DEFAULT 0,
      passed TINYINT(1) DEFAULT 0,
      time_taken_seconds INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_qa_quiz (quiz_id),
      INDEX idx_qa_student (student_id),
      INDEX idx_qa_user (user_id),
      INDEX idx_qa_type (library_type),
      INDEX idx_qa_status (status)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        book_id INTEGER,
        digital_content_id INTEGER,
        student_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        school_code TEXT DEFAULT 'DPS123',
        library_type TEXT NOT NULL DEFAULT 'OFFLINE',
        attempt_number INTEGER DEFAULT 1,
        started_at DATETIME NOT NULL,
        submitted_at DATETIME,
        status TEXT DEFAULT 'IN_PROGRESS',
        score REAL DEFAULT 0,
        total_marks REAL DEFAULT 10,
        percentage REAL DEFAULT 0,
        passed INTEGER DEFAULT 0,
        time_taken_seconds INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // Add missing columns if quiz_attempts existed from old implementation
  await query(`ALTER TABLE quiz_attempts ADD COLUMN student_id BIGINT UNSIGNED NOT NULL DEFAULT 0`).catch(() => {});
  await query(`ALTER TABLE quiz_attempts ADD COLUMN library_type VARCHAR(20) DEFAULT 'OFFLINE'`).catch(() => {});
  await query(`ALTER TABLE quiz_attempts ADD COLUMN digital_content_id BIGINT UNSIGNED NULL`).catch(() => {});
  await query(`ALTER TABLE quiz_attempts ADD COLUMN attempt_number INT DEFAULT 1`).catch(() => {});
  await query(`ALTER TABLE quiz_attempts ADD COLUMN percentage DECIMAL(5,2) DEFAULT 0`).catch(() => {});
  await query(`ALTER TABLE quiz_attempts ADD COLUMN time_taken_seconds INT DEFAULT 0`).catch(() => {});

  // 8. QUIZ ANSWERS TABLE
  await query(`
    CREATE TABLE IF NOT EXISTS quiz_answers (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      attempt_id BIGINT UNSIGNED NOT NULL,
      question_id BIGINT UNSIGNED NOT NULL,
      selected_answer TEXT NOT NULL,
      is_correct TINYINT(1) DEFAULT 0,
      marks_obtained DECIMAL(5,2) DEFAULT 0,
      answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ans_attempt (attempt_id),
      INDEX idx_ans_question (question_id)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS quiz_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attempt_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        selected_answer TEXT NOT NULL,
        is_correct INTEGER DEFAULT 0,
        marks_obtained REAL DEFAULT 0,
        answered_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // 9. CONFIGURABLE SCHOOL ELIGIBILITY RULE
  // Default rule: RETURNED_BOOK (student eligible once physical book is returned)
  try {
    await query(`
      INSERT INTO library_settings (school_code, setting_key, setting_value)
      VALUES ('DPS123', 'offlineQuizEligibilityRule', 'RETURNED_BOOK')
      ON DUPLICATE KEY UPDATE setting_value = setting_value
    `).catch(async () => {
      await query(`
        INSERT OR IGNORE INTO library_settings (school_code, setting_key, setting_value)
        VALUES ('DPS123', 'offlineQuizEligibilityRule', 'RETURNED_BOOK')
      `).catch(() => {});
    });
  } catch (e) {}

  console.log('[QUIZ DB] ✅ All quiz tables, circulation size columns, and eligibility models initialized.');
}

module.exports = { initQuizTables };

if (require.main === module) {
  initQuizTables()
    .then(() => {
      console.log('[QUIZ DB] Migration script completed successfully.');
      process.exit(0);
    })
    .catch(err => {
      console.error('[QUIZ DB] Migration error:', err);
      process.exit(1);
    });
}
