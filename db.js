const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

let dbMain;
let dbDemo;
let poolMain;
let poolDemo;
let mysqlPool;

const fs = require('fs');
const isServer = fs.existsSync('/run/mysqld/mysqld.sock') || process.env.NODE_ENV === 'production' || process.env.FORCE_MYSQL === '1';
const useMysql = (process.env.USE_MYSQL === '1' && isServer) || (!!process.env.MYSQL_DB && !process.env.USE_SQLITE && isServer);
const usePostgres = !useMysql && !!process.env.DATABASE_URL && process.env.USE_SQLITE !== '1';

// Helper to convert PostgreSQL $1, $2 placeholders to ? for MySQL/SQLite, replace ILIKE with LIKE, and strip RETURNING
const convertPlaceholders = (text, params = [], isMysql = false) => {
  let cleanedSql = text;
  
  // Replace PostgreSQL ILIKE with MySQL/SQLite LIKE
  cleanedSql = cleanedSql.replace(/\bILIKE\b/gi, 'LIKE');
  
  // Replace RANDOM() with RAND() for MySQL only (SQLite uses RANDOM())
  if (isMysql) {
    cleanedSql = cleanedSql.replace(/\bRANDOM\(\)/gi, 'RAND()');
  }
  
  // Strip RETURNING clause for MySQL/SQLite
  cleanedSql = cleanedSql.replace(/\s+RETURNING\s+([a-z0-9_,\*\s]+)/gi, '');

  if (!params || !Array.isArray(params) || params.length === 0) {
    return { sql: cleanedSql.replace(/\$\d+/g, '?'), newParams: params || [] };
  }
  const matches = cleanedSql.match(/\$\d+/g);
  if (!matches) {
    return { sql: cleanedSql, newParams: params };
  }

  const newParams = [];
  const newSql = cleanedSql.replace(/\$(\d+)/g, (match, indexStr) => {
    const paramIndex = parseInt(indexStr, 10) - 1;
    newParams.push(params[paramIndex] !== undefined ? params[paramIndex] : null);
    return '?';
  });

  return { sql: newSql, newParams };
};

if (useMysql) {
  // MySQL Setup (MilesWeb MySQL)
  const fs = require('fs');
  const mysqlConfig = {
    host: process.env.MYSQL_HOST || '10.169.7.44',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    user: process.env.MYSQL_USER || 'librika_1_librika',
    password: process.env.MYSQL_PASSWORD || 'kalatota@123',
    database: process.env.MYSQL_DB || 'librika_1_librika',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  const targetSocket = process.env.MYSQL_SOCKET || '/run/mysqld/mysqld.sock';
  if (fs.existsSync(targetSocket)) {
    mysqlConfig.socketPath = targetSocket;
  }

  mysqlPool = mysql.createPool(mysqlConfig);

  const query = async (text, params) => {
    try {
      const { sql, newParams } = convertPlaceholders(text, params, true);
      const [rows, fields] = await mysqlPool.query(sql, newParams);
      const isArray = Array.isArray(rows);
      let returnRows = isArray ? rows : [];
      if (!isArray && rows.insertId) {
        returnRows = [{ id: rows.insertId }];
      }
      return {
        rows: returnRows,
        rowCount: isArray ? rows.length : (rows.affectedRows || 0),
        lastId: isArray ? null : rows.insertId
      };
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060) {
        return { rows: [], rowCount: 0 };
      }
      console.error('Database query error (MySQL):', err);
      throw err;
    }
  };

  module.exports = {
    query,
    mysqlPool
  };
} else if (usePostgres) {
  // PostgreSQL setup
  const mainConnectionString = process.env.DATABASE_URL;
  const demoConnectionString = process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL;

  poolMain = new Pool({ connectionString: mainConnectionString });
  poolDemo = new Pool({ connectionString: demoConnectionString });

  const query = async (text, params, useDemo = false) => {
    const pool = useDemo ? poolDemo : poolMain;
    try {
      const res = await pool.query(text, params);
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
  // SQLite setup (Fallback)
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

  const query = (text, params, useDemo = false) => {
    const db = useDemo ? dbDemo : dbMain;
    const { sql, newParams } = convertPlaceholders(text, params);
    return new Promise((resolve, reject) => {
      const trimmedSql = sql.trim();
      if (/^\s*SELECT/i.test(trimmedSql)) {
        db.all(sql, newParams, (err, rows) => {
          if (err) { reject(err); return; }
          resolve({ rows: rows || [], rowCount: (rows || []).length });
        });
      } else {
        db.run(sql, newParams, function(err) {
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