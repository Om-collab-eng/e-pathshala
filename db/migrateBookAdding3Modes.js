/**
 * db/migrateBookAdding3Modes.js
 * Ensures books table contains all fields for the 3-Mode Book Adding Workflow:
 * - book_id (VARCHAR(50)) e.g. VBPG20260001
 * - price (VARCHAR(50))
 * - book_condition (VARCHAR(50) DEFAULT 'GOOD')
 * - publication_year (VARCHAR(10))
 * - edition (VARCHAR(50))
 * - publisher (VARCHAR(255))
 * - language (VARCHAR(50) DEFAULT 'English')
 * - subject (VARCHAR(100))
 * - class (VARCHAR(50))
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../db');

async function migrateBookAdding3Modes() {
  console.log('--- Starting Book Adding 3 Modes Schema Migration ---');

  const columnsToAdd = [
    { name: 'book_id', type: 'VARCHAR(50)' },
    { name: 'price', type: 'VARCHAR(50)' },
    { name: 'book_condition', type: 'VARCHAR(50) DEFAULT \'GOOD\'' },
    { name: 'publication_year', type: 'VARCHAR(10)' },
    { name: 'edition', type: 'VARCHAR(50)' },
    { name: 'publisher', type: 'VARCHAR(255)' },
    { name: 'language', type: 'VARCHAR(50) DEFAULT \'English\'' },
    { name: 'subject', type: 'VARCHAR(100)' },
    { name: 'class', type: 'VARCHAR(50)' }
  ];

  for (const col of columnsToAdd) {
    try {
      await db.query(`ALTER TABLE books ADD COLUMN ${col.name} ${col.type}`);
      console.log(`✓ Added column '${col.name}' to books table`);
    } catch (err) {
      // Ignore if already exists
      if (err.message && (err.message.includes('duplicate column') || err.message.includes('already exists') || err.message.includes('Duplicate column name'))) {
        console.log(`- Column '${col.name}' already exists in books table`);
      } else {
        console.warn(`! Note on adding column '${col.name}':`, err.message);
      }
    }
  }

  // Backfill book_id for existing books if missing (format: VBPG + YYYY + 4-digit sequence)
  try {
    const booksRes = await db.query('SELECT id, book_id, barcode_id, created_at FROM books ORDER BY id ASC');
    const rows = booksRes.rows || [];
    let seq = 1;
    const year = new Date().getFullYear();

    for (const b of rows) {
      if (!b.book_id || !b.book_id.startsWith('VBPG')) {
        const generatedId = `VBPG${year}${String(seq).padStart(4, '0')}`;
        await db.query('UPDATE books SET book_id = $1 WHERE id = $2', [generatedId, b.id]);
        console.log(`✓ Backfilled book_id '${generatedId}' for book id ${b.id}`);
        seq++;
      } else {
        const match = b.book_id.match(/VBPG\d{4}(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= seq) seq = num + 1;
        }
      }
    }
  } catch (err) {
    console.warn('! Note on backfilling book_id:', err.message);
  }

  console.log('--- Book Adding 3 Modes Schema Migration Complete ---');
}

if (require.main === module) {
  migrateBookAdding3Modes().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = migrateBookAdding3Modes;
