const { query } = require('../db');

async function initLiveTables() {
  try {
    // 1. live_courses
    await query(`
      CREATE TABLE IF NOT EXISTS live_courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(500),
        description TEXT,
        instructor_id INT,
        instructor_name VARCHAR(255),
        category VARCHAR(100) DEFAULT 'Technology',
        level VARCHAR(50) DEFAULT 'All Levels',
        price DECIMAL(10, 2) DEFAULT 0.00,
        cover_image TEXT,
        status VARCHAR(50) DEFAULT 'Published',
        school_code VARCHAR(50) DEFAULT 'DPS123',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(async () => {
      // SQLite fallback syntax
      await query(`
        CREATE TABLE IF NOT EXISTS live_courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          subtitle TEXT,
          description TEXT,
          instructor_id INTEGER,
          instructor_name TEXT,
          category TEXT DEFAULT 'Technology',
          level TEXT DEFAULT 'All Levels',
          price REAL DEFAULT 0.00,
          cover_image TEXT,
          status TEXT DEFAULT 'Published',
          school_code TEXT DEFAULT 'DPS123',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
    });

    // 2. course_modules
    await query(`
      CREATE TABLE IF NOT EXISTS course_modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        order_index INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS course_modules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          course_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          order_index INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
    });

    // 3. course_lessons
    await query(`
      CREATE TABLE IF NOT EXISTS course_lessons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id INT NOT NULL,
        course_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content_type VARCHAR(50) DEFAULT 'live_class',
        video_url TEXT,
        pdf_url TEXT,
        duration_minutes INT DEFAULT 45,
        order_index INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS course_lessons (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          module_id INTEGER NOT NULL,
          course_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          content_type TEXT DEFAULT 'live_class',
          video_url TEXT,
          pdf_url TEXT,
          duration_minutes INTEGER DEFAULT 45,
          order_index INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
    });

    // 4. live_sessions
    await query(`
      CREATE TABLE IF NOT EXISTS live_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT,
        lesson_id INT,
        title VARCHAR(255) NOT NULL,
        scheduled_start TIMESTAMP NOT NULL,
        scheduled_end TIMESTAMP,
        duration_minutes INT DEFAULT 60,
        meeting_id VARCHAR(100) UNIQUE NOT NULL,
        passcode VARCHAR(50) DEFAULT '123456',
        host_user_id INT,
        host_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'scheduled',
        recording_url TEXT,
        shareable_token VARCHAR(255) UNIQUE,
        max_participants INT DEFAULT 100,
        school_code VARCHAR(50) DEFAULT 'DPS123',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS live_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          course_id INTEGER,
          lesson_id INTEGER,
          title TEXT NOT NULL,
          scheduled_start DATETIME NOT NULL,
          scheduled_end DATETIME,
          duration_minutes INTEGER DEFAULT 60,
          meeting_id TEXT UNIQUE NOT NULL,
          passcode TEXT DEFAULT '123456',
          host_user_id INTEGER,
          host_name TEXT,
          status TEXT DEFAULT 'scheduled',
          recording_url TEXT,
          shareable_token TEXT UNIQUE,
          max_participants INTEGER DEFAULT 100,
          school_code TEXT DEFAULT 'DPS123',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
    });

    // 5. course_enrollments
    await query(`
      CREATE TABLE IF NOT EXISTS course_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        user_id INT NOT NULL,
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        role VARCHAR(50) DEFAULT 'student',
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        progress_percent INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active'
      )
    `).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS course_enrollments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          course_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          user_name TEXT,
          user_email TEXT,
          role TEXT DEFAULT 'student',
          enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          progress_percent INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active'
        )
      `).catch(() => {});
    });

    // 6. session_attendance / studio_attendance
    await query(`
      CREATE TABLE IF NOT EXISTS studio_attendance (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id BIGINT UNSIGNED NOT NULL,
        member_id BIGINT UNSIGNED NOT NULL,
        member_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'student',
        joined_at DATETIME NOT NULL,
        left_at DATETIME NULL,
        duration_seconds INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_attendance_session (session_id),
        INDEX idx_attendance_member (member_id)
      )
    `).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS studio_attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          member_id INTEGER NOT NULL,
          member_name TEXT,
          role TEXT DEFAULT 'student',
          joined_at DATETIME NOT NULL,
          left_at DATETIME,
          duration_seconds INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
    });

    // 7. studio_sessions (Jitsi-powered Librika Meeting Architecture)
    await query(`
      CREATE TABLE IF NOT EXISTS studio_sessions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        host_id BIGINT UNSIGNED NOT NULL,
        host_name VARCHAR(255),
        meeting_code VARCHAR(100) UNIQUE NOT NULL,
        scheduled_start DATETIME NULL,
        scheduled_end DATETIME NULL,
        duration_minutes INT DEFAULT 60,
        status VARCHAR(50) DEFAULT 'SCHEDULED',
        class_name VARCHAR(100) NULL,
        school_code VARCHAR(50) DEFAULT 'DPS123',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_meeting_code (meeting_code),
        INDEX idx_scheduled_start (scheduled_start),
        INDEX idx_status (status)
      )
    `).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS studio_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          host_id INTEGER NOT NULL,
          host_name TEXT,
          meeting_code TEXT UNIQUE NOT NULL,
          scheduled_start DATETIME,
          scheduled_end DATETIME,
          duration_minutes INTEGER DEFAULT 60,
          status TEXT DEFAULT 'SCHEDULED',
          class_name TEXT,
          school_code TEXT DEFAULT 'DPS123',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
    });

    // Cleanup any lingering demo classes to ensure only real teacher/librarian sessions appear
    try {
      await query(`
        DELETE FROM live_sessions 
        WHERE title LIKE '%Live Masterclass: React State%' 
           OR title LIKE '%Live Lab: Building RAG%' 
           OR title LIKE '%Board Exam Marathon%'
           OR meeting_id IN ('LIB-REACT-101', 'LIB-AI-202', 'LIB-PHY-303')
      `).catch(() => {});

      await query(`
        DELETE FROM studio_sessions 
        WHERE title LIKE '%Advanced Mathematics%' 
           OR title LIKE '%Physics Laws of Motion%'
           OR title LIKE '%Modern Web Bootcamp Live Lab%'
           OR meeting_code IN ('LIBRIKA-10MATH-7A8B9C', 'LIBRIKA-9SCI-42A8F31C', 'LIBRIKA-AIWEB-99C1D2')
      `).catch(() => {});

      await query(`
        DELETE FROM live_courses 
        WHERE title LIKE '%Full-Stack Web Development Bootcamp%' 
           OR title LIKE '%Artificial Intelligence & Applied LLMs%' 
           OR title LIKE '%CBSE & Competitive Physics%'
      `).catch(() => {});

      await query(`
        DELETE FROM course_enrollments 
        WHERE user_name LIKE '%Aarav Patel%' OR user_name LIKE '%Diya Sharma%'
      `).catch(() => {});
    } catch (cleanErr) {
      // Ignored
    }

  } catch (err) {
    console.warn('[LIVE STUDIO] Table initialization error (handled):', err.message);
  }
}

module.exports = { initLiveTables };
