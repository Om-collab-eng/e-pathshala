const axios = require('axios');
const https = require('https');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function testGB() {
  const queries = [
    'intitle:HOW TO ENJOY YOUR LIFE inauthor:Dale Carnegie',
    'HOW TO ENJOY YOUR LIFE Dale Carnegie',
    'intitle:How to Win Friends and Influence People inauthor:Dale Carnegie'
  ];

  for (const q of queries) {
    console.log('\n--- Querying:', q, '---');
    try {
      const url = 'https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(q) + '&maxResults=3';
      const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, httpsAgent, timeout: 5000 });
      const items = res.data.items || [];
      console.log('Found:', items.length, 'item(s)');
      items.forEach((it, idx) => {
        const v = it.volumeInfo || {};
        const isbnStr = (v.industryIdentifiers || []).map(i => i.identifier).join(', ');
        const coverStr = v.imageLinks ? (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail) : 'None';
        console.log(`#${idx+1}: ${v.title} by ${(v.authors || []).join(', ')} | Publisher: ${v.publisher} | Date: ${v.publishedDate} | ISBN: ${isbnStr}`);
        console.log(`   Cover URL: ${coverStr}`);
      });
    } catch(e) {
      console.log('Error:', e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message);
    }
  }
}

testGB();
