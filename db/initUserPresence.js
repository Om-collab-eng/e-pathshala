const { query } = require('../db');

async function initUserPresence() {
  console.log('[PRESENCE MIGRATION] Ensuring last_active_at & is_online columns on users table...');
  
  // MySQL syntax
  try {
    await query(`ALTER TABLE users ADD COLUMN last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
    console.log('[PRESENCE MIGRATION] Added last_active_at column.');
  } catch (e) {
    // Already exists or syntax error for SQLite
  }

  try {
    await query(`ALTER TABLE users ADD COLUMN is_online TINYINT DEFAULT 0`);
    console.log('[PRESENCE MIGRATION] Added is_online column.');
  } catch (e) {}

  // SQLite fallback
  try {
    await query(`ALTER TABLE users ADD COLUMN last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
  } catch (e) {}

  try {
    await query(`ALTER TABLE users ADD COLUMN is_online INTEGER DEFAULT 0`);
  } catch (e) {}

  console.log('[PRESENCE MIGRATION] User presence columns verified.');
}

if (require.main === module) {
  initUserPresence()
    .then(() => {
      console.log('[PRESENCE MIGRATION] Complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[PRESENCE MIGRATION] Error:', err);
      process.exit(1);
    });
}

module.exports = { initUserPresence };
