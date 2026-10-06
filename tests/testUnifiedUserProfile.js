const assert = require('assert');
const bcrypt = require('bcrypt');
const db = require('../db');
const userService = require('../services/userService');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING UNIFIED USER PROFILE ACCEPTANCE TESTS');
  console.log('====================================================\n');

  let testUserId = null;

  try {
    // ----------------------------------------------------
    // TEST 1: Password Security in Database
    // ----------------------------------------------------
    console.log('TEST 1: Verifying DB Passwords are All Bcrypt Hashed (No Plaintext)...');
    const allUsers = await db.query('SELECT id, username, password FROM users');
    let plaintextCount = 0;
    for (const u of (allUsers.rows || [])) {
      if (u.password && !u.password.startsWith('$2b$') && !u.password.startsWith('$2a$')) {
        plaintextCount++;
      }
    }
    assert.strictEqual(plaintextCount, 0, `Found ${plaintextCount} plaintext passwords in users table!`);
    console.log(`✓ Passed: All ${allUsers.rows.length} existing users have secure bcrypt hashes.\n`);

    // ----------------------------------------------------
    // TEST 2: Canonical User Creation (Section 7 Example)
    // ----------------------------------------------------
    console.log('TEST 2: Creating Test Student (Ayushman Gupta) via Unified UserService...');
    // Cleanup any previous run
    await db.query("DELETE FROM users WHERE username = 'ayushman6061' OR admission_no = 'TEST-196' OR phone = '9899198907' OR phone = '9811111111'");
    await db.query("DELETE FROM student_profiles WHERE admission_no = 'TEST-196'");

    const created = await userService.createUser({
      user_type: 'student',
      name: 'Ayushman Gupta',
      gender: 'Male',
      dob: '2012-08-16',
      father_name: 'Ashish Kumar Gupta',
      mother_name: 'Pooja Gupta',
      admission_no: 'TEST-196',
      roll_no: '10',
      class: 'Class IX',
      section: 'A',
      school_code: 'VBPGZ',
      academic_year: '2026-2027',
      phone: '9899198907',
      email: 'ayushman.gupta@example.com',
      address: 'Plot 42, Sector 5, Rohini, New Delhi',
      username: 'ayushman6061',
      password: 'InitialPassword@123'
    }, {
      user_id: 1,
      school_code: 'VBPGZ',
      role: 'admin',
      module: 'school_admin_test'
    });

    testUserId = created.id || (created.user && created.user.id);
    assert(testUserId, 'User ID should be generated');
    console.log(`✓ User created successfully with ID: ${testUserId}`);

    // Verify Password was hashed
    const userInDb = (await db.query('SELECT * FROM users WHERE id = $1', [testUserId])).rows[0];
    assert(userInDb.password.startsWith('$2b$'), 'Password must be bcrypt hash in DB');
    const passMatches = await bcrypt.compare('InitialPassword@123', userInDb.password);
    assert.strictEqual(passMatches, true, 'Bcrypt hash must match entered password');
    console.log('✓ Password securely hashed with bcrypt in DB (never stored plaintext).\n');

    // ----------------------------------------------------
    // TEST 3: Canonical Single Source of Truth Retrieval
    // ----------------------------------------------------
    console.log('TEST 3: Checking Canonical Profile (getUserProfile)...');
    const profile = await userService.getUserProfile(testUserId, 'VBPGZ');
    
    // Check security: password must never be exposed
    assert.strictEqual(profile.password, undefined, 'CRITICAL: Profile must NOT expose password');
    assert.strictEqual(profile.session_token, undefined, 'Profile must NOT expose session token');

    // Check canonical fields
    assert.strictEqual(profile.name, 'Ayushman Gupta');
    assert.strictEqual(profile.gender, 'Male');
    assert.strictEqual(profile.dob, '2012-08-16');
    assert.strictEqual(profile.father_name, 'Ashish Kumar Gupta');
    assert.strictEqual(profile.mother_name, 'Pooja Gupta');
    assert.strictEqual(profile.admission_no, 'TEST-196');
    assert.strictEqual(profile.roll_no, '10');
    assert.strictEqual(profile.class, 'Class IX');
    assert.strictEqual(profile.section, 'A');
    assert.strictEqual(profile.phone, '9899198907');
    assert.strictEqual(profile.email, 'ayushman.gupta@example.com');
    assert.strictEqual(profile.username, 'ayushman6061');
    assert.strictEqual(profile.school_code, 'VBPGZ');

    // Check student profile extension sync
    assert(profile.studentProfile, 'Student profile extension object must exist');
    assert.strictEqual(profile.studentProfile.rollNo, '10');
    assert.strictEqual(profile.studentProfile.fatherName, 'Ashish Kumar Gupta');
    assert.strictEqual(profile.studentProfile.motherName, 'Pooja Gupta');
    console.log('✓ Canonical profile contract matches exact expected schema.\n');

    // ----------------------------------------------------
    // TEST 4: Single Source of Truth Live Update Propagation
    // ----------------------------------------------------
    console.log('TEST 4: Testing Live Update Propagation (Mobile change: 8527198907 -> 9811111111)...');
    const updated = await userService.updateUserProfile(testUserId, {
      phone: '9811111111',
      father_name: 'Ashish K. Gupta',
      avatar_id: 'avatar_07'
    }, {
      user_id: 1,
      school_code: 'VBPGZ',
      role: 'admin',
      module: 'admin_edit'
    });

    assert.strictEqual(updated.phone, '9811111111');
    assert.strictEqual(updated.father_name, 'Ashish K. Gupta');
    assert.strictEqual(updated.avatar_id, 'avatar_07');

    // Verify DB users row
    const userDbAfter = (await db.query('SELECT * FROM users WHERE id = $1', [testUserId])).rows[0];
    assert.strictEqual(userDbAfter.phone, '9811111111');
    assert.strictEqual(userDbAfter.father_name, 'Ashish K. Gupta');
    assert.strictEqual(userDbAfter.avatar_id, 'avatar_07');

    // Verify DB student_profiles extension table row was updated synchronously
    const studDbAfter = (await db.query('SELECT * FROM student_profiles WHERE user_id = $1', [String(testUserId)])).rows[0];
    assert.strictEqual(studDbAfter.father_name, 'Ashish K. Gupta');

    // Verify audit log entry was generated
    const auditLogs = (await db.query('SELECT * FROM user_audit_logs WHERE target_user_id = $1 ORDER BY id DESC', [testUserId])).rows;
    assert(auditLogs.length >= 2, 'Audit logs must capture creation and profile update');
    console.log(`✓ Audit log verified: recorded ${auditLogs.length} events for user.`);
    console.log('✓ Update propagated synchronously to users and extension tables.\n');

    // ----------------------------------------------------
    // TEST 5: Password Reset by Admin (Never Displayed, Hashed)
    // ----------------------------------------------------
    console.log('TEST 5: Admin Password Reset...');
    await userService.resetUserPassword(testUserId, 'NewAdminSetPassword#999', {
      user_id: 1,
      school_code: 'VBPGZ',
      role: 'admin'
    });

    const userDbAfterReset = (await db.query('SELECT password FROM users WHERE id = $1', [testUserId])).rows[0];
    const newPassWorks = await bcrypt.compare('NewAdminSetPassword#999', userDbAfterReset.password);
    const oldPassFails = await bcrypt.compare('InitialPassword@123', userDbAfterReset.password);
    assert.strictEqual(newPassWorks, true, 'New password must verify against bcrypt hash');
    assert.strictEqual(oldPassFails, false, 'Old password must no longer work');
    console.log('✓ Password reset hashes new password securely; old password revoked.\n');

    // ----------------------------------------------------
    // TEST 6: Student Self-Service Password Change
    // ----------------------------------------------------
    console.log('TEST 6: Student Self-Service Password Change...');
    // Attempt with wrong current password -> should fail
    let failedAsExpected = false;
    try {
      await userService.changeOwnPassword(testUserId, 'WrongCurrentPass', 'StudentNewPass#777');
    } catch (e) {
      failedAsExpected = true;
    }
    assert.strictEqual(failedAsExpected, true, 'Incorrect current password must throw error');

    // Now with correct current password -> should succeed
    await userService.changeOwnPassword(testUserId, 'NewAdminSetPassword#999', 'StudentNewPass#777');
    const userDbAfterOwnChange = (await db.query('SELECT password FROM users WHERE id = $1', [testUserId])).rows[0];
    const selfPassWorks = await bcrypt.compare('StudentNewPass#777', userDbAfterOwnChange.password);
    assert.strictEqual(selfPassWorks, true, 'Student self-service changed password must verify');
    console.log('✓ Self-service password change enforced current password check and updated hash.\n');

    // ----------------------------------------------------
    // TEST 7: Teacher / Staff Canonical Profile Test
    // ----------------------------------------------------
    console.log('TEST 7: Creating and Verifying Staff User (Teacher/Librarian)...');
    await db.query("DELETE FROM users WHERE username = 'librarian_vbp' OR employee_id = 'EMP-901'");
    await db.query("DELETE FROM staff_profiles WHERE employee_id = 'EMP-901'");

    const createdStaff = await userService.createUser({
      user_type: 'librarian',
      name: 'Sunita Sharma',
      gender: 'Female',
      employee_id: 'EMP-901',
      department: 'Library Services',
      designation: 'Head Librarian',
      school_code: 'VBPGZ',
      phone: '9876543210',
      email: 'sunita.sharma@vbpgz.edu',
      username: 'librarian_vbp',
      password: 'StaffSecretPass@123'
    }, {
      user_id: 1,
      school_code: 'VBPGZ',
      role: 'admin',
      module: 'school_admin_staff'
    });

    const staffProfile = await userService.getUserProfile(createdStaff.user.id, 'VBPGZ');
    assert.strictEqual(staffProfile.password, undefined, 'Staff profile must NOT expose password');
    assert.strictEqual(staffProfile.employee_id, 'EMP-901');
    assert.strictEqual(staffProfile.department, 'Library Services');
    assert.strictEqual(staffProfile.designation, 'Head Librarian');
    assert(staffProfile.staffProfile, 'Staff extension object must exist');
    assert.strictEqual(staffProfile.staffProfile.employeeId, 'EMP-901');
    console.log('✓ Staff profile created and canonical model verified.\n');

    // Cleanup test users
    await db.query('DELETE FROM users WHERE id IN ($1, $2)', [testUserId, createdStaff.user.id]);
    await db.query('DELETE FROM student_profiles WHERE user_id = $1', [String(testUserId)]);
    await db.query('DELETE FROM staff_profiles WHERE user_id = $1', [String(createdStaff.user.id)]);
    await db.query('DELETE FROM user_audit_logs WHERE target_user_id IN ($1, $2)', [testUserId, createdStaff.user.id]);

    console.log('====================================================');
    console.log('🎉 ALL 7 ACCEPTANCE TEST SUITES PASSED FLAWLESSLY!');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    if (testUserId) {
      await db.query('DELETE FROM users WHERE id = $1', [testUserId]).catch(() => {});
      await db.query('DELETE FROM student_profiles WHERE user_id = $1', [String(testUserId)]).catch(() => {});
    }
    process.exit(1);
  }
}

runTests();
