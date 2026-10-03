const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function testUserScan() {
  const booksDir = path.join(__dirname, '..', 'static', 'uploads', 'books');
  const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.jpg'));
  const frontFiles = files.filter(f => f.includes('front')).sort();
  const backFiles = files.filter(f => f.includes('back')).sort();
  const lastFront = frontFiles[frontFiles.length - 1];
  const lastBack = backFiles[backFiles.length - 1];

  console.log('Testing with actual user cover images:', lastFront, lastBack);
  const fBuf = fs.readFileSync(path.join(booksDir, lastFront));
  const bBuf = fs.readFileSync(path.join(booksDir, lastBack));

  const fBase64 = 'data:image/jpeg;base64,' + fBuf.toString('base64');
  const bBase64 = 'data:image/jpeg;base64,' + bBuf.toString('base64');

  // Authenticate as librarian
  const loginRes = await axios.post('http://localhost:3000/login', 
    'username=librarian&password=admin123',
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, maxRedirects: 0, validateStatus: s => s === 302 }
  );
  const cookie = loginRes.headers['set-cookie'];

  const t0 = Date.now();
  const scanRes = await axios.post('http://localhost:3000/admin/api/books/smart-scan', {
    frontImageBase64: fBase64,
    backImageBase64: bBase64
  }, {
    headers: { 'Cookie': cookie }
  });

  console.log('Status:', scanRes.status, 'Time:', Date.now() - t0, 'ms');
  console.log('Book detected:');
  console.log(JSON.stringify(scanRes.data.book, null, 2));
  console.log('\nSequential Debug Trace [05] - [15]:');
  scanRes.data.debugTrace.forEach(t => {
    console.log(`[${t.step}] ${t.title}: ${t.details}`);
  });
}

testUserScan();
