/**
 * Librika Production Meeting System — Database Migration
 * Creates all meeting-related tables and adds user UIDs.
 * Works across MySQL (production), PostgreSQL, and SQLite (local dev).
 */

const { query } = require('../db');
const crypto = require('crypto');

function generateUid(prefix, len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return `${prefix}${result}`;
}

async function initMeetingTables() {
  console.log('[MEETING DB] Starting meeting system migration...');

  // ────────────────────────────────────────────
  // 1. MEETINGS TABLE
  // ────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS meetings (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      uid VARCHAR(30) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      meeting_type VARCHAR(20) DEFAULT 'INVITE_ONLY',
      session_type VARCHAR(20) DEFAULT 'CLASS',
      host_user_id BIGINT UNSIGNED NOT NULL,
      host_name VARCHAR(255),
      host_uid VARCHAR(30),
      meeting_code VARCHAR(30),
      jaas_room_name VARCHAR(120),
      status VARCHAR(20) DEFAULT 'DRAFT',
      scheduled_start DATETIME NULL,
      scheduled_end DATETIME NULL,
      duration_minutes INT DEFAULT 60,
      actual_start DATETIME NULL,
      actual_end DATETIME NULL,
      class_name VARCHAR(100) DEFAULT 'All Students',
      school_code VARCHAR(50) DEFAULT 'DPS123',
      max_participants INT DEFAULT 100,
      lobby_enabled TINYINT(1) DEFAULT 1,
      recording_enabled TINYINT(1) DEFAULT 0,
      passcode VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_meeting_uid (uid),
      UNIQUE KEY uk_meeting_code (meeting_code),
      INDEX idx_mtg_host (host_user_id),
      INDEX idx_mtg_status (status),
      INDEX idx_mtg_school (school_code),
      INDEX idx_mtg_start (scheduled_start)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        meeting_type TEXT DEFAULT 'INVITE_ONLY',
        session_type TEXT DEFAULT 'CLASS',
        host_user_id INTEGER NOT NULL,
        host_name TEXT,
        host_uid TEXT,
        meeting_code TEXT UNIQUE,
        jaas_room_name TEXT,
        status TEXT DEFAULT 'DRAFT',
        scheduled_start DATETIME,
        scheduled_end DATETIME,
        duration_minutes INTEGER DEFAULT 60,
        actual_start DATETIME,
        actual_end DATETIME,
        class_name TEXT DEFAULT 'All Students',
        school_code TEXT DEFAULT 'DPS123',
        max_participants INTEGER DEFAULT 100,
        lobby_enabled INTEGER DEFAULT 1,
        recording_enabled INTEGER DEFAULT 0,
        passcode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(e => console.warn('[MEETING DB] meetings table note:', e.message));
  });

  // ────────────────────────────────────────────
  // 2. MEETING PARTICIPANTS
  // ────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS meeting_participants (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      meeting_id BIGINT UNSIGNED NOT NULL,
      meeting_uid VARCHAR(30),
      user_id BIGINT UNSIGNED NOT NULL,
      user_uid VARCHAR(30),
      user_name VARCHAR(255),
      role VARCHAR(20) DEFAULT 'participant',
      invitation_status VARCHAR(20) DEFAULT 'pending',
      invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      responded_at DATETIME NULL,
      INDEX idx_mp_meeting (meeting_id),
      INDEX idx_mp_user (user_id),
      INDEX idx_mp_status (invitation_status)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id INTEGER NOT NULL,
        meeting_uid TEXT,
        user_id INTEGER NOT NULL,
        user_uid TEXT,
        user_name TEXT,
        role TEXT DEFAULT 'participant',
        invitation_status TEXT DEFAULT 'pending',
        invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        responded_at DATETIME
      )
    `).catch(e => console.warn('[MEETING DB] meeting_participants note:', e.message));
  });

  // ────────────────────────────────────────────
  // 3. MEETING JOIN REQUESTS (lobby)
  // ────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS meeting_join_requests (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      meeting_id BIGINT UNSIGNED NOT NULL,
      meeting_uid VARCHAR(30),
      user_id BIGINT UNSIGNED NOT NULL,
      user_name VARCHAR(255),
      user_role VARCHAR(50),
      status VARCHAR(20) DEFAULT 'pending',
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      decided_at DATETIME NULL,
      decided_by BIGINT UNSIGNED NULL,
      INDEX idx_jr_meeting (meeting_id),
      INDEX idx_jr_user (user_id),
      INDEX idx_jr_status (status)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS meeting_join_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id INTEGER NOT NULL,
        meeting_uid TEXT,
        user_id INTEGER NOT NULL,
        user_name TEXT,
        user_role TEXT,
        status TEXT DEFAULT 'pending',
        requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        decided_at DATETIME,
        decided_by INTEGER
      )
    `).catch(e => console.warn('[MEETING DB] meeting_join_requests note:', e.message));
  });

  // ────────────────────────────────────────────
  // 4. MEETING SESSIONS (per-connection attendance)
  // ────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS meeting_sessions (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      meeting_id BIGINT UNSIGNED NOT NULL,
      meeting_uid VARCHAR(30),
      user_id BIGINT UNSIGNED NOT NULL,
      user_name VARCHAR(255),
      user_role VARCHAR(50) DEFAULT 'participant',
      session_token VARCHAR(64),
      joined_at DATETIME NOT NULL,
      left_at DATETIME NULL,
      duration_seconds INT DEFAULT 0,
      last_heartbeat_at DATETIME NULL,
      join_method VARCHAR(20) DEFAULT 'direct',
      device_info VARCHAR(255),
      INDEX idx_ms_meeting (meeting_id),
      INDEX idx_ms_user (user_id),
      INDEX idx_ms_token (session_token)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS meeting_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id INTEGER NOT NULL,
        meeting_uid TEXT,
        user_id INTEGER NOT NULL,
        user_name TEXT,
        user_role TEXT DEFAULT 'participant',
        session_token TEXT,
        joined_at DATETIME NOT NULL,
        left_at DATETIME,
        duration_seconds INTEGER DEFAULT 0,
        last_heartbeat_at DATETIME,
        join_method TEXT DEFAULT 'direct',
        device_info TEXT
      )
    `).catch(e => console.warn('[MEETING DB] meeting_sessions note:', e.message));
  });

  // ────────────────────────────────────────────
  // 5. MEETING RECORDINGS
  // ────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS meeting_recordings (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      meeting_id BIGINT UNSIGNED NOT NULL,
      meeting_uid VARCHAR(30),
      recording_url TEXT,
      duration_seconds INT DEFAULT 0,
      file_size_bytes BIGINT DEFAULT 0,
      status VARCHAR(20) DEFAULT 'processing',
      started_at DATETIME NULL,
      ended_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_mr_meeting (meeting_id)
    )
  `).catch(async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS meeting_recordings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id INTEGER NOT NULL,
        meeting_uid TEXT,
        recording_url TEXT,
        duration_seconds INTEGER DEFAULT 0,
        file_size_bytes INTEGER DEFAULT 0,
        status TEXT DEFAULT 'processing',
        started_at DATETIME,
        ended_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(e => console.warn('[MEETING DB] meeting_recordings note:', e.message));
  });

  // ────────────────────────────────────────────
  // 6. USER UID MIGRATION
  // ────────────────────────────────────────────
  console.log('[MEETING DB] Ensuring user uid column exists...');
  await query(`ALTER TABLE users ADD COLUMN uid VARCHAR(30) UNIQUE`).catch(() => {});

  const usersWithoutUid = await query(
    `SELECT id FROM users WHERE uid IS NULL OR uid = ''`
  ).catch(() => ({ rows: [] }));

  if (usersWithoutUid.rows && usersWithoutUid.rows.length > 0) {
    console.log(`[MEETING DB] Backfilling UIDs for ${usersWithoutUid.rows.length} users...`);
    for (const user of usersWithoutUid.rows) {
      const uid = `lib_usr_${String(user.id).padStart(6, '0')}`;
      await query(`UPDATE users SET uid = $1 WHERE id = $2`, [uid, user.id]).catch(() => {});
    }
    console.log('[MEETING DB] User UID backfill complete.');
  }

  await query(`CREATE INDEX IF NOT EXISTS idx_users_uid ON users (uid)`).catch(() => {});

  console.log('[MEETING DB] ✅ All meeting tables and user UIDs migrated successfully.');
}

module.exports = { initMeetingTables, generateUid };

if (require.main === module) {
  initMeetingTables()
    .then(() => {
      console.log('[MEETING DB] Migration completed.');
      process.exit(0);
    })
    .catch(err => {
      console.error('[MEETING DB] Migration error:', err);
      process.exit(1);
    });
}
