const db = require('../db');
const path = require('path');
const fs = require('fs');
const pushService = require('./pushNotificationService');
const { emitLiveNotification } = require('./liveSocket');

let admin = null;
try {
  admin = require('firebase-admin');
  const serviceAccountPath = path.join(__dirname, '../firebase-key.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    if (admin && admin.apps && admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin SDK initialized for Push Notifications.');
    }
  } else {
    // Silent in dev
  }
} catch (e) {
  // Ignored
}

/**
 * Send push notification to all devices registered to a specific user (FCM legacy)
 */
async function sendNotificationToUser(userId, { title, body, data = {} }) {
  try {
    const result = await db.query(
      'SELECT fcm_token, device_type FROM user_devices WHERE user_id = $1',
      [userId]
    ).catch(() => ({ rows: [] }));
    const rows = result.rows || [];

    if (rows.length === 0) {
      return { success: true, count: 0 };
    }

    const tokens = rows.map(r => r.fcm_token);

    if (admin && admin.apps && admin.apps.length > 0) {
      const payload = {
        tokens: tokens,
        notification: { title, body },
        data: { click_action: 'FLUTTER_NOTIFICATION_CLICK', ...data }
      };
      const response = await admin.messaging().sendMulticast(payload);
      return { success: true, response };
    } else {
      return { success: true, simulated: true, count: tokens.length };
    }
  } catch (err) {
    console.error('Error sending legacy FCM push notification:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Universal Multi-Device Notification Dispatcher
 * Saves to DB, emits real-time via Socket.IO to all open tabs/devices,
 * and sends OS-level Web Push to mobile phones & laptops.
 */
async function notifyUser({ io, userId, schoolCode = 'GLOBAL', title, message, type = 'info', url = '/student', data = {} }) {
  const finalTitle = title || 'Librika Notification';
  const finalMessage = message || '';

  // 1. Insert into database
  try {
    await db.query(
      `INSERT INTO notifications (user_id, message, type, is_read, school_code, created_at)
       VALUES ($1, $2, $3, 0, $4, CURRENT_TIMESTAMP)`,
      [userId || 0, finalMessage, type, schoolCode]
    );
  } catch (dbErr) {
    console.warn('[NOTIFY] DB insert note:', dbErr.message);
  }

  // 2. Real-time broadcast via Socket.IO across all logged-in devices/tabs
  if (io) {
    emitLiveNotification(io, {
      userId,
      schoolCode,
      title: finalTitle,
      message: finalMessage,
      type,
      url,
      data
    });
  }

  // 3. Web Push to registered laptops & phones (OS notification)
  if (userId) {
    pushService.sendPushToUser(userId, {
      title: finalTitle,
      body: finalMessage,
      url,
      type,
      data
    }).catch(err => console.warn('[Web Push] Send error:', err.message));

    // Also trigger legacy FCM if configured
    sendNotificationToUser(userId, { title: finalTitle, body: finalMessage, data }).catch(() => {});
  }

  return { success: true };
}

/**
 * Broadcast notification to all students/staff in a school
 */
async function notifySchool({ io, schoolCode = 'GLOBAL', title, message, type = 'info', url = '/student', data = {} }) {
  const finalTitle = title || 'Librika Announcement';
  const finalMessage = message || '';

  try {
    await db.query(
      `INSERT INTO notifications (user_id, message, type, is_read, school_code, created_at)
       VALUES (0, $1, $2, 0, $3, CURRENT_TIMESTAMP)`,
      [finalMessage, type, schoolCode]
    );
  } catch (dbErr) {
    console.warn('[NOTIFY] DB insert note:', dbErr.message);
  }

  if (io) {
    emitLiveNotification(io, {
      schoolCode,
      title: finalTitle,
      message: finalMessage,
      type,
      url,
      data
    });
  }

  pushService.sendPushToSchool(schoolCode, {
    title: finalTitle,
    body: finalMessage,
    url,
    type,
    data
  }).catch(err => console.warn('[Web Push] School broadcast error:', err.message));

  return { success: true };
}

async function registerDeviceToken(userId, fcmToken, deviceType = 'web') {
  try {
    await db.query(
      `INSERT INTO user_devices (user_id, fcm_token, device_type, last_active)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [userId, fcmToken, deviceType]
    );
    return { success: true };
  } catch (err) {
    console.error('Error registering device token:', err);
    throw err;
  }
}

async function unregisterDeviceToken(fcmToken) {
  try {
    await db.query('DELETE FROM user_devices WHERE fcm_token = $1', [fcmToken]);
    return { success: true };
  } catch (err) {
    console.error('Error unregistering device token:', err);
    throw err;
  }
}

module.exports = {
  notifyUser,
  notifySchool,
  sendNotificationToUser,
  registerDeviceToken,
  unregisterDeviceToken
};

