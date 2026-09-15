/**
 * Librika Automated Push Notification & Multi-Device Verification Suite
 */

const pushService = require('../services/pushNotificationService');
const notifService = require('../services/notificationService');
const db = require('../db');

async function runPushTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING MULTI-DEVICE PUSH NOTIFICATION TESTS');
  console.log('==================================================\n');

  // Test 1: VAPID Public Key
  console.log('[TEST 1] Verifying VAPID Public Key...');
  const key = pushService.getVapidPublicKey();
  console.log('  VAPID Public Key:', key);
  if (!key || typeof key !== 'string' || key.length < 30) {
    throw new Error('Invalid VAPID public key.');
  }
  console.log('  ✅ VAPID Key validation passed.\n');

  // Test 2: Device Subscription Registration
  console.log('[TEST 2] Testing Device Subscription Registration...');
  const testEndpoint = 'https://fcm.googleapis.com/fcm/send/test-device-endpoint-librika-' + Date.now();
  const testSub = {
    userId: 99999,
    endpoint: testEndpoint,
    p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YwfldUSpPx3',
    auth: 'tBHItJI5svbpez7KI4CCXg',
    deviceType: 'mobile_phone',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X)'
  };

  const subResult = await pushService.subscribeDevice(testSub);
  console.log('  Subscription Result:', subResult);
  if (!subResult.success) {
    throw new Error('Failed to register test device.');
  }
  console.log('  ✅ Device registration passed.\n');

  // Test 3: Updating Existing Device Subscription
  console.log('[TEST 3] Testing Device Subscription Update...');
  const updateResult = await pushService.subscribeDevice({
    ...testSub,
    deviceType: 'desktop_laptop',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  });
  console.log('  Update Result:', updateResult);
  if (!updateResult.success || updateResult.action !== 'updated') {
    throw new Error('Failed to update existing device subscription.');
  }
  console.log('  ✅ Device update passed.\n');

  // Test 4: Dispatch Notification via Unified Service
  console.log('[TEST 4] Testing Unified Notification Dispatch (DB + Web Push)...');
  const notifyResult = await notifService.notifyUser({
    userId: 99999,
    schoolCode: 'DEMO01',
    title: '🔔 Multi-Device Sync Verification',
    message: 'Test notification delivered successfully across phone and laptop!',
    type: 'test_alert',
    url: '/student'
  });
  console.log('  Notify Result:', notifyResult);
  if (!notifyResult.success) {
    throw new Error('Unified notification dispatch failed.');
  }
  console.log('  ✅ Notification dispatch passed.\n');

  // Test 5: Verify Notification was recorded in DB
  console.log('[TEST 5] Checking Notifications DB table...');
  const dbCheck = await db.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
    [99999]
  );
  if (!dbCheck.rows || dbCheck.rows.length === 0) {
    throw new Error('Notification was not inserted into database.');
  }
  console.log('  Found DB record ID:', dbCheck.rows[0].id, 'Message:', dbCheck.rows[0].message);
  console.log('  ✅ DB persistence passed.\n');

  // Test 6: Device Unsubscription Cleanup
  console.log('[TEST 6] Cleaning up test device subscription...');
  await pushService.unsubscribeDevice(testEndpoint);
  await db.query('DELETE FROM notifications WHERE user_id = $1', [99999]);
  console.log('  ✅ Cleanup complete.\n');

  console.log('==================================================');
  console.log('🎉 ALL PUSH NOTIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================');
}

runPushTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Push test failed:', err);
    process.exit(1);
  });
