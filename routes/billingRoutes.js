const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware'); // We'll create this
const billingController = require('../controllers/billingController');

// All billing routes require authentication
router.use(authMiddleware);

// Dashboard route
router.get('/', billingController.getDashboard);

// Checkout route
router.post('/checkout', billingController.postCheckout);

// Cancel route
router.post('/cancel', billingController.postCancel);

module.exports = router;