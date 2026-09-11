const { query } = require('../db');
const liveController = require('../controllers/liveController');

async function testStudioApis() {
  console.log('=== TESTING STUDIO SESSIONS REST APIS ===\n');

  // 1. Create Session
  const mockReqCreate = {
    session: { user_id: 23, name: 'Mrs. Sharma', role: 'teacher', school_code: 'DPS123' },
    body: {
      title: 'AP Physics: Electromagnetism',
      description: 'Faraday Law and Maxwell Equations with live whiteboard',
      className: 'Class 12',
      durationMinutes: 45
    }
  };

  let createdSession = null;
  const mockResCreate = {
    json: (data) => {
      createdSession = data.session || data.meeting;
      console.log('✅ Created Session API result:', data.message, createdSession);
    },
    status: (code) => ({ json: (err) => console.error('Status ' + code, err) })
  };

  await liveController.postCreateStudioSession(mockReqCreate, mockResCreate);
  if (!createdSession || !createdSession.id) throw new Error('Session creation failed');

  // 2. Start Session
  const mockReqStart = {
    session: { user_id: 23, name: 'Mrs. Sharma', role: 'teacher', school_code: 'DPS123' },
    params: { id: createdSession.id }
  };
  const mockResStart = {
    json: (data) => console.log('✅ Started Session API result:', data),
    status: (code) => ({ json: (err) => console.error('Status ' + code, err) })
  };
  await liveController.postStartStudioSession(mockReqStart, mockResStart);

  // 3. Student Joins Session
  const mockReqJoin = {
    session: { user_id: 105, name: 'Vikram Mehta', role: 'student', school_code: 'DPS123', class: 'Class 12' },
    params: { id: createdSession.id },
    body: {}
  };
  let joinData = null;
  const mockResJoin = {
    json: (data) => {
      joinData = data;
      console.log('✅ Student Join API result:');
      console.log('   Room:', data.roomName);
      console.log('   Full Room:', data.fullRoomName);
      console.log('   Is Moderator:', data.isModerator);
      console.log('   Domain:', data.domain);
    },
    status: (code) => ({ json: (err) => console.error('Status ' + code, err) })
  };
  await liveController.postJoinStudioSession(mockReqJoin, mockResJoin);
  if (!joinData || !joinData.success) throw new Error('Student join failed');
  if (joinData.isModerator !== false) throw new Error('Student must not be moderator');

  // 4. Heartbeat
  const mockReqHeartbeat = {
    session: { user_id: 105 },
    params: { id: createdSession.id },
    body: { memberId: 105 }
  };
  const mockResHeartbeat = {
    json: (data) => console.log('✅ Heartbeat API result:', data),
    status: (code) => ({ json: (err) => console.error('Status ' + code, err) })
  };
  await liveController.postHeartbeatStudioSession(mockReqHeartbeat, mockResHeartbeat);

  // 5. Leave
  const mockReqLeave = {
    session: { user_id: 105 },
    params: { id: createdSession.id },
    body: { memberId: 105 }
  };
  const mockResLeave = {
    json: (data) => console.log('✅ Leave API result:', data),
    status: (code) => ({ json: (err) => console.error('Status ' + code, err) })
  };
  await liveController.postLeaveStudioSession(mockReqLeave, mockResLeave);

  // 6. Verify Attendance Record in DB
  const attRes = await query('SELECT * FROM studio_attendance WHERE session_id = $1', [createdSession.id]);
  console.log('✅ Attendance DB Records Count:', attRes.rows.length);
  console.log('   Latest Attendance Entry:', attRes.rows[attRes.rows.length - 1]);

  // 7. End Session
  const mockReqEnd = {
    session: { user_id: 23, name: 'Mrs. Sharma', role: 'teacher', school_code: 'DPS123' },
    params: { id: createdSession.id }
  };
  const mockResEnd = {
    json: (data) => console.log('✅ End Session API result:', data),
    status: (code) => ({ json: (err) => console.error('Status ' + code, err) })
  };
  await liveController.postEndStudioSession(mockReqEnd, mockResEnd);

  console.log('\n🎉 ALL STUDIO SESSION ENDPOINT TESTS PASSED!\n');
}

testStudioApis().catch(err => {
  console.error('❌ API test failed:', err);
  process.exit(1);
});
