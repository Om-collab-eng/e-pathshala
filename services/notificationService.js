const { poolMain } = require('../db');
const path = require('path');
const fs = require('fs');

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
    console.warn('⚠️ firebase-key.json not found. Push notifications will operate in simulation mode.');
  }
} catch (e) {
  console.warn('⚠️ firebase-admin package or credentials not fully active yet:', e.message);
}

/**
 * Send push notification to all devices registered to a specific user
 * @param {number|string} userId 
 * @param {object} notification { title, body, data }
 */
async function sendNotificationToUser(userId, { title, body, data = {} }) {
  try {
    // 1. Fetch active FCM tokens for this user
    const client = await poolMain.connect();
    let rows = [];
    try {
      const result = await client.query(
        'SELECT fcm_token, device_type FROM user_devices WHERE user_id = $1',
        [userId]
      );
      rows = result.rows;
    } finally {
      client.release();
    }

    if (rows.length === 0) {
      console.log(`[Push Notification] No active device tokens found for user ${userId}`);
      return { success: true, count: 0 };
    }

    const tokens = rows.map(r => r.fcm_token);
    console.log(`[Push Notification] Broadcasting to ${tokens.length} devices for user ${userId}...`);

    if (admin && admin.apps.length > 0) {
      const payload = {
        tokens: tokens,
        notification: {
          title,
          body,
        },
        data: {
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          ...data
        }
      };

      const response = await admin.messaging().sendMulticast(payload);
      console.log(`✅ Push Sent: ${response.successCount} succeeded, ${response.failureCount} failed.`);
      return { success: true, response };
    } else {
      console.log(`[SIMULATED PUSH] Title: "${title}", Body: "${body}", Tokens:`, tokens);
      return { success: true, simulated: true, count: tokens.length };
    }
  } catch (err) {
    console.error('Error sending push notification:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Register or update a device token for a user
 */
async function registerDeviceToken(userId, fcmToken, deviceType = 'web') {
  const client = await poolMain.connect();
  try {
    await client.query(
      `INSERT INTO user_devices (user_id, fcm_token, device_type, last_active)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (fcm_token)
       DO UPDATE SET user_id = EXCLUDED.user_id, device_type = EXCLUDED.device_type, last_active = CURRENT_TIMESTAMP`,
      [userId, fcmToken, deviceType]
    );
    return { success: true };
  } catch (err) {
    console.error('Error registering device token:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Remove a device token on logout
 */
async function unregisterDeviceToken(fcmToken) {
  const client = await poolMain.connect();
  try {
    await client.query('DELETE FROM user_devices WHERE fcm_token = $1', [fcmToken]);
    return { success: true };
  } catch (err) {
    console.error('Error unregistering device token:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  sendNotificationToUser,
  registerDeviceToken,
  unregisterDeviceToken
};
