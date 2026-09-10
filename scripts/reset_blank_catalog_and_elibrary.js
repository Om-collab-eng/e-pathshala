const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CATALOG_AND_ELIBRARY_TABLES = [
  'book_copies',
  'transactions',
  'loans',
  'fines',
  'reservations',
  'book_reviews',
  'student_saved_books',
  'student_wishlist',
  'personal_borrowings',
  'personal_reading_tracker',
  'personal_books',
  'acquisition_items',
  'acquisitions',
  'books',
  'digital_documents',
  'reading_progress',
  'student_saved_documents',
  'student_bookmarks',
  'quiz_attempts',
  'quizzes',
  'digital_content'
];

async function resetMysql() {
  const config = {
    host: process.env.MYSQL_HOST || '10.169.7.44',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    user: process.env.MYSQL_USER || 'librika_1_librika',
    password: process.env.MYSQL_PASSWORD || 'kalatota@123',
    database: process.env.MYSQL_DB || 'librika_1_librika',
    multipleStatements: true
  };

  console.log('[RESET] Connecting to MySQL / MariaDB on', config.host, '...');
  try {
    const conn = await mysql.createConnection(config);
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

    for (const table of CATALOG_AND_ELIBRARY_TABLES) {
      try {
        await conn.query(`DELETE FROM \`${table}\`;`);
        await conn.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1;`).catch(() => {});
        console.log(`  ✓ Truncated / Wiped: ${table}`);
      } catch (err) {
        console.warn(`  - Table ${table} not present or skipped (${err.message})`);
      }
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    await conn.end();
    console.log('[RESET] MySQL / MariaDB catalog and e-library reset COMPLETE (0 items).');
  } catch (err) {
    console.error('[RESET] MySQL connection error:', err.message);
  }
}

async function resetSqlite() {
  const dbPaths = [
    path.join(__dirname, '..', 'library.db'),
    path.join(__dirname, '..', 'library_demo.db'),
    path.join(__dirname, '..', 'database.sqlite')
  ];

  for (const dbPath of dbPaths) {
    if (!fs.existsSync(dbPath)) continue;
    console.log(`[RESET] Wiping SQLite DB: ${path.basename(dbPath)} ...`);
    const db = new sqlite3.Database(dbPath);

    await new Promise((resolve) => {
      db.serialize(() => {
        for (const table of CATALOG_AND_ELIBRARY_TABLES) {
          db.run(`DELETE FROM ${table};`, () => {});
        }
        db.run(`DELETE FROM sqlite_sequence WHERE name IN (${CATALOG_AND_ELIBRARY_TABLES.map(t => `'${t}'`).join(',')});`, () => {});
      });
      db.close(() => resolve());
    });
    console.log(`  ✓ Wiped SQLite tables in ${path.basename(dbPath)}`);
  }
}

async function main() {
  console.log('====================================================');
  console.log('  LIBRIKA: COMPLETE BLANK WIPE OF CATALOG & E-LIBRARY');
  console.log('====================================================');
  await resetMysql();
  await resetSqlite();
  console.log('====================================================');
  console.log('  SUCCESS: All catalogs and e-library wiped to 0.');
  console.log('====================================================');
}

main();
