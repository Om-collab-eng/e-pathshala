const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { registerDeviceToken, unregisterDeviceToken, sendNotificationToUser } = require('../services/notificationService');

const JWT_SECRET = process.env.JWT_SECRET || 'librika_jwt_secret';

// 1. Mobile & Web Unified API Login (Returns JWT token)
router.post('/v1/auth/login', async (req, res) => {
  const { login, password, device_type, fcm_token } = req.body;
  if (!login || !password) {
    return res.status(400).json({ success: false, message: 'Login and password are required' });
  }

  try {
    let userResult = await query('SELECT * FROM users WHERE phone = $1', [login]);
    if (userResult.rowCount === 0) {
      userResult = await query('SELECT * FROM users WHERE admission_no = $1', [login]);
    }
    if (userResult.rowCount === 0) {
      userResult = await query('SELECT * FROM users WHERE email = $1', [login]);
    }

    if (userResult.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password (bcrypt or plaintext compatibility)
    let passwordMatches = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      passwordMatches = (user.password === password);
    }

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.is_banned) {
      return res.status(403).json({ success: false, message: 'Account has been banned' });
    }

    // Generate JWT Token
    const payload = {
      user_id: user.id,
      name: user.name,
      role: user.role,
      school_code: user.school_code
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '60d' });

    // Register FCM Device Token if provided during login
    if (fcm_token) {
      await registerDeviceToken(user.id, fcm_token, device_type || 'android');
    }

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        school_code: user.school_code,
        plan_name: user.plan_name
      }
    });
  } catch (err) {
    console.error('API Login Error:', err);
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
});

// 2. Register Device Token (Requires Auth)
router.post('/v1/devices/register', authMiddleware, async (req, res) => {
  const { fcm_token, device_type } = req.body;
  const userId = req.userId || (req.session && req.session.user_id);

  if (!fcm_token) {
    return res.status(400).json({ success: false, message: 'fcm_token is required' });
  }

  try {
    await registerDeviceToken(userId, fcm_token, device_type || 'web');
    return res.json({ success: true, message: 'Device registered successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to register device' });
  }
});

// 3. Unregister Device Token (Logout)
router.post('/v1/devices/unregister', authMiddleware, async (req, res) => {
  const { fcm_token } = req.body;
  if (!fcm_token) {
    return res.status(400).json({ success: false, message: 'fcm_token is required' });
  }

  try {
    await unregisterDeviceToken(fcm_token);
    return res.json({ success: true, message: 'Device unregistered successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to unregister device' });
  }
});

// 4. Send Test Notification to Current User's Devices
router.post('/v1/notifications/send-test', authMiddleware, async (req, res) => {
  const userId = req.userId || (req.session && req.session.user_id);
  const { title, body } = req.body;

  const result = await sendNotificationToUser(userId, {
    title: title || 'Librika Alert 🔔',
    body: body || 'Your Web App and Android App are now linked seamlessly!',
    data: { timestamp: new Date().toISOString() }
  });

  return res.json(result);
});

module.exports = router;
