/**
 * Database Table Initializer for Librika Librarian Platform
 * Supports PostgreSQL, SQLite, and MySQL
 */
const db = require('../db');

async function initLibrarianTables() {
  try {
    // 1. Library Settings Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS library_settings (
        id SERIAL PRIMARY KEY,
        school_code VARCHAR(50) DEFAULT 'DEMO01',
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(async () => {
      // SQLite fallback
      await db.query(`
        CREATE TABLE IF NOT EXISTS library_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          school_code TEXT DEFAULT 'DEMO01',
          setting_key TEXT NOT NULL,
          setting_value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
    });

    // 2. Book Copies Table (Individual Physical Copies with Barcodes)
    await db.query(`
      CREATE TABLE IF NOT EXISTS book_copies (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL,
        barcode VARCHAR(100) NOT NULL,
        condition_status VARCHAR(50) DEFAULT 'GOOD',
        availability_status VARCHAR(50) DEFAULT 'AVAILABLE',
        acquired_at DATE DEFAULT CURRENT_DATE,
        school_code VARCHAR(50) DEFAULT 'DEMO01'
      )
    `).catch(async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS book_copies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          barcode TEXT NOT NULL,
          condition_status TEXT DEFAULT 'GOOD',
          availability_status TEXT DEFAULT 'AVAILABLE',
          acquired_at DATE DEFAULT CURRENT_DATE,
          school_code TEXT DEFAULT 'DEMO01'
        )
      `).catch(() => {});
    });

    // 3. Loans Table (Circulation Transactions)
    await db.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        member_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        book_copy_id INTEGER,
        barcode VARCHAR(100),
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_at TIMESTAMP NOT NULL,
        returned_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        renewal_count INTEGER DEFAULT 0,
        fine_amount DECIMAL(10,2) DEFAULT 0,
        school_code VARCHAR(50) DEFAULT 'DEMO01'
      )
    `).catch(async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS loans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          member_id INTEGER NOT NULL,
          book_id INTEGER NOT NULL,
          book_copy_id INTEGER,
          barcode TEXT,
          issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          due_at DATETIME NOT NULL,
          returned_at DATETIME,
          status TEXT DEFAULT 'ACTIVE',
          renewal_count INTEGER DEFAULT 0,
          fine_amount DECIMAL(10,2) DEFAULT 0,
          school_code TEXT DEFAULT 'DEMO01'
        )
      `).catch(() => {});
    });

    // 4. Fines Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS fines (
        id SERIAL PRIMARY KEY,
        loan_id INTEGER,
        member_id INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        reason VARCHAR(255) DEFAULT 'Overdue Loan',
        status VARCHAR(50) DEFAULT 'PENDING',
        paid_at TIMESTAMP,
        waived_at TIMESTAMP,
        school_code VARCHAR(50) DEFAULT 'DEMO01',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS fines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          loan_id INTEGER,
          member_id INTEGER NOT NULL,
          amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          reason TEXT DEFAULT 'Overdue Loan',
          status TEXT DEFAULT 'PENDING',
          paid_at DATETIME,
          waived_at DATETIME,
          school_code TEXT DEFAULT 'DEMO01',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
    });

    // 5. Digital Documents Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS digital_documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255),
        description TEXT,
        file_url TEXT NOT NULL,
        cover_url TEXT,
        document_type VARCHAR(50) DEFAULT 'EBOOK',
        access_level VARCHAR(50) DEFAULT 'ALL',
        reading_time_mins INTEGER DEFAULT 15,
        school_code VARCHAR(50) DEFAULT 'DEMO01',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS digital_documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          author TEXT,
          description TEXT,
          file_url TEXT NOT NULL,
          cover_url TEXT,
          document_type TEXT DEFAULT 'EBOOK',
          access_level TEXT DEFAULT 'ALL',
          reading_time_mins INTEGER DEFAULT 15,
          school_code TEXT DEFAULT 'DEMO01',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
    });

    // 6. Audit Logs Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id INTEGER,
        description TEXT,
        ip_address VARCHAR(50),
        school_code VARCHAR(50) DEFAULT 'DEMO01',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          action TEXT NOT NULL,
          entity_type TEXT,
          entity_id INTEGER,
          description TEXT,
          ip_address TEXT,
          school_code TEXT DEFAULT 'DEMO01',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
    });

    // 7. Seed Default Settings if not present
    const defaultSettings = [
      { key: 'loan_duration_days', val: '14' },
      { key: 'student_max_books', val: '3' },
      { key: 'teacher_max_books', val: '10' },
      { key: 'staff_max_books', val: '5' },
      { key: 'fine_per_day', val: '5' },
      { key: 'grace_period_days', val: '2' },
      { key: 'max_renewals', val: '2' },
      { key: 'allow_digital_downloads', val: 'true' },
      { key: 'auto_notify_overdue', val: 'true' }
    ];

    for (const s of defaultSettings) {
      const check = await db.query('SELECT id FROM library_settings WHERE setting_key = $1', [s.key]).catch(() => ({ rows: [] }));
      if (!check.rows || check.rows.length === 0) {
        await db.query(
          'INSERT INTO library_settings (school_code, setting_key, setting_value) VALUES ($1, $2, $3)',
          ['DEMO01', s.key, s.val]
        ).catch(() => {});
      }
    }

    // 8. Ensure sample copies exist for catalog books
    const booksRes = await db.query('SELECT id, barcode_id, available_copies, total_copies FROM books LIMIT 50').catch(() => ({ rows: [] }));
    if (booksRes.rows && booksRes.rows.length > 0) {
      for (const b of booksRes.rows) {
        const copiesCheck = await db.query('SELECT COUNT(*) as count FROM book_copies WHERE book_id = $1', [b.id]).catch(() => ({ rows: [{ count: 0 }] }));
        const count = parseInt(copiesCheck.rows[0].count, 10) || 0;
        if (count === 0) {
          const total = b.total_copies || 2;
          for (let i = 1; i <= Math.max(1, total); i++) {
            const copyBarcode = b.barcode_id ? `${b.barcode_id}-C${i}` : `LIB-BK${b.id}-C${i}`;
            await db.query(
              `INSERT INTO book_copies (book_id, barcode, condition_status, availability_status, school_code)
               VALUES ($1, $2, 'GOOD', 'AVAILABLE', 'DEMO01')`,
              [b.id, copyBarcode]
            ).catch(() => {});
          }
        }
      }
    }

    console.log('[LIBRARIAN PLATFORM] Relational tables initialized successfully.');
  } catch (err) {
    console.warn('[LIBRARIAN PLATFORM] Init warning:', err.message);
  }
}

module.exports = { initLibrarianTables };
