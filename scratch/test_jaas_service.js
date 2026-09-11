const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jaasService = require('../services/jaasService');

async function testJaasIntegration() {
  console.log('=== TESTING JAAS SERVICE & INTEGRATION ===\n');

  // 1. Test Room Generation
  const room1 = jaasService.generateJaasRoomName(42);
  console.log('✅ Generated Room Name:', room1);
  if (!room1.startsWith('librika-42-')) throw new Error('Room name format invalid');

  const fullRoom = jaasService.formatFullJaasRoom('vpaas-magic-cookie-test1234', room1);
  console.log('✅ Full JaaS Room:', fullRoom);
  if (!fullRoom.startsWith('vpaas-magic-cookie-test1234/librika-42-')) throw new Error('Full room formatting invalid');

  // 2. Test Access Control
  const session = {
    id: 101,
    title: 'Grade 10 Mathematics',
    host_id: 25,
    class_name: 'Class 10',
    school_code: 'DPS123',
    status: 'SCHEDULED'
  };

  const teacher = { id: 25, name: 'Mr. Sharma', role: 'teacher', school_code: 'DPS123' };
  const studentValid = { id: 50, name: 'Aarav', role: 'student', class: 'Class 10', school_code: 'DPS123' };
  const studentOtherSchool = { id: 51, name: 'Rohan', role: 'student', class: 'Class 10', school_code: 'OTHER_SCHOOL' };

  console.log('Test Teacher access:', jaasService.canJoinStudioSession(teacher, session));
  if (!jaasService.canJoinStudioSession(teacher, session).allowed) throw new Error('Teacher should be allowed');

  console.log('Test Valid Student access:', jaasService.canJoinStudioSession(studentValid, session));
  if (!jaasService.canJoinStudioSession(studentValid, session).allowed) throw new Error('Valid student should be allowed');

  console.log('Test Other School Student access:', jaasService.canJoinStudioSession(studentOtherSchool, session));
  if (jaasService.canJoinStudioSession(studentOtherSchool, session).allowed) throw new Error('Other school student should be rejected');

  // 3. Test Moderator Determination
  const isTeacherMod = jaasService.isSessionModerator(teacher, session);
  const isStudentMod = jaasService.isSessionModerator(studentValid, session);
  console.log('✅ Teacher is Moderator:', isTeacherMod);
  console.log('✅ Student is Moderator:', isStudentMod);
  if (!isTeacherMod) throw new Error('Teacher must be moderator');
  if (isStudentMod) throw new Error('Student must NEVER be moderator');

  // 4. Test RSA JWT Signing and Verification
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  // Temporarily set env vars for testing token generation
  process.env.JAAS_APP_ID = 'vpaas-magic-cookie-test1234';
  process.env.JAAS_API_KEY_ID = 'vpaas-magic-cookie-test1234/testkey1';
  process.env.JAAS_PRIVATE_KEY = privateKey;
  process.env.JAAS_DOMAIN = '8x8.vc';

  const tokenRes = jaasService.generateParticipantToken({
    user: studentValid,
    session,
    durationMinutes: 25
  });

  console.log('✅ Token generated successfully:');
  console.log('   Full Room:', tokenRes.fullRoomName);
  console.log('   Domain:', tokenRes.domain);
  console.log('   Is Moderator:', tokenRes.isModerator);
  console.log('   Token prefix:', tokenRes.token.slice(0, 30) + '...');

  // Verify JWT using public key
  const decoded = jwt.verify(tokenRes.token, publicKey, { algorithms: ['RS256'] });
  console.log('✅ Decoded JWT Payload:');
  console.log('   aud:', decoded.aud);
  console.log('   iss:', decoded.iss);
  console.log('   sub:', decoded.sub);
  console.log('   room:', decoded.room);
  console.log('   user name:', decoded.context.user.name);
  console.log('   user moderator:', decoded.context.user.moderator);

  if (decoded.aud !== 'jitsi') throw new Error('aud must be jitsi');
  if (decoded.iss !== 'chat') throw new Error('iss must be chat');
  if (decoded.sub !== 'vpaas-magic-cookie-test1234') throw new Error('sub must match App ID');
  if (decoded.context.user.moderator !== false) throw new Error('Student token context.user.moderator must be false');

  console.log('\n🎉 ALL JAAS INTEGRATION TESTS PASSED PERFECTLY!\n');
}

testJaasIntegration().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
