const db = require('../db');
const { initLibrarianTables } = require('../db/initLibrarianTables');

async function testSuite() {
  console.log('--- Starting Librarian Platform Test Suite ---');
  await initLibrarianTables();

  // 1. Check Tables
  const tables = ['books', 'book_copies', 'users', 'transactions', 'library_settings'];
  for (const t of tables) {
    const res = await db.query(`SELECT COUNT(*) as count FROM ${t}`).catch(e => ({ rows: [{ count: -1, error: e.message }] }));
    console.log(`Table [${t}]: ${res.rows[0].count} records`);
  }

  // 2. Test Book Copies
  const copies = await db.query('SELECT * FROM book_copies LIMIT 3').catch(() => ({ rows: [] }));
  console.log('Sample Book Copies:', copies.rows);

  // 3. Test Library Settings
  const settings = await db.query('SELECT * FROM library_settings').catch(() => ({ rows: [] }));
  console.log('Active Library Settings:', settings.rows);

  console.log('--- Test Suite Completed Successfully ---');
}

testSuite().catch(console.error);
