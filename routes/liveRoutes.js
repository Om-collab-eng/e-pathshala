const express = require('express');
const router = express.Router();
const liveController = require('../controllers/liveController');

// ── 0. Studio Meeting REST API & Jitsi Meeting Routes ─────────────────────────
router.get('/studio/meeting/:id', liveController.getLiveClassroom);
router.get('/api/studio/meetings', liveController.getStudioMeetingsApi);
router.post('/api/studio/meetings', liveController.postCreateStudioMeeting);
router.get('/api/studio/meetings/:id', liveController.getStudioMeetingById);
router.post('/api/studio/meetings/:id/start', liveController.postStartStudioMeeting);
router.post('/api/studio/meetings/:id/end', liveController.postEndStudioMeeting);
router.delete('/api/studio/meetings/:id', liveController.deleteStudioMeeting);
router.post('/api/studio/meetings/:id/attendance/join', liveController.postRecordAttendanceJoin);
router.post('/api/studio/meetings/:id/attendance/leave', liveController.postRecordAttendanceLeave);

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
