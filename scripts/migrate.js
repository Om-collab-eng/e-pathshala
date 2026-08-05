#!/usr/bin/env node
// scripts/migrate.js — Apply all SQL migrations in db/migrations/.
// Portable: works with PostgreSQL, MySQL, and SQLite.
//
// Strategy:
//  - Detect dialect by inspecting db.js (mysqlPool / poolMain / dbMain).
//  - For Postgres: pass through as-is (it supports IF NOT EXISTS everywhere).
//  - For MySQL: same as Postgres (MySQL 8 supports IF NOT EXISTS).
//  - For SQLite: rewrite ALTER TABLE ADD COLUMN to a portable form using
//    a runtime check via `PRAGMA table_info`. CREATE INDEX must use IF
//    NOT EXISTS (SQLite 3.8+); CREATE TABLE IF NOT EXISTS already works.

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('../db');

function detectDialect() {
  if (db.mysqlPool) return 'mysql';
  if (db.poolMain) return 'postgres';
  return 'sqlite';
}

async function columnExists(table, col) {
  if (db.mysqlPool) {
    const r = await db.query(
      `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, col]
    );
    return r.rows.length > 0;
  }
  if (db.poolMain) {
    const r = await db.query(
      `SELECT 1 FROM information_schema.COLUMNS WHERE table_name = $1 AND column_name = $2`,
      [table, col]
    );
    return r.rows.length > 0;
  }
  // sqlite
  const r = await db.query(`PRAGMA table_info(${table})`, []);
  return r.rows.some(row => row.name === col);
}

async function tableExists(table) {
  if (db.mysqlPool) {
    const r = await db.query(
      `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [table]
    );
    return r.rows.length > 0;
  }
  if (db.poolMain) {
    const r = await db.query(
      `SELECT 1 FROM information_schema.TABLES WHERE table_name = $1`,
      [table]
    );
    return r.rows.length > 0;
  }
  const r = await db.query(
    `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
    [table]
  );
  return r.rows.length > 0;
}

function parseAlterAddColumn(stmt) {
  // Matches: ALTER TABLE <name> ADD COLUMN <col> <rest>
  const m = stmt.match(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)\s+(.+)$/i);
  if (!m) return null;
  return { table: m[1], col: m[2], rest: m[3] };
}

function splitStatements(sql) {
  return sql
    .replace(/--[^\n]*/g, '')
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

async function runOne(stmt) {
  const dialect = detectDialect();
  if (dialect === 'sqlite') {
    const addCol = parseAlterAddColumn(stmt);
    if (addCol) {
      const exists = await columnExists(addCol.table, addCol.col);
      if (exists) return { skipped: true };
      return db.query(`ALTER TABLE ${addCol.table} ADD COLUMN ${addCol.col} ${addCol.rest}`, []);
    }
    // SQLite does not autoincrement a `SERIAL` primary key — rewrite to
    // `INTEGER PRIMARY KEY AUTOINCREMENT` so inserted rows get an id.
    if (/SERIAL/i.test(stmt)) {
      return db.query(stmt.replace(/\bSERIAL\s+PRIMARY\s+KEY\b/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT'), []);
    }
  }
  return db.query(stmt, []);
}

async function apply() {
  const dir = path.join(__dirname, '..', 'db', 'migrations');
  if (!fs.existsSync(dir)) {
    console.error('No migrations directory at', dir);
    process.exit(1);
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  console.log(`Found ${files.length} migration file(s).  Dialect: ${detectDialect()}`);
  for (const f of files) {
    const full = path.join(dir, f);
    const raw = fs.readFileSync(full, 'utf8');
    const statements = splitStatements(raw);
    console.log(`\n→ ${f}  (${statements.length} statements)`);
    let okCount = 0, skipCount = 0, errCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        const result = await runOne(stmt);
        if (result && result.skipped) {
          skipCount++;
          process.stdout.write('~');
        } else {
          okCount++;
          process.stdout.write('.');
        }
      } catch (err) {
        const msg = String(err.message || err);
        // Ignore benign errors defensively.
        if (/already exists|duplicate column|duplicate key|exists/i.test(msg)) {
          skipCount++;
          process.stdout.write('~');
        } else {
          errCount++;
          console.error(`\n  ✗ Statement ${i+1} failed: ${msg}`);
          console.error('    SQL:', stmt.slice(0, 140) + (stmt.length > 140 ? '...' : ''));
        }
      }
    }
    console.log(`\n  ok=${okCount} skip=${skipCount} err=${errCount}`);
  }
  console.log('\n✓ Migrations complete.');
  process.exit(0);
}

apply().catch(e => { console.error(e); process.exit(1); });