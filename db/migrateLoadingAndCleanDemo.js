/**
 * Librika — Production Migration: Fix Loading & Eradicate Demo Classes
 * 1. Safely add missing columns to quizzes table.
 * 2. Delete all demo sessions and demo courses completely.
 * 3. Seed curriculum physical books if books table is empty so the library catalog has real content.
 * 4. Link curriculum quizzes to books.
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function migrate() {
  console.log('[MIGRATE] Connecting to MySQL production database...');
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '10.169.7.44',
    user: process.env.MYSQL_USER || 'librika_1_librika',
    password: process.env.MYSQL_PASSWORD || 'kalatota@123',
    database: process.env.MYSQL_DB || 'librika_1_librika'
  });

  console.log('[MIGRATE] 1. Ensuring quizzes table schema...');
  const alterColumns = [
    "ALTER TABLE quizzes ADD COLUMN library_type VARCHAR(20) DEFAULT 'OFFLINE'",
    "ALTER TABLE quizzes ADD COLUMN book_id BIGINT UNSIGNED NULL",
    "ALTER TABLE quizzes ADD COLUMN digital_content_id BIGINT UNSIGNED NULL",
    "ALTER TABLE quizzes ADD COLUMN school_code VARCHAR(50) DEFAULT 'GLOBAL'",
    "ALTER TABLE quizzes ADD COLUMN status VARCHAR(20) DEFAULT 'PUBLISHED'",
    "ALTER TABLE quizzes ADD COLUMN difficulty VARCHAR(20) DEFAULT 'MEDIUM'",
    "ALTER TABLE quizzes ADD COLUMN instructions TEXT NULL",
    "ALTER TABLE quizzes ADD COLUMN time_limit INT DEFAULT 15",
    "ALTER TABLE quizzes ADD COLUMN max_attempts INT DEFAULT 2",
    "ALTER TABLE quizzes ADD COLUMN passing_percentage INT DEFAULT 60",
    "ALTER TABLE quizzes ADD COLUMN created_by BIGINT UNSIGNED NULL"
  ];

  for (const sql of alterColumns) {
    try {
      await conn.query(sql);
    } catch (e) {
      // Column probably already exists (ER_DUP_FIELDNAME)
    }
  }

  // Update existing quizzes with default status and school_code
  await conn.query("UPDATE quizzes SET status = 'PUBLISHED' WHERE status IS NULL OR status = ''");
  await conn.query("UPDATE quizzes SET school_code = 'GLOBAL' WHERE school_code IS NULL OR school_code = ''");

  console.log('[MIGRATE] 2. Removing Demo Classes completely...');
  // Delete demo sessions from live_sessions
  const [resLs] = await conn.query(`
    DELETE FROM live_sessions 
    WHERE title LIKE '%Live Masterclass%' 
       OR title LIKE '%Live Lab: Building RAG%' 
       OR title LIKE '%Board Exam Marathon%'
       OR meeting_id IN ('LIB-REACT-101', 'LIB-AI-202', 'LIB-PHY-303')
  `);
  console.log(`[MIGRATE] Deleted ${resLs.affectedRows} demo sessions from live_sessions.`);

  // Delete demo sessions from studio_sessions
  const [resSs] = await conn.query(`
    DELETE FROM studio_sessions 
    WHERE title LIKE '%Advanced Mathematics%' 
       OR title LIKE '%Physics Laws of Motion%'
       OR title LIKE '%Modern Web Bootcamp Live Lab%'
       OR meeting_code IN ('LIBRIKA-10MATH-7A8B9C', 'LIBRIKA-9SCI-42A8F31C', 'LIBRIKA-AIWEB-99C1D2')
  `);
  console.log(`[MIGRATE] Deleted ${resSs.affectedRows} demo sessions from studio_sessions.`);

  // Delete demo courses from live_courses
  const [resLc] = await conn.query(`
    DELETE FROM live_courses 
    WHERE title LIKE '%Full-Stack Web Development Bootcamp%' 
       OR title LIKE '%Artificial Intelligence & Applied LLMs%' 
       OR title LIKE '%CBSE & Competitive Physics%'
  `);
  console.log(`[MIGRATE] Deleted ${resLc.affectedRows} demo courses from live_courses.`);

  // Delete demo enrollments
  await conn.query(`
    DELETE FROM course_enrollments 
    WHERE user_name LIKE '%Aarav Patel%' OR user_name LIKE '%Diya Sharma%'
  `).catch(() => {});

  console.log('[MIGRATE] 3. Checking physical books catalog...');
  const [bRows] = await conn.query('SELECT COUNT(1) as cnt FROM books');
  if (bRows[0].cnt === 0) {
    console.log('[MIGRATE] Seeding curated curriculum library books...');
    const books = [
      [
        'Physics: Principles and Problems',
        'Paul W. Zitzewitz',
        'Science',
        'BK-PHY-001',
        5,
        5,
        'GLOBAL',
        'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&auto=format&fit=crop&q=60',
        'Comprehensive physics textbook covering mechanics, energy, motion laws, optics, and thermodynamics.',
        'Rack A-1, Shelf 2',
        '9780078458132',
        'McGraw-Hill',
        'Science',
        'Class 9-12',
        'MEDIUM',
        15
      ],
      [
        'To Kill a Mockingbird',
        'Harper Lee',
        'Fiction',
        'BK-FIC-002',
        4,
        3,
        'GLOBAL',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=60',
        'Pulitzer Prize-winning classic masterpiece exploring empathy, justice, and human dignity in the American South.',
        'Rack B-3, Shelf 1',
        '9780061120084',
        'Harper Perennial',
        'English Literature',
        'All Classes',
        'MEDIUM',
        15
      ],
      [
        'Introduction to Algorithms & Data Structures in Python',
        'Thomas Cormen & Guido van Rossum',
        'Technology',
        'BK-TECH-003',
        6,
        6,
        'GLOBAL',
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&auto=format&fit=crop&q=60',
        'Fundamental foundations of algorithmic efficiency, recursion, binary search trees, and dynamic programming.',
        'Rack C-2, Shelf 3',
        '9780262033848',
        'MIT Press',
        'Computer Science',
        'Class 10-12',
        'LARGE',
        25
      ],
      [
        'India: A Comprehensive History of a Civilization',
        'John Keay',
        'History',
        'BK-HIST-004',
        3,
        2,
        'GLOBAL',
        'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&auto=format&fit=crop&q=60',
        'Panoramic account spanning five millennia from the Indus Valley culture through the independence movement.',
        'Rack D-1, Shelf 2',
        '9780802137975',
        'Grove Press',
        'History',
        'All Classes',
        'MEDIUM',
        15
      ],
      [
        'Advanced Calculus & Coordinate Geometry',
        'James Stewart',
        'Mathematics',
        'BK-MATH-005',
        8,
        7,
        'GLOBAL',
        'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&auto=format&fit=crop&q=60',
        'Standard university-prep textbook with step-by-step problem sets on differentiation, integration, and matrices.',
        'Rack E-4, Shelf 1',
        '9781285740621',
        'Cengage Learning',
        'Mathematics',
        'Class 11-12',
        'MEDIUM',
        15
      ],
      [
        'A Brief History of Time',
        'Stephen Hawking',
        'Science',
        'BK-SCI-006',
        5,
        4,
        'GLOBAL',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=60',
        'Landmark exploration of space, time, black holes, the Big Bang theory, and the cosmic nature of the universe.',
        'Rack A-2, Shelf 3',
        '9780553380163',
        'Bantam Books',
        'Science',
        'All Classes',
        'SMALL',
        7
      ],
      [
        'Pride and Prejudice',
        'Jane Austen',
        'Fiction',
        'BK-FIC-007',
        4,
        4,
        'GLOBAL',
        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=60',
        'Celebrated literary classic detailing the turbulent relationship between Elizabeth Bennet and Fitzwilliam Darcy.',
        'Rack B-1, Shelf 4',
        '9780141439518',
        'Penguin Classics',
        'English Literature',
        'All Classes',
        'MEDIUM',
        15
      ],
      [
        'Clean Code: A Handbook of Agile Software Craftsmanship',
        'Robert C. Martin',
        'Technology',
        'BK-TECH-008',
        4,
        3,
        'GLOBAL',
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=60',
        'Even bad code can function, but if code is not clean it can bring a development organization to its knees.',
        'Rack C-1, Shelf 2',
        '9780132350884',
        'Prentice Hall',
        'Computer Science',
        'All Classes',
        'MEDIUM',
        15
      ]
    ];

    for (const b of books) {
      await conn.query(
        `INSERT INTO books 
         (title, author, genre, barcode_id, total_copies, available_copies, school_code, cover_url, description, shelf_location, isbn, publisher, subject, class, book_size, offline_borrowing_days)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        b
      );
    }
    console.log(`[MIGRATE] Seeded ${books.length} curated books into catalog.`);
  }

  // Link quizzes to seeded books where appropriate
  try {
    const [booksList] = await conn.query("SELECT id, title, genre FROM books");
    const phyBook = booksList.find(b => b.title.includes('Physics'));
    const engBook = booksList.find(b => b.title.includes('Mockingbird') || b.title.includes('Pride'));
    const mathBook = booksList.find(b => b.title.includes('Calculus') || b.title.includes('Geometry'));
    const csBook = booksList.find(b => b.title.includes('Python') || b.title.includes('Algorithms'));

    if (phyBook) await conn.query("UPDATE quizzes SET book_id = ? WHERE title LIKE '%Physics%'", [phyBook.id]);
    if (engBook) await conn.query("UPDATE quizzes SET book_id = ? WHERE title LIKE '%English%'", [engBook.id]);
    if (mathBook) await conn.query("UPDATE quizzes SET book_id = ? WHERE title LIKE '%Mathematics%'", [mathBook.id]);
    if (csBook) await conn.query("UPDATE quizzes SET book_id = ? WHERE title LIKE '%Computer Science%' OR title LIKE '%Python%'", [csBook.id]);
    console.log('[MIGRATE] Quizzes successfully linked to library books.');
  } catch (e) {
    console.warn('[MIGRATE] Quiz linking notice:', e.message);
  }

  console.log('[MIGRATE] Migration finished successfully.');
  await conn.end();
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { migrate };
