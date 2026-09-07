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

    // 6. session_attendance
    await query(`
      CREATE TABLE IF NOT EXISTS session_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        user_id INT NOT NULL,
        user_name VARCHAR(255),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP,
        duration_seconds INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'present'
      )
    `).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS session_attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          user_name TEXT,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          left_at DATETIME,
          duration_seconds INTEGER DEFAULT 0,
          status TEXT DEFAULT 'present'
        )
      `).catch(() => {});
    });

    // Check if seed data exists
    const checkCourses = await query('SELECT count(*) as count FROM live_courses').catch(() => ({ rows: [{ count: 0 }] }));
    const count = checkCourses.rows && checkCourses.rows[0] ? parseInt(checkCourses.rows[0].count || 0) : 0;

    if (count === 0) {
      console.log('[LIVE STUDIO] Seeding sample courses & live sessions...');

      // Seed Course 1: Full-Stack Web Dev
      await query(`
        INSERT INTO live_courses (title, subtitle, description, instructor_id, instructor_name, category, level, price, cover_image, status, school_code)
        VALUES (
          'Full-Stack Web Development Bootcamp (MERN & Next.js)',
          'Master React, Node.js, Express, MySQL & Next.js 15 with live interactive coding sessions and production deployments.',
          'Comprehensive zero-to-hero curriculum covering frontend architecture, REST APIs, databases, authentication, and cloud deployment.',
          23,
          'Prof. Vikram Malhotra',
          'Computer Science',
          'All Levels',
          0.00,
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=60',
          'Published',
          'DPS123'
        )
      `).catch(() => {});

      // Seed Course 2: AI & LLM Engineering
      await query(`
        INSERT INTO live_courses (title, subtitle, description, instructor_id, instructor_name, category, level, price, cover_image, status, school_code)
        VALUES (
          'Artificial Intelligence & Applied LLMs Masterclass',
          'Learn prompt engineering, RAG pipelines, fine-tuning, and multimodal AI with hands-on live labs.',
          'Deep dive into LangChain, OpenAI APIs, NVIDIA NIM, and vector databases for modern software engineering.',
          23,
          'Dr. Ananya Sen',
          'AI & Data Science',
          'Intermediate',
          0.00,
          'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=60',
          'Published',
          'DPS123'
        )
      `).catch(() => {});

      // Seed Course 3: Class 12 Physics Live Batch
      await query(`
        INSERT INTO live_courses (title, subtitle, description, instructor_id, instructor_name, category, level, price, cover_image, status, school_code)
        VALUES (
          'CBSE & Competitive Physics: Electromagnetism & Optics',
          'Interactive live problem solving, numerical derivation marathons, and board exam revision batch.',
          'Weekly live interactive classes with digital whiteboard derivations, formula cheat sheets, and previous 10 years question solutions.',
          23,
          'Mrs. Sharma (Senior Faculty)',
          'Science & Academics',
          'Advanced',
          0.00,
          'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop&q=60',
          'Published',
          'DPS123'
        )
      `).catch(() => {});

      // Seed Modules for Course 1
      await query(`
        INSERT INTO course_modules (course_id, title, order_index) VALUES 
        (1, 'Module 1: Modern JavaScript & Async Programming', 1),
        (1, 'Module 2: React 19 State, Hooks & Component Lifecycle', 2),
        (1, 'Module 3: Backend REST APIs with Node.js & Express', 3),
        (1, 'Module 4: Live Capstone Project & Cloud Deployment', 4)
      `).catch(() => {});

      // Seed Lessons for Course 1
      await query(`
        INSERT INTO course_lessons (module_id, course_id, title, content_type, duration_minutes, order_index) VALUES 
        (1, 1, 'ES6+ Features, Closures & Event Loop Deep Dive', 'video', 50, 1),
        (1, 1, 'Promises, Async/Await & Fetch API Hands-on', 'video', 45, 2),
        (2, 1, 'Interactive Live Masterclass: Building React Hooks from Scratch', 'live_class', 60, 3),
        (3, 1, 'Live Class: Building Scalable REST APIs & PostgreSQL Integration', 'live_class', 75, 4)
      `).catch(() => {});

      // Seed Live Sessions
      const now = new Date();
      const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

      await query(`
        INSERT INTO live_sessions (course_id, lesson_id, title, scheduled_start, scheduled_end, duration_minutes, meeting_id, passcode, host_user_id, host_name, status, shareable_token, max_participants, school_code)
        VALUES 
        (
          1, 
          3, 
          'Live Masterclass: React State & Custom Hooks Studio', 
          '${fmt(in2Hours)}', 
          '${fmt(new Date(in2Hours.getTime() + 60 * 60 * 1000))}', 
          60, 
          'LIB-REACT-101', 
          '888999', 
          23, 
          'Prof. Vikram Malhotra', 
          'scheduled', 
          'token_react_live_101', 
          150, 
          'DPS123'
        ),
        (
          2, 
          NULL, 
          'Live Lab: Building RAG with LangChain & Vector Databases', 
          '${fmt(tomorrow)}', 
          '${fmt(new Date(tomorrow.getTime() + 75 * 60 * 1000))}', 
          75, 
          'LIB-AI-202', 
          '777666', 
          23, 
          'Dr. Ananya Sen', 
          'scheduled', 
          'token_ai_live_202', 
          100, 
          'DPS123'
        ),
        (
          3, 
          NULL, 
          'Board Exam Marathon: Electromagnetic Waves & Optics Problem Solving', 
          '${fmt(dayAfter)}', 
          '${fmt(new Date(dayAfter.getTime() + 90 * 60 * 1000))}', 
          90, 
          'LIB-PHY-303', 
          '555444', 
          23, 
          'Mrs. Sharma (Senior Faculty)', 
          'scheduled', 
          'token_phy_live_303', 
          200, 
          'DPS123'
        )
      `).catch(() => {});

      // Seed Enrollments for Demo Students
      await query(`
        INSERT INTO course_enrollments (course_id, user_id, user_name, user_email, role, progress_percent, status) VALUES 
        (1, 12, 'Aarav Patel (Grade 10)', 'aarav.patel@dps.edu', 'student', 45, 'active'),
        (2, 12, 'Aarav Patel (Grade 10)', 'aarav.patel@dps.edu', 'student', 20, 'active'),
        (3, 12, 'Aarav Patel (Grade 10)', 'aarav.patel@dps.edu', 'student', 70, 'active'),
        (1, 14, 'Diya Sharma (Grade 12)', 'diya.sharma@dps.edu', 'student', 60, 'active'),
        (3, 14, 'Diya Sharma (Grade 12)', 'diya.sharma@dps.edu', 'student', 85, 'active')
      `).catch(() => {});

      console.log('[LIVE STUDIO] Sample courses, curriculum and scheduled live batches initialized.');
    }
  } catch (err) {
    console.warn('[LIVE STUDIO] Table initialization error (handled):', err.message);
  }
}

module.exports = { initLiveTables };
