const { query } = require('../db');
const bcrypt = require('bcryptjs');

async function testAllLogins() {
  console.log('🧪 Testing authentication for all 20 dummy accounts...\n');

  const testAccounts = [
    // VBPGZ
    { school: 'VBPGZ', role: 'admin', phone: '9810100001', pass: 'Admin@123', name: 'Rajesh Sharma' },
    { school: 'VBPGZ', role: 'admin', phone: '9810100002', pass: 'Admin@123', name: 'Sunita Verma' },
    { school: 'VBPGZ', role: 'librarian', phone: '9810100003', pass: 'Lib@123', name: 'Meenakshi Rao' },
    { school: 'VBPGZ', role: 'librarian', phone: '9810100004', pass: 'Lib@123', name: 'Alok Tripathi' },
    { school: 'VBPGZ', role: 'teacher', phone: '9810100005', pass: 'Teach@123', name: 'Vikram Malhotra' },
    { school: 'VBPGZ', role: 'teacher', phone: '9810100006', pass: 'Teach@123', name: 'Pooja Saxena' },
    { school: 'VBPGZ', role: 'student', phone: '9810100007', pass: 'Student@123', name: 'Aarav Singhania' },
    { school: 'VBPGZ', role: 'parent', phone: '9810100008', pass: 'Parent@123', name: 'Sanjay Singhania' },
    { school: 'VBPGZ', role: 'student', phone: '9810100009', pass: 'Student@123', name: 'Ananya Gupta' },
    { school: 'VBPGZ', role: 'parent', phone: '9810100010', pass: 'Parent@123', name: 'Rakesh Gupta' },

    // VBPNO
    { school: 'VBPNO', role: 'admin', phone: '9820200001', pass: 'Admin@123', name: 'Amitabh Sen' },
    { school: 'VBPNO', role: 'admin', phone: '9820200002', pass: 'Admin@123', name: 'Kavita Nambiar' },
    { school: 'VBPNO', role: 'librarian', phone: '9820200003', pass: 'Lib@123', name: 'Deepak Chawla' },
    { school: 'VBPNO', role: 'librarian', phone: '9820200004', pass: 'Lib@123', name: 'Rashmi Deshmukh' },
    { school: 'VBPNO', role: 'teacher', phone: '9820200005', pass: 'Teach@123', name: 'Pradeep Joshi' },
    { school: 'VBPNO', role: 'teacher', phone: '9820200006', pass: 'Teach@123', name: 'Neha Kapoor' },
    { school: 'VBPNO', role: 'student', phone: '9820200007', pass: 'Student@123', name: 'Kabir Mehta' },
    { school: 'VBPNO', role: 'parent', phone: '9820200008', pass: 'Parent@123', name: 'Naveen Mehta' },
    { school: 'VBPNO', role: 'student', phone: '9820200009', pass: 'Student@123', name: 'Rhea Nair' },
    { school: 'VBPNO', role: 'parent', phone: '9820200010', pass: 'Parent@123', name: 'Girish Nair' },
  ];

  let passed = 0;
  for (const acc of testAccounts) {
    // Simulate authController lookup
    const res = await query(
      `SELECT * FROM users 
       WHERE (phone = $1 OR email = $1 OR admission_no = $1 OR employee_id = $1 OR name = $1 OR CAST(id AS CHAR) = $1)
         AND (LOWER(school_code) = LOWER($2) OR role = 'super_admin' OR role = 'superadmin' OR school_code = 'GLOBAL' OR school_code IS NULL)
       ORDER BY (CASE WHEN role = 'super_admin' OR role = 'superadmin' THEN 1 ELSE 2 END)`,
      [acc.phone, acc.school]
    );

    if (!res.rows || res.rows.length === 0) {
      console.error(`❌ User lookup failed for ${acc.name} (${acc.phone}) in ${acc.school}`);
      continue;
    }

    const user = res.rows[0];
    const match = await bcrypt.compare(acc.pass, user.password);
    if (!match) {
      console.error(`❌ Password verification failed for ${acc.name} (${acc.phone})`);
      continue;
    }

    passed++;
    console.log(`✓ [${acc.school}] [${user.role.toUpperCase()}] ${user.name} authenticated successfully. ID: ${user.id}`);
  }

  console.log(`\n======================================================`);
  console.log(`Result: ${passed}/${testAccounts.length} dummy user accounts verified successfully!`);
  console.log(`======================================================`);
  process.exit(passed === testAccounts.length ? 0 : 1);
}

testAllLogins().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
