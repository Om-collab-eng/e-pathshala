const assert = require('assert');
const db = require('../db');
const userService = require('../services/userService');
const memberCsvService = require('../services/memberCsvService');

async function runCsvAcceptanceTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING MEMBER CSV IMPORT & EXPORT ACCEPTANCE TESTS');
  console.log('====================================================\n');

  const schoolCode = 'VBPGZ';
  const adminUser = {
    id: 58,
    username: 'VBPGZ-EMP-001',
    role: 'admin',
    school_code: schoolCode
  };

  try {
    // ----------------------------------------------------
    // CLEANUP TEST USERS FROM PREVIOUS RUNS
    // ----------------------------------------------------
    await db.query("DELETE FROM users WHERE admission_no IN ('CSV-STU-001', 'CSV-STU-EXIST') OR employee_id IN ('CSV-TCH-001') OR username IN ('rohan_csv', 'ananya_csv', 'exist_csv') OR phone IN ('9811122334', '9822233445', '9899001122', '9899009900')");
    await db.query("DELETE FROM student_profiles WHERE admission_no IN ('CSV-STU-001', 'CSV-STU-EXIST')");
    await db.query("DELETE FROM staff_profiles WHERE employee_id IN ('CSV-TCH-001')");

    // ----------------------------------------------------
    // TEST 1: CSV Template Generation
    // ----------------------------------------------------
    console.log('TEST 1: Verifying CSV Template Structure & Content...');
    const templateCsv = memberCsvService.getMemberCsvTemplate();
    assert(templateCsv.includes('Member ID,Full Name,Gender,Role,Admission Number,Roll Number'), 'Template must include canonical column headers');
    assert(templateCsv.includes('Ayushman Gupta'), 'Template should provide a sample student row');
    assert(templateCsv.includes('Sunita Sharma'), 'Template should provide a sample employee row');
    assert(!templateCsv.toLowerCase().includes('password_hash'), 'Template must NEVER expose password hash');
    console.log('✓ Passed: CSV template contains official canonical columns, instructions and sample rows.\n');

    // ----------------------------------------------------
    // TEST 2: Scoped CSV Export (Security & Isolation)
    // ----------------------------------------------------
    console.log('TEST 2: Verifying Scoped CSV Export & Password Exclusion...');
    const exportedCsv = await memberCsvService.exportMembersCsv({ schoolCode });
    assert(exportedCsv.length > 0, 'Exported CSV should not be empty');
    assert(!exportedCsv.includes('password'), 'Exported CSV must NEVER include plain passwords or password hashes');
    assert(!exportedCsv.includes('salt'), 'Exported CSV must NEVER include auth salt');
    
    // Check school isolation
    const lines = exportedCsv.trim().split('\n');
    const headers = lines[0].split(',');
    const schoolCodeIdx = headers.indexOf('School Code');
    assert(schoolCodeIdx >= 0, 'Exported CSV must contain School Code header');

    for (let i = 1; i < lines.length; i++) {
      const rowCols = lines[i].split(',');
      if (rowCols.length > schoolCodeIdx) {
        const rowSchool = rowCols[schoolCodeIdx].replace(/"/g, '').trim();
        assert.strictEqual(rowSchool, schoolCode, `Row ${i} leaked school code: ${rowSchool} (expected ${schoolCode})`);
      }
    }
    console.log(`✓ Passed: Exported ${lines.length - 1} records strictly within school '${schoolCode}', zero password exposure.\n`);

    // ----------------------------------------------------
    // TEST 3: Seed an Existing Member to Test Update & Blank Preservation
    // ----------------------------------------------------
    console.log('TEST 3: Seeding an Existing Member for Update & Data Preservation Verification...');
    const existingStudent = await userService.createUser({
      user_type: 'student',
      name: 'Existing Member Demo',
      gender: 'Female',
      dob: '2010-05-15',
      father_name: 'Original Father Name',
      mother_name: 'Original Mother Name',
      admission_no: 'CSV-STU-EXIST',
      roll_no: '42',
      class: 'Class 9',
      section: 'B',
      school_code: schoolCode,
      academic_year: '2025-2026',
      phone: '9899009900',
      email: 'exist.student@example.com',
      address: 'Original Flat 101, Delhi',
      username: 'exist_csv',
      password: 'SafePassword123'
    }, adminUser);

    const initialTotalUsers = (await db.query("SELECT COUNT(*) as count FROM users WHERE school_code = ?", [schoolCode])).rows[0].count;
    console.log(`✓ Seeded existing student ID: ${existingStudent.id}. Current school users: ${initialTotalUsers}.\n`);

    // ----------------------------------------------------
    // TEST 4: Parse & Validate CSV (Staged In-Memory Upsert)
    // ----------------------------------------------------
    console.log('TEST 4: Staging CSV Import with New, Updated, Blank-Preserved, and Invalid Rows...');
    
    // Construct test CSV:
    // Row 1: New Student (Rohan Sharma)
    // Row 2: New Teacher (Dr. Ananya Sen)
    // Row 3: Update Existing Student (New Phone 9899001122, New Father Name, BUT BLANK Mother Name and BLANK Address)
    // Row 4: Malicious/Escalated Role (super_admin) -> Should be rejected with error!
    const headersRow = 'Member ID,Full Name,Gender,Role,Admission Number,Roll Number,Employee ID,Class,Section,Academic Year,Father Name,Mother Name,DOB,Mobile,Email,Address,School Code,Username';
    const row1 = ['', 'Rohan Sharma', 'Male', 'Student', 'CSV-STU-001', '15', '', 'Class 10', 'A', '2026-2027', 'Rajesh Sharma', 'Meena Sharma', '2011-04-10', '+91 98111 22334', 'rohan@example.com', 'Block C, Green Park', schoolCode, 'rohan_csv'];
    const row2 = ['', 'Dr. Ananya Sen', 'Female', 'Teacher', '', '', 'CSV-TCH-001', '', '', '', '', '', '1985-05-20', '09822233445', 'ananya@example.com', 'Faculty Enclave', schoolCode, 'ananya_csv'];
    const row3 = ['', 'Existing Member Demo', 'Female', 'Student', 'CSV-STU-EXIST', '42', '', 'Class 9', 'B', '2025-2026', 'Updated Father Name', '', '', '9899001122', '', '', schoolCode, 'exist_csv'];
    const row4 = ['', 'Hacker Admin', 'Other', 'super_admin', 'HACK-01', '', '', '', '', '', '', '', '', '9800000000', 'hack@example.com', '', schoolCode, 'hacker'];

    const testCsvContent = [
      headersRow,
      row1.map(v => v.includes(' ') || v.includes(',') ? `"${v}"` : v).join(','),
      row2.map(v => v.includes(' ') || v.includes(',') ? `"${v}"` : v).join(','),
      row3.map(v => v.includes(' ') || v.includes(',') ? `"${v}"` : v).join(','),
      row4.map(v => v.includes(' ') || v.includes(',') ? `"${v}"` : v).join(',')
    ].join('\r\n');

    const preview = await memberCsvService.parseAndValidateMemberCsv({
      fileBuffer: Buffer.from(testCsvContent, 'utf-8'),
      fileName: 'acceptance_test.csv',
      schoolCode,
      adminUser
    });

    console.log('Preview rows:', JSON.stringify(preview.rows.map(r => ({ row: r.rowNumber, action: r.action, name: r.name, errors: r.errorMessages, warnings: r.warningMessages })), null, 2));
    assert(preview.success, 'Preview parsing should succeed');
    assert.strictEqual(preview.summary.totalRows, 4, 'Should parse exactly 4 data rows');
    assert.strictEqual(preview.summary.toCreate, 2, 'Should stage 2 new members (Rohan and Dr. Ananya)');
    assert.strictEqual(preview.summary.toUpdate, 1, 'Should detect 1 member to update (Existing Member Demo)');
    assert.strictEqual(preview.summary.errors, 1, 'Should flag 1 error (super_admin role rejection)');

    // Verify Row 3 diffs and blank preservation
    const updateRow = preview.rows.find(r => r.action === 'update');
    assert(updateRow, 'Update row must be present');
    assert.strictEqual(updateRow.matchedUserId, existingStudent.id, 'Must match existing student ID');
    
    const changedFields = updateRow.diffs.map(d => d.field);
    assert(changedFields.includes('phone'), 'Diff must detect phone change');
    assert(changedFields.includes('father_name'), 'Diff must detect father_name change');
    assert(!changedFields.includes('mother_name'), 'Blank mother_name must NOT overwrite existing value');
    assert(!changedFields.includes('address'), 'Blank address must NOT overwrite existing address');

    // Verify Row 4 role escalation rejection
    const errorRow = preview.rows.find(r => r.action === 'error');
    assert(errorRow, 'Error row must be present');
    assert(errorRow.errorMessages.some(e => e.includes('super_admin') || e.includes('Invalid role')), 'Should reject unauthorized role escalation');
    console.log(`✓ Passed: Staged preview detected 2 new, 1 update (with 0 blank overwrites), and 1 rejected error.\n`);

    // ----------------------------------------------------
    // TEST 5: Commit Staged Import (Atomic DB Upsert)
    // ----------------------------------------------------
    console.log('TEST 5: Committing Import in Atomic Database Transaction...');
    const commitResult = await memberCsvService.commitMemberImport({
      batchId: preview.batchId,
      schoolCode,
      adminUser,
      options: {
        skipErrors: true,
        updateExisting: true
      }
    });

    assert(commitResult.success, 'Commit should succeed');
    assert.strictEqual(commitResult.results.created, 2, 'Should have created 2 members');
    assert.strictEqual(commitResult.results.updated, 1, 'Should have updated 1 member');
    assert.strictEqual(commitResult.results.errors, 1, 'Should record 1 skipped error row');

    // Verify New Student in users & student_profiles
    const rohanUser = (await db.query("SELECT * FROM users WHERE admission_no = 'CSV-STU-001'")).rows[0];
    assert(rohanUser, 'Rohan Sharma must be created in users table');
    assert.strictEqual(rohanUser.phone, '9811122334', 'Mobile must be normalized Indian 10 digits');
    assert.strictEqual(rohanUser.role, 'student', 'Role must be student');
    assert.strictEqual(rohanUser.father_name, 'Rajesh Sharma', 'Father name must be saved in canonical record');
    assert(rohanUser.password && rohanUser.password.startsWith('$2b$'), 'Password must be hashed with bcrypt');

    const rohanProfile = (await db.query("SELECT * FROM student_profiles WHERE admission_no = 'CSV-STU-001'")).rows[0];
    assert(rohanProfile, 'Rohan Sharma must have a student_profiles record');
    assert.strictEqual(rohanProfile.class_name || rohanProfile.class, 'Class 10', 'Student profile class must match');
    assert.strictEqual(rohanUser.class, 'Class 10', 'Canonical users table class must match');

    // Verify New Teacher in users & staff_profiles
    const ananyaUser = (await db.query("SELECT * FROM users WHERE employee_id = 'CSV-TCH-001'")).rows[0];
    assert(ananyaUser, 'Dr. Ananya Sen must be created in users table');
    assert.strictEqual(ananyaUser.phone, '9822233445', 'Teacher mobile must be normalized');
    assert.strictEqual(ananyaUser.role, 'teacher', 'Role must be teacher');

    const ananyaProfile = (await db.query("SELECT * FROM staff_profiles WHERE employee_id = 'CSV-TCH-001'")).rows[0];
    assert(ananyaProfile, 'Dr. Ananya Sen must have a staff_profiles record');

    // Verify Existing Member Updates & Zero Data Loss
    const updatedMember = (await db.query("SELECT * FROM users WHERE id = ?", [existingStudent.id])).rows[0];
    assert.strictEqual(updatedMember.phone, '9899001122', 'Updated phone must be applied');
    assert.strictEqual(updatedMember.father_name, 'Updated Father Name', 'Updated father name must be applied');
    
    // CRITICAL: Ensure BLANK CSV values did NOT erase existing valid data!
    assert.strictEqual(updatedMember.mother_name, 'Original Mother Name', 'CRITICAL: Blank mother_name must NOT overwrite existing mother_name');
    assert.strictEqual(updatedMember.address, 'Original Flat 101, Delhi', 'CRITICAL: Blank address must NOT overwrite existing address');
    assert.strictEqual(updatedMember.admission_no, 'CSV-STU-EXIST', 'Existing admission number must remain intact');

    // Verify audit logs
    const auditLogs = await db.query("SELECT * FROM user_audit_logs WHERE school_code = ? ORDER BY id DESC LIMIT 10", [schoolCode]);
    assert(auditLogs.rows.length >= 3, 'Audit logs must record member creation and updates');
    console.log(`✓ Passed: Database verified. New records created, existing record safely updated, zero data loss on blank fields.\n`);

    // ----------------------------------------------------
    // TEST 6: Zero Accidental Deletion Check
    // ----------------------------------------------------
    console.log('TEST 6: Verifying Zero Accidental Deletions Principle...');
    const postTotalUsers = (await db.query("SELECT COUNT(*) as count FROM users WHERE school_code = ?", [schoolCode])).rows[0].count;
    assert.strictEqual(postTotalUsers, initialTotalUsers + 2, `Total users should have increased by exactly 2 (from ${initialTotalUsers} to ${initialTotalUsers + 2}). Was ${postTotalUsers}`);
    console.log(`✓ Passed: No existing members were deleted. Monotonic upsert verified.\n`);

    // ----------------------------------------------------
    // TEST 7: Idempotency Verification (Re-Importing Same CSV)
    // ----------------------------------------------------
    console.log('TEST 7: Verifying Idempotency on Re-Import...');
    const rePreview = await memberCsvService.parseAndValidateMemberCsv({
      fileBuffer: Buffer.from(testCsvContent, 'utf-8'),
      fileName: 'acceptance_test_reimport.csv',
      schoolCode,
      adminUser
    });

    // Rohan, Dr. Ananya, and Existing Member Demo are now all existing and matching DB values
    assert.strictEqual(rePreview.summary.toCreate, 0, 'Re-importing same CSV must NOT create duplicate records');
    assert.strictEqual(rePreview.summary.unchanged, 3, 'All 3 valid records should now be recognized as unchanged');
    console.log('✓ Passed: Re-importing identical CSV creates 0 duplicates and marks existing records as unchanged.\n');

    // ----------------------------------------------------
    // TEST 8: Error Report CSV Generation
    // ----------------------------------------------------
    console.log('TEST 8: Verifying Error Report CSV Generation...');
    const errorReportCsv = memberCsvService.generateErrorReportCsv(preview.batchId);
    assert(errorReportCsv, 'Error report CSV must be generated');
    assert(errorReportCsv.includes('Row Number,Member Name,Field,Invalid Value,Error Description,Recommended Action'), 'Error report must have error summary headers');
    assert(errorReportCsv.includes('Hacker Admin'), 'Error report must detail the rejected row');
    console.log('✓ Passed: Error report CSV correctly details rejected rows and specific validation error reasons.\n');

    console.log('====================================================');
    console.log('🎉 ALL CSV IMPORT & EXPORT ACCEPTANCE TESTS PASSED!');
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Acceptance Test Failed:', err);
    process.exit(1);
  } finally {
    // Clean up created test users
    await db.query("DELETE FROM users WHERE admission_no IN ('CSV-STU-001', 'CSV-STU-EXIST') OR employee_id IN ('CSV-TCH-001') OR username IN ('rohan_csv', 'ananya_csv', 'exist_csv') OR phone IN ('9811122334', '9822233445', '9899001122', '9899009900')");
    await db.query("DELETE FROM student_profiles WHERE admission_no IN ('CSV-STU-001', 'CSV-STU-EXIST')");
    await db.query("DELETE FROM staff_profiles WHERE employee_id IN ('CSV-TCH-001')");
    process.exit(0);
  }
}

runCsvAcceptanceTests();
