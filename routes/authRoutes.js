const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Logout route
router.get('/logout', authController.getLogout);

// Registration routes (placeholder)
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

module.exports = router;