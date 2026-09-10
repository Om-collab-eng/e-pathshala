const { query } = require('../db');
const crypto = require('crypto');

// Helper to generate unique Librika Jitsi room code (e.g. LIBRIKA-42-A8F31C2D)
function generateMeetingCode(id, prefix = 'LIBRIKA') {
  const rand = crypto.randomUUID ? crypto.randomUUID().substring(0, 8).toUpperCase() : Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${id || Math.floor(Math.random() * 900 + 100)}-${rand}`;
}

// Helper to generate readable Meeting IDs like LIB-MERN-842
function generateMeetingId(prefix = 'LIB') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code.slice(0, 3)}-${code.slice(3)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 0. STUDIO REST APIS (MEETING SCHEDULING, LIFECYCLE & ATTENDANCE)
// ─────────────────────────────────────────────────────────────────────────────
exports.getStudioMeetingsApi = async (req, res) => {
  try {
    const schoolCode = (req.session && req.session.school_code) || 'DPS123';
    const result = await query(
      `SELECT ss.*, 
        (SELECT COUNT(*) FROM studio_attendance sa WHERE sa.session_id = ss.id) as attendee_count
       FROM studio_sessions ss
       WHERE ss.school_code = $1 OR ss.school_code = 'DPS123'
       ORDER BY ss.scheduled_start ASC`,
      [schoolCode]
    ).catch(() => ({ rows: [] }));

    const all = result.rows || [];
    const now = new Date();
    const upcoming = all.filter(m => m.status === 'SCHEDULED' || (!m.status && new Date(m.scheduled_start) >= now));
    const live = all.filter(m => m.status === 'LIVE' || m.status === 'live');
    const past = all.filter(m => m.status === 'COMPLETED' || m.status === 'CANCELLED' || (new Date(m.scheduled_start) < now && m.status !== 'LIVE'));

    res.json({ success: true, meetings: all, upcoming, live, past });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.postCreateStudioMeeting = async (req, res) => {
  try {
    const { title, description, className, scheduledStart, scheduledEnd, durationMinutes } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Meeting title is required' });
    }
    const hostId = (req.session && req.session.user_id) || 23;
    const hostName = (req.session && req.session.name) || 'Mrs. Sharma';
    const schoolCode = (req.session && req.session.school_code) || 'DPS123';
    const duration = parseInt(durationMinutes, 10) || 60;

    const startDt = scheduledStart ? new Date(scheduledStart) : new Date();
    const endDt = scheduledEnd ? new Date(scheduledEnd) : new Date(startDt.getTime() + duration * 60000);

    const tempCode = `LIBRIKA-TMP-${Date.now().toString(36).toUpperCase()}`;

    const insertRes = await query(
      `INSERT INTO studio_sessions (title, description, host_id, host_name, meeting_code, scheduled_start, scheduled_end, duration_minutes, status, class_name, school_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SCHEDULED', $9, $10)`,
      [title, description || '', hostId, hostName, tempCode, startDt.toISOString().slice(0, 19).replace('T', ' '), endDt.toISOString().slice(0, 19).replace('T', ' '), duration, className || 'All Students', schoolCode]
    );

    const newId = insertRes.insertId || (insertRes.rows && insertRes.rows[0] && insertRes.rows[0].id) || Math.floor(Math.random() * 8000 + 100);
    const finalCode = generateMeetingCode(newId);

    await query('UPDATE studio_sessions SET meeting_code = $1 WHERE id = $2 OR meeting_code = $3', [finalCode, newId, tempCode]).catch(() => {});

    res.json({
      success: true,
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
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudioMeetingById = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await query(
      `SELECT ss.* FROM studio_sessions ss WHERE ss.id = $1 OR ss.meeting_code = $1`,
      [id]
    );
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    const meeting = result.rows[0];
    const attendanceRes = await query(
      `SELECT * FROM studio_attendance WHERE session_id = $1 ORDER BY joined_at DESC`,
      [meeting.id]
    ).catch(() => ({ rows: [] }));

    res.json({ success: true, meeting, attendance: attendanceRes.rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.postStartStudioMeeting = async (req, res) => {
  try {
    const id = req.params.id;
    await query(`UPDATE studio_sessions SET status = 'LIVE' WHERE id = $1 OR meeting_code = $1`, [id]);
    res.json({ success: true, status: 'LIVE' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.postEndStudioMeeting = async (req, res) => {
  try {
    const id = req.params.id;
    await query(`UPDATE studio_sessions SET status = 'COMPLETED', scheduled_end = CURRENT_TIMESTAMP WHERE id = $1 OR meeting_code = $1`, [id]);
    res.json({ success: true, status: 'COMPLETED' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteStudioMeeting = async (req, res) => {
  try {
    const id = req.params.id;
    await query(`DELETE FROM studio_sessions WHERE id = $1 OR meeting_code = $1`, [id]);
    res.json({ success: true, message: 'Meeting deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.postRecordAttendanceJoin = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const memberId = (req.session && req.session.user_id) || req.body.memberId || 0;
    const memberName = (req.session && (req.session.name || req.session.user_name)) || req.body.memberName || 'Participant';
    const role = (req.session && req.session.role) || req.body.role || 'student';

    await query(
      `INSERT INTO studio_attendance (session_id, member_id, member_name, role, joined_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [sessionId, memberId, memberName, role]
    ).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.postRecordAttendanceLeave = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const memberId = (req.session && req.session.user_id) || req.body.memberId || 0;

    await query(
      `UPDATE studio_attendance 
       SET left_at = CURRENT_TIMESTAMP, 
           duration_seconds = TIMESTAMPDIFF(SECOND, joined_at, CURRENT_TIMESTAMP)
       WHERE session_id = $1 AND member_id = $2 AND left_at IS NULL`,
      [sessionId, memberId]
    ).catch(async () => {
      // SQLite fallback syntax
      await query(
        `UPDATE studio_attendance 
         SET left_at = CURRENT_TIMESTAMP,
             duration_seconds = (strftime('%s', 'now') - strftime('%s', joined_at))
         WHERE session_id = $1 AND member_id = $2 AND left_at IS NULL`,
        [sessionId, memberId]
      ).catch(() => {});
    });

    res.json({ success: true });
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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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
        'scheduled',
        shareableToken,
        parseInt(max_participants) || 100,
        schoolCode
      ]
    );

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
exports.getLiveClassroom = async (req, res) => {
  try {
    const rawMeetingId = req.params.meetingId || req.params.id || req.query.meeting_id || '';
    const shareToken = req.query.token;

    let session = null;

    // 1. Try studio_sessions first (Primary Jitsi Meeting Table)
    if (rawMeetingId) {
      const studioRes = await query(
        `SELECT ss.*, ss.meeting_code as meeting_id, ss.class_name as course_title, ss.host_name as course_instructor
         FROM studio_sessions ss
         WHERE ss.id = $1 OR ss.meeting_code = $1`,
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

    // 3. Fallback mock room for testing
    if (!session) {
      const generatedCode = rawMeetingId.startsWith('LIBRIKA-') ? rawMeetingId : `LIBRIKA-DEMO-${(rawMeetingId || 'ROOM').toUpperCase()}`;
      session = {
        id: 99,
        meeting_id: generatedCode,
        meeting_code: generatedCode,
        title: rawMeetingId ? `Live Class: ${rawMeetingId}` : 'Interactive Live Studio Masterclass',
        host_name: 'Mrs. Sharma (Faculty)',
        course_title: 'Librika Studio Live Session',
        status: 'LIVE'
      };
    }

    const meetingCode = session.meeting_code || session.meeting_id;
    session.meeting_code = meetingCode;
    session.meeting_id = meetingCode;

    const referer = req.headers.referer || '';
    const fromStudio = referer.includes('/studio') || referer.includes('/admin');

    const currentUserId = (req.session && req.session.user_id) || Math.floor(Math.random() * 8000 + 1000);
    const currentUserName = (req.session && (req.session.name || req.session.user_name)) || req.query.guest_name || (fromStudio ? (session.host_name || 'Host Instructor') : 'Participant');

    const sessionRole = (req.session && req.session.role) || '';
    const isInstructorRole = ['admin', 'librarian', 'super_admin', 'teacher', 'instructor', 'faculty', 'staff', 'personal'].includes(sessionRole);
    const isSessionOwner = req.session && req.session.user_id && (session.host_user_id === req.session.user_id || session.host_id === req.session.user_id);

    const isExplicitHostQuery = req.query.role === 'host' || req.query.host === '1' || req.query.isHost === 'true' || (req.query.passcode && req.query.passcode === session.passcode);

    const isHost = Boolean(isInstructorRole || isSessionOwner || isExplicitHostQuery || fromStudio);

    // Automatically record attendance join if user is logged in
    if (session.id && req.session && req.session.user_id) {
      query(
        `INSERT INTO studio_attendance (session_id, member_id, member_name, role, joined_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [session.id, currentUserId, currentUserName, isHost ? 'host' : 'student']
      ).catch(() => {});
    }

    res.render('live_classroom', {
      layout: false,
      title: `Live Studio: ${session.title} - Librika Meet`,
      session,
      isHost,
      user: {
        id: currentUserId,
        name: currentUserName,
        role: isHost ? 'host' : 'student',
        email: (req.session && req.session.username) || `${currentUserName.toLowerCase().replace(/\s+/g, '.')}@librika.in`
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

    // 1. Fetch upcoming / active live sessions
    const sessionsRes = await query(
      `SELECT s.*, c.title as course_title, c.cover_image as course_cover, c.category as course_category, c.instructor_name
       FROM live_sessions s
       LEFT JOIN live_courses c ON s.course_id = c.id
       ORDER BY s.scheduled_start ASC
       LIMIT 20`
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
