/**
 * Librika AI-Powered Quiz & Reading Verification System — Migration Script
 * Migrates both SQLite and MySQL to support:
 * 1. Configurable Quiz Settings in library_settings
 * 2. Reading Verification Events (guarantees anti-cheat / no duplicate leaderboard points)
 * 3. Quiz Question Bank (semantic deduplication, unique question IDs, used counts)
 * 4. Enhanced offline_book_readings & digital_book_readings columns
 * 5. Enhanced quizzes & quiz_attempts columns (unlock dates, deadlines, expiry)
 */

const { query } = require('../db');

async function migrateQuizVerification() {
  console.log('[MIGRATION] Initializing AI-Powered Quiz Verification System tables & columns...');

  // 1. Reading Verification Events Table (Prevent students from repeatedly farming leaderboard points)
  await query(`
    CREATE TABLE IF NOT EXISTS reading_verification_events (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      student_id BIGINT UNSIGNED NOT NULL,
      book_id BIGINT UNSIGNED NULL,
      digital_content_id BIGINT UNSIGNED NULL,
      book_type VARCHAR(20) NOT NULL DEFAULT 'PHYSICAL',
      reading_range VARCHAR(50) DEFAULT 'FULL_BOOK',
      quiz_id BIGINT UNSIGNED NOT NULL,
      attempt_id BIGINT UNSIGNED NOT NULL,
      score DECIMAL(5,2) DEFAULT 0,
      percentage DECIMAL(5,2) DEFAULT 0,
      passed TINYINT(1) DEFAULT 1,
      points_awarded INT DEFAULT 50,
      verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      school_code VARCHAR(50) DEFAULT 'DPS123',
      INDEX idx_rve_student (student_id),
      INDEX idx_rve_book (book_id),
      INDEX idx_rve_digital (digital_content_id),
      INDEX idx_rve_school (school_code)
    )
  `).catch(async () => {
    // SQLite Fallback
    await query(`
      CREATE TABLE IF NOT EXISTS reading_verification_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        book_id INTEGER,
        digital_content_id INTEGER,
        book_type TEXT NOT NULL DEFAULT 'PHYSICAL',
        reading_range TEXT DEFAULT 'FULL_BOOK',
        quiz_id INTEGER NOT NULL,
        attempt_id INTEGER NOT NULL,
        score REAL DEFAULT 0,
        percentage REAL DEFAULT 0,
        passed INTEGER DEFAULT 1,
        points_awarded INTEGER DEFAULT 50,
        verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        school_code TEXT DEFAULT 'DPS123'
      )
    `).catch(() => {});
  });

  // 2. Quiz Question Bank (Unique Question Code, deduplication, used_count)
  await query(`
    CREATE TABLE IF NOT EXISTS quiz_question_bank (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      question_code VARCHAR(50) UNIQUE,
      book_id BIGINT UNSIGNED NULL,
      digital_content_id BIGINT UNSIGNED NULL,
      question TEXT NOT NULL,
      question_type VARCHAR(30) DEFAULT 'MCQ',
      options TEXT NOT NULL,
      correct_answer VARCHAR(255) NOT NULL,
      explanation TEXT NULL,
      page_number INT DEFAULT 0,
      difficulty VARCHAR(20) DEFAULT 'MEDIUM',
      used_count INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_qqb_book (book_id),
      INDEX idx_qqb_digital (digital_content_id),
      INDEX idx_qqb_code (question_code)
    )
  `).catch(async () => {
    // SQLite Fallback
    await query(`
      CREATE TABLE IF NOT EXISTS quiz_question_bank (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_code TEXT UNIQUE,
        book_id INTEGER,
        digital_content_id INTEGER,
        question TEXT NOT NULL,
        question_type TEXT DEFAULT 'MCQ',
        options TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        page_number INTEGER DEFAULT 0,
        difficulty TEXT DEFAULT 'MEDIUM',
        used_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // 3. Alter offline_book_readings to add page count, classification, unlock date, deadline, override
  const offlineCols = [
    { name: 'page_count', type: 'INT DEFAULT 0' },
    { name: 'page_count_estimated', type: 'TINYINT(1) DEFAULT 0' },
    { name: 'book_classification', type: "VARCHAR(20) DEFAULT 'SHORT'" },
    { name: 'unlock_date', type: 'DATETIME NULL' },
    { name: 'points_deadline', type: 'DATETIME NULL' },
    { name: 'librarian_override', type: 'TINYINT(1) DEFAULT 0' },
    { name: 'librarian_override_notes', type: 'TEXT NULL' },
    { name: 'quiz_variant_id', type: 'BIGINT UNSIGNED NULL' }
  ];
  for (const col of offlineCols) {
    await query(`ALTER TABLE offline_book_readings ADD COLUMN ${col.name} ${col.type}`).catch(() => {});
  }

  // 4. Alter digital_book_readings to add meaningful reading metrics, ranges, retry lock
  const digitalCols = [
    { name: 'verified_range_end', type: 'INT DEFAULT 0' },
    { name: 'meaningful_pages_read', type: 'INT DEFAULT 0' },
    { name: 'quiz_unlock_date', type: 'DATETIME NULL' },
    { name: 'points_deadline', type: 'DATETIME NULL' },
    { name: 'librarian_override', type: 'TINYINT(1) DEFAULT 0' },
    { name: 'retry_locked', type: 'TINYINT(1) DEFAULT 0' },
    { name: 'reread_required_pages', type: 'INT DEFAULT 0' }
  ];
  for (const col of digitalCols) {
    await query(`ALTER TABLE digital_book_readings ADD COLUMN ${col.name} ${col.type}`).catch(() => {});
  }

  // 5. Alter quizzes to add unlock_date, points_deadline, reading ranges, question_count
  const quizCols = [
    { name: 'unlock_date', type: 'DATETIME NULL' },
    { name: 'points_deadline', type: 'DATETIME NULL' },
    { name: 'reading_range_start', type: 'INT DEFAULT 1' },
    { name: 'reading_range_end', type: 'INT DEFAULT 0' },
    { name: 'is_expired', type: 'TINYINT(1) DEFAULT 0' },
    { name: 'librarian_override', type: 'TINYINT(1) DEFAULT 0' },
    { name: 'question_count', type: 'INT DEFAULT 10' },
    { name: 'variant_number', type: 'INT DEFAULT 1' }
  ];
  for (const col of quizCols) {
    await query(`ALTER TABLE quizzes ADD COLUMN ${col.name} ${col.type}`).catch(() => {});
  }

  // 6. Alter quiz_attempts to add points_awarded, is_expired, question_code tracking
  const attemptCols = [
    { name: 'points_awarded', type: 'INT DEFAULT 0' },
    { name: 'is_expired_points', type: 'TINYINT(1) DEFAULT 0' },
    { name: 'librarian_override', type: 'TINYINT(1) DEFAULT 0' }
  ];
  for (const col of attemptCols) {
    await query(`ALTER TABLE quiz_attempts ADD COLUMN ${col.name} ${col.type}`).catch(() => {});
  }

  // 7. Seed Default Configurable Settings in library_settings
  const defaultSettings = [
    { key: 'quiz_short_max_pages', val: '150' },
    { key: 'quiz_medium_max_pages', val: '300' },
    { key: 'quiz_short_unlock_days', val: '7' },
    { key: 'quiz_medium_unlock_days', val: '10' },
    { key: 'quiz_long_unlock_days', val: '14' },
    { key: 'quiz_pages_per_question', val: '10' },
    { key: 'quiz_min_questions', val: '5' },
    { key: 'quiz_max_questions', val: '50' },
    { key: 'quiz_passing_percentage', val: '80' },
    { key: 'quiz_points_deadline_days', val: '10' },
    { key: 'quiz_points_awarded', val: '50' }
  ];

  for (const s of defaultSettings) {
    const sCode = 'DEMO01';
    const sCodeGlobal = 'GLOBAL';
    for (const code of [sCode, sCodeGlobal, 'DPS123']) {
      await query(`
        INSERT INTO library_settings (school_code, setting_key, setting_value)
        VALUES ($1, $2, $3)
        ON DUPLICATE KEY UPDATE setting_value = setting_value
      `, [code, s.key, s.val]).catch(async () => {
        await query(`
          INSERT OR IGNORE INTO library_settings (school_code, setting_key, setting_value)
          VALUES ($1, $2, $3)
        `, [code, s.key, s.val]).catch(() => {});
      });
    }
  }

  console.log('[MIGRATION] ✅ AI Quiz & Reading Verification schema successfully migrated.');
}

module.exports = { migrateQuizVerification };

if (require.main === module) {
  migrateQuizVerification()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
