const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

async function migrate() {
  console.log('Starting Migration from SQLite (library_v3.db) to MySQL...');

  const sqlitePath = path.join(__dirname, 'library_v3.db');
  const sqliteDb = new sqlite3.Database(sqlitePath);

  const configsToTry = [
    { socketPath: '/run/mysqld/mysqld.sock', user: 'librika_1_librika', password: 'kalatota@123', database: 'librika_1_librika' },
    { host: '127.0.0.1', port: 3306, user: 'librika_1_librika', password: 'kalatota@123', database: 'librika_1_librika' },
    { host: 'localhost', port: 3306, user: 'librika_1_librika', password: 'kalatota@123', database: 'librika_1_librika' },
    { host: '10.169.7.44', port: 3306, user: 'librika_1_librika', password: 'kalatota@123', database: 'librika_1_librika' }
  ];

  let connection = null;
  let successfulConfig = null;

  for (const cfg of configsToTry) {
    try {
      console.log(`Trying MySQL connection (${cfg.socketPath || cfg.host})...`);
      connection = await mysql.createConnection(cfg);
      successfulConfig = cfg;
      console.log('Successfully connected to MySQL!');
      break;
    } catch (e) {
      console.log(`Connection attempt failed: ${e.message}`);
    }
  }

  if (!connection) {
    console.error('All MySQL connection attempts failed.');
    process.exit(1);
  }

  // Get all table names from SQLite
  sqliteDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';", async (err, tables) => {
    if (err) {
      console.error('Error fetching tables from SQLite:', err);
      process.exit(1);
    }

    for (const tableObj of tables) {
      const tableName = tableObj.name;

      // Read table rows from SQLite
      sqliteDb.all(`SELECT * FROM "${tableName}"`, async (err, rows) => {
        if (err || !rows || rows.length === 0) {
          return;
        }

        const firstRow = rows[0];
        const cols = Object.keys(firstRow);
        const colDefs = cols.map(col => `\`${col}\` LONGTEXT`).join(', ');

        try {
          await connection.query(`CREATE TABLE IF NOT EXISTS \`${tableName}\` (${colDefs});`);

          for (const row of rows) {
            const values = Object.values(row).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
            const placeholders = cols.map(() => '?').join(', ');
            const sql = `INSERT IGNORE INTO \`${tableName}\` (\`${cols.join('`, `')}\`) VALUES (${placeholders})`;
            await connection.execute(sql, values);
          }
          console.log(`Successfully migrated ${rows.length} rows into MySQL table \`${tableName}\`.`);
        } catch (e) {
          console.error(`Error migrating \`${tableName}\`:`, e.message);
        }
      });
    }
  });
}

migrate();
