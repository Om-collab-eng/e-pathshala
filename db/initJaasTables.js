const { query } = require('../db');
const crypto = require('crypto');

/**
 * Migration script for JaaS (Jitsi as a Service on 8x8.vc) tables and columns.
 * Works seamlessly across MySQL, MariaDB, PostgreSQL and SQLite.
 */
async function initJaasTables() {
  console.log('[JAAS DB] Checking & Migrating Studio Tables for JaaS 8x8.vc...');

  // 1. studio_sessions table
  await query(`
    CREATE TABLE IF NOT EXISTS studio_sessions (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      host_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
      host_name VARCHAR(255) DEFAULT 'Faculty Instructor',
      meeting_code VARCHAR(100) UNIQUE NOT NULL,
      jaas_room_name VARCHAR(120) NULL,
      scheduled_start DATETIME NULL,
      scheduled_end DATETIME NULL,
      duration_minutes INT DEFAULT 60,
      status VARCHAR(50) DEFAULT 'SCHEDULED',
      class_name VARCHAR(100) NULL DEFAULT 'All Students',
      visibility VARCHAR(50) DEFAULT 'CLASS',
      school_code VARCHAR(50) DEFAULT 'DPS123',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_host_id (host_id),
      INDEX idx_scheduled_start (scheduled_start),
      INDEX idx_status (status),
      INDEX idx_meeting_code (meeting_code),
      INDEX idx_jaas_room_name (jaas_room_name)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS studio_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        host_id INTEGER NOT NULL DEFAULT 1,
        host_name TEXT DEFAULT 'Faculty Instructor',
        meeting_code TEXT UNIQUE NOT NULL,
        jaas_room_name TEXT,
        scheduled_start DATETIME,
        scheduled_end DATETIME,
        duration_minutes INTEGER DEFAULT 60,
        status TEXT DEFAULT 'SCHEDULED',
        class_name TEXT DEFAULT 'All Students',
        visibility TEXT DEFAULT 'CLASS',
        school_code TEXT DEFAULT 'DPS123',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // Ensure columns exist on existing table
  await query(`ALTER TABLE studio_sessions ADD COLUMN jaas_room_name VARCHAR(120)`).catch(() => {});
  await query(`ALTER TABLE studio_sessions ADD COLUMN visibility VARCHAR(50) DEFAULT 'CLASS'`).catch(() => {});
  await query(`ALTER TABLE studio_sessions ADD COLUMN duration_minutes INT DEFAULT 60`).catch(() => {});
  await query(`ALTER TABLE studio_sessions ADD COLUMN school_code VARCHAR(50) DEFAULT 'DPS123'`).catch(() => {});

  // Add indexes safely
  await query(`CREATE INDEX idx_ss_host ON studio_sessions (host_id)`).catch(() => {});
  await query(`CREATE INDEX idx_ss_start ON studio_sessions (scheduled_start)`).catch(() => {});
  await query(`CREATE INDEX idx_ss_status ON studio_sessions (status)`).catch(() => {});
  await query(`CREATE INDEX idx_ss_code ON studio_sessions (meeting_code)`).catch(() => {});
  await query(`CREATE INDEX idx_ss_jaas ON studio_sessions (jaas_room_name)`).catch(() => {});

  // 2. studio_attendance table
  await query(`
    CREATE TABLE IF NOT EXISTS studio_attendance (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      session_id BIGINT UNSIGNED NOT NULL,
      member_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
      user_id BIGINT UNSIGNED NULL,
      member_name VARCHAR(255) DEFAULT 'Participant',
      role VARCHAR(50) DEFAULT 'student',
      joined_at DATETIME NOT NULL,
      left_at DATETIME NULL,
      duration_seconds INT DEFAULT 0,
      last_heartbeat_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_att_session (session_id),
      INDEX idx_att_member (member_id),
      INDEX idx_att_user (user_id)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS studio_attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL DEFAULT 0,
        user_id INTEGER,
        member_name TEXT DEFAULT 'Participant',
        role TEXT DEFAULT 'student',
        joined_at DATETIME NOT NULL,
        left_at DATETIME,
        duration_seconds INTEGER DEFAULT 0,
        last_heartbeat_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
  });

  // Ensure attendance columns exist
  await query(`ALTER TABLE studio_attendance ADD COLUMN user_id BIGINT UNSIGNED`).catch(() => {});
  await query(`ALTER TABLE studio_attendance ADD COLUMN last_heartbeat_at DATETIME`).catch(() => {});
  await query(`ALTER TABLE studio_attendance ADD COLUMN duration_seconds INT DEFAULT 0`).catch(() => {});

  // 3. Backfill jaas_room_name for any existing sessions
  const sessions = await query(`SELECT id, meeting_code, jaas_room_name FROM studio_sessions WHERE jaas_room_name IS NULL OR jaas_room_name = ''`).catch(() => ({ rows: [] }));
  if (sessions.rows && sessions.rows.length > 0) {
    for (const row of sessions.rows) {
      const rand = crypto.randomBytes(4).toString('hex');
      const safeRoom = `librika-${row.id}-${rand}`;
      await query(`UPDATE studio_sessions SET jaas_room_name = $1 WHERE id = $2`, [safeRoom, row.id]).catch(() => {});
    }
  }

  console.log('[JAAS DB] Studio Tables and Indexes migrated successfully for JaaS.');
}

if (require.main === module) {
  initJaasTables()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[JAAS DB] Migration error:', err);
      process.exit(1);
    });
}

module.exports = { initJaasTables };
