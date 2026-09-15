/**
 * Librika Book-Based Quiz System — Express Routes
 */

const express = require('express');
const router = express.Router();
const quizCtrl = require('../controllers/quizController');

function requireLogin(req, res, next) {
  if (req.session && req.session.user_id) return next();
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }
  return res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session && (req.session.role === 'admin' || req.session.role === 'librarian' || req.session.role === 'superadmin')) {
    return next();
  }
  return res.status(403).json({ status: 'error', message: 'Admin or Librarian privileges required' });
}

// Student APIs & Views
router.get('/api/quizzes/student', requireLogin, quizCtrl.getStudentQuizzes);
router.get('/quizzes/:id/take', requireLogin, quizCtrl.getTakeQuiz);
router.post('/api/quizzes/:id/submit', requireLogin, quizCtrl.postSubmitQuizAttempt);
router.get('/quizzes/:id/results/:attemptId', requireLogin, quizCtrl.getQuizResult);

// Admin APIs
router.get('/admin/api/quizzes/list', requireAdmin, quizCtrl.getAdminQuizzesList);
router.post('/admin/api/quizzes/save', requireAdmin, quizCtrl.postSaveQuiz);
router.post('/admin/api/quizzes/generate-ai', requireAdmin, quizCtrl.postGenerateAiQuiz);

module.exports = router;
