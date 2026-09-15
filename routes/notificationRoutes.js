/**
 * Librika Notification API Routes
 * Handles VAPID public key distribution, push subscription registration,
 * and test notification dispatching for phones, laptops, and tablets.
 */

const express = require('express');
const router = express.Router();
const pushService = require('../services/pushNotificationService');
const notifService = require('../services/notificationService');

// 1. Get VAPID Public Key for client browser subscription
router.get('/vapid-public-key', (req, res) => {
  res.json({
    status: 'success',
    publicKey: pushService.getVapidPublicKey()
  });
});

// 2. Register / Subscribe device push endpoint
router.post('/push-subscribe', async (req, res) => {
  try {
    const userId = req.session ? (req.session.user_id || req.session.id) : null;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Authentication required to subscribe devices.' });
    }

    const { subscription, deviceType, userAgent } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ status: 'error', message: 'Invalid subscription object.' });
    }

    const result = await pushService.subscribeDevice({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      deviceType: deviceType || 'browser',
      userAgent: userAgent || req.headers['user-agent'] || ''
    });

    res.json({
      status: 'success',
      message: 'Device push notification registered successfully.',
      action: result.action
    });
  } catch (err) {
    console.error('Error in /push-subscribe:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 3. Unsubscribe device
router.post('/push-unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await pushService.unsubscribeDevice(endpoint);
    }
    res.json({ status: 'success', message: 'Device unsubscribed.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 4. Send Instant Test Notification to All Connected Devices
router.post('/test', async (req, res) => {
  try {
    const userId = req.session ? (req.session.user_id || req.session.id) : null;
    const schoolCode = req.session ? (req.session.school_code || 'GLOBAL') : 'GLOBAL';
    const userName = req.session ? (req.session.name || 'User') : 'User';

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Please log in to test notifications.' });
    }

    const io = req.app.get('io');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    await notifService.notifyUser({
      io,
      userId,
      schoolCode,
      title: '🔔 Librika Alert',
      message: `Hello ${userName}! Cross-device notification received at ${timestamp}.`,
      type: 'success',
      url: '/student',
      data: { test: true, timestamp }
    });

    res.json({
      status: 'success',
      message: 'Test notification triggered across your phone, laptop, and connected devices!'
    });
  } catch (err) {
    console.error('Error in /test notification:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
