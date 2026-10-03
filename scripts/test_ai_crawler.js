const axios = require('axios');
const https = require('https');
require('dotenv').config();
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function testAICrawler() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const prompt = `You are the Google Books Store Online Catalog Crawler.
The librarian scanned a book with Title: "HOW TO ENJOY YOUR LIFE" (or similar to "How to Enjoy Your Life and Your Job") and Author: "Dale Carnegie".
Search and retrieve the complete official book details from Google Books Store and library databases for Dale Carnegie's book.
Return ONLY JSON in this format:
{
  "title": "Exact Title from Google Books Store",
  "author": "Dale Carnegie",
  "publisher": "Official Publisher",
  "isbn": "13-digit or 10-digit ISBN",
  "publication_year": "YYYY",
  "synopsis": "Official back cover summary / synopsis",
  "category": "Self-help / Personal Development",
  "price": "Printed MRP / price",
  "cover_url": "High quality front cover image URL",
  "back_cover_url": "Back cover URL if available or empty string"
}`;

  const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: 'google/gemini-2.5-flash-lite',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  }, {
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    httpsAgent
  });

  console.log('Result:');
  console.log(res.data.choices[0].message.content);
}

testAICrawler();
