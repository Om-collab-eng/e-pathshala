const express = require('express');
const router = express.Router();
const liveController = require('../controllers/liveController');

// ── 0. JaaS Studio Session REST APIs & Meeting Routes ─────────────────────────
router.get('/studio/meeting/:id', liveController.getLiveClassroom);
router.get('/student/studio/meeting/:id', liveController.getLiveClassroom);
router.get('/teacher/studio/meeting/:id', liveController.getLiveClassroom);

// JaaS Studio Sessions REST API
router.get('/api/studio/sessions', liveController.getStudioSessionsApi);
router.post('/api/studio/sessions', liveController.postCreateStudioSession);
router.get('/api/studio/sessions/:id', liveController.getStudioSessionById);
router.patch('/api/studio/sessions/:id', liveController.patchStudioSession);
router.post('/api/studio/sessions/:id/update', liveController.patchStudioSession);
router.post('/api/studio/sessions/:id/start', liveController.postStartStudioSession);
router.post('/api/studio/sessions/:id/end', liveController.postEndStudioSession);
router.post('/api/studio/sessions/:id/cancel', liveController.postCancelStudioSession);
router.delete('/api/studio/sessions/:id', liveController.deleteStudioSession);
router.post('/api/studio/sessions/:id/join', liveController.postJoinStudioSession);
router.post('/api/studio/sessions/:id/heartbeat', liveController.postHeartbeatStudioSession);
router.post('/api/studio/sessions/:id/leave', liveController.postLeaveStudioSession);

// Backwards compatibility aliases
router.get('/api/studio/meetings', liveController.getStudioMeetingsApi);
router.post('/api/studio/meetings', liveController.postCreateStudioMeeting);
router.get('/api/studio/meetings/:id', liveController.getStudioMeetingById);
router.post('/api/studio/meetings/:id/start', liveController.postStartStudioMeeting);
router.post('/api/studio/meetings/:id/end', liveController.postEndStudioMeeting);
router.delete('/api/studio/meetings/:id', liveController.deleteStudioMeeting);
router.post('/api/studio/meetings/:id/attendance/join', liveController.postRecordAttendanceJoin);
router.post('/api/studio/meetings/:id/attendance/leave', liveController.postRecordAttendanceLeave);

// Webhook
router.post('/api/webhooks/jaas', liveController.postJaasWebhook);


// ── 1. Instructor & Faculty Live Studio Dashboard ────────────────────────────
router.get('/studio', liveController.getStudioDashboard);
router.get('/studio/courses/new', liveController.getNewCourse);
router.post('/studio/courses', liveController.postCreateCourse);
router.get('/studio/courses/:id', liveController.getCourseEdit);
router.post('/studio/courses/:id', liveController.postUpdateCourse);
router.post('/studio/courses/:id/modules', liveController.postAddModule);
router.post('/studio/courses/:id/lessons', liveController.postAddLesson);

// ── 2. Live Calendar & Batch Scheduler ───────────────────────────────────────
router.get('/studio/calendar', liveController.getCalendar);
router.post('/studio/sessions/schedule', liveController.postScheduleSession);

// ── 3. High Definition Video Classroom & Jitsi Meet Engine ────────────────────
router.get('/live/:meetingId', liveController.getLiveClassroom);
router.get('/studio/live/:meetingId', liveController.getLiveClassroom);
router.get('/join/:token', (req, res) => {
  res.redirect(`/live/${req.params.token}?token=${req.params.token}`);
});

// ── 4. Student Course Learning Player & Hub (Teachable / Classplus) ───────────
router.get('/student/live-classes', liveController.getStudentLiveClasses);
router.get('/student/courses', liveController.getStudentLiveClasses);
router.get('/courses/:id/learn', liveController.getCoursePlayer);
router.post('/courses/:id/enroll', liveController.postEnrollStudent);

module.exports = router;
