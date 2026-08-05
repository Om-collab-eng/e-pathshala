// scripts/fix_serial_ids.js
// Repair tables created from migration SQL where `id SERIAL PRIMARY KEY`
// was passed through verbatim to SQLite. SQLite does NOT autoincrement a
// `SERIAL` primary key, so newly inserted rows end up with id = NULL.
// This recreates each affected table with `id INTEGER PRIMARY KEY
// AUTOINCREMENT` and migrates existing rows (rowid order → sequential ids).
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'library_v3.db');
const db = new sqlite3.Database(dbPath);

function all(sql, params = []) {
  return new Promise((resolve, reject) => db.all(sql, params, (e, r) => e ? reject(e) : resolve(r)));
}
function run(sql, params = []) {
  return new Promise((resolve, reject) => db.run(sql, params, function (e) { e ? reject(e) : resolve(this); }));
}

(async () => {
  const tables = (await all(
    `SELECT name, sql FROM sqlite_master WHERE type='table' AND sql LIKE '%SERIAL PRIMARY KEY%' AND name NOT LIKE 'sqlite_%'`
  ));

  console.log(`Found ${tables.length} affected table(s).`);
  for (const t of tables) {
    const newSql = t.sql.replace(/\bSERIAL\s+PRIMARY\s+KEY\b/i, 'INTEGER PRIMARY KEY AUTOINCREMENT');
    const tmp = `_fix_${t.name}`;
    try {
      await run(`DROP TABLE IF EXISTS ${tmp}`);
      await run(`CREATE TABLE ${tmp} (${newSql.replace(/^CREATE TABLE [\w_]+ \(/, '').replace(/\);?\s*$/, '')})`);
      await run(`INSERT INTO ${tmp} SELECT * FROM ${t.name}`);
      await run(`DROP TABLE ${t.name}`);
      await run(`ALTER TABLE ${tmp} RENAME TO ${t.name}`);
      // Recreate indexes
      const idxs = await all(`SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name=? AND sql IS NOT NULL`, [t.name]);
      for (const ix of idxs) await run(ix.sql);
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${e.message}`);
    }
  }

  // Verify
  const check = await all(`SELECT name FROM sqlite_master WHERE type='table' AND sql LIKE '%SERIAL PRIMARY KEY%' AND name NOT LIKE 'sqlite_%'`);
  console.log(check.length ? `WARNING: ${check.length} table(s) still have SERIAL PK` : '✓ All SERIAL PKs repaired.');
  const sample = await all(`SELECT id, title FROM assignments`);
  console.log('assignments sample:', JSON.stringify(sample));
  db.close();
})().catch(e => { console.error(e); process.exit(1); });
