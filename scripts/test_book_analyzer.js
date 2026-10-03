const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- 🧪 STARTING BOOK ANALYZER TEST SUITE ---');

  // Create an axios instance with cookie preservation
  let sessionCookie = '';

  const client = axios.create({
    baseURL: BASE_URL,
    maxRedirects: 0,
    validateStatus: status => status < 400 || status === 302
  });

  // 1. Login as Librarian
  console.log('\n[TEST 1] Logging in as Librarian (librarian / admin123)...');
  const loginParams = new URLSearchParams();
  loginParams.append('username', 'librarian');
  loginParams.append('password', 'admin123');

  const loginRes = await client.post('/login', loginParams.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const setCookie = loginRes.headers['set-cookie'];
  if (setCookie && setCookie.length > 0) {
    sessionCookie = setCookie.map(c => c.split(';')[0]).join('; ');
    console.log('✅ Logged in successfully. Session cookie obtained:', sessionCookie.substring(0, 30) + '...');
  } else {
    throw new Error('Failed to obtain session cookie');
  }

  // 2. Test GET /admin/book-analyzer-test
  console.log('\n[TEST 2] Testing GET /admin/book-analyzer-test (Playground page)...');
  const pageRes = await client.get('/admin/book-analyzer-test', {
    headers: { Cookie: sessionCookie }
  });

  if (pageRes.status === 200 && pageRes.data.includes('Book Analyzer')) {
    console.log('✅ Playground HTML page rendered successfully (Status 200). Found "Book Analyzer"');
  } else {
    throw new Error(`Failed to load playground page, status: ${pageRes.status}`);
  }

  // 3. Test POST /admin/api/book-analyzer-test/run with Sample Dummy Book Images
  console.log('\n[TEST 3] Testing POST /admin/api/book-analyzer-test/run (End-to-End Pipeline)...');
  
  // Render true raster PNGs using sharp
  const sharp = require('sharp');
  const sampleFrontSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">
    <rect width="600" height="800" fill="#1E293B"/>
    <text x="300" y="240" font-family="Arial" font-size="44" font-weight="bold" fill="#38BDF8" text-anchor="middle">CLEAN CODE</text>
    <text x="300" y="320" font-family="Arial" font-size="24" fill="#F8FAFC" text-anchor="middle">Robert C. Martin</text>
    <text x="300" y="680" font-family="Arial" font-size="20" fill="#94A3B8" text-anchor="middle">Prentice Hall</text>
  </svg>`);
  const frontPngBuffer = await sharp(sampleFrontSvg).png().toBuffer();
  const frontBase64 = 'data:image/png;base64,' + frontPngBuffer.toString('base64');

  const sampleBackSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">
    <rect width="600" height="800" fill="#FFFFFF"/>
    <text x="40" y="150" font-family="Courier" font-size="24" fill="#000">ISBN: 9780132350884</text>
    <text x="40" y="220" font-family="Courier" font-size="24" fill="#000">Price: ₹ 699</text>
    <text x="40" y="300" font-family="Arial" font-size="20" fill="#333">A guide to writing clean, maintainable software.</text>
  </svg>`);
  const backPngBuffer = await sharp(sampleBackSvg).png().toBuffer();
  const backBase64 = 'data:image/png;base64,' + backPngBuffer.toString('base64');

  const testStartTime = Date.now();
  const runRes = await client.post('/admin/api/book-analyzer-test/run', {
    frontImageBase64: frontBase64,
    backImageBase64: backBase64
  }, {
    headers: { Cookie: sessionCookie, 'Content-Type': 'application/json' },
    timeout: 15000
  });

  const duration = Date.now() - testStartTime;
  console.log(`⏱️ API executed in ${duration}ms (Max constraint: 5-10s)`);

  if (runRes.data && runRes.data.success) {
    console.log('✅ Analyzer Test Pipeline returned success: true');
    console.log('   - OCR Stage:', JSON.stringify(runRes.data.ocr.diagnostics));
    console.log('   - AI Agent Stage Provider:', runRes.data.aiAgent.provider_used);
    console.log('   - AI Agent Output:', JSON.stringify({
      title: runRes.data.aiAgent.title,
      author: runRes.data.aiAgent.author,
      isbn: runRes.data.aiAgent.isbn,
      confidence_score: runRes.data.aiAgent.confidence_score
    }));
    console.log('   - Crawler Sources Checked:', runRes.data.crawler.diagnostics.sourcesChecked);
    console.log('   - Crawler Time Taken:', runRes.data.crawler.diagnostics.timeTakenMs + 'ms');
    console.log('   - Final Merged Book:', JSON.stringify({
      title: runRes.data.book.title,
      author: runRes.data.book.author,
      isbn: runRes.data.book.isbn,
      cover_url: runRes.data.book.cover_url
    }));
  } else {
    throw new Error('Pipeline execution failed: ' + JSON.stringify(runRes.data));
  }

  // 4. Test POST /admin/api/books/smart-scan (The Add Book Modal Scanner)
  console.log('\n[TEST 4] Testing POST /admin/api/books/smart-scan (Add Book Modal Endpoint)...');
  const scanRes = await client.post('/admin/api/books/smart-scan', {
    frontImageBase64: frontBase64,
    backImageBase64: backBase64
  }, {
    headers: { Cookie: sessionCookie, 'Content-Type': 'application/json' },
    timeout: 15000
  });

  if (scanRes.data && scanRes.data.success && scanRes.data.bookId && scanRes.data.barcodeUrl) {
    console.log('✅ Smart Scan endpoint returned success: true');
    console.log('   - Generated Book ID:', scanRes.data.bookId);
    console.log('   - Generated Barcode URL:', scanRes.data.barcodeUrl);
    console.log('   - Missing Fields Identified:', scanRes.data.missingFields);
    console.log('   - Manual Action Required:', scanRes.data.manualActionRequired);
    console.log('   - User Prompt Message:', scanRes.data.userPromptMessage);
  } else {
    throw new Error('Smart Scan failed: ' + JSON.stringify(scanRes.data));
  }

  console.log('\n🎉 ALL BOOK ANALYZER TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Error:', err.message);
  if (err.response) {
    console.error('Response Status:', err.response.status);
    console.error('Response Data:', err.response.data);
  }
  process.exit(1);
});
