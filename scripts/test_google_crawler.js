const axios = require('axios');
const https = require('https');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function testCrawler() {
  const title = 'HOW TO ENJOY YOUR LIFE';
  const author = 'Dale Carnegie';
  console.log(`Testing online crawler for "${title}" by "${author}"...`);

  // 1. OpenLibrary query by Title & Author
  try {
    const q = `${title} ${author}`;
    const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=3`;
    const olRes = await axios.get(olUrl, { httpsAgent, timeout: 5000 });
    const docs = olRes.data.docs || [];
    console.log(`OpenLibrary found ${docs.length} books:`);
    if (docs.length > 0) {
      const top = docs[0];
      console.log('Top match:', top.title, 'by', (top.author_name || []).join(', '));
      console.log('Publisher:', (top.publisher || [])[0]);
      console.log('Year:', top.first_publish_year);
      console.log('ISBN:', (top.isbn || [])[0]);
      console.log('Cover URL:', top.cover_i ? `https://covers.openlibrary.org/b/id/${top.cover_i}-L.jpg` : 'none');
    }
  } catch (e) {
    console.error('OpenLibrary error:', e.message);
  }

  // 2. Google Books Direct volumes scraping / public query
  try {
    const gq = `intitle:${title} inauthor:${author}`;
    console.log('\nTrying Google Books with user-agent rotation...');
    const gUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(gq)}&maxResults=3`;
    const gRes = await axios.get(gUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      httpsAgent,
      timeout: 5000
    });
    console.log('Google Books success! Items:', (gRes.data.items || []).length);
  } catch (e) {
    console.log('Google Books API status:', e.response ? e.response.status : e.message);
  }
}

testCrawler();
