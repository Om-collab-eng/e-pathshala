const assert = require('assert');
const http = require('http');

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function testHttpEndpoints() {
  console.log('====================================================');
  console.log('🌐 RUNNING HTTP API ACCEPTANCE & SECURITY CHECKS');
  console.log('====================================================\n');

  // Let's test user ID 18 or 31 (Ayushman Gupta)
  console.log('Checking Canonical Profile API: /api/user/31/profile...');
  const res = await getJson('http://localhost:3000/api/user/31/profile');
  assert.strictEqual(res.status, 200, 'Expected HTTP 200 from /api/user/31/profile');
  assert(res.data.success, 'Expected success: true');
  const profile = res.data.profile;

  // CRITICAL SECURITY ASSERTIONS
  console.log('Verifying CRITICAL SECURITY: Password and Secrets Are Never Returned in API...');
  assert.strictEqual(profile.password, undefined, 'CRITICAL SECURITY DEFECT: password must not be returned');
  assert.strictEqual(profile.session_token, undefined, 'CRITICAL SECURITY DEFECT: session_token must not be returned');
  assert.strictEqual(profile.two_factor_secret, undefined, 'CRITICAL SECURITY DEFECT: two_factor_secret must not be returned');
  console.log('✓ Password is never exposed via public/internal API.');

  // Check Canonical Person Profile Fields
  console.log('Verifying Canonical Person Profile Model Fields...');
  assert(profile.id, 'id exists');
  assert(profile.name, 'name exists');
  assert(profile.username, 'username exists');
  assert(profile.gender !== undefined, 'gender exists');
  assert(profile.schoolCode || profile.school_code, 'schoolCode exists');
  console.log(`✓ Verified canonical fields for: ${profile.name} (Username: ${profile.username}, Role: ${profile.role})`);

  console.log('\n====================================================');
  console.log('🎉 ALL HTTP API SECURITY & DATA CONTRACT CHECKS PASSED!');
  console.log('====================================================');
}

testHttpEndpoints().catch(err => {
  console.error('HTTP test failed:', err);
  process.exit(1);
});
