const express = require('express');
const router = express.Router();
const liveController = require('../controllers/liveController');

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

// ── 3. Zoom-style High Definition Video Classroom & Whiteboard ───────────────
router.get('/live/:meetingId', liveController.getLiveClassroom);
router.get('/studio/live/:meetingId', liveController.getLiveClassroom);
router.get('/join/:token', (req, res) => {
  res.redirect(`/live/${req.params.token}?token=${req.params.token}`);
});

// ── 4. Student Course Learning Player & Hub (Teachable / Classplus) ───────────
router.get('/courses/:id/learn', liveController.getCoursePlayer);
router.post('/courses/:id/enroll', liveController.postEnrollStudent);

module.exports = router;
