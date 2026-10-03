const axios = require('axios');

async function testAllLogins() {
  const tests = [
    { label: 'Master Admin / Super Admin (Card Click: superadmin / admin123)', username: 'superadmin', password: 'admin123', expected: '/super-admin' },
    { label: 'Master Admin / Super Admin (Alternative: superadmin / super123)', username: 'superadmin', password: 'super123', expected: '/super-admin' },
    { label: 'Master Admin by Phone (7000000000 / admin123)', username: '7000000000', password: 'admin123', expected: '/super-admin' },
    { label: 'Master Admin by Phone (8527198907 / 12345)', username: '8527198907', password: '12345', expected: '/super-admin' },
    { label: 'Librarian (Card Click: 9898989898 / libpassword)', username: '9898989898', password: 'libpassword', expected: '/admin' },
    { label: 'Librarian (Username: librarian / admin123)', username: 'librarian', password: 'admin123', expected: '/admin' }
  ];

  console.log('--- 🔐 VERIFYING AUTHENTICATION FIXES ---');
  let allPassed = true;

  for (const t of tests) {
    const params = new URLSearchParams();
    params.append('username', t.username);
    params.append('password', t.password);
    params.append('school_code', 'DPS123');

    const res = await axios.post('http://localhost:3000/login', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      maxRedirects: 0,
      validateStatus: () => true
    });

    const loc = res.headers.location;
    const passed = (loc === t.expected);
    if (!passed) allPassed = false;

    console.log(`[${passed ? '✅ PASS' : '❌ FAIL'}] ${t.label}`);
    console.log(`       Status: ${res.status} | Redirect: ${loc} (Expected: ${t.expected})`);
  }

  if (allPassed) {
    console.log('\n🎉 ALL LOGIN ROLES & CREDENTIAL COMBINATIONS VERIFIED SUCCESSFULLY!');
  } else {
    console.error('\n❌ SOME LOGIN TESTS FAILED');
    process.exit(1);
  }
}

testAllLogins().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
