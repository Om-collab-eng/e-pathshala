const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

let dbMain;
let dbDemo;
let poolMain;
let poolDemo;

// Determine which database to use: PostgreSQL if DATABASE_URL is set, otherwise SQLite
const usePostgres = !!process.env.DATABASE_URL;

if (usePostgres) {
  // PostgreSQL setup
  const mainConnectionString = process.env.DATABASE_URL;
  const demoConnectionString = process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL; // fallback to main

  poolMain = new Pool({ connectionString: mainConnectionString });
  poolDemo = new Pool({ connectionString: demoConnectionString });

  // Convert PostgreSQL-style placeholders ($1, $2, ...) to SQLite-style (?) for compatibility
  // Actually, we will keep the queries in PostgreSQL style and convert them when using SQLite.
  // But since we are using PostgreSQL, we don't need conversion.
  // We'll define a helper function that does nothing when using PostgreSQL.
  const convertPlaceholders = (text) => text;

  // Query function for PostgreSQL
  const query = async (text, params, useDemo = false) => {
    const pool = useDemo ? poolDemo : poolMain;
    try {
      const res = await pool.query(text, params);
      // Return an object similar to what we want for SQLite: { rows, rowCount }
      return { rows: res.rows, rowCount: res.rowCount };
    } catch (err) {
      console.error('Database query error (PostgreSQL):', err);
      throw err;
    }
  };

  module.exports = {
    query,
    poolMain,
    poolDemo
  };
} else {
  // SQLite setup
  const dbPath = path.resolve(__dirname);
  dbMain = new sqlite3.Database(path.join(dbPath, 'library_v3.db'), (err) => {
    if (err) {
      console.error('Error opening database', err);
    } else {
      console.log('Connected to the main SQLite database.');
    }
  });

  dbDemo = new sqlite3.Database(path.join(dbPath, 'demo.db'), (err) => {
    if (err) {
      console.error('Error opening demo database', err);
    } else {
      console.log('Connected to the demo SQLite database.');
    }
  });

  // Convert PostgreSQL-style placeholders ($1, $2, ...) to SQLite-style (?)
  const convertPlaceholders = (text) => {
    return text.replace(/\$\d+/g, '?');
  };

  const query = (text, params, useDemo = false) => {
    const db = useDemo ? dbDemo : dbMain;
    const sql = convertPlaceholders(text);
    return new Promise((resolve, reject) => {
      const trimmedSql = sql.trim();
      if (/^\s*SELECT/i.test(trimmedSql)) {
        db.all(sql, params, (err, rows) => {
          if (err) { reject(err); return; }
          resolve({ rows, rowCount: rows.length });
        });
      } else {
        db.run(sql, params, function(err) {
          if (err) { reject(err); return; }
          resolve({ rowCount: this.changes, lastId: this.lastID, rows: [] });
        });
      }
    });
  };

  module.exports = {
    query,
    dbMain,
    dbDemo
  };
}