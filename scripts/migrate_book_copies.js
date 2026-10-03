const db = require('../db');

async function migrateBookCopies() {
  console.log('--- Starting Book Copies Schema Migration ---');
  try {
    // 1. Check existing columns in book_copies
    let existingColumns = [];
    try {
      const colRes = await db.query("SHOW COLUMNS FROM book_copies");
      existingColumns = (colRes.rows || []).map(r => (r.Field || r.field || r.name || '').toLowerCase());
    } catch (e) {
      try {
        const tableInfo = await db.query("PRAGMA table_info(book_copies)");
        existingColumns = (tableInfo.rows || []).map(r => (r.name || '').toLowerCase());
      } catch (e2) {
        console.warn('Could not inspect book_copies columns, proceeding with ALTER TABLE IF NEEDED');
      }
    }
    console.log('Existing columns in book_copies:', existingColumns);

    const columnsToAdd = [
      { name: 'barcode', type: 'TEXT' },
      { name: 'book_code', type: 'TEXT' },
      { name: 'edition_id', type: 'TEXT' },
      { name: 'serial_number', type: 'INTEGER' },
      { name: 'copy_number', type: 'INTEGER' },
      { name: 'status', type: "TEXT DEFAULT 'AVAILABLE'" },
      { name: 'availability_status', type: "TEXT DEFAULT 'AVAILABLE'" },
      { name: 'condition_status', type: "TEXT DEFAULT 'GOOD'" },
      { name: 'shelf', type: 'TEXT' },
      { name: 'rack', type: 'TEXT' },
      { name: 'added_date', type: 'TEXT' },
      { name: 'added_by', type: 'TEXT' },
      { name: 'school_code', type: 'TEXT' },
      { name: 'accession_number', type: 'TEXT' }
    ];

    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name.toLowerCase())) {
        console.log(`Adding missing column ${col.name} to book_copies...`);
        try {
          await db.query(`ALTER TABLE book_copies ADD COLUMN ${col.name} ${col.type}`);
        } catch (e) {
          console.warn(`Note when adding column ${col.name}:`, e.message);
        }
      }
    }

    // Add indices
    try {
      await db.query('CREATE INDEX IF NOT EXISTS idx_book_copies_barcode ON book_copies(barcode)');
      await db.query('CREATE INDEX IF NOT EXISTS idx_book_copies_book_id ON book_copies(book_id)');
      await db.query('CREATE INDEX IF NOT EXISTS idx_book_copies_school_code ON book_copies(school_code)');
    } catch (e) {
      console.warn('Index note:', e.message);
    }

    console.log('Schema update complete. Now checking existing books...');

    // 2. Fetch all existing books
    const booksRes = await db.query('SELECT * FROM books ORDER BY id ASC');
    const books = booksRes.rows || [];
    console.log(`Found ${books.length} existing books in database.`);

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let totalGenerated = 0;

    for (const book of books) {
      const copiesRes = await db.query('SELECT COUNT(*) as count FROM book_copies WHERE book_id = $1', [book.id]);
      const currentCount = parseInt(copiesRes.rows[0]?.count, 10) || 0;
      const targetCopies = parseInt(book.total_copies, 10) || 1;

      if (currentCount < targetCopies) {
        const needed = targetCopies - currentCount;
        const schoolCode = (book.school_code && book.school_code !== 'GLOBAL' ? book.school_code : 'VBPGZ').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const rack = book.rack || (book.shelf_location ? (book.shelf_location.match(/Rack\s*([A-Za-z0-9]+)/i)?.[1] || 'A') : 'A');
        const shelf = book.shelf || (book.shelf_location ? (book.shelf_location.match(/Shelf\s*([0-9]+)/i)?.[1] || '1') : '1');

        console.log(`Book "${book.title}" (ID: ${book.id}): has ${currentCount}/${targetCopies} copies. Generating ${needed} copies...`);

        for (let i = currentCount + 1; i <= targetCopies; i++) {
          // Serial number: book.id * 1000 + i (or sequential)
          const serial = String(totalGenerated + 1).padStart(6, '0');
          // Standard pattern: SCHOOL_CODE + YYYYMMDD + SERIAL
          const barcode = `${schoolCode}${todayStr}${serial}`;
          const copyId = `CP-${book.id}-${i}`;

          await db.query(`
            INSERT INTO book_copies (
              id, book_id, barcode, book_code, edition_id, serial_number, copy_number,
              shelf, rack, status, availability_status, condition_status,
              added_date, added_by, school_code
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'AVAILABLE', 'AVAILABLE', 'GOOD', $10, 'Migration', $11)
          `, [
            copyId,
            book.id,
            barcode,
            barcode,
            book.edition || '1st Edition',
            totalGenerated + 1,
            i,
            shelf,
            rack,
            new Date().toISOString(),
            book.school_code || 'VBPGZ'
          ]);

          totalGenerated++;
        }
      }
    }

    console.log(`Migration complete! Successfully generated ${totalGenerated} physical copies.`);

    // Verification
    const countRes = await db.query('SELECT COUNT(*) as total FROM book_copies');
    console.log(`Total records in book_copies now: ${countRes.rows[0]?.total}`);

    const sample = await db.query(`
      SELECT bc.id, bc.barcode, bc.copy_number, bc.status, bc.shelf, bc.rack, b.title 
      FROM book_copies bc 
      JOIN books b ON bc.book_id = b.id 
      LIMIT 10
    `);
    console.log('Sample physical copies:', sample.rows);

    return true;
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateBookCopies().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { migrateBookCopies };
