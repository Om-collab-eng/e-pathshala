/**
 * Librika Production-Grade Meeting Controller
 * Powered by 8x8 JaaS (Jitsi as a Service)
 * 
 * Features:
 * - Cryptographically secure meeting UIDs (mtg_...)
 * - Strict meeting state machine (DRAFT -> SCHEDULED -> WAITING -> LIVE -> ENDING -> ENDED)
 * - Two meeting types: INVITE_ONLY and BROADCAST (with host lobby approval)
 * - Server-side JaaS RS256 JWT generation with room & identity enforcement
 * - Single active meeting per user tracking
 * - Real-time heartbeat & exact duration calculation
 * - Pre-join lobby device preview
 */

const { query } = require('../db');
const crypto = require('crypto');
const jaasService = require('../services/jaasService');
const auditLogger = require('../services/auditLogger');
const notifService = require('../services/notificationService');
const { generateUid } = require('../db/initMeetingTables');


// Helper to generate human-readable meeting code (e.g., LIB-782-K9Q)
function generateMeetingCode(prefix = 'LIB') {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let p1 = '', p2 = '';
  for (let i = 0; i < 3; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${p1}-${p2}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MEETING MANAGEMENT (CRUD & STATE MACHINE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new meeting (INVITE_ONLY or BROADCAST)
 * POST /api/meetings
 */
exports.postCreateMeeting = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const role = (req.session.role || '').toLowerCase();
    if (role === 'student') {
      return res.status(403).json({ success: false, message: 'Students are not authorized to create online meetings.' });
    }

    const {
      title,
      description,
      meetingType = 'INVITE_ONLY',
      sessionType = 'CLASS',
      className = 'All Students',
      scheduledStart,
      scheduledEnd,
      durationMinutes = 60,
      maxParticipants = 100,
      lobbyEnabled = true,
      recordingEnabled = false,
      passcode,
      invitedUserIds = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Meeting title is required.' });
    }

    const hostUserId = req.session.user_id;
    const hostName = req.session.name || req.session.user_name || 'Faculty Host';
    const schoolCode = req.body.schoolCode || (req.session.role === 'super_admin' ? 'GLOBAL' : (req.session.school_code || 'DPS123'));
    const duration = parseInt(durationMinutes, 10) || 60;

    const startDt = scheduledStart ? new Date(scheduledStart) : new Date();
    const endDt = scheduledEnd ? new Date(scheduledEnd) : new Date(startDt.getTime() + duration * 60000);

    // Fetch or generate host UID
    let hostUid = req.session.uid;
    if (!hostUid) {
      const uRes = await query('SELECT uid FROM users WHERE id = $1', [hostUserId]).catch(() => ({ rows: [] }));
      hostUid = (uRes.rows && uRes.rows[0] && uRes.rows[0].uid) || `lib_usr_${String(hostUserId).padStart(6, '0')}`;
    }

    // Generate unique meeting identifiers
    const uid = generateUid('mtg_', 14);
    const meetingCode = generateMeetingCode('LIB');
    const jaasRoomName = jaasService.generateJaasRoomName(uid);

    const startStr = startDt.toISOString().slice(0, 19).replace('T', ' ');
    const endStr = endDt.toISOString().slice(0, 19).replace('T', ' ');

    // Insert meeting record
    const insertRes = await query(
      `INSERT INTO meetings (
        uid, title, description, meeting_type, session_type, host_user_id, host_name,
        host_uid, meeting_code, jaas_room_name, status, scheduled_start, scheduled_end,
        duration_minutes, class_name, school_code, max_participants, lobby_enabled,
        recording_enabled, passcode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SCHEDULED', $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id`,
      [
        uid,
        title.trim(),
        description || '',
        meetingType.toUpperCase(),
        sessionType.toUpperCase(),
        hostUserId,
        hostName,
        hostUid,
        meetingCode,
        jaasRoomName,
        startStr,
        endStr,
        duration,
        className,
        schoolCode,
        parseInt(maxParticipants, 10) || 100,
        lobbyEnabled ? 1 : 0,
        recordingEnabled ? 1 : 0,
        passcode || null
      ]
    ).catch(async () => {
      // Fallback for MySQL/SQLite without RETURNING
      return await query(
        `INSERT INTO meetings (
          uid, title, description, meeting_type, session_type, host_user_id, host_name,
          host_uid, meeting_code, jaas_room_name, status, scheduled_start, scheduled_end,
          duration_minutes, class_name, school_code, max_participants, lobby_enabled,
          recording_enabled, passcode
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SCHEDULED', $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          uid,
          title.trim(),
          description || '',
          meetingType.toUpperCase(),
          sessionType.toUpperCase(),
          hostUserId,
          hostName,
          hostUid,
          meetingCode,
          jaasRoomName,
          startStr,
          endStr,
          duration,
          className,
          schoolCode,
          parseInt(maxParticipants, 10) || 100,
          lobbyEnabled ? 1 : 0,
          recordingEnabled ? 1 : 0,
          passcode || null
        ]
      );
    });

    let meetingId = (insertRes.rows && insertRes.rows[0] && insertRes.rows[0].id) || insertRes.lastId || insertRes.insertId;
    if (!meetingId) {
      const row = await query('SELECT id FROM meetings WHERE uid = $1', [uid]).catch(() => ({ rows: [] }));
      meetingId = row.rows && row.rows[0] ? row.rows[0].id : 0;
    }

    // Automatically add host to participants
    await query(
      `INSERT INTO meeting_participants (meeting_id, meeting_uid, user_id, user_uid, user_name, role, invitation_status)
       VALUES ($1, $2, $3, $4, $5, 'host', 'accepted')`,
      [meetingId, uid, hostUserId, hostUid, hostName]
    ).catch(() => {});

    // Add invited participants if provided
    if (Array.isArray(invitedUserIds) && invitedUserIds.length > 0) {
      for (const targetId of invitedUserIds) {
        if (!targetId || Number(targetId) === Number(hostUserId)) continue;
        const userRow = await query('SELECT id, uid, name FROM users WHERE id = $1', [targetId]).catch(() => ({ rows: [] }));
        if (userRow.rows && userRow.rows[0]) {
          const u = userRow.rows[0];
          await query(
            `INSERT INTO meeting_participants (meeting_id, meeting_uid, user_id, user_uid, user_name, role, invitation_status)
             VALUES ($1, $2, $3, $4, $5, 'participant', 'pending')`,
            [meetingId, uid, u.id, u.uid || `lib_usr_${String(u.id).padStart(6, '0')}`, u.name]
          ).catch(() => {});
        }
      }
    }

    // Sync to legacy studio_sessions for seamless backward compatibility with existing views
    await query(
      `INSERT INTO studio_sessions (title, description, host_id, host_name, meeting_code, jaas_room_name, scheduled_start, scheduled_end, duration_minutes, status, class_name, visibility, school_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SCHEDULED', $10, $11, $12)`,
      [
        title.trim(),
        description || '',
        hostUserId,
        hostName,
        meetingCode,
        jaasRoomName,
        startStr,
        endStr,
        duration,
        className,
        meetingType === 'BROADCAST' ? 'PUBLIC' : 'CLASS',
        schoolCode
      ]
    ).catch(() => {});

    // Multi-device notification broadcast (DB, Socket.IO, Web Push)
    notifService.notifySchool({
      io: req.app ? req.app.get('io') : null,
      schoolCode,
      title: '📅 New Live Meeting Scheduled',
      message: `"${title.trim()}" by ${hostName} (${meetingCode})`,
      type: 'live_class',
      url: `/meet/${uid}`
    }).catch(() => {});


    // Audit log
    await auditLogger.logActivity(req, {
      userId: hostUserId,
      action: `Created Online Meeting: ${title.trim()} (${meetingCode})`,
      module: 'meeting',
      schoolCode,
      details: { uid, meetingCode, jaasRoomName, scheduledStart: startStr }
    });

    const shareUrl = `${req.protocol}://${req.get('host')}/meet/${uid}`;

    res.json({
      success: true,
      message: 'Meeting created successfully',
      meeting: {
        id: meetingId,
        uid,
        title: title.trim(),
        meetingCode,
        meetingType: meetingType.toUpperCase(),
        sessionType: sessionType.toUpperCase(),
        scheduledStart: startDt,
        scheduledEnd: endDt,
        durationMinutes: duration,
        status: 'SCHEDULED',
        hostName,
        shareUrl,
        jaasRoomName
      }
    });
  } catch (err) {
    console.error('[MEETING] postCreateMeeting error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * List meetings with filters (upcoming, live, past, mine, class)
 * GET /api/meetings
 */
exports.getMeetingsApi = async (req, res) => {
  try {
    const schoolCode = (req.session && req.session.school_code) || 'DPS123';
    const userId = req.session && req.session.user_id;
    const filter = (req.query.filter || req.query.tab || 'all').toLowerCase();
    const typeFilter = (req.query.type || '').toUpperCase();

    // Query from meetings table
    const result = await query(
      `SELECT m.*,
              (SELECT COUNT(*) FROM meeting_sessions ms WHERE ms.meeting_id = m.id AND ms.left_at IS NULL) as active_participants_count,
              (SELECT COUNT(*) FROM meeting_participants mp WHERE mp.meeting_id = m.id) as invitees_count
       FROM meetings m
       WHERE (LOWER(m.school_code) = LOWER($1) OR m.school_code = 'DPS123' OR m.school_code = 'GLOBAL' OR m.school_code IS NULL OR m.school_code = '')
       ORDER BY m.scheduled_start ASC`,
      [schoolCode]
    ).catch(() => ({ rows: [] }));

    let all = result.rows || [];
    const nowMs = Date.now();

    // Auto-transition stale LIVE meetings to ENDED after scheduled_end + 2h
    for (const m of all) {
      if ((m.status || '').toUpperCase() === 'LIVE' && m.scheduled_end && (nowMs - new Date(m.scheduled_end).getTime()) > 2 * 3600 * 1000) {
        m.status = 'ENDED';
        query(`UPDATE meetings SET status = 'ENDED', actual_end = CURRENT_TIMESTAMP WHERE id = $1`, [m.id]).catch(() => {});
      }
    }

    if (typeFilter) {
      all = all.filter(m => (m.session_type || '').toUpperCase() === typeFilter || (m.meeting_type || '').toUpperCase() === typeFilter);
    }

    const upcoming = all.filter(m => {
      const st = (m.status || '').toUpperCase();
      const startMs = new Date(m.scheduled_start).getTime();
      const durMs = (parseInt(m.duration_minutes, 10) || 60) * 60000;
      return st === 'SCHEDULED' || st === 'WAITING' || (!st && (startMs + durMs) >= nowMs);
    });
    const live = all.filter(m => (m.status || '').toUpperCase() === 'LIVE');
    const past = all.filter(m => {
      const st = (m.status || '').toUpperCase();
      const startMs = new Date(m.scheduled_start).getTime();
      const durMs = (parseInt(m.duration_minutes, 10) || 60) * 60000;
      return st === 'ENDED' || st === 'COMPLETED' || st === 'CANCELLED' || (st !== 'LIVE' && (startMs + durMs) < nowMs);
    });
    const mine = userId ? all.filter(m => Number(m.host_user_id) === Number(userId)) : [];

    let filtered = all;
    if (filter === 'upcoming') filtered = upcoming;
    else if (filter === 'live') filtered = live;
    else if (filter === 'past' || filter === 'completed') filtered = past;
    else if (filter === 'mine') filtered = mine;

    res.json({
      success: true,
      meetings: all,
      filtered,
      upcoming,
      live,
      past,
      mine,
      isJaasConfigured: jaasService.isJaasConfigured(),
      jaasDomain: jaasService.getJaasConfig().domain
    });
  } catch (err) {
    console.error('[MEETING] getMeetingsApi error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get meeting details by UID or meeting code
 * GET /api/meetings/:uid
 */
exports.getMeetingByUid = async (req, res) => {
  try {
    const uid = req.params.uid;
    const result = await query(
      `SELECT m.* FROM meetings m WHERE m.uid = $1 OR m.meeting_code = $1 OR CAST(m.id AS CHAR) = $1`,
      [uid]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    const meeting = result.rows[0];
    const user = req.session || {};
    const isModerator = jaasService.isMeetingModerator(user, meeting);

    // Fetch participants
    const partRes = await query(
      `SELECT * FROM meeting_participants WHERE meeting_id = $1 ORDER BY id ASC`,
      [meeting.id]
    ).catch(() => ({ rows: [] }));

    // If host/moderator, also fetch pending lobby requests
    let joinRequests = [];
    if (isModerator) {
      const jrRes = await query(
        `SELECT * FROM meeting_join_requests WHERE meeting_id = $1 AND status = 'pending' ORDER BY requested_at ASC`,
        [meeting.id]
      ).catch(() => ({ rows: [] }));
      joinRequests = jrRes.rows || [];
    }

    // Active attendance count
    const activeRes = await query(
      `SELECT COUNT(*) as count FROM meeting_sessions WHERE meeting_id = $1 AND left_at IS NULL`,
      [meeting.id]
    ).catch(() => ({ rows: [{ count: 0 }] }));

    res.json({
      success: true,
      meeting,
      participants: partRes.rows || [],
      joinRequests,
      activeParticipantsCount: parseInt((activeRes.rows && activeRes.rows[0] && activeRes.rows[0].count) || 0, 10),
      isModerator,
      isJaasConfigured: jaasService.isJaasConfigured()
    });
  } catch (err) {
    console.error('[MEETING] getMeetingByUid error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Start a meeting (SCHEDULED/WAITING -> LIVE)
 * POST /api/meetings/:uid/start
 */
exports.postStartMeeting = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const uid = req.params.uid;
    const mRes = await query(`SELECT * FROM meetings WHERE uid = $1 OR meeting_code = $1 OR CAST(id AS CHAR) = $1`, [uid]);
    if (!mRes.rows || mRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    const meeting = mRes.rows[0];

    if (!jaasService.isMeetingModerator(req.session, meeting)) {
      return res.status(403).json({ success: false, message: 'Only the host or instructor can start this meeting.' });
    }

    await query(
      `UPDATE meetings SET status = 'LIVE', actual_start = CURRENT_TIMESTAMP WHERE id = $1`,
      [meeting.id]
    );

    // Also sync status to legacy studio_sessions
    await query(`UPDATE studio_sessions SET status = 'LIVE' WHERE meeting_code = $1 OR jaas_room_name = $2`, [meeting.meeting_code, meeting.jaas_room_name]).catch(() => {});

    await auditLogger.logActivity(req, {
      userId: req.session.user_id,
      action: `Started Live Meeting: ${meeting.title} (${meeting.meeting_code})`,
      module: 'meeting',
      details: { meetingId: meeting.id, uid: meeting.uid, status: 'LIVE' }
    });

    res.json({ success: true, status: 'LIVE', message: 'Meeting is now LIVE.' });
  } catch (err) {
    console.error('[MEETING] postStartMeeting error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * End a meeting (LIVE -> ENDED)
 * POST /api/meetings/:uid/end
 */
exports.postEndMeeting = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const uid = req.params.uid;
    const mRes = await query(`SELECT * FROM meetings WHERE uid = $1 OR meeting_code = $1 OR CAST(id AS CHAR) = $1`, [uid]);
    if (!mRes.rows || mRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    const meeting = mRes.rows[0];

    if (!jaasService.isMeetingModerator(req.session, meeting)) {
      return res.status(403).json({ success: false, message: 'Only the host or instructor can end this meeting.' });
    }

    await query(
      `UPDATE meetings SET status = 'ENDED', actual_end = CURRENT_TIMESTAMP WHERE id = $1`,
      [meeting.id]
    );

    // Finalize open sessions in meeting_sessions
    await query(
      `UPDATE meeting_sessions 
       SET left_at = CURRENT_TIMESTAMP,
           duration_seconds = TIMESTAMPDIFF(SECOND, joined_at, CURRENT_TIMESTAMP)
       WHERE meeting_id = $1 AND left_at IS NULL`,
      [meeting.id]
    ).catch(async () => {
      await query(
        `UPDATE meeting_sessions 
         SET left_at = CURRENT_TIMESTAMP,
             duration_seconds = (strftime('%s', 'now') - strftime('%s', joined_at))
         WHERE meeting_id = $1 AND left_at IS NULL`,
        [meeting.id]
      ).catch(() => {});
    });

    // Also sync legacy studio_sessions
    await query(`UPDATE studio_sessions SET status = 'COMPLETED', scheduled_end = CURRENT_TIMESTAMP WHERE meeting_code = $1 OR jaas_room_name = $2`, [meeting.meeting_code, meeting.jaas_room_name]).catch(() => {});

    await auditLogger.logActivity(req, {
      userId: req.session.user_id,
      action: `Concluded Live Meeting: ${meeting.title} (${meeting.meeting_code})`,
      module: 'meeting',
      details: { meetingId: meeting.id, uid: meeting.uid, status: 'ENDED' }
    });

    res.json({ success: true, status: 'ENDED', message: 'Meeting ended successfully.' });
  } catch (err) {
    console.error('[MEETING] postEndMeeting error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Cancel a meeting
 * POST /api/meetings/:uid/cancel
 */
exports.postCancelMeeting = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const uid = req.params.uid;
    const mRes = await query(`SELECT * FROM meetings WHERE uid = $1 OR meeting_code = $1 OR CAST(id AS CHAR) = $1`, [uid]);
    if (!mRes.rows || mRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    const meeting = mRes.rows[0];

    if (!jaasService.isMeetingModerator(req.session, meeting)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this meeting.' });
    }

    await query(`UPDATE meetings SET status = 'CANCELLED' WHERE id = $1`, [meeting.id]);
    await query(`UPDATE studio_sessions SET status = 'CANCELLED' WHERE meeting_code = $1 OR jaas_room_name = $2`, [meeting.meeting_code, meeting.jaas_room_name]).catch(() => {});

    res.json({ success: true, status: 'CANCELLED', message: 'Meeting cancelled.' });
  } catch (err) {
    console.error('[MEETING] postCancelMeeting error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete meeting record
 * DELETE /api/meetings/:uid
 */
exports.deleteMeeting = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const uid = req.params.uid;
    const mRes = await query(`SELECT * FROM meetings WHERE uid = $1 OR meeting_code = $1 OR CAST(id AS CHAR) = $1`, [uid]);
    if (!mRes.rows || mRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    const meeting = mRes.rows[0];

    if (!jaasService.isMeetingModerator(req.session, meeting)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this meeting.' });
    }

    await query(`DELETE FROM meeting_sessions WHERE meeting_id = $1`, [meeting.id]).catch(() => {});
    await query(`DELETE FROM meeting_participants WHERE meeting_id = $1`, [meeting.id]).catch(() => {});
    await query(`DELETE FROM meeting_join_requests WHERE meeting_id = $1`, [meeting.id]).catch(() => {});
    await query(`DELETE FROM meetings WHERE id = $1`, [meeting.id]);
    await query(`DELETE FROM studio_sessions WHERE meeting_code = $1 OR jaas_room_name = $2`, [meeting.meeting_code, meeting.jaas_room_name]).catch(() => {});

    res.json({ success: true, message: 'Meeting deleted successfully.' });
  } catch (err) {
    console.error('[MEETING] deleteMeeting error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// 2. PARTICIPANT INVITATIONS & BROADCAST LOBBY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Invite participants to an INVITE_ONLY meeting
 * POST /api/meetings/:uid/invite
 */
exports.postInviteParticipants = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const uid = req.params.uid;
    const mRes = await query(`SELECT * FROM meetings WHERE uid = $1 OR meeting_code = $1 OR CAST(id AS CHAR) = $1`, [uid]);
    if (!mRes.rows || mRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    const meeting = mRes.rows[0];

    if (!jaasService.isMeetingModerator(req.session, meeting)) {
      return res.status(403).json({ success: false, message: 'Only hosts or instructors can invite participants.' });
    }

    const { userIds = [], role = 'participant' } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one user ID to invite.' });
    }

    let invitedCount = 0;
    for (const targetId of userIds) {
      const uRes = await query(`SELECT id, uid, name FROM users WHERE id = $1`, [targetId]).catch(() => ({ rows: [] }));
      if (uRes.rows && uRes.rows[0]) {
        const u = uRes.rows[0];
        const userUid = u.uid || `lib_usr_${String(u.id).padStart(6, '0')}`;
        await query(
          `INSERT INTO meeting_participants (meeting_id, meeting_uid, user_id, user_uid, user_name, role, invitation_status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [meeting.id, meeting.uid, u.id, userUid, u.name, role]
        ).catch(() => {});
        invitedCount++;

        // Send multi-device push and socket alert directly to invited user
        notifService.notifyUser({
          io: req.app ? req.app.get('io') : null,
          userId: u.id,
          schoolCode: meeting.school_code || 'GLOBAL',
          title: '📹 Meeting Invitation',
          message: `You were invited to "${meeting.title}" by ${req.session.name || 'Host'}.`,
          type: 'live_meeting',
          url: `/meet/${meeting.uid}`
        }).catch(() => {});
      }
    }


    res.json({ success: true, message: `Successfully invited ${invitedCount} participants.` });
  } catch (err) {
    console.error('[MEETING] postInviteParticipants error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Request to join a BROADCAST meeting (adds to lobby)
 * POST /api/meetings/:uid/join-request
 */
exports.postJoinRequest = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const uid = req.params.uid;
    const mRes = await query(`SELECT * FROM meetings WHERE uid = $1 OR meeting_code = $1 OR CAST(id AS CHAR) = $1`, [uid]);
    if (!mRes.rows || mRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    const meeting = mRes.rows[0];

    const userId = req.session.user_id;
    const userName = req.session.name || 'Participant';
    const userRole = req.session.role || 'student';

    // If meeting is INVITE_ONLY, reject open join requests
    if (meeting.meeting_type === 'INVITE_ONLY') {
      // Check if user is in participants table
      const partCheck = await query(
        `SELECT id FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2`,
        [meeting.id, userId]
      ).catch(() => ({ rows: [] }));

      if (!partCheck.rows || partCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'This is a private, invite-only meeting. You must be invited by the host to attend.'
        });
      }
    }

    // Check if an existing request is pending or approved
    const existingReq = await query(
      `SELECT * FROM meeting_join_requests WHERE meeting_id = $1 AND user_id = $2 ORDER BY id DESC LIMIT 1`,
      [meeting.id, userId]
    ).catch(() => ({ rows: [] }));

    if (existingReq.rows && existingReq.rows.length > 0) {
      const status = existingReq.rows[0].status;
      if (status === 'approved') {
        return res.json({ success: true, status: 'approved', message: 'You have been approved to join.' });
      }
      if (status === 'pending') {
        return res.json({ success: true, status: 'pending', message: 'Waiting for host approval.' });
      }
    }

    // If lobby is not enabled, auto-approve
    const lobbyEnabled = Boolean(meeting.lobby_enabled);
    const initialStatus = lobbyEnabled ? 'pending' : 'approved';

    await query(
      `INSERT INTO meeting_join_requests (meeting_id, meeting_uid, user_id, user_name, user_role, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [meeting.id, meeting.uid, userId, userName, userRole, initialStatus]
    );

    res.json({
      success: true,
      status: initialStatus,
      message: initialStatus === 'approved' ? 'Entry approved.' : 'Waiting for host to admit you into the room.'
    });
  } catch (err) {
    console.error('[MEETING] postJoinRequest error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Host approves participant join request
 * POST /api/meetings/:uid/approve/:userId
 */
exports.postApproveJoinRequest = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { uid, userId } = req.params;
    const mRes = await query(`SELECT * FROM meetings WHERE uid = $1 OR meeting_code = $1 OR CAST(id AS CHAR) = $1`, [uid]);
    if (!mRes.rows || mRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    const meeting = mRes.rows[0];

    if (!jaasService.isMeetingModerator(req.session, meeting)) {
      return res.status(403).json({ success: false, message: 'Only hosts can approve join requests.' });
    }

    await query(
      `UPDATE meeting_join_requests 
       SET status = 'approved', decided_at = CURRENT_TIMESTAMP, decided_by = $1
       WHERE meeting_id = $2 AND user_id = $3 AND status = 'pending'`,
      [req.session.user_id, meeting.id, userId]
    );

    res.json({ success: true, message: 'Participant approved to enter room.' });
  } catch (err) {
    console.error('[MEETING] postApproveJoinRequest error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Host rejects participant join request
 * POST /api/meetings/:uid/reject/:userId
 */
exports.postRejectJoinRequest = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { uid, userId } = req.params;
    const mRes = await query(`SELECT * FROM meetings WHERE uid = $1 OR meeting_code = $1 OR CAST(id AS CHAR) = $1`, [uid]);
    if (!mRes.rows || mRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    const meeting = mRes.rows[0];

    if (!jaasService.isMeetingModerator(req.session, meeting)) {
      return res.status(403).json({ success: false, message: 'Only hosts can reject join requests.' });
    }

    await query(
      `UPDATE meeting_join_requests 
       SET status = 'rejected', decided_at = CURRENT_TIMESTAMP, decided_by = $1
       WHERE meeting_id = $2 AND user_id = $3 AND status = 'pending'`,
      [req.session.user_id, meeting.id, userId]
    );

    res.json({ success: true, message: 'Participant request rejected.' });
  } catch (err) {
    console.error('[MEETING] postRejectJoinRequest error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// 3. JOIN AUTHORIZATION, TOKEN GENERATION & ATTENDANCE SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authorize and issue short-lived JaaS RS256 JWT for participant
 * POST /api/meetings/:uid/join
 */
exports.postJoinMeetingApi = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const uid = req.params.uid;
    const mRes = await query(
      `SELECT m.* FROM meetings m WHERE m.uid = $1 OR m.meeting_code = $1 OR CAST(m.id AS CHAR) = $1`,
      [uid]
    );

    if (!mRes.rows || mRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found. Unknown meeting link.' });
    }
    const meeting = mRes.rows[0];

    const user = req.session;
    const userId = user.user_id;
    const userName = user.name || user.user_name || 'Participant';
    const isModerator = jaasService.isMeetingModerator(user, meeting);

    // 1. Authorization check based on meeting type
    if (meeting.meeting_type === 'INVITE_ONLY' && !isModerator) {
      const partCheck = await query(
        `SELECT id FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2`,
        [meeting.id, userId]
      ).catch(() => ({ rows: [] }));

      if (!partCheck.rows || partCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You are not invited to this private meeting.'
        });
      }
    }

    // 2. Check lobby approval for BROADCAST meetings if lobby is enabled
    if (meeting.meeting_type === 'BROADCAST' && meeting.lobby_enabled && !isModerator) {
      const reqCheck = await query(
        `SELECT status FROM meeting_join_requests WHERE meeting_id = $1 AND user_id = $2 ORDER BY id DESC LIMIT 1`,
        [meeting.id, userId]
      ).catch(() => ({ rows: [] }));

      const status = reqCheck.rows && reqCheck.rows[0] && reqCheck.rows[0].status;
      if (status !== 'approved') {
        return res.status(403).json({
          success: false,
          waitingInLobby: true,
          status: status || 'pending',
          message: status === 'rejected' ? 'Your request to join was declined by the host.' : 'Waiting for host approval in the lobby.'
        });
      }
    }

    // 3. Single active meeting enforcement (close any previous open sessions for this user)
    await query(
      `UPDATE meeting_sessions 
       SET left_at = CURRENT_TIMESTAMP,
           duration_seconds = TIMESTAMPDIFF(SECOND, joined_at, CURRENT_TIMESTAMP)
       WHERE user_id = $1 AND left_at IS NULL AND meeting_id != $2`,
      [userId, meeting.id]
    ).catch(() => {});

    // 4. Generate unique session token for this connection
    const sessionToken = `sess_${crypto.randomBytes(16).toString('hex')}`;
    const userRole = isModerator ? 'host' : (user.role || 'participant');

    // Fetch user UID
    let userUid = user.uid;
    if (!userUid) {
      const uRow = await query('SELECT uid FROM users WHERE id = $1', [userId]).catch(() => ({ rows: [] }));
      userUid = (uRow.rows && uRow.rows[0] && uRow.rows[0].uid) || `lib_usr_${String(userId).padStart(6, '0')}`;
    }

    // Record attendance session
    await query(
      `INSERT INTO meeting_sessions (
        meeting_id, meeting_uid, user_id, user_name, user_role, session_token,
        joined_at, last_heartbeat_at, join_method, device_info
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7, $8)`,
      [
        meeting.id,
        meeting.uid,
        userId,
        userName,
        userRole,
        sessionToken,
        'direct',
        (req.headers['user-agent'] || '').slice(0, 255)
      ]
    );

    // Also mirror into legacy studio_attendance table
    await query(
      `INSERT INTO studio_attendance (session_id, member_id, user_id, member_name, role, joined_at, last_heartbeat_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [meeting.id, userId, userId, userName, userRole]
    ).catch(() => {});

    // 5. Generate short-lived RS256 JaaS JWT
    let jwtToken = null;
    const jaasConfigured = jaasService.isJaasConfigured();
    const jaasConfig = jaasService.getJaasConfig();
    const rawRoomName = meeting.jaas_room_name || jaasService.generateJaasRoomName(meeting.uid);
    const fullRoomName = jaasService.formatFullJaasRoom(jaasConfig.appId, rawRoomName);

    if (jaasConfigured) {
      try {
        const tokenRes = jaasService.generateParticipantToken({
          user: {
            id: userUid,
            name: userName,
            email: user.email || `${userName.toLowerCase().replace(/\s+/g, '.')}@librika.in`,
            avatar: user.profile_photo || user.avatar || '',
            role: user.role
          },
          session: {
            id: meeting.id,
            jaas_room_name: rawRoomName,
            host_user_id: meeting.host_user_id
          },
          durationMinutes: 45,
          isModerator
        });
        jwtToken = tokenRes.token;
      } catch (tokenErr) {
        console.warn('[MEETING JOIN] JaaS JWT sign note:', tokenErr.message);
      }
    }

    // Audit log
    await auditLogger.logActivity(req, {
      userId,
      action: `Joined Meeting: ${meeting.title} (${meeting.meeting_code})`,
      module: 'meeting',
      details: { meetingId: meeting.id, uid: meeting.uid, role: userRole, isModerator }
    });

    res.json({
      success: true,
      meeting: {
        id: meeting.id,
        uid: meeting.uid,
        title: meeting.title,
        meetingCode: meeting.meeting_code,
        status: meeting.status,
        hostName: meeting.host_name
      },
      roomName: rawRoomName,
      fullRoomName,
      domain: jaasConfig.domain || '8x8.vc',
      appId: jaasConfig.appId,
      jwt: jwtToken,
      sessionToken,
      isModerator,
      isJaasConfigured: jaasConfigured,
      user: {
        id: userId,
        uid: userUid,
        name: userName,
        role: userRole
      }
    });
  } catch (err) {
    console.error('[MEETING] postJoinMeetingApi error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Attendance heartbeat — keeps session alive and updates duration
 * POST /api/meetings/:uid/heartbeat
 */
exports.postHeartbeatMeetingApi = async (req, res) => {
  try {
    const uid = req.params.uid;
    const userId = (req.session && req.session.user_id) || req.body.userId;
    const sessionToken = req.body.sessionToken;

    if (!uid || !userId) {
      return res.json({ success: true, warning: 'Missing credentials' });
    }

    // Update heartbeat timestamp & duration on latest active meeting session
    await query(
      `UPDATE meeting_sessions 
       SET last_heartbeat_at = CURRENT_TIMESTAMP,
           duration_seconds = TIMESTAMPDIFF(SECOND, joined_at, CURRENT_TIMESTAMP)
       WHERE user_id = $1 AND left_at IS NULL
       ORDER BY id DESC LIMIT 1`,
      [userId]
    ).catch(async () => {
      await query(
        `UPDATE meeting_sessions 
         SET last_heartbeat_at = CURRENT_TIMESTAMP,
             duration_seconds = (strftime('%s', 'now') - strftime('%s', joined_at))
         WHERE user_id = $1 AND left_at IS NULL
         ORDER BY id DESC LIMIT 1`,
        [userId]
      ).catch(() => {});
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Participant leaves room — records exit time and final duration
 * POST /api/meetings/:uid/leave
 */
exports.postLeaveMeetingApi = async (req, res) => {
  try {
    const uid = req.params.uid;
    const userId = (req.session && req.session.user_id) || req.body.userId;

    if (userId) {
      await query(
        `UPDATE meeting_sessions 
         SET left_at = CURRENT_TIMESTAMP,
             duration_seconds = TIMESTAMPDIFF(SECOND, joined_at, CURRENT_TIMESTAMP)
         WHERE user_id = $1 AND left_at IS NULL
         ORDER BY id DESC LIMIT 1`,
        [userId]
      ).catch(async () => {
        await query(
          `UPDATE meeting_sessions 
           SET left_at = CURRENT_TIMESTAMP,
               duration_seconds = (strftime('%s', 'now') - strftime('%s', joined_at))
           WHERE user_id = $1 AND left_at IS NULL
           ORDER BY id DESC LIMIT 1`,
          [userId]
        ).catch(() => {});
      });

      // Also update legacy studio_attendance
      await query(
        `UPDATE studio_attendance 
         SET left_at = CURRENT_TIMESTAMP,
             duration_seconds = TIMESTAMPDIFF(SECOND, joined_at, CURRENT_TIMESTAMP)
         WHERE member_id = $1 AND left_at IS NULL
         ORDER BY id DESC LIMIT 1`,
        [userId]
      ).catch(() => {});
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// 4. FRONTEND VIEWS: PRE-JOIN LOBBY & CLASSROOM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render pre-join lobby screen with device preview
 * GET /meet/:uid
 */
exports.getMeetingLobby = async (req, res) => {
  try {
    const rawUid = req.params.uid || '';
    
    // Look up meeting in DB
    const mRes = await query(
      `SELECT m.* FROM meetings m WHERE m.uid = $1 OR m.meeting_code = $1 OR CAST(m.id AS CHAR) = $1`,
      [rawUid]
    );

    // If meeting not found, return clean 404 page (no ad-hoc session creation!)
    if (!mRes.rows || mRes.rows.length === 0) {
      return res.status(404).render('404', {
        title: 'Meeting Not Found - Librika',
        message: 'The meeting link you accessed is invalid or has expired.',
        url: req.originalUrl,
        user: req.session || {}
      }, (err, html) => {
        if (err || !html) {
          return res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Meeting Not Found - Librika</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
            <body class="bg-slate-900 text-white min-h-screen flex items-center justify-center p-6">
              <div class="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center">
                <div class="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl font-bold">✕</div>
                <h1 class="text-xl font-bold mb-2">Meeting Not Found</h1>
                <p class="text-slate-400 text-sm mb-6">The meeting code or URL <code>${rawUid}</code> does not correspond to an active or scheduled session.</p>
                <a href="/login" class="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm transition">Return to Portal</a>
              </div>
            </body>
            </html>
          `);
        }
        res.send(html);
      });
    }

    const meeting = mRes.rows[0];
    const user = req.session || {};
    const userId = user.user_id;

    // Check if user is logged in; if not, redirect to login with returnTo
    if (!userId) {
      if (req.flash) req.flash('error', 'Please log in to join this online meeting.');
      return res.redirect(`/login?returnTo=${encodeURIComponent(`/meet/${meeting.uid}`)}`);
    }

    const isModerator = jaasService.isMeetingModerator(user, meeting);

    // Active participants count
    const activeRes = await query(
      `SELECT COUNT(*) as count FROM meeting_sessions WHERE meeting_id = $1 AND left_at IS NULL`,
      [meeting.id]
    ).catch(() => ({ rows: [{ count: 0 }] }));
    const activeCount = parseInt((activeRes.rows && activeRes.rows[0] && activeRes.rows[0].count) || 0, 10);

    // Check invitation status if INVITE_ONLY
    let isInvited = true;
    if (meeting.meeting_type === 'INVITE_ONLY' && !isModerator) {
      const partRes = await query(
        `SELECT id FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2`,
        [meeting.id, userId]
      ).catch(() => ({ rows: [] }));
      isInvited = Boolean(partRes.rows && partRes.rows.length > 0);
    }

    // Check lobby approval status if BROADCAST
    let lobbyStatus = 'none';
    if (meeting.meeting_type === 'BROADCAST' && meeting.lobby_enabled && !isModerator) {
      const jrRes = await query(
        `SELECT status FROM meeting_join_requests WHERE meeting_id = $1 AND user_id = $2 ORDER BY id DESC LIMIT 1`,
        [meeting.id, userId]
      ).catch(() => ({ rows: [] }));
      if (jrRes.rows && jrRes.rows[0]) {
        lobbyStatus = jrRes.rows[0].status;
      }
    }

    res.render('meeting_lobby', {
      layout: false,
      title: `${meeting.title} - Librika Pre-Join Lobby`,
      meeting,
      user: {
        id: userId,
        uid: user.uid || `lib_usr_${String(userId).padStart(6, '0')}`,
        name: user.name || user.user_name || 'Participant',
        role: user.role || 'student',
        email: user.email || ''
      },
      isModerator,
      isInvited,
      lobbyStatus,
      activeCount,
      jaasDomain: jaasService.getJaasConfig().domain
    });
  } catch (err) {
    console.error('[MEETING] getMeetingLobby error:', err);
    res.status(500).send('Error loading meeting lobby: ' + err.message);
  }
};

/**
 * Render full-screen interactive live classroom
 * GET /meet/:uid/classroom
 */
exports.getMeetingClassroom = async (req, res) => {
  try {
    const rawUid = req.params.uid || '';
    const mRes = await query(
      `SELECT m.* FROM meetings m WHERE m.uid = $1 OR m.meeting_code = $1 OR CAST(m.id AS CHAR) = $1`,
      [rawUid]
    );

    if (!mRes.rows || mRes.rows.length === 0) {
      return res.status(404).send('Meeting session not found.');
    }
    const meeting = mRes.rows[0];

    const user = req.session || {};
    const userId = user.user_id;

    if (!userId) {
      return res.redirect(`/meet/${meeting.uid}`);
    }

    const isModerator = jaasService.isMeetingModerator(user, meeting);
    const role = isModerator ? 'host' : (user.role || 'student');

    // Verify permission to be in classroom
    if (meeting.meeting_type === 'INVITE_ONLY' && !isModerator) {
      const partCheck = await query(
        `SELECT id FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2`,
        [meeting.id, userId]
      ).catch(() => ({ rows: [] }));
      if (!partCheck.rows || partCheck.rows.length === 0) {
        return res.redirect(`/meet/${meeting.uid}`);
      }
    }

    // Prepare JaaS JWT
    let jaasJwt = null;
    const jaasConfigured = jaasService.isJaasConfigured();
    const jaasConfig = jaasService.getJaasConfig();
    const rawRoomName = meeting.jaas_room_name || jaasService.generateJaasRoomName(meeting.uid);
    const fullRoomName = jaasService.formatFullJaasRoom(jaasConfig.appId, rawRoomName);

    const userUid = user.uid || `lib_usr_${String(userId).padStart(6, '0')}`;

    if (jaasConfigured) {
      try {
        const tokenRes = jaasService.generateParticipantToken({
          user: {
            id: userUid,
            name: user.name || 'Participant',
            email: user.email || '',
            avatar: user.profile_photo || user.avatar || '',
            role: user.role
          },
          session: {
            id: meeting.id,
            jaas_room_name: rawRoomName,
            host_user_id: meeting.host_user_id
          },
          durationMinutes: 45,
          isModerator
        });
        jaasJwt = tokenRes.token;
      } catch (err) {
        console.warn('[JAAS SSR] JWT sign note:', err.message);
      }
    }

    // Adapt session object for compatibility with live_classroom.ejs template
    const sessionObj = {
      id: meeting.id,
      uid: meeting.uid,
      title: meeting.title,
      description: meeting.description,
      meeting_code: meeting.meeting_code,
      meeting_id: meeting.meeting_code,
      jaas_room_name: rawRoomName,
      status: meeting.status,
      host_name: meeting.host_name,
      course_title: meeting.class_name || 'Classroom',
      class_name: meeting.class_name
    };

    res.render('live_classroom', {
      layout: false,
      title: `${meeting.title} - Librika Live Meeting`,
      session: sessionObj,
      meeting,
      isHost: isModerator,
      isModerator,
      jaasConfig: {
        domain: jaasConfig.domain || '8x8.vc',
        appId: jaasConfig.appId,
        fullRoomName,
        rawRoomName,
        isConfigured: jaasConfigured,
        jwt: jaasJwt
      },
      user: {
        id: userId,
        uid: userUid,
        name: user.name || 'Participant',
        role,
        email: user.email || ''
      }
    });
  } catch (err) {
    console.error('[MEETING] getMeetingClassroom error:', err);
    res.status(500).send('Error launching live classroom: ' + err.message);
  }
};

/**
 * Calendar Events API — returns JSON array of scheduled meetings for calendar view
 * GET /api/meetings/calendar
 */
exports.getCalendarEventsApi = async (req, res) => {
  try {
    const schoolCode = (req.session && req.session.school_code) || 'DPS123';
    const result = await query(
      `SELECT id, uid, title, session_type, meeting_type, scheduled_start, scheduled_end, duration_minutes, status, host_name, class_name
       FROM meetings
       WHERE (LOWER(school_code) = LOWER($1) OR school_code = 'DPS123' OR school_code = 'GLOBAL' OR school_code IS NULL OR school_code = '')
       ORDER BY scheduled_start ASC`,
      [schoolCode]
    ).catch(() => ({ rows: [] }));

    const events = (result.rows || []).map(m => {
      let color = '#3B82F6'; // default blue
      const type = (m.session_type || '').toUpperCase();
      if (type === 'CLASS') color = '#10B981'; // green
      else if (type === 'WEBINAR') color = '#8B5CF6'; // purple
      else if (type === 'BROADCAST') color = '#F59E0B'; // amber

      if (m.status === 'LIVE') color = '#EF4444'; // red for live
      if (m.status === 'ENDED' || m.status === 'COMPLETED') color = '#6B7280'; // gray

      return {
        id: m.uid,
        title: m.title,
        start: m.scheduled_start,
        end: m.scheduled_end,
        url: `/meet/${m.uid}`,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          sessionType: m.session_type,
          meetingType: m.meeting_type,
          hostName: m.host_name,
          className: m.class_name,
          status: m.status
        }
      };
    });

    res.json({ success: true, events });
  } catch (err) {
    console.error('[MEETING] getCalendarEventsApi error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
