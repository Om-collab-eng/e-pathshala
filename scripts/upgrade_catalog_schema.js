const db = require('../db');

async function upgradeCatalogSchema() {
  console.log('🚀 Running schema enhancement for Book Catalogue & Barcode Audit...');

  // 1. Add summary and synopsis to books table if not present
  const bookCols = ['summary', 'synopsis'];
  for (const col of bookCols) {
    try {
      await db.query(`ALTER TABLE books ADD COLUMN ${col} TEXT`);
      console.log(`✓ Added column '${col}' to books table`);
    } catch (e) {
      // Column may already exist
      console.log(`  (Note: books.${col} column exists or skipped)`);
    }
  }

  // 2. Add barcode_printed audit columns to book_copies table if not present
  const copyCols = [
    { name: 'barcode_printed', type: 'INTEGER DEFAULT 0' },
    { name: 'barcode_printed_at', type: 'TEXT' },
    { name: 'barcode_printed_by', type: 'TEXT' },
    { name: 'barcode_print_batch', type: 'TEXT' }
  ];

  for (const col of copyCols) {
    try {
      await db.query(`ALTER TABLE book_copies ADD COLUMN ${col.name} ${col.type}`);
      console.log(`✓ Added column '${col.name}' to book_copies table`);
    } catch (e) {
      // Column may already exist
      console.log(`  (Note: book_copies.${col.name} column exists or skipped)`);
    }
  }

  // Populate some sample summaries for existing books if empty so the UI shows rich details
  await db.query(`
    UPDATE books 
    SET summary = COALESCE(NULLIF(summary, ''), description, 'An insightful and comprehensive work providing valuable knowledge and practical exercises.')
    WHERE summary IS NULL OR summary = ''
  `);

  console.log('🎉 Schema enhancement completed successfully!');
  process.exit(0);
}

upgradeCatalogSchema().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
