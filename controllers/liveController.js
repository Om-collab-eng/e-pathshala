const { query } = require('../db');
const crypto = require('crypto');
const jaasService = require('../services/jaasService');
const auditLogger = require('../services/auditLogger');
const notificationService = require('../services/notificationService');

// Helper to generate readable Meeting IDs
function generateMeetingId(prefix = 'LIB') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code.slice(0, 3)}-${code.slice(3)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 0. STUDIO REST APIS — JAAS 8X8.VC PRODUCTION INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List studio sessions with support for filters: upcoming, live, completed, mine, class
 * GET /api/studio/sessions & GET /api/studio/meetings
 */
exports.getStudioSessionsApi = async (req, res) => {
  try {
    const schoolCode = (req.session && req.session.school_code) || 'DPS123';
    const userId = req.session && req.session.user_id;
    const filter = (req.query.filter || req.query.tab || 'all').toLowerCase();
    const classFilter = req.query.class;

    const result = await query(
      `SELECT ss.id, ss.title, ss.description, ss.host_id, ss.host_name, ss.meeting_code, ss.meeting_code as meeting_id,
              ss.jaas_room_name, ss.scheduled_start, ss.scheduled_end, ss.duration_minutes, ss.status,
              ss.class_name, ss.visibility, ss.school_code,
              (SELECT COUNT(*) FROM studio_attendance sa WHERE sa.session_id = ss.id) as attendee_count
       FROM studio_sessions ss
       WHERE (LOWER(ss.school_code) = LOWER($1) OR ss.school_code = 'DPS123' OR ss.school_code = 'GLOBAL' OR ss.school_code IS NULL OR ss.school_code = '')
       UNION ALL
       SELECT ls.id + 100000 as id, ls.title, '' as description, ls.host_user_id as host_id, ls.host_name,
              ls.meeting_id as meeting_code, ls.meeting_id, ls.meeting_id as jaas_room_name,
              ls.scheduled_start, ls.scheduled_end, ls.duration_minutes, ls.status,
              'All Students' as class_name, 'CLASS' as visibility, ls.school_code,
              0 as attendee_count
       FROM live_sessions ls
       WHERE (LOWER(ls.school_code) = LOWER($1) OR ls.school_code = 'DPS123' OR ls.school_code = 'GLOBAL' OR ls.school_code IS NULL OR ls.school_code = '')
         AND NOT EXISTS (SELECT 1 FROM studio_sessions s2 WHERE s2.meeting_code = ls.meeting_id OR s2.title = ls.title)
       ORDER BY scheduled_start ASC`,
      [schoolCode]
    ).catch(() => ({ rows: [] }));

    let all = result.rows || [];
    const now = new Date();
    const nowMs = now.getTime();

    // Auto-recovery: If scheduled_end passed by over 2 hours and still marked LIVE, auto-complete
    for (const s of all) {
      if ((s.status || '').toUpperCase() === 'LIVE' && s.scheduled_end && (nowMs - new Date(s.scheduled_end).getTime()) > 2 * 3600 * 1000) {
        s.status = 'COMPLETED';
        query(`UPDATE studio_sessions SET status = 'COMPLETED' WHERE id = $1`, [s.id]).catch(() => {});
      }
    }

    if (classFilter && classFilter !== 'all') {
      all = all.filter(s => {
        const sc = (s.class_name || '').toLowerCase();
        return sc === classFilter.toLowerCase() || sc === 'all' || sc === 'all students' || !sc;
      });
    }

    const upcoming = all.filter(m => {
      const st = (m.status || '').toUpperCase();
      const startMs = new Date(m.scheduled_start).getTime();
      const durMs = (parseInt(m.duration_minutes, 10) || 60) * 60000;
      return st === 'SCHEDULED' || (!st && (startMs + durMs) >= nowMs) || (st !== 'COMPLETED' && st !== 'CANCELLED' && (startMs + durMs) >= nowMs);
    });
    const live = all.filter(m => (m.status || '').toUpperCase() === 'LIVE');
    const past = all.filter(m => {
      const st = (m.status || '').toUpperCase();
      const startMs = new Date(m.scheduled_start).getTime();
      const durMs = (parseInt(m.duration_minutes, 10) || 60) * 60000;
      return st === 'COMPLETED' || st === 'CANCELLED' || (st !== 'LIVE' && (startMs + durMs) < nowMs);
    });
    const mine = userId ? all.filter(m => Number(m.host_id) === Number(userId)) : [];

    let filteredList = all;
    if (filter === 'upcoming') filteredList = upcoming;
    else if (filter === 'live') filteredList = live;
    else if (filter === 'completed' || filter === 'past' || filter === 'replays') filteredList = past;
    else if (filter === 'mine') filteredList = mine;

    res.json({
      success: true,
      meetings: all,
      sessions: filteredList,
      upcoming,
      live,
      past,
      mine,
      isJaasConfigured: jaasService.isJaasConfigured(),
      jaasDomain: jaasService.getJaasConfig().domain
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.getStudioMeetingsApi = exports.getStudioSessionsApi;

/**
 * Create a new live class / studio meeting room
 * POST /api/studio/sessions & POST /api/studio/meetings
 */
exports.postCreateStudioSession = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = (req.session.role || '').toLowerCase();
    if (userRole === 'student') {
      return res.status(403).json({ success: false, message: 'Students are not authorized to create live studio classes.' });
    }

    const { title, description, className, scheduledStart, scheduledEnd, durationMinutes, visibility } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Class title is required' });
    }

    const hostId = req.session.user_id;
    const hostName = req.session.name || req.session.user_name || 'Faculty Instructor';
    const schoolCode = req.session.school_code || 'DPS123';
    const duration = parseInt(durationMinutes, 10) || 60;

    const startDt = scheduledStart ? new Date(scheduledStart) : new Date();
    const endDt = scheduledEnd ? new Date(scheduledEnd) : new Date(startDt.getTime() + duration * 60000);

    const tempCode = `LIB-${Date.now().toString(36).toUpperCase()}`;

    // Use RETURNING id for PostgreSQL, fall back for MySQL
    let insertRes = await query(
      `INSERT INTO studio_sessions (title, description, host_id, host_name, meeting_code, scheduled_start, scheduled_end, duration_minutes, status, class_name, visibility, school_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SCHEDULED', $9, $10, $11) RETURNING id`,
      [
        title.trim(),
        description || '',
        hostId,
        hostName,
        tempCode,
        startDt.toISOString().slice(0, 19).replace('T', ' '),
        endDt.toISOString().slice(0, 19).replace('T', ' '),
        duration,
        className || 'All Students',
        visibility || 'CLASS',
        schoolCode
      ]
    ).catch(async () => {
      // Fallback for database without RETURNING support
      return await query(
        `INSERT INTO studio_sessions (title, description, host_id, host_name, meeting_code, scheduled_start, scheduled_end, duration_minutes, status, class_name, visibility, school_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SCHEDULED', $9, $10, $11)`,
        [
          title.trim(),
          description || '',
          hostId,
          hostName,
          tempCode,
          startDt.toISOString().slice(0, 19).replace('T', ' '),
          endDt.toISOString().slice(0, 19).replace('T', ' '),
          duration,
          className || 'All Students',
          visibility || 'CLASS',
          schoolCode
        ]
      );
    });

    let newId = (insertRes.rows && insertRes.rows[0] && insertRes.rows[0].id) || insertRes.lastId || insertRes.insertId;
    if (!newId) {
      const findRow = await query(`SELECT id FROM studio_sessions WHERE meeting_code = $1 LIMIT 1`, [tempCode]).catch(() => ({ rows: [] }));
      newId = findRow.rows && findRow.rows[0] ? findRow.rows[0].id : Math.floor(Math.random() * 8000 + 100);
    }

    const jaasRoomName = jaasService.generateJaasRoomName(newId);
    const finalCode = `LIB-${newId}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    await query(
      `UPDATE studio_sessions SET meeting_code = $1, jaas_room_name = $2 WHERE id = $3 OR meeting_code = $4`,
      [finalCode, jaasRoomName, newId, tempCode]
    ).catch(() => {});

    // Sync into live_sessions as well to guarantee cross-module discovery
    await query(
      `INSERT INTO live_sessions (title, scheduled_start, scheduled_end, duration_minutes, meeting_id, passcode, host_user_id, host_name, status, shareable_token, max_participants, school_code)
       VALUES ($1, $2, $3, $4, $5, '123456', $6, $7, 'SCHEDULED', $8, 100, $9)`,
      [
        title.trim(),
        startDt.toISOString().slice(0, 19).replace('T', ' '),
        endDt.toISOString().slice(0, 19).replace('T', ' '),
        duration,
        finalCode,
        hostId,
        hostName,
        `live_${finalCode}`,
        schoolCode
      ]
    ).catch(() => {});

    // Broadcast in-app notification to students of this school
    await query(
      `INSERT INTO notifications (user_id, message, type, school_code)
       VALUES (0, $1, 'live_class', $2)`,
      [`🎥 New live class scheduled: "${title.trim()}" by ${hostName} (${className || 'All Students'}).`, schoolCode]
    ).catch(() => {});

    // Audit Logging
    await auditLogger.logActivity(req, {
      userId: hostId,
      action: `Scheduled Live Studio Class: ${title} (${className || 'All Students'})`,
      module: 'studio',
      schoolCode,
      details: { sessionId: newId, meetingCode: finalCode, jaasRoomName, scheduledStart: startDt }
    });

    res.json({
      success: true,
      message: 'Class scheduled successfully',
      session: {
        id: newId,
        title,
        meetingCode: finalCode,
        jaasRoomName,
        status: 'SCHEDULED',
        scheduledStart: startDt,
        scheduledEnd: endDt,
        hostName,
        className: className || 'All Students'
      },
      meeting: {
        id: newId,
        title,
        meetingCode: finalCode,
        status: 'SCHEDULED',
        scheduledStart: startDt,
        hostName,
        className: className || 'All Students'
      }
    });
  } catch (err) {
    console.error('postCreateStudioSession error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.postCreateStudioMeeting = exports.postCreateStudioSession;

/**
 * Get details & attendance roster for a specific studio session
 * GET /api/studio/sessions/:id & GET /api/studio/meetings/:id
 */
exports.getStudioSessionById = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await query(
      `SELECT ss.* FROM studio_sessions ss WHERE ss.id = $1 OR ss.meeting_code = $1 OR ss.jaas_room_name = $1`,
      [id]
    );
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting session not found' });
    }
    const session = result.rows[0];
    const attendanceRes = await query(
      `SELECT * FROM studio_attendance WHERE session_id = $1 ORDER BY joined_at DESC`,
      [session.id]
    ).catch(() => ({ rows: [] }));

    const user = req.session || {};
    const authCheck = jaasService.canJoinStudioSession(user, session);
    const isModerator = jaasService.isSessionModerator(user, session);

    res.json({
      success: true,
      session,
      meeting: session,
      attendance: attendanceRes.rows || [],
      canJoin: authCheck.allowed,
      isModerator,
      isJaasConfigured: jaasService.isJaasConfigured()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.getStudioMeetingById = exports.getStudioSessionById;

/**
 * Update studio session metadata
 * PATCH /api/studio/sessions/:id & POST /api/studio/sessions/:id/update
 */
exports.patchStudioSession = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const id = req.params.id;
    const existing = await query(`SELECT * FROM studio_sessions WHERE id = $1 OR meeting_code = $1`, [id]);
    if (!existing.rows || existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    const session = existing.rows[0];

    const isAuthorized = jaasService.isSessionModerator(req.session, session);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this session.' });
    }

    const { title, description, className, scheduledStart, scheduledEnd, durationMinutes, visibility } = req.body;
    const updatedTitle = title || session.title;
    const updatedDesc = description !== undefined ? description : session.description;
    const updatedClass = className || session.class_name;
    const updatedVis = visibility || session.visibility || 'CLASS';
    const updatedDuration = parseInt(durationMinutes, 10) || session.duration_minutes || 60;
    const startDt = scheduledStart ? new Date(scheduledStart) : new Date(session.scheduled_start);
    const endDt = scheduledEnd ? new Date(scheduledEnd) : new Date(startDt.getTime() + updatedDuration * 60000);

    await query(
      `UPDATE studio_sessions 
       SET title = $1, description = $2, class_name = $3, visibility = $4, duration_minutes = $5, scheduled_start = $6, scheduled_end = $7
       WHERE id = $8`,
      [
        updatedTitle,
        updatedDesc,
        updatedClass,
        updatedVis,
        updatedDuration,
        startDt.toISOString().slice(0, 19).replace('T', ' '),
        endDt.toISOString().slice(0, 19).replace('T', ' '),
        session.id
      ]
    );

    await auditLogger.logActivity(req, {
      userId: req.session.user_id,
      action: `Updated Studio Session: ${updatedTitle}`,
      module: 'studio',
      details: { sessionId: session.id, title: updatedTitle }
    });

    res.json({ success: true, message: 'Session updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Start live class (transition SCHEDULED -> LIVE)
 * POST /api/studio/sessions/:id/start & POST /api/studio/meetings/:id/start
 */
exports.postStartStudioSession = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const id = req.params.id;
    const existing = await query(`SELECT * FROM studio_sessions WHERE id = $1 OR meeting_code = $1`, [id]);
    if (!existing.rows || existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    const session = existing.rows[0];

    const isAuthorized = jaasService.isSessionModerator(req.session, session);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Only the host or faculty can start this live class.' });
    }

    await query(`UPDATE studio_sessions SET status = 'LIVE' WHERE id = $1`, [session.id]);

    await auditLogger.logActivity(req, {
      userId: req.session.user_id,
      action: `Started Live Studio Class: ${session.title}`,
      module: 'studio',
      details: { sessionId: session.id, status: 'LIVE' }
    });

    res.json({ success: true, status: 'LIVE', message: 'Class is now live.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.postStartStudioMeeting = exports.postStartStudioSession;

/**
 * Cancel live class (mark CANCELLED)
 * POST /api/studio/sessions/:id/cancel
 */
exports.postCancelStudioSession = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const id = req.params.id;
    const existing = await query(`SELECT * FROM studio_sessions WHERE id = $1 OR meeting_code = $1`, [id]);
    if (!existing.rows || existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    const session = existing.rows[0];

    const isAuthorized = jaasService.isSessionModerator(req.session, session);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this class.' });
    }

    await query(`UPDATE studio_sessions SET status = 'CANCELLED' WHERE id = $1`, [session.id]);

    await auditLogger.logActivity(req, {
      userId: req.session.user_id,
      action: `Cancelled Studio Class: ${session.title}`,
      module: 'studio',
      details: { sessionId: session.id, status: 'CANCELLED' }
    });

    res.json({ success: true, status: 'CANCELLED', message: 'Class cancelled.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * End live class (transition LIVE -> COMPLETED)
 * POST /api/studio/sessions/:id/end & POST /api/studio/meetings/:id/end
 */
exports.postEndStudioSession = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const id = req.params.id;
    const existing = await query(`SELECT * FROM studio_sessions WHERE id = $1 OR meeting_code = $1`, [id]);
    if (!existing.rows || existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    const session = existing.rows[0];

    const isAuthorized = jaasService.isSessionModerator(req.session, session);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'You are not authorized to conclude this class.' });
    }

    await query(
      `UPDATE studio_sessions SET status = 'COMPLETED', scheduled_end = CURRENT_TIMESTAMP WHERE id = $1`,
      [session.id]
    );

    // Finalize open attendance records
    await query(
      `UPDATE studio_attendance 
       SET left_at = CURRENT_TIMESTAMP, 
           duration_seconds = TIMESTAMPDIFF(SECOND, joined_at, CURRENT_TIMESTAMP)
       WHERE session_id = $1 AND left_at IS NULL`,
      [session.id]
    ).catch(async () => {
      await query(
        `UPDATE studio_attendance 
         SET left_at = CURRENT_TIMESTAMP, 
             duration_seconds = (strftime('%s', 'now') - strftime('%s', joined_at))
         WHERE session_id = $1 AND left_at IS NULL`,
        [session.id]
      ).catch(() => {});
    });

    await auditLogger.logActivity(req, {
      userId: req.session.user_id,
      action: `Concluded Live Studio Class: ${session.title}`,
      module: 'studio',
      details: { sessionId: session.id, status: 'COMPLETED' }
    });

    res.json({ success: true, status: 'COMPLETED', message: 'Class concluded successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.postEndStudioMeeting = exports.postEndStudioSession;

/**
 * Delete studio session record
 * DELETE /api/studio/sessions/:id & DELETE /api/studio/meetings/:id
 */
exports.deleteStudioSession = async (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const id = req.params.id;
    const existing = await query(`SELECT * FROM studio_sessions WHERE id = $1 OR meeting_code = $1`, [id]);
    if (!existing.rows || existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    const session = existing.rows[0];

    const isAuthorized = jaasService.isSessionModerator(req.session, session);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this session.' });
    }

    await query(`DELETE FROM studio_attendance WHERE session_id = $1`, [session.id]).catch(() => {});
    await query(`DELETE FROM studio_sessions WHERE id = $1`, [session.id]);

    await auditLogger.logActivity(req, {
      userId: req.session.user_id,
      action: `Deleted Studio Session: ${session.title}`,
      module: 'studio',
      details: { sessionId: session.id }
    });

    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.deleteStudioMeeting = exports.deleteStudioSession;

/**
 * Authenticate, Authorize, Record Attendance, and Generate short-lived JaaS RS256 JWT
 * POST /api/studio/sessions/:id/join
 */
exports.postJoinStudioSession = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await query(
      `SELECT ss.* FROM studio_sessions ss WHERE ss.id = $1 OR ss.meeting_code = $1 OR ss.jaas_room_name = $1`,
      [id]
    );
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Live class session not found.' });
    }
    const session = result.rows[0];

    const user = req.session || {};
    const authCheck = jaasService.canJoinStudioSession(user, session);
    if (!authCheck.allowed) {
      return res.status(403).json({ success: false, message: authCheck.reason || 'You are not authorized to join this live class.' });
    }

    const memberId = user.user_id || user.id || 0;
    const memberName = user.name || user.user_name || req.body.memberName || 'Participant';
    const isModerator = jaasService.isSessionModerator(user, session);
    const role = isModerator ? 'host' : (user.role || 'student');

    // 1. Ensure room name exists
    if (!session.jaas_room_name) {
      session.jaas_room_name = jaasService.generateJaasRoomName(session.id);
      await query(`UPDATE studio_sessions SET jaas_room_name = $1 WHERE id = $2`, [session.jaas_room_name, session.id]).catch(() => {});
    }

    // 2. Record Attendance Join
    if (memberId) {
      await query(
        `INSERT INTO studio_attendance (session_id, member_id, user_id, member_name, role, joined_at, last_heartbeat_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [session.id, memberId, memberId, memberName, role]
      ).catch(() => {});
    }

    // 3. Generate JaaS JWT if credentials configured
    let jwtToken = null;
    let jaasConfigured = jaasService.isJaasConfigured();
    let jaasDomain = '8x8.vc';
    let fullRoomName = session.jaas_room_name;
    let appId = '';

    if (jaasConfigured) {
      try {
        const tokenResult = jaasService.generateParticipantToken({
          user: {
            id: memberId,
            name: memberName,
            email: user.email || `${memberName.toLowerCase().replace(/\s+/g, '.')}@librika.in`,
            avatar: user.profile_photo || user.avatar || '',
            role: user.role
          },
          session,
          durationMinutes: 30,
          isModerator
        });
        jwtToken = tokenResult.token;
        fullRoomName = tokenResult.fullRoomName;
        jaasDomain = tokenResult.domain;
        appId = tokenResult.appId;
      } catch (tokenErr) {
        console.warn('[JAAS JOIN] Token generation note:', tokenErr.message);
      }
    } else {
      const cfg = jaasService.getJaasConfig();
      appId = cfg.appId || 'vpaas-magic-cookie-demo';
      fullRoomName = jaasService.formatFullJaasRoom(appId, session.jaas_room_name);
    }

    // 4. Audit Log Join
    await auditLogger.logActivity(req, {
      userId: memberId,
      action: `Joined Live Studio Session: ${session.title}`,
      module: 'studio',
      details: { sessionId: session.id, role, isModerator }
    });

    res.json({
      success: true,
      sessionId: session.id,
      title: session.title,
      roomName: session.jaas_room_name,
      fullRoomName,
      domain: jaasDomain,
      appId,
      jwt: jwtToken,
      isModerator,
      isJaasConfigured: jaasConfigured,
      displayName: memberName,
      email: user.email || '',
      sessionStatus: session.status
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Attendance Heartbeat — Keeps student/host attendance alive and computes duration
 * POST /api/studio/sessions/:id/heartbeat
 */
exports.postHeartbeatStudioSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const memberId = (req.session && req.session.user_id) || req.body.memberId || 0;

    if (!sessionId || !memberId) {
      return res.json({ success: true, warning: 'No active session id' });
    }

    // Update heartbeat timestamp & duration on latest active attendance entry
    await query(
      `UPDATE studio_attendance 
       SET last_heartbeat_at = CURRENT_TIMESTAMP,
           duration_seconds = TIMESTAMPDIFF(SECOND, joined_at, CURRENT_TIMESTAMP)
       WHERE session_id = $1 AND (member_id = $2 OR user_id = $2) AND left_at IS NULL
       ORDER BY id DESC LIMIT 1`,
      [sessionId, memberId]
    ).catch(async () => {
      await query(
        `UPDATE studio_attendance 
         SET last_heartbeat_at = CURRENT_TIMESTAMP,
             duration_seconds = (strftime('%s', 'now') - strftime('%s', joined_at))
         WHERE session_id = $1 AND (member_id = $2 OR user_id = $2) AND left_at IS NULL`,
        [sessionId, memberId]
      ).catch(() => {});
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Record participant leaving the room & calculate final duration
 * POST /api/studio/sessions/:id/leave & POST /api/studio/meetings/:id/attendance/leave
 */
exports.postLeaveStudioSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const memberId = (req.session && req.session.user_id) || req.body.memberId || 0;

    if (sessionId && memberId) {
      await query(
        `UPDATE studio_attendance 
         SET left_at = CURRENT_TIMESTAMP, 
             duration_seconds = TIMESTAMPDIFF(SECOND, joined_at, CURRENT_TIMESTAMP)
         WHERE session_id = $1 AND (member_id = $2 OR user_id = $2) AND left_at IS NULL
         ORDER BY id DESC LIMIT 1`,
        [sessionId, memberId]
      ).catch(async () => {
        await query(
          `UPDATE studio_attendance 
           SET left_at = CURRENT_TIMESTAMP,
               duration_seconds = (strftime('%s', 'now') - strftime('%s', joined_at))
           WHERE session_id = $1 AND (member_id = $2 OR user_id = $2) AND left_at IS NULL`,
          [sessionId, memberId]
        ).catch(() => {});
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.postRecordAttendanceLeave = exports.postLeaveStudioSession;
exports.postRecordAttendanceJoin = exports.postJoinStudioSession;

/**
 * Optional JaaS Webhook Endpoint
 * POST /api/webhooks/jaas
 */
exports.postJaasWebhook = async (req, res) => {
  try {
    const event = req.body;
    if (!event || !event.event_type) {
      return res.status(400).json({ success: false, message: 'Invalid JaaS event payload' });
    }

    // Handle room end or participant leave events idempotently
    if (event.event_type === 'ROOM_DESTROYED') {
      const roomName = event.room_name;
      if (roomName) {
        await query(`UPDATE studio_sessions SET status = 'COMPLETED', scheduled_end = CURRENT_TIMESTAMP WHERE jaas_room_name = $1 OR meeting_code = $1`, [roomName]).catch(() => {});
      }
    }

    res.json({ success: true, processed: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// 1. INSTRUCTOR LIVE STUDIO DASHBOARD (/studio)
// ─────────────────────────────────────────────────────────────────────────────
exports.getStudioDashboard = async (req, res) => {
  try {
    // If student accesses studio, redirect to student-facing live classes hub
    if (req.session && req.session.role === 'student') {
      return res.redirect('/student/live-classes');
    }

    const schoolCode = req.session.school_code || 'DPS123';
    const userId = req.session.user_id || 23;
    const userName = req.session.name || 'Instructor';

    // 1. Fetch all courses
    const coursesRes = await query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM course_enrollments e WHERE e.course_id = c.id) as enrollment_count,
        (SELECT COUNT(*) FROM live_sessions s WHERE s.course_id = c.id) as session_count
       FROM live_courses c 
       WHERE c.school_code = $1 OR c.instructor_id = $2
       ORDER BY c.created_at DESC`,
      [schoolCode, userId]
    ).catch(() => ({ rows: [] }));

    const courses = coursesRes.rows || [];

    // 2. Fetch upcoming live sessions
    const sessionsRes = await query(
      `SELECT s.*, c.title as course_title, c.cover_image as course_cover
       FROM live_sessions s
       LEFT JOIN live_courses c ON s.course_id = c.id
       WHERE (s.school_code = $1 OR s.host_user_id = $2)
       ORDER BY s.scheduled_start ASC
       LIMIT 10`,
      [schoolCode, userId]
    ).catch(() => ({ rows: [] }));

    const sessions = sessionsRes.rows || [];

    // 3. Fetch total students enrolled across all courses
    const enrollmentsRes = await query(
      `SELECT COUNT(DISTINCT user_id) as total_students, COUNT(*) as total_enrollments 
       FROM course_enrollments e
       JOIN live_courses c ON e.course_id = c.id
       WHERE c.school_code = $1 OR c.instructor_id = $2`,
      [schoolCode, userId]
    ).catch(() => ({ rows: [{ total_students: 0, total_enrollments: 0 }] }));

    const stats = {
      totalCourses: courses.length,
      totalSessions: sessions.length,
      totalStudents: parseInt((enrollmentsRes.rows[0] && enrollmentsRes.rows[0].total_students) || 0),
      totalEnrollments: parseInt((enrollmentsRes.rows[0] && enrollmentsRes.rows[0].total_enrollments) || 0),
      liveNowCount: sessions.filter(s => s.status === 'live').length
    };

    res.render('live_studio', {
      layout: false,
      title: 'Live Studio & Course Manager - Librika',
      user: {
        id: userId,
        name: userName,
        role: req.session ? req.session.role : 'admin',
        school_code: schoolCode
      },
      courses,
      sessions,
      stats,
      activeTab: 'overview'
    });
  } catch (err) {
    console.error('Live studio error:', err);
    res.status(500).send('Error loading Live Studio Dashboard');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. COURSE BUILDER & CURRICULUM MANAGER
// ─────────────────────────────────────────────────────────────────────────────
exports.getNewCourse = (req, res) => {
  if (req.session && req.session.role === 'student') {
    return res.redirect('/student/live-classes');
  }

  res.render('live_course_edit', {
    layout: false,
    title: 'Create New Course - Live Studio',
    isNew: true,
    course: {},
    modules: [],
    sessions: [],
    enrollments: [],
    user: req.session || { name: 'Faculty' }
  });
};

exports.postCreateCourse = async (req, res) => {
  if (req.session && req.session.role === 'student') {
    return res.redirect('/student/live-classes');
  }
  try {
    const { title, subtitle, description, category, level, price, cover_image, status } = req.body;
    const instructorId = req.session.user_id || 23;
    const instructorName = req.session.name || 'Faculty Instructor';
    const schoolCode = req.session.school_code || 'DPS123';

    const insertRes = await query(
      `INSERT INTO live_courses (title, subtitle, description, instructor_id, instructor_name, category, level, price, cover_image, status, school_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        title || 'Untitled Course',
        subtitle || '',
        description || '',
        instructorId,
        instructorName,
        category || 'Technology',
        level || 'All Levels',
        parseFloat(price) || 0.00,
        cover_image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
        status || 'Published',
        schoolCode
      ]
    ).catch(async () => {
      // Fallback for SQLite without RETURNING id
      await query(
        `INSERT INTO live_courses (title, subtitle, description, instructor_id, instructor_name, category, level, price, cover_image, status, school_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          title || 'Untitled Course',
          subtitle || '',
          description || '',
          instructorId,
          instructorName,
          category || 'Technology',
          level || 'All Levels',
          parseFloat(price) || 0.00,
          cover_image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
          status || 'Published',
          schoolCode
        ]
      );
      const last = await query('SELECT MAX(id) as id FROM live_courses');
      return last;
    });

    const newCourseId = insertRes.rows && insertRes.rows[0] ? insertRes.rows[0].id : 1;

    // Create default starter module
    await query(
      `INSERT INTO course_modules (course_id, title, order_index) VALUES ($1, $2, 1)`,
      [newCourseId, 'Module 1: Course Introduction & Orientation']
    ).catch(() => {});

    res.redirect(`/studio/courses/${newCourseId}`);
  } catch (err) {
    console.error('Create course error:', err);
    res.redirect('/studio');
  }
};

exports.getCourseEdit = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);

    const courseRes = await query('SELECT * FROM live_courses WHERE id = $1', [courseId]);
    if (!courseRes.rows || courseRes.rows.length === 0) {
      return res.redirect('/studio');
    }
    const course = courseRes.rows[0];

    // Fetch modules and lessons
    const modulesRes = await query(
      'SELECT * FROM course_modules WHERE course_id = $1 ORDER BY order_index ASC',
      [courseId]
    ).catch(() => ({ rows: [] }));
    const modules = modulesRes.rows || [];

    const lessonsRes = await query(
      'SELECT * FROM course_lessons WHERE course_id = $1 ORDER BY order_index ASC',
      [courseId]
    ).catch(() => ({ rows: [] }));
    const lessons = lessonsRes.rows || [];

    // Group lessons under modules
    modules.forEach(m => {
      m.lessons = lessons.filter(l => l.module_id === m.id);
    });

    // Fetch scheduled sessions for this course
    const sessionsRes = await query(
      'SELECT * FROM live_sessions WHERE course_id = $1 ORDER BY scheduled_start ASC',
      [courseId]
    ).catch(() => ({ rows: [] }));
    const sessions = sessionsRes.rows || [];

    // Fetch enrolled students
    const enrollRes = await query(
      'SELECT * FROM course_enrollments WHERE course_id = $1 ORDER BY enrolled_at DESC',
      [courseId]
    ).catch(() => ({ rows: [] }));
    const enrollments = enrollRes.rows || [];

    res.render('live_course_edit', {
      layout: false,
      title: `${course.title} - Curriculum Studio`,
      isNew: false,
      course,
      modules,
      sessions,
      enrollments,
      user: req.session || { name: 'Faculty' }
    });
  } catch (err) {
    console.error('Course edit error:', err);
    res.redirect('/studio');
  }
};

exports.postUpdateCourse = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const { title, subtitle, description, category, level, price, cover_image, status } = req.body;

    await query(
      `UPDATE live_courses 
       SET title = $1, subtitle = $2, description = $3, category = $4, level = $5, price = $6, cover_image = $7, status = $8 
       WHERE id = $9`,
      [title, subtitle, description, category, level, parseFloat(price) || 0, cover_image, status, courseId]
    );

    res.redirect(`/studio/courses/${courseId}?success=1`);
  } catch (err) {
    console.error('Update course error:', err);
    res.redirect('/studio');
  }
};

exports.postAddModule = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const { title } = req.body;
    if (title && title.trim()) {
      const maxOrderRes = await query('SELECT MAX(order_index) as max_order FROM course_modules WHERE course_id = $1', [courseId]);
      const nextOrder = (maxOrderRes.rows && maxOrderRes.rows[0] && maxOrderRes.rows[0].max_order ? parseInt(maxOrderRes.rows[0].max_order) : 0) + 1;
      await query('INSERT INTO course_modules (course_id, title, order_index) VALUES ($1, $2, $3)', [courseId, title.trim(), nextOrder]);
    }
    res.redirect(`/studio/courses/${courseId}`);
  } catch (err) {
    res.redirect('/studio');
  }
};

exports.postAddLesson = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const { module_id, title, content_type, duration_minutes, video_url } = req.body;
    if (title && title.trim()) {
      const maxOrderRes = await query('SELECT MAX(order_index) as max_order FROM course_lessons WHERE module_id = $1', [module_id]);
      const nextOrder = (maxOrderRes.rows && maxOrderRes.rows[0] && maxOrderRes.rows[0].max_order ? parseInt(maxOrderRes.rows[0].max_order) : 0) + 1;
      
      await query(
        `INSERT INTO course_lessons (module_id, course_id, title, content_type, duration_minutes, video_url, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [parseInt(module_id), courseId, title.trim(), content_type || 'live_class', parseInt(duration_minutes) || 45, video_url || '', nextOrder]
      );
    }
    res.redirect(`/studio/courses/${courseId}`);
  } catch (err) {
    res.redirect('/studio');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. INTERACTIVE CALENDAR & LIVE BATCH SCHEDULER
// ─────────────────────────────────────────────────────────────────────────────
exports.getCalendar = async (req, res) => {
  try {
    const schoolCode = req.session ? (req.session.school_code || 'DPS123') : 'DPS123';
    const userId = req.session ? (req.session.user_id || 23) : 23;

    const sessionsRes = await query(
      `SELECT s.*, c.title as course_title, c.category, c.cover_image
       FROM live_sessions s
       LEFT JOIN live_courses c ON s.course_id = c.id
       WHERE (s.school_code = $1 OR s.host_user_id = $2)
       ORDER BY s.scheduled_start ASC`,
      [schoolCode, userId]
    ).catch(() => ({ rows: [] }));

    const coursesRes = await query(
      `SELECT id, title FROM live_courses WHERE school_code = $1 OR instructor_id = $2`,
      [schoolCode, userId]
    ).catch(() => ({ rows: [] }));

    res.render('live_calendar', {
      layout: false,
      title: 'Live Class Schedule & Calendar - Librika Studio',
      sessions: sessionsRes.rows || [],
      courses: coursesRes.rows || [],
      user: req.session || { name: 'Faculty' }
    });
  } catch (err) {
    console.error('Calendar error:', err);
    res.redirect('/studio');
  }
};

exports.postScheduleSession = async (req, res) => {
  try {
    const { course_id, title, date, start_time, duration_minutes, passcode, max_participants } = req.body;
    const hostUserId = req.session ? (req.session.user_id || 23) : 23;
    const hostName = req.session ? (req.session.name || 'Faculty Host') : 'Faculty Host';
    const schoolCode = req.session ? (req.session.school_code || 'DPS123') : 'DPS123';

    const scheduledStartStr = `${date} ${start_time}:00`;
    const durMins = parseInt(duration_minutes) || 60;
    const scheduledStartDate = new Date(scheduledStartStr);
    const scheduledEndDate = new Date(scheduledStartDate.getTime() + durMins * 60 * 1000);

    const fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

    const meetingId = generateMeetingId('LIB');
    const shareableToken = `live_${crypto.randomBytes(8).toString('hex')}`;

    await query(
      `INSERT INTO live_sessions (course_id, title, scheduled_start, scheduled_end, duration_minutes, meeting_id, passcode, host_user_id, host_name, status, shareable_token, max_participants, school_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SCHEDULED', $10, $11, $12)`,
      [
        parseInt(course_id) || null,
        title || 'Live Interactive Class Session',
        fmt(scheduledStartDate),
        fmt(scheduledEndDate),
        durMins,
        meetingId,
        passcode || '123456',
        hostUserId,
        hostName,
        shareableToken,
        parseInt(max_participants) || 100,
        schoolCode
      ]
    );

    // Sync into studio_sessions to guarantee student portal and JaaS discovery
    await query(
      `INSERT INTO studio_sessions (title, description, host_id, host_name, meeting_code, jaas_room_name, scheduled_start, scheduled_end, duration_minutes, status, class_name, visibility, school_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SCHEDULED', 'All Students', 'CLASS', $10)`,
      [
        title || 'Live Interactive Class Session',
        'Live interactive class lecture and discussion.',
        hostUserId,
        hostName,
        meetingId,
        meetingId,
        fmt(scheduledStartDate),
        fmt(scheduledEndDate),
        durMins,
        schoolCode
      ]
    ).catch(() => {});

    // Broadcast in-app notification to students of this school
    await query(
      `INSERT INTO notifications (user_id, message, type, school_code)
       VALUES (0, $1, 'live_class', $2)`,
      [`🎥 New live class scheduled: "${title || 'Live Interactive Class'}" by ${hostName}.`, schoolCode]
    ).catch(() => {});

    const redirectTarget = req.body.redirect_to || '/studio/calendar';
    res.redirect(`${redirectTarget}?scheduled=1&meeting_id=${meetingId}`);
  } catch (err) {
    console.error('Schedule session error:', err);
    res.redirect('/studio/calendar?error=1');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. FULL-SCREEN INTERACTIVE LIVE VIDEO CLASSROOM (JITSI BACKEND ENGINE)
// ─────────────────────────────────────────────────────────────────────────────
// 4. FULL-SCREEN INTERACTIVE LIVE VIDEO CLASSROOM (JAAS 8X8.VC ENGINE)
// ─────────────────────────────────────────────────────────────────────────────
exports.getLiveClassroom = async (req, res) => {
  try {
    const rawMeetingId = req.params.meetingId || req.params.id || req.query.meeting_id || '';
    const shareToken = req.query.token;

    let session = null;

    // 1. Try studio_sessions first (Primary JaaS Meeting Table)
    if (rawMeetingId) {
      const studioRes = await query(
        `SELECT ss.*, ss.meeting_code as meeting_id, ss.class_name as course_title, ss.host_name as course_instructor
         FROM studio_sessions ss
         WHERE ss.id = $1 OR ss.meeting_code = $1 OR ss.jaas_room_name = $1`,
        [rawMeetingId]
      ).catch(() => ({ rows: [] }));

      if (studioRes.rows && studioRes.rows.length > 0) {
        session = studioRes.rows[0];
      }
    }

    // 2. Fallback to live_sessions
    if (!session && rawMeetingId) {
      const sessRes = await query(
        `SELECT s.*, c.title as course_title, c.instructor_name as course_instructor
         FROM live_sessions s
         LEFT JOIN live_courses c ON s.course_id = c.id
         WHERE s.meeting_id = $1 OR s.shareable_token = $1`,
        [rawMeetingId]
      ).catch(() => ({ rows: [] }));

      if (sessRes.rows && sessRes.rows.length > 0) {
        session = sessRes.rows[0];
      }
    }

    if (!session && shareToken) {
      const sessRes = await query(
        `SELECT s.*, c.title as course_title, c.instructor_name as course_instructor
         FROM live_sessions s
         LEFT JOIN live_courses c ON s.course_id = c.id
         WHERE s.shareable_token = $1`,
        [shareToken]
      ).catch(() => ({ rows: [] }));

      if (sessRes.rows && sessRes.rows.length > 0) {
        session = sessRes.rows[0];
      }
    }

    // 3. Fallback for newly initiated or ad-hoc sessions
    if (!session) {
      const isNum = !isNaN(rawMeetingId);
      const safeRoom = jaasService.generateJaasRoomName(rawMeetingId || 1);
      const safeCode = rawMeetingId.startsWith('LIB-') ? rawMeetingId : `LIB-${(rawMeetingId || 'DEMO').toUpperCase()}`;
      session = {
        id: isNum ? parseInt(rawMeetingId, 10) : 1,
        meeting_id: safeCode,
        meeting_code: safeCode,
        jaas_room_name: safeRoom,
        title: rawMeetingId ? `Live Class: ${rawMeetingId}` : 'Interactive Live Studio Masterclass',
        host_name: 'Faculty Instructor',
        course_title: 'Librika Live Studio',
        status: 'LIVE'
      };
    }

    // Ensure session has jaas_room_name
    if (!session.jaas_room_name) {
      session.jaas_room_name = jaasService.generateJaasRoomName(session.id);
      if (session.id && !isNaN(session.id)) {
        await query(`UPDATE studio_sessions SET jaas_room_name = $1 WHERE id = $2`, [session.jaas_room_name, session.id]).catch(() => {});
      }
    }

    const meetingCode = session.meeting_code || session.meeting_id || session.jaas_room_name;
    session.meeting_code = meetingCode;
    session.meeting_id = meetingCode;

    const user = req.session || {};
    const authCheck = jaasService.canJoinStudioSession(user, session);
    if (!authCheck.allowed) {
      if (req.flash) req.flash('error', authCheck.reason || 'You are not authorized to join this live classroom.');
      return res.redirect(user.role === 'student' ? '/student/live-classes' : '/admin?module=studio');
    }

    const currentUserId = user.user_id || user.id || 0;
    const currentUserName = user.name || user.user_name || req.query.guest_name || 'Participant';
    const isModerator = jaasService.isSessionModerator(user, session);
    const role = isModerator ? 'host' : (user.role || 'student');

    // Automatically record attendance join in database
    if (session.id && currentUserId) {
      await query(
        `INSERT INTO studio_attendance (session_id, member_id, user_id, member_name, role, joined_at, last_heartbeat_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [session.id, currentUserId, currentUserId, currentUserName, role]
      ).catch(() => {});
    }

    // Prepare JaaS JWT if configured
    let jaasJwt = null;
    const jaasConfigured = jaasService.isJaasConfigured();
    const jaasConfig = jaasService.getJaasConfig();
    const fullRoomName = jaasService.formatFullJaasRoom(jaasConfig.appId, session.jaas_room_name);

    if (jaasConfigured) {
      try {
        const tokenRes = jaasService.generateParticipantToken({
          user: {
            id: currentUserId,
            name: currentUserName,
            email: user.email || `${currentUserName.toLowerCase().replace(/\s+/g, '.')}@librika.in`,
            avatar: user.profile_photo || user.avatar || '',
            role: user.role
          },
          session,
          durationMinutes: 30,
          isModerator
        });
        jaasJwt = tokenRes.token;
      } catch (err) {
        console.warn('[JAAS SSR] Could not pre-sign JWT:', err.message);
      }
    }

    res.render('live_classroom', {
      layout: false,
      title: `Live Studio: ${session.title} - Librika Meet`,
      session,
      isHost: isModerator,
      isModerator,
      jaasConfig: {
        domain: jaasConfig.domain || '8x8.vc',
        appId: jaasConfig.appId,
        fullRoomName,
        rawRoomName: session.jaas_room_name,
        isConfigured: jaasConfigured,
        jwt: jaasJwt
      },
      user: {
        id: currentUserId,
        name: currentUserName,
        role,
        email: user.email || `${currentUserName.toLowerCase().replace(/\s+/g, '.')}@librika.in`
      }
    });
  } catch (err) {
    console.error('Live classroom error:', err);
    res.status(500).send('Error loading live classroom: ' + err.message);
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// 5. STUDENT COURSE LEARNING HUB & LMS PLAYER (TEACHABLE / CLASSPLUS STYLE)
// ─────────────────────────────────────────────────────────────────────────────
exports.getCoursePlayer = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = (req.session && req.session.user_id) || 12;

    const courseRes = await query('SELECT * FROM live_courses WHERE id = $1', [courseId]);
    if (!courseRes.rows || courseRes.rows.length === 0) {
      return res.redirect('/student');
    }
    const course = courseRes.rows[0];

    // Modules and Lessons
    const modulesRes = await query('SELECT * FROM course_modules WHERE course_id = $1 ORDER BY order_index ASC', [courseId]);
    const modules = modulesRes.rows || [];

    const lessonsRes = await query('SELECT * FROM course_lessons WHERE course_id = $1 ORDER BY order_index ASC', [courseId]);
    const lessons = lessonsRes.rows || [];

    modules.forEach(m => {
      m.lessons = lessons.filter(l => l.module_id === m.id);
    });

    // Scheduled live sessions for this course
    const sessionsRes = await query(
      'SELECT * FROM live_sessions WHERE course_id = $1 ORDER BY scheduled_start ASC',
      [courseId]
    );
    const liveSessions = sessionsRes.rows || [];

    // Current active lesson
    const lessonId = parseInt(req.query.lesson) || (lessons.length > 0 ? lessons[0].id : null);
    const activeLesson = lessons.find(l => l.id === lessonId) || lessons[0] || {};

    // Enrollment check
    const enrollRes = await query(
      'SELECT * FROM course_enrollments WHERE course_id = $1 AND user_id = $2',
      [courseId, userId]
    );
    const enrollment = enrollRes.rows && enrollRes.rows[0] ? enrollRes.rows[0] : { progress_percent: 35 };

    res.render('live_course_player', {
      layout: false,
      title: `${course.title} - Librika Learning Hub`,
      course,
      modules,
      lessons,
      liveSessions,
      activeLesson,
      enrollment,
      user: req.session || { name: 'Student' }
    });
  } catch (err) {
    console.error('Course player error:', err);
    res.redirect('/student');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. ENROLLMENT & ATTENDANCE APIS
// ─────────────────────────────────────────────────────────────────────────────
exports.postEnrollStudent = async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const userId = req.session.user_id || 12;
    const userName = req.session.name || 'Enrolled Student';
    const userEmail = req.session.username || `${userName.toLowerCase().replace(/\s+/g, '.')}@librika.in`;

    await query(
      `INSERT INTO course_enrollments (course_id, user_id, user_name, user_email, role, progress_percent, status)
       VALUES ($1, $2, $3, $4, 'student', 0, 'active')`,
      [courseId, userId, userName, userEmail]
    ).catch(() => {});

    res.redirect(`/courses/${courseId}/learn`);
  } catch (err) {
    res.redirect(`/courses/${req.params.id}/learn`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. STUDENT-FACING LIVE CLASSES & COURSES (LEARNER-ONLY INTERFACE)
// ─────────────────────────────────────────────────────────────────────────────
exports.getStudentLiveClasses = async (req, res) => {
  try {
    const userId = (req.session && req.session.user_id) || 0;
    const schoolCode = (req.session && req.session.school_code) || 'DPS123';

    // 1. Fetch upcoming / active live sessions from studio_sessions and live_sessions
    const sessionsRes = await query(
      `SELECT ss.id, ss.title, ss.description, ss.host_name, ss.meeting_code as meeting_id,
              ss.scheduled_start, ss.scheduled_end, ss.duration_minutes, ss.status,
              ss.class_name, ss.school_code,
              'Standalone Live Class' as course_title, '' as course_cover, 'General' as course_category, ss.host_name as instructor_name
       FROM studio_sessions ss
       WHERE (LOWER(ss.school_code) = LOWER($1) OR ss.school_code = 'DPS123' OR ss.school_code = 'GLOBAL' OR ss.school_code IS NULL OR ss.school_code = '')
       UNION ALL
       SELECT ls.id + 100000 as id, ls.title, '' as description, ls.host_name, ls.meeting_id,
              ls.scheduled_start, ls.scheduled_end, ls.duration_minutes, ls.status,
              'All Students' as class_name, ls.school_code,
              COALESCE(c.title, 'Standalone Live Class') as course_title, COALESCE(c.cover_image, '') as course_cover, COALESCE(c.category, 'General') as course_category, COALESCE(c.instructor_name, ls.host_name) as instructor_name
       FROM live_sessions ls
       LEFT JOIN live_courses c ON ls.course_id = c.id
       WHERE (LOWER(ls.school_code) = LOWER($1) OR ls.school_code = 'DPS123' OR ls.school_code = 'GLOBAL' OR ls.school_code IS NULL OR ls.school_code = '')
         AND NOT EXISTS (SELECT 1 FROM studio_sessions s2 WHERE s2.meeting_code = ls.meeting_id OR s2.title = ls.title)
       ORDER BY scheduled_start ASC
       LIMIT 40`,
      [schoolCode]
    ).catch(() => ({ rows: [] }));
    const sessions = sessionsRes.rows || [];

    // 2. Fetch published courses with module & lesson counts
    const coursesRes = await query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM course_modules m WHERE m.course_id = c.id) as module_count,
        (SELECT COUNT(*) FROM course_lessons l WHERE l.course_id = c.id) as lesson_count,
        (SELECT COUNT(*) FROM course_enrollments e WHERE e.course_id = c.id) as student_count,
        (SELECT COUNT(*) FROM course_enrollments e WHERE e.course_id = c.id AND e.user_id = $1) as is_enrolled
       FROM live_courses c
       WHERE c.status = 'Published' OR c.status IS NULL
       ORDER BY c.created_at DESC`,
      [userId]
    ).catch(() => ({ rows: [] }));
    const courses = coursesRes.rows || [];

    res.render('student_live_classes', {
      layout: false,
      title: 'Live Online Classes & Courses - Librika Student Portal',
      active: 'live_classes',
      sessions,
      courses,
      session: req.session || {}
    });
  } catch (err) {
    console.error('Student live classes error:', err);
    res.redirect('/student');
  }
};
