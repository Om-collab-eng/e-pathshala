/**
 * Librika Web Push & Cross-Device Notification Service
 * Standards-compliant VAPID Web Push delivery for Phones, Laptops, and Browsers.
 */

const webpush = require('web-push');
const db = require('../db');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BCcPEyasF2EGpJs1TJwpIUc1nump_Ov2PrDSMz9MlgLPyd7tUTxwD6VhMRitOYr4mifNrkTSmfxz7X_j151Gq2o';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'Y62RXDIGG6i2tQxcasDB36s3LmJQMAhFJ9_5SK2TBDc';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@librika.in';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ Web Push (VAPID) engine initialized successfully.');
} catch (err) {
  console.warn('⚠️ Web Push initialization warning:', err.message);
}

function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

/**
 * Register or update a browser/device push subscription
 */
async function subscribeDevice({ userId, endpoint, p256dh, auth, deviceType = 'browser', userAgent = '' }) {
  if (!userId || !endpoint || !p256dh || !auth) {
    throw new Error('Missing required subscription parameters (userId, endpoint, p256dh, auth).');
  }

  try {
    const existing = await db.query(
      'SELECT id FROM push_subscriptions WHERE endpoint = $1',
      [endpoint]
    );

    if (existing.rows && existing.rows.length > 0) {
      await db.query(
        `UPDATE push_subscriptions 
         SET user_id = $1, p256dh = $2, auth = $3, device_type = $4, user_agent = $5, updated_at = CURRENT_TIMESTAMP 
         WHERE endpoint = $6`,
        [userId, p256dh, auth, deviceType, userAgent, endpoint]
      );
      return { success: true, action: 'updated', id: existing.rows[0].id };
    } else {
      const inserted = await db.query(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, device_type, user_agent, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [userId, endpoint, p256dh, auth, deviceType, userAgent]
      );
      return { success: true, action: 'created', id: inserted.lastId || null };
    }
  } catch (err) {
    console.error('Error saving push subscription:', err);
    throw err;
  }
}

/**
 * Unsubscribe a device (e.g. upon user logout)
 */
async function unsubscribeDevice(endpoint) {
  if (!endpoint) return { success: false, message: 'No endpoint provided' };
  try {
    await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    return { success: true };
  } catch (err) {
    console.error('Error unsubscribing device:', err);
    throw err;
  }
}

/**
 * Send Web Push notification to all devices registered to a specific user
 */
async function sendPushToUser(userId, payload = {}) {
  if (!userId) return { success: false, message: 'Invalid userId' };

  try {
    const subs = await db.query(
      'SELECT endpoint, p256dh, auth, device_type FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    if (!subs.rows || subs.rows.length === 0) {
      return { success: true, delivered: 0, message: 'No registered push devices for user.' };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title || 'Librika Alert',
      body: payload.body || payload.message || '',
      icon: payload.icon || '/logo.png',
      badge: payload.badge || '/favicon-32x32.png',
      url: payload.url || '/student',
      type: payload.type || 'info',
      tag: payload.tag || `librika-${Date.now()}`,
      timestamp: Date.now(),
      data: payload.data || {}
    });

    const sendPromises = subs.rows.map(async (row) => {
      const pushSubscription = {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh,
          auth: row.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
        return { endpoint: row.endpoint, success: true, deviceType: row.device_type };
      } catch (err) {
        // HTTP 410 (Gone) or 404 means the user unsubscribed or revoked permission
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[Web Push] Subscription expired (${err.statusCode}). Cleaning up endpoint...`);
          await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [row.endpoint]).catch(() => {});
        } else {
          console.warn(`[Web Push] Failed to deliver to ${row.endpoint}:`, err.message);
        }
        return { endpoint: row.endpoint, success: false, error: err.message };
      }
    });

    const results = await Promise.all(sendPromises);
    const deliveredCount = results.filter(r => r.success).length;

    return {
      success: true,
      totalDevices: subs.rows.length,
      delivered: deliveredCount,
      results
    };
  } catch (err) {
    console.error('Error in sendPushToUser:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send Web Push notification to all devices belonging to users in a school
 */
async function sendPushToSchool(schoolCode, payload = {}) {
  try {
    let userQuery = 'SELECT DISTINCT id FROM users WHERE school_code = $1';
    if (!schoolCode || schoolCode === 'GLOBAL') {
      userQuery = 'SELECT DISTINCT id FROM users';
    }
    const users = await db.query(userQuery, schoolCode === 'GLOBAL' ? [] : [schoolCode]);
    if (!users.rows || users.rows.length === 0) return { success: true, delivered: 0 };

    const promises = users.rows.map(u => sendPushToUser(u.id, payload));
    const allResults = await Promise.all(promises);
    return { success: true, totalUsers: users.rows.length, details: allResults };
  } catch (err) {
    console.error('Error sending push to school:', err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  getVapidPublicKey,
  subscribeDevice,
  unsubscribeDevice,
  sendPushToUser,
  sendPushToSchool
};
