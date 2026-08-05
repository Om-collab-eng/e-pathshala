const axios = require('axios');
async function testLogin() {
  try {
    const res = await axios.post('http://localhost:3000/login', new URLSearchParams({
      username: '8527198907',
      password: '12345'
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      maxRedirects: 0,
      validateStatus: null
    });
    console.log('Login Status:', res.status);
    console.log('Redirect Location:', res.headers.location);
    console.log('Session Cookie Set:', !!res.headers['set-cookie']);
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}
testLogin();
