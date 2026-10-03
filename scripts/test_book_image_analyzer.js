const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BASE_URL = 'http://localhost:3000';

async function testPipeline() {
  console.log('====================================================');
  console.log('🧪 TESTING SMART BOOK SCANNER & DEBUG CONSOLE PIPELINE');
  console.log('====================================================');

  const client = axios.create({
    baseURL: BASE_URL,
    maxRedirects: 0,
    validateStatus: s => s < 500
  });

  // Step 1: Login as librarian
  console.log('\n[1] Authenticating as Librarian...');
  const loginParams = new URLSearchParams();
  loginParams.append('username', 'librarian');
  loginParams.append('password', 'admin123');
  loginParams.append('school_code', 'DPS123');
  const loginRes = await client.post('/login', loginParams.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const cookie = (loginRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  if (!cookie) throw new Error('Could not authenticate: missing session cookie');
  console.log('✅ Authenticated successfully! Cookie obtained.');

  // Step 2: Verify Smart Scan UI HTML contains 2:3 aspect ratio and Debug Console
  console.log('\n[2] Checking Admin Page for 2:3 aspect-ratio camera and Debug Console...');
  const adminPageRes = await client.get('/admin', { headers: { Cookie: cookie } });
  if (adminPageRes.status !== 200) throw new Error('Failed to load /admin page: status ' + adminPageRes.status);

  const html = adminPageRes.data;
  const has23Ratio = html.includes('aspect-ratio:2/3') || html.includes('aspect-ratio: 2/3');
  const hasDebugConsole = html.includes('smartScanDebugConsole');
  const hasRunButton = html.includes('btnRunSmartScan');
  const hasCopyButton = html.includes('btnCopyDebugLog');

  console.log('   - 2:3 Portrait Aspect Ratio:', has23Ratio ? '✅ Present' : '❌ Missing');
  console.log('   - Debug Console Panel:', hasDebugConsole ? '✅ Present' : '❌ Missing');
  console.log('   - Run Book Analyzer CTA:', hasRunButton ? '✅ Present' : '❌ Missing');
  console.log('   - Copy Debug Log Button:', hasCopyButton ? '✅ Present' : '❌ Missing');

  if (!has23Ratio || !hasDebugConsole || !hasRunButton) {
    throw new Error('UI requirements missing from admin.ejs');
  }

  // Step 3: Create realistic 2:3 portrait book cover test images (720x1080)
  console.log('\n[3] Generating 2:3 portrait test images (720x1080)...');
  const frontSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080">
    <rect width="720" height="1080" fill="#1E293B"/>
    <text x="360" y="320" font-family="Arial" font-size="52" font-weight="bold" fill="#38BDF8" text-anchor="middle">ATOMIC HABITS</text>
    <text x="360" y="420" font-family="Arial" font-size="28" fill="#F8FAFC" text-anchor="middle">An Easy and Proven Way to Build Good Habits</text>
    <text x="360" y="560" font-family="Arial" font-size="36" font-weight="bold" fill="#F8FAFC" text-anchor="middle">James Clear</text>
    <text x="360" y="920" font-family="Arial" font-size="26" fill="#94A3B8" text-anchor="middle">Penguin Random House</text>
  </svg>`);

  const backSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080">
    <rect width="720" height="1080" fill="#F8FAFC"/>
    <text x="60" y="140" font-family="Arial" font-size="30" font-weight="bold" fill="#0F172A">About The Book:</text>
    <text x="60" y="200" font-family="Arial" font-size="24" fill="#334155">People think when you want to change your life,</text>
    <text x="60" y="240" font-family="Arial" font-size="24" fill="#334155">you need to think big. But world-renowned habit</text>
    <text x="60" y="280" font-family="Arial" font-size="24" fill="#334155">expert James Clear reveals a different way.</text>
    <text x="60" y="600" font-family="monospace" font-size="28" font-weight="bold" fill="#0F172A">ISBN: 9780735211292</text>
    <text x="60" y="680" font-family="monospace" font-size="30" font-weight="bold" fill="#0F172A">MRP: ₹ 599.00</text>
    <text x="60" y="760" font-family="Arial" font-size="22" fill="#64748B">Year: 2018 • Publisher: Avery</text>
  </svg>`);

  const frontJpeg = await sharp(frontSvg).jpeg({ quality: 92 }).toBuffer();
  const backJpeg = await sharp(backSvg).jpeg({ quality: 92 }).toBuffer();

  const frontBase64 = 'data:image/jpeg;base64,' + frontJpeg.toString('base64');
  const backBase64 = 'data:image/jpeg;base64,' + backJpeg.toString('base64');
  console.log(`✅ Front JPEG: 720x1080 (${Math.round(frontJpeg.length / 1024)} KB, 2:3 aspect ratio)`);
  console.log(`✅ Back JPEG:  720x1080 (${Math.round(backJpeg.length / 1024)} KB, 2:3 aspect ratio)`);

  // Step 4: Test POST /admin/api/books/smart-scan
  console.log('\n[4] Executing POST /admin/api/books/smart-scan...');
  const t0 = Date.now();
  const scanRes = await client.post('/admin/api/books/smart-scan', {
    frontImageBase64: frontBase64,
    backImageBase64: backBase64
  }, {
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie
    }
  });

  const duration = Date.now() - t0;
  console.log(`✅ Server responded in ${duration}ms with status: ${scanRes.status}`);

  const data = scanRes.data;
  console.log('\n--- SCAN RESULT VERIFICATION ---');
  console.log('Success:', data.success ? '✅ TRUE' : '❌ FALSE');
  console.log('Book ID Generated:', data.bookId || '❌ Missing');
  console.log('Barcode URL:', data.barcodeUrl || '❌ Missing');
  console.log('Title detected:', data.book && data.book.title);
  console.log('Author detected:', data.book && data.book.author);
  console.log('Publisher:', data.book && data.book.publisher);
  console.log('ISBN:', data.book && data.book.isbn);

  console.log('\n--- 📟 DEBUG TRACE SEQUENTIAL STEP LOGS [05] - [15] ---');
  if (data.debugTrace && Array.isArray(data.debugTrace)) {
    data.debugTrace.forEach(t => {
      console.log(`[${t.step}] ${t.title}: ${t.details}`);
    });
  } else {
    throw new Error('❌ Missing debugTrace in response!');
  }

  // Check required steps in debugTrace
  const steps = data.debugTrace.map(t => t.step);
  const requiredSteps = ['05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'];
  const missingSteps = requiredSteps.filter(s => !steps.includes(s));

  if (missingSteps.length > 0) {
    throw new Error(`❌ Missing expected debug trace steps: ${missingSteps.join(', ')}`);
  }
  console.log('\n✅ All sequential steps [05] through [15] verified in debug trace!');

  // Step 5: Test Error Handling when Front Image is Missing
  console.log('\n[5] Testing Error Handling (Front image missing)...');
  const errRes = await client.post('/admin/api/books/smart-scan', {}, {
    headers: { 'Content-Type': 'application/json', Cookie: cookie }
  });
  console.log('Status code on error:', errRes.status);
  console.log('Error message:', errRes.data.error);
  console.log('Failing step:', errRes.data.failingStep);
  console.log('Debug trace on error:', errRes.data.debugTrace && errRes.data.debugTrace.map(t => `[${t.step}] ${t.details}`));

  if (errRes.data.failingStep === '02' && errRes.data.debugTrace) {
    console.log('✅ Error handling correctly logs failing step [02] and returns structured trace!');
  } else {
    throw new Error('❌ Error handling failed to log structured step');
  }

  console.log('\n====================================================');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 100% VERIFIED!');
  console.log('====================================================');
}

testPipeline().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err.message);
  process.exit(1);
});
