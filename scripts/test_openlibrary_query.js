const axios = require('axios');

async function test() {
  const q = 'how to enjoy your life dale carnegie';
  const url = 'https://openlibrary.org/search.json?q=' + encodeURIComponent(q) + '&limit=3';
  const res = await axios.get(url);
  console.log('OpenLibrary results:', res.data.numFound);
  res.data.docs.slice(0, 3).forEach((d, i) => {
    const pub = (d.publisher || [])[0] || 'Unknown';
    const authors = (d.author_name || []).join(', ');
    const isbn = (d.isbn || [])[0] || 'N/A';
    const coverUrl = d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : 'None';
    console.log(`#${i+1}: ${d.title} by ${authors} | Publisher: ${pub} | Year: ${d.first_publish_year} | ISBN: ${isbn}`);
    console.log(`   Cover URL: ${coverUrl}`);
  });
}

test();
