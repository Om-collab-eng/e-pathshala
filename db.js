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

  // Query function for SQLite
  const query = (text, params, useDemo = false) => {
    const db = useDemo ? demoDb : mainDb;
    const sql = convertPlaceholders(text);
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        // For SELECT-like queries, rows is an array. For INSERT/UPDATE/DELETE, we need to use run.
        // However, we are using all() which only works for SELECT. We need to differentiate.
        // We'll check if the query is a SELECT (case-insensitive) and uses all, otherwise we use run.
        // But note: the query might be a SELECT with INTO, etc. We'll keep it simple: if the query starts with SELECT (ignoring whitespace), we treat it as a SELECT.
        // Actually, we can't use all for INSERT/UPDATE/DELETE because they don't return rows.
        // We'll split: if the query matches /^\s*SELECT/i, we use all, else we use run.
        // However, note that the original code in the application uses the same execute method for both.
        // We'll have to change the way we call query in the application? We cannot change all the calls.
        // Instead, we will make the query function smart enough to handle both by checking the statement type.
        // But the sqlite3 module's all method is for queries that return rows. For INSERT/UPDATE/DELETE, we should use run.
        // We'll do: if the query is a SELECT, we use all and return { rows, rowCount: rows.length }.
        // Otherwise, we use run and return { rowCount: this.changes } (where this is the context of the run callback).
        // We cannot do that in a single function without knowing the type.
        // We'll create two separate functions: query and execute? But we want to keep the same interface.
        // We'll look at the first word of the query (trimmed and uppercase) to decide.
        const trimmedSql = sql.trim();
        if (matched = /^\s*SELECT/i.exec(trimmedSql)) {
          // It's a SELECT query
          db.all(sql, params, (err, rows) => {
            if (err) {
              reject(err);
              return;
            }
            resolve({ rows, rowCount: rows.length });
          });
        } else {
          // It's an INSERT, UPDATE, DELETE, etc.
          db.run(sql, params, function(err) {
            if (err) {
              reject(err);
              return;
            }
            // this.lastID is the rowid for INSERT, this.changes is the number of rows changed
            resolve({
              rowCount: this.changes,
              // For INSERT, we might want to return the last inserted id? The original code sometimes uses lastrowid.
              // We'll add lastId for convenience.
              lastId: this.lastID
            });
          });
        }
      });
    });
  };

  module.exports = {
    query,
    dbMain,
    dbDemo
  };
}