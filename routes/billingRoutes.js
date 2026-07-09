const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware'); // We'll create this
const billingController = require('../controllers/billingController');

// All billing routes require authentication
router.use(authMiddleware);

// Dashboard route
router.get('/', billingController.dashboard);

// Checkout route
router.post('/checkout', billingController.checkout);

// Cancel route
router.post('/cancel', billingController.cancel);

module.exports = router;