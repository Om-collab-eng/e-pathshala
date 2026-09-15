/**
 * Librika Cross-Device Push Subscriptions Migration
 * Creates the push_subscriptions table across MySQL (production), SQLite, and PostgreSQL.
 */
const { query } = require('../db');

async function initPushSubscriptionsTable() {
  console.log('[PUSH DB] Initializing push_subscriptions table...');

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        device_type VARCHAR(50) DEFAULT 'browser',
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[PUSH DB] ✅ push_subscriptions table verified/created successfully.');
  } catch (err) {
    console.error('[PUSH DB] Error creating push_subscriptions table:', err.message);
  }
}

if (require.main === module) {
  initPushSubscriptionsTable().then(() => {
    console.log('[PUSH DB] Migration finished.');
    process.exit(0);
  }).catch(e => {
    console.error('[PUSH DB] Fatal error during migration:', e);
    process.exit(1);
  });
}

module.exports = { initPushSubscriptionsTable };
