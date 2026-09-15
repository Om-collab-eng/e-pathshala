/**
 * Automated Verification Script for Librika JaaS Meeting System
 */

const assert = require('assert');
const { query } = require('./db');
const { initMeetingTables } = require('./db/initMeetingTables');
const meetingController = require('./controllers/meetingController');
const jaasService = require('./services/jaasService');

// Mock Express req/res
function createMockReq(session = {}, params = {}, body = {}, queryParams = {}) {
  return {
    session,
    params,
    body,
    query: queryParams,
    headers: { 'user-agent': 'TestRunner/1.0' },
    protocol: 'https',
    get: (header) => (header === 'host' ? 'librika.in' : '')
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    jsonData: null,
    renderedView: null,
    renderData: null,
    sentText: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    render(view, data) {
      this.renderedView = view;
      this.renderData = data;
      return Promise.resolve(this);
    },
    send(text) {
      this.sentText = text;
      return this;
    },
    redirect(url) {
      this.redirectUrl = url;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('🧪 Starting JaaS Production Meeting System Tests...\n');

  // 1. Ensure DB schema is initialized
  await initMeetingTables();
  console.log('✅ 1. Database tables initialized.');

  // Ensure test users exist in DB
  await query(`INSERT OR IGNORE INTO users (id, uid, name, role, school_code) VALUES (202, 'lib_usr_000202', 'Rohan Verma', 'student', 'DPS123')`).catch(() => {});
  await query(`INSERT OR IGNORE INTO users (id, uid, name, role, school_code) VALUES (303, 'lib_usr_000303', 'Uninvited Student', 'student', 'DPS123')`).catch(() => {});

  // 2. Test Meeting Creation by Teacher
  const teacherSession = {
    user_id: 101,
    uid: 'lib_usr_000101',
    name: 'Prof. Sharma',
    role: 'teacher',
    school_code: 'DPS123'
  };

  const createReq = createMockReq(teacherSession, {}, {
    title: 'Advanced Robotics & AI Lecture',
    description: 'Autonomous navigation and computer vision hands-on lab.',
    meetingType: 'INVITE_ONLY',
    sessionType: 'CLASS',
    className: 'Class 12A',
    durationMinutes: 45,
    invitedUserIds: [202] // Student 202 is invited
  });
  const createRes = createMockRes();

  await meetingController.postCreateMeeting(createReq, createRes);
  assert.strictEqual(createRes.statusCode, 200, 'Creation status should be 200');
  assert(createRes.jsonData && createRes.jsonData.success, 'Creation should succeed');
  const meeting = createRes.jsonData.meeting;
  assert(meeting.uid.startsWith('mtg_'), 'Meeting UID must start with mtg_');
  assert(meeting.meetingCode.startsWith('LIB-'), 'Meeting code must start with LIB-');
  console.log(`✅ 2. Meeting created: UID = ${meeting.uid}, Code = ${meeting.meetingCode}`);

  // 3. Test Student Authorization (Invite-only)
  // 3a. Uninvited student (id 303)
  const uninvitedStudent = {
    user_id: 303,
    uid: 'lib_usr_000303',
    name: 'Uninvited Student',
    role: 'student',
    school_code: 'DPS123'
  };
  const uninvitedJoinReq = createMockReq(uninvitedStudent, { uid: meeting.uid });
  const uninvitedJoinRes = createMockRes();
  await meetingController.postJoinMeetingApi(uninvitedJoinReq, uninvitedJoinRes);
  assert.strictEqual(uninvitedJoinRes.statusCode, 403, 'Uninvited student should be denied (403)');
  console.log('✅ 3a. Uninvited participant properly rejected (403).');

  // 3b. Invited student (id 202)
  const invitedStudent = {
    user_id: 202,
    uid: 'lib_usr_000202',
    name: 'Rohan Verma',
    role: 'student',
    school_code: 'DPS123'
  };
  const invitedJoinReq = createMockReq(invitedStudent, { uid: meeting.uid });
  const invitedJoinRes = createMockRes();
  await meetingController.postJoinMeetingApi(invitedJoinReq, invitedJoinRes);
  assert.strictEqual(invitedJoinRes.statusCode, 200, 'Invited student should be allowed (200)');
  assert(invitedJoinRes.jsonData && invitedJoinRes.jsonData.sessionToken, 'Session token must be issued');
  console.log('✅ 3b. Invited participant admitted & session token issued.');

  // 4. Test Heartbeat & Attendance Duration
  const sessionToken = invitedJoinRes.jsonData.sessionToken;
  const hbReq = createMockReq(invitedStudent, { uid: meeting.uid }, { sessionToken, userId: 202 });
  const hbRes = createMockRes();
  await meetingController.postHeartbeatMeetingApi(hbReq, hbRes);
  assert.strictEqual(hbRes.statusCode, 200, 'Heartbeat should return 200');
  console.log('✅ 4. Attendance heartbeat active and updating duration.');

  // 5. Test Leave Room
  const leaveReq = createMockReq(invitedStudent, { uid: meeting.uid }, { sessionToken, userId: 202 });
  const leaveRes = createMockRes();
  await meetingController.postLeaveMeetingApi(leaveReq, leaveRes);
  assert.strictEqual(leaveRes.statusCode, 200, 'Leave should return 200');
  console.log('✅ 5. Leave beacon processed and session finalized.');

  // 6. Test Broadcast Meeting with Lobby Approval Flow
  const broadcastReq = createMockReq(teacherSession, {}, {
    title: 'All-School Annual Science Webinar',
    meetingType: 'BROADCAST',
    sessionType: 'WEBINAR',
    lobbyEnabled: true
  });
  const broadcastRes = createMockRes();
  await meetingController.postCreateMeeting(broadcastReq, broadcastRes);
  const bMeeting = broadcastRes.jsonData.meeting;

  // Student requests to enter lobby
  const lobbyReq = createMockReq(uninvitedStudent, { uid: bMeeting.uid });
  const lobbyRes = createMockRes();
  await meetingController.postJoinRequest(lobbyReq, lobbyRes);
  assert.strictEqual(lobbyRes.jsonData.status, 'pending', 'Broadcast request should be pending in lobby');
  console.log('✅ 6a. Broadcast lobby entry request queued (pending).');

  // Host approves request
  const approveReq = createMockReq(teacherSession, { uid: bMeeting.uid, userId: 303 });
  const approveRes = createMockRes();
  await meetingController.postApproveJoinRequest(approveReq, approveRes);
  assert(approveRes.jsonData.success, 'Host approval should succeed');
  console.log('✅ 6b. Host approved lobby request.');

  // Student can now join
  const approvedJoinReq = createMockReq(uninvitedStudent, { uid: bMeeting.uid });
  const approvedJoinRes = createMockRes();
  await meetingController.postJoinMeetingApi(approvedJoinReq, approvedJoinRes);
  assert.strictEqual(approvedJoinRes.statusCode, 200, 'Approved participant can now join room');
  console.log('✅ 6c. Approved participant successfully entered room.');

  // 7. Security: Unknown Meeting UID must return 404 (NO ad-hoc creation)
  const unknownReq = createMockReq(invitedStudent, { uid: 'mtg_UNKNOWN_FAKE_999' });
  const unknownRes = createMockRes();
  await meetingController.postJoinMeetingApi(unknownReq, unknownRes);
  assert.strictEqual(unknownRes.statusCode, 404, 'Unknown meeting must return 404');
  console.log('✅ 7. Security verified: Unknown meeting IDs rejected with 404.');

  // 8. Calendar API Test
  const calReq = createMockReq(teacherSession, {}, {}, {});
  const calRes = createMockRes();
  await meetingController.getCalendarEventsApi(calReq, calRes);
  assert(calRes.jsonData.events.length > 0, 'Calendar should return scheduled events');
  console.log(`✅ 8. Calendar events API returning ${calRes.jsonData.events.length} events.`);

  console.log('\n🎉 ALL 8 TEST SUITES PASSED PERFECTLY!\n');
}

runTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
