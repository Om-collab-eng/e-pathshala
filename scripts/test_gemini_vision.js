const fs = require('fs');
const path = require('path');
const axios = require('axios');
const https = require('https');
require('dotenv').config();

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function testFull() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const booksDir = path.join(__dirname, '..', 'static', 'uploads', 'books');
  const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.jpg'));

  const frontFiles = files.filter(f => f.includes('front')).sort();
  const backFiles = files.filter(f => f.includes('back')).sort();

  const lastFront = frontFiles[frontFiles.length - 1];
  const lastBack = backFiles[backFiles.length - 1];

  console.log('Testing with Front:', lastFront, 'and Back:', lastBack);

  const fBuf = fs.readFileSync(path.join(booksDir, lastFront));
  const fBase64 = 'data:image/jpeg;base64,' + fBuf.toString('base64');

  const contents = [
    {
      type: 'text',
      text: `You are Google Lens AI for Book Recognition & Cataloging.
Analyze the attached book cover image(s).
Instructions:
1. Identify the Title (capitalized, omit author/publisher branding from title).
2. Identify the Author(s).
3. Identify the Publisher.
4. Extract ISBN-10 or ISBN-13 (from barcode numbers or printed text).
5. Extract MRP / Price if printed.
6. Extract Synopsis / book summary blurb.
7. If text appears horizontally mirrored or reversed, automatically read and un-reverse it.

Return ONLY a JSON object:
{
  "title": "...",
  "subtitle": "...",
  "author": "...",
  "publisher": "...",
  "isbn": "...",
  "price": "...",
  "publication_year": "...",
  "synopsis": "...",
  "category": "...",
  "confidence_score": 95
}`
    },
    { type: 'image_url', image_url: { url: fBase64 } }
  ];

  if (lastBack) {
    const bBuf = fs.readFileSync(path.join(booksDir, lastBack));
    contents.push({
      type: 'image_url',
      image_url: { url: 'data:image/jpeg;base64,' + bBuf.toString('base64') }
    });
  }

  const startTime = Date.now();
  const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: 'google/gemini-2.5-flash-lite',
    messages: [
      { role: 'user', content: contents }
    ],
    response_format: { type: 'json_object' }
  }, {
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    httpsAgent,
    timeout: 15000
  });

  console.log('Completed in:', Date.now() - startTime, 'ms');
  console.log('AI Response:');
  console.log(res.data.choices[0].message.content);
}

testFull();
