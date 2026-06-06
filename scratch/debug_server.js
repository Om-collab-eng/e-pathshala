const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

async function test() {
    let cookie;

    try {
        console.log("1. Logging in as Admin...");
        const loginRes = await axios.post(`${BASE_URL}/api/login/admin`, {
            admin_id: 'admin1',
            pin: '1234'
        });
        cookie = loginRes.headers['set-cookie'];
        console.log("✅ Logged in");
    } catch (e) {
        console.log("❌ Login failed:", e.response?.data || e.message);
        return;
    }

    // Creating a mock image file
    fs.writeFileSync('mock_image.jpg', 'mock image data');
    
    try {
        console.log("\n2. Testing /api/analyze-cover...");
        const formData = new FormData();
        formData.append('front_image', fs.createReadStream('mock_image.jpg'));
        
        const res = await axios.post(`${BASE_URL}/api/analyze-cover`, formData, {
            headers: {
                ...formData.getHeaders(),
                Cookie: cookie
            }
        });
        console.log("✅ Analysis Result:", res.data);
    } catch (e) {
        console.log("❌ Analysis Failed:", e.response?.data || e.message);
    }

    try {
        console.log("\n3. Testing /api/books/scan...");
        const formData = new FormData();
        formData.append('title', 'Test API Title');
        formData.append('author', 'Test Author');
        formData.append('front_image', fs.createReadStream('mock_image.jpg'));
        
        const res = await axios.post(`${BASE_URL}/api/books/scan`, formData, {
            headers: {
                ...formData.getHeaders(),
                Cookie: cookie
            }
        });
        console.log("✅ Saved Book:", res.data);
    } catch (e) {
        console.log("❌ Save Failed:", e.response?.data || e.message);
    }

    fs.unlinkSync('mock_image.jpg');
}

test();
