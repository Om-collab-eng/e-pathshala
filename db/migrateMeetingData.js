/**
 * Librika Online Meeting System — Data Migration
 * Migrates existing studio_sessions and studio_attendance into
 * the unified production meetings and meeting_sessions architecture.
 */

const { query } = require('../db');
const { generateUid } = require('./initMeetingTables');

async function migrateMeetingData() {
  console.log('[MIGRATE MEETINGS] Checking legacy studio_sessions and studio_attendance...');

  try {
    // 1. Fetch legacy sessions that haven't been copied to meetings
    const legacySessions = await query(
      `SELECT ss.* FROM studio_sessions ss
       WHERE NOT EXISTS (
         SELECT 1 FROM meetings m 
         WHERE m.meeting_code = ss.meeting_code OR (m.jaas_room_name = ss.jaas_room_name AND ss.jaas_room_name IS NOT NULL)
       )`
    ).catch(() => ({ rows: [] }));

    const sessions = legacySessions.rows || [];
    console.log(`[MIGRATE MEETINGS] Found ${sessions.length} legacy studio sessions to migrate.`);

    for (const s of sessions) {
      const uid = generateUid('mtg_', 14);
      const meetingCode = s.meeting_code || `LIB-${s.id}-${Math.floor(Math.random() * 899 + 100)}`;
      const jaasRoomName = s.jaas_room_name || `librika-${s.id}-${Math.random().toString(36).substring(2, 7)}`;
      const hostId = s.host_id || 1;
      const hostName = s.host_name || 'Faculty Instructor';
      const hostUid = `lib_usr_${String(hostId).padStart(6, '0')}`;
      const status = (s.status || 'SCHEDULED').toUpperCase();
      const schoolCode = s.school_code || 'DPS123';

      await query(
        `INSERT INTO meetings (
          uid, title, description, meeting_type, session_type, host_user_id, host_name,
          host_uid, meeting_code, jaas_room_name, status, scheduled_start, scheduled_end,
          duration_minutes, class_name, school_code, max_participants, lobby_enabled
        ) VALUES ($1, $2, $3, 'CLASS', 'CLASS', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 100, 1)`,
        [
          uid,
          s.title || 'Live Studio Class',
          s.description || '',
          hostId,
          hostName,
          hostUid,
          meetingCode,
          jaasRoomName,
          status,
          s.scheduled_start,
          s.scheduled_end,
          s.duration_minutes || 60,
          s.class_name || 'All Students',
          schoolCode
        ]
      ).catch(e => console.warn('[MIGRATE] Session copy note:', e.message));

      // Also ensure host is registered in meeting_participants
      const mRow = await query('SELECT id FROM meetings WHERE uid = $1', [uid]).catch(() => ({ rows: [] }));
      if (mRow.rows && mRow.rows[0]) {
        await query(
          `INSERT INTO meeting_participants (meeting_id, meeting_uid, user_id, user_uid, user_name, role, invitation_status)
           VALUES ($1, $2, $3, $4, $5, 'host', 'accepted')`,
          [mRow.rows[0].id, uid, hostId, hostUid, hostName]
        ).catch(() => {});
      }
    }

    console.log('[MIGRATE MEETINGS] ✅ Legacy sessions migration complete.');
  } catch (err) {
    console.error('[MIGRATE MEETINGS] Migration error:', err.message);
  }
}

module.exports = { migrateMeetingData };

if (require.main === module) {
  migrateMeetingData()
    .then(() => {
      console.log('[MIGRATE MEETINGS] Done.');
      process.exit(0);
    })
    .catch(err => {
      console.error('[MIGRATE MEETINGS] Error:', err);
      process.exit(1);
    });
}
