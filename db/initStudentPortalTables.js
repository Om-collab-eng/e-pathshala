const { query } = require('../db');

async function initStudentPortalTables() {
  console.log('[STUDENT DB] Initializing Student Portal Relational Tables...');

  // 1. student_profiles
  await query(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      student_id VARCHAR(50) UNIQUE NOT NULL,
      class_name VARCHAR(50),
      section VARCHAR(20),
      roll_number VARCHAR(30),
      phone VARCHAR(30),
      profile_photo VARCHAR(500),
      digital_pass_token VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        student_id TEXT UNIQUE NOT NULL,
        class_name TEXT,
        section TEXT,
        roll_number TEXT,
        phone TEXT,
        profile_photo TEXT,
        digital_pass_token TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // 2. student_saved_books
  await query(`
    CREATE TABLE IF NOT EXISTS student_saved_books (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      book_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_saved_book (user_id, book_id)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS student_saved_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, book_id)
      )
    `).catch(() => {});
  });

  // 3. student_wishlist
  await query(`
    CREATE TABLE IF NOT EXISTS student_wishlist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      book_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_wishlist (user_id, book_id)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS student_wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, book_id)
      )
    `).catch(() => {});
  });

  // 4. student_saved_documents
  await query(`
    CREATE TABLE IF NOT EXISTS student_saved_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      document_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_saved_doc (user_id, document_id)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS student_saved_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        document_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, document_id)
      )
    `).catch(() => {});
  });

  // 5. student_bookmarks
  await query(`
    CREATE TABLE IF NOT EXISTS student_bookmarks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      document_id INT NOT NULL,
      page_number INT DEFAULT 1,
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS student_bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        document_id INTEGER NOT NULL,
        page_number INTEGER DEFAULT 1,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // 6. quizzes
  await query(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      subject VARCHAR(100),
      class_name VARCHAR(50),
      duration_minutes INT DEFAULT 15,
      total_marks INT DEFAULT 10,
      published TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        subject TEXT,
        class_name TEXT,
        duration_minutes INTEGER DEFAULT 15,
        total_marks INTEGER DEFAULT 10,
        published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // 7. quiz_attempts
  await query(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quiz_id INT NOT NULL,
      user_id INT NOT NULL,
      score DECIMAL(6,2) DEFAULT 0,
      total_marks INT DEFAULT 10,
      passed TINYINT DEFAULT 1,
      started_at DATETIME,
      completed_at DATETIME,
      status VARCHAR(50) DEFAULT 'COMPLETED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        score REAL DEFAULT 0,
        total_marks INTEGER DEFAULT 10,
        passed INTEGER DEFAULT 1,
        started_at DATETIME,
        completed_at DATETIME,
        status TEXT DEFAULT 'COMPLETED',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // Ensure quiz_attempts table columns exist
  await query(`ALTER TABLE quiz_attempts ADD COLUMN quiz_id INT DEFAULT NULL`).catch(() => {});
  await query(`ALTER TABLE quiz_attempts ADD COLUMN total_marks INT DEFAULT 10`).catch(() => {});
  await query(`ALTER TABLE quiz_attempts ADD COLUMN status VARCHAR(50) DEFAULT 'COMPLETED'`).catch(() => {});

  // 8. assignments
  await query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      subject VARCHAR(100),
      class_name VARCHAR(50),
      due_at DATETIME,
      school_code VARCHAR(50) DEFAULT 'DPS123',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        subject TEXT,
        class_name TEXT,
        due_at DATETIME,
        school_code TEXT DEFAULT 'DPS123',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // Ensure assignments table columns exist
  await query(`ALTER TABLE assignments ADD COLUMN subject VARCHAR(100)`).catch(() => {});
  await query(`ALTER TABLE assignments ADD COLUMN class_name VARCHAR(50)`).catch(() => {});
  await query(`ALTER TABLE assignments ADD COLUMN due_at DATETIME`).catch(() => {});
  await query(`ALTER TABLE assignments ADD COLUMN school_code VARCHAR(50) DEFAULT 'DPS123'`).catch(() => {});


  // 9. assignment_submissions
  await query(`
    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assignment_id INT NOT NULL,
      user_id INT NOT NULL,
      submission_url VARCHAR(1000),
      submission_text TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      score DECIMAL(6,2),
      feedback TEXT,
      status VARCHAR(50) DEFAULT 'SUBMITTED',
      UNIQUE KEY unique_sub (assignment_id, user_id)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        submission_url TEXT,
        submission_text TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        score REAL,
        feedback TEXT,
        status TEXT DEFAULT 'SUBMITTED',
        UNIQUE(assignment_id, user_id)
      )
    `).catch(() => {});
  });

  // 10. reading_goals
  await query(`
    CREATE TABLE IF NOT EXISTS reading_goals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      goal_type VARCHAR(50) DEFAULT 'BOOKS',
      target_value INT NOT NULL DEFAULT 20,
      current_value INT DEFAULT 0,
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS reading_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        goal_type TEXT DEFAULT 'BOOKS',
        target_value INTEGER NOT NULL DEFAULT 20,
        current_value INTEGER DEFAULT 0,
        start_date DATE,
        end_date DATE,
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // 11. reading_activity
  await query(`
    CREATE TABLE IF NOT EXISTS reading_activity (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      document_id INT,
      reading_date DATE NOT NULL,
      minutes_read INT DEFAULT 0,
      pages_read INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS reading_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        document_id INTEGER,
        reading_date DATE NOT NULL,
        minutes_read INTEGER DEFAULT 0,
        pages_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // 12. achievements
  await query(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      icon VARCHAR(100),
      requirement_type VARCHAR(100),
      requirement_value INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        requirement_type TEXT,
        requirement_value INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // 13. student_achievements
  await query(`
    CREATE TABLE IF NOT EXISTS student_achievements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      achievement_id INT NOT NULL,
      earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_achievement (user_id, achievement_id)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS student_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        achievement_id INTEGER NOT NULL,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      )
    `).catch(() => {});
  });

  // 14. Seed default quizzes, assignments, and achievements if empty
  const qCount = await query('SELECT COUNT(*) as c FROM quizzes').catch(() => ({ rows: [{ c: 0 }] }));
  if (parseInt((qCount.rows[0] && qCount.rows[0].c) || 0) === 0) {
    await query(`
      INSERT INTO quizzes (title, description, subject, class_name, duration_minutes, total_marks, published) VALUES
      ('Physics: Motion & Force', 'Chapter 3 diagnostic quiz on Newton Laws of Motion', 'Physics', 'Class 9', 15, 10, 1),
      ('English: Literature & Comprehension', 'Poetry analysis and vocabulary test', 'English', 'Class 9', 20, 15, 1),
      ('Mathematics: Coordinate Geometry', 'Mid-term practice test with coordinate planes', 'Mathematics', 'Class 10', 25, 20, 1),
      ('Computer Science: Python Data Structures', 'Lists, Dictionaries and algorithmic problem solving', 'Computer Science', 'All Classes', 15, 10, 1)
    `).catch(() => {});
  }

  const aCount = await query('SELECT COUNT(*) as c FROM assignments').catch(() => ({ rows: [{ c: 0 }] }));
  if (parseInt((aCount.rows[0] && aCount.rows[0].c) || 0) === 0) {
    await query(`
      INSERT INTO assignments (title, description, subject, class_name, due_at, school_code) VALUES
      ('Biology: Cellular Respiration Lab Report', 'Submit a 2-page report summarizing mitochondria experiment observations.', 'Biology', 'Class 9', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 DAY), 'DPS123'),
      ('History: Indian Independence Movement Essay', 'Write a structured critical essay on the Salt Satyagraha of 1930.', 'History', 'Class 10', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY), 'DPS123'),
      ('Literature: Character Study of Portia', 'Analyze the courtroom scene monologue in Merchant of Venice.', 'English', 'Class 9', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 3 DAY), 'DPS123')
    `).catch(async () => {
      await query(`
        INSERT INTO assignments (title, description, subject, class_name, due_at, school_code) VALUES
        ('Biology: Cellular Respiration Lab Report', 'Submit a 2-page report summarizing mitochondria experiment observations.', 'Biology', 'Class 9', datetime('now', '+5 days'), 'DPS123'),
        ('History: Indian Independence Movement Essay', 'Write a structured critical essay on the Salt Satyagraha of 1930.', 'History', 'Class 10', datetime('now', '+7 days'), 'DPS123'),
        ('Literature: Character Study of Portia', 'Analyze the courtroom scene monologue in Merchant of Venice.', 'English', 'Class 9', datetime('now', '+3 days'), 'DPS123')
      `).catch(() => {});
    });
  }

  const achCount = await query('SELECT COUNT(*) as c FROM achievements').catch(() => ({ rows: [{ c: 0 }] }));
  if (parseInt((achCount.rows[0] && achCount.rows[0].c) || 0) === 0) {
    await query(`
      INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES
      ('First Book Completed', 'Finished reading your first physical or digital book', '📚', 'books', 1),
      ('7 Day Streak', 'Read books consistently for 7 consecutive days', '🔥', 'streak', 7),
      ('Top Reader', 'Read more than 10 books in a single academic term', '🌟', 'books', 10),
      ('Quiz Master', 'Passed 5 chapter quizzes with 80%+ score', '🎯', 'quizzes', 5),
      ('Knowledge Explorer', 'Explored 10 different e-library research documents', '🧭', 'digital', 10),
      ('Review Expert', 'Submitted 5 verified book reviews approved by faculty', '✍️', 'reviews', 5)
    `).catch(() => {});
  }

  console.log('[STUDENT DB] All Student Portal tables initialized successfully.');
}

if (require.main === module) {
  initStudentPortalTables()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = { initStudentPortalTables };
