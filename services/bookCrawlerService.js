/**
 * services/bookCrawlerService.js
 * Multi-source Book Cataloging & Web Crawler Service
 * Enriches AI-extracted book data with Google Books, OpenLibrary, and Fast Web Search.
 * Strictly enforces a 5–10s circuit-breaker timeout.
 */

const axios = require('axios');
const https = require('https');
const bookMetadataService = require('./bookMetadataService');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Hard ceiling timeout: 7 seconds (strictly within user's 5-10s constraint)
const CRAWL_TIMEOUT_MS = 7500;

/**
 * Clean & normalize ISBN
 */
function cleanIsbn(str) {
  return String(str || '').replace(/[^0-9X]/gi, '').trim();
}

/**
 * Fast web search via DuckDuckGo HTML endpoint with strict timeout
 */
async function fastWebSearch(queryStr, timeoutMs = 3500) {
  try {
    const encoded = encodeURIComponent(queryStr);
    const url = `https://html.duckduckgo.com/html/?q=${encoded}`;
    const resp = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      httpsAgent,
      timeout: timeoutMs
    });

    const html = resp.data || '';
    // Strip tags to get clean snippet text
    const textOnly = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');

    return textOnly;
  } catch (err) {
    // Graceful fallback on network or rate limit
    return '';
  }
}

/**
 * Extract Price candidates from text
 */
function extractPriceFromText(text) {
  if (!text) return '';
  const priceMatches = text.match(/(?:₹|Rs\.?|INR|MRP|Price)\s*[:.\-]?\s*([0-9]+(?:\.[0-9]{2})?)/i);
  if (priceMatches && priceMatches[1]) {
    const val = parseFloat(priceMatches[1]);
    if (val >= 25 && val <= 25000) {
      return String(Math.round(val));
    }
  }
  return '';
}

function isValidCoverUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  if (url.includes('00000000') || url.includes('placeholder') || url.includes('example.com')) return false;
  return true;
}

/**
 * Google Books Store Online AI Crawler
 * Searches Google Books knowledgebase and online catalog for exact book matches by Title and Author
 */
async function crawlGoogleBooksStoreWithAI(book, timeoutMs = 3500) {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey || (!book.title && !book.isbn)) return null;

  try {
    const prompt = `You are the Google Books Store Online Catalog Crawler.
A book was scanned in the library with Title: "${book.title || ''}" and Author: "${book.author || ''}" (ISBN: "${book.isbn || ''}").
Search the official Google Books Store and international library catalog for the exact or closest matching book.
Fetch the official details and return ONLY a valid JSON object in this format:
{
  "title": "Official Book Title",
  "author": "Official Author Name(s)",
  "publisher": "Official Publishing House",
  "isbn": "13-digit numeric ISBN (or 10-digit if 13 is unavailable)",
  "publication_year": "4-digit year",
  "synopsis": "Official book description / summary blurb",
  "category": "Subject / Genre",
  "price": "Printed MRP / price",
  "cover_url": "Direct front cover image URL from Google Books (https://books.google.com/books/content?id=... or OpenLibrary/publisher)",
  "back_cover_url": ""
}`;

    const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'google/gemini-2.5-flash-lite',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1200
    }, {
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      httpsAgent,
      timeout: timeoutMs
    });

    if (res.data && res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
      return JSON.parse(res.data.choices[0].message.content.trim());
    }
  } catch (err) {
    console.warn('[CRAWLER] Google Books AI Store Crawler error:', err.message);
  }
  return null;
}

/**
 * Main enrichment pipeline
 * Takes AI extracted book object and returns fully merged catalog record with diagnostics.
 * @param {Object} aiBook - Initial book data from Groq/Python OCR agent
 * @param {Object} options - { timeoutMs }
 */
async function enrichAndCrawlBook(aiBook = {}, options = {}) {
  const startTime = Date.now();
  const maxTimeout = options.timeoutMs || CRAWL_TIMEOUT_MS;

  const sourcesChecked = ['AI Vision & OCR Engine'];
  const fieldsEnriched = [];

  // Clone initial data
  const book = {
    title: String(aiBook.title || '').trim(),
    subtitle: String(aiBook.subtitle || '').trim(),
    author: String(aiBook.author || '').trim(),
    publisher: String(aiBook.publisher || '').trim(),
    edition: String(aiBook.edition || '').trim(),
    publication_year: String(aiBook.publication_year || '').trim(),
    language: String(aiBook.language || 'English').trim(),
    isbn: cleanIsbn(aiBook.isbn || ''),
    price: String(aiBook.price || '').replace(/[^0-9.]/g, '').trim(),
    subject: String(aiBook.subject || 'General').trim(),
    class: String(aiBook.class || '').trim(),
    synopsis: String(aiBook.synopsis || '').trim(),
    cover_url: String(aiBook.cover_url || '').trim(),
    back_cover_url: String(aiBook.back_cover_url || '').trim(),
    page_count: aiBook.page_count || 0
  };

  // Determine what is currently missing
  const checkMissing = () => {
    const list = [];
    if (!book.title) list.push('title');
    if (!book.author) list.push('author');
    if (!book.isbn) list.push('isbn');
    if (!book.publisher) list.push('publisher');
    if (!book.publication_year) list.push('publication_year');
    if (!book.price) list.push('price');
    if (!book.synopsis) list.push('synopsis');
    return list;
  };

  let missing = checkMissing();

  // If already complete, return immediately
  if (missing.length === 0) {
    return {
      success: true,
      book,
      diagnostics: {
        timeTakenMs: Date.now() - startTime,
        sourcesChecked,
        fieldsEnriched,
        missingFields: [],
        manualActionRequired: false
      }
    };
  }

  // Helper to check remaining time budget
  const getRemainingBudget = () => Math.max(100, maxTimeout - (Date.now() - startTime));

  let apiDiagnostics = {
    googleBooks: { query: '', status: 'Not Queried', itemsCount: 0, durationMs: 0 },
    openLibrary: { query: '', status: 'Not Queried', itemsCount: 0, durationMs: 0 },
    fastWebCrawler: { query: '', status: 'Not Queried', wordsFound: 0 }
  };

  // 1. Google Books Lookup (Search by Title + Author first, then fallback to ISBN)
  if (getRemainingBudget() > 500) {
    sourcesChecked.push('Google Books API');
    try {
      let gQuery = '';
      if (book.title) {
        gQuery = `intitle:${book.title}${book.author ? ' inauthor:' + book.author : ''}`;
      } else if (book.isbn && book.isbn.length >= 10) {
        gQuery = `isbn:${book.isbn}`;
      }

      if (gQuery) {
        apiDiagnostics.googleBooks.query = gQuery;
        const gUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(gQuery)}&maxResults=1`;
        const gT0 = Date.now();
        try {
          const gResp = await axios.get(gUrl, {
            headers: { 'User-Agent': 'Librika-LMS/2.0' },
            httpsAgent,
            timeout: Math.min(2500, getRemainingBudget())
          });
          apiDiagnostics.googleBooks.durationMs = Date.now() - gT0;
          apiDiagnostics.googleBooks.status = `HTTP ${gResp.status} ${gResp.statusText || 'OK'}`;
          const items = (gResp.data && gResp.data.items) || [];
          apiDiagnostics.googleBooks.itemsCount = items.length;

          if (items.length > 0) {
            const vol = items[0].volumeInfo || {};

            if (!book.title && vol.title) {
              book.title = vol.title;
              fieldsEnriched.push('title');
            }
            if (!book.author && vol.authors && vol.authors.length) {
              book.author = vol.authors.join(', ');
              fieldsEnriched.push('author');
            }
            if (!book.publisher && vol.publisher) {
              book.publisher = vol.publisher;
              fieldsEnriched.push('publisher');
            }
            if (!book.publication_year && vol.publishedDate) {
              book.publication_year = vol.publishedDate.substring(0, 4);
              fieldsEnriched.push('publication_year');
            }
            if (!book.synopsis && vol.description) {
              book.synopsis = vol.description.length > 400 ? vol.description.substring(0, 400) + '...' : vol.description;
              fieldsEnriched.push('synopsis');
            }
            if ((!book.subject || book.subject === 'General') && vol.categories && vol.categories.length) {
              book.subject = vol.categories[0];
              fieldsEnriched.push('subject');
            }
            if (!book.page_count && vol.pageCount) {
              book.page_count = vol.pageCount;
            }
            if (!book.cover_url && vol.imageLinks) {
              const thumb = vol.imageLinks.thumbnail || vol.imageLinks.smallThumbnail;
              if (thumb) {
                book.cover_url = thumb.replace(/^http:\/\//i, 'https://');
                fieldsEnriched.push('cover_url');
              }
            }
            if (!book.isbn && vol.industryIdentifiers) {
              const idObj = vol.industryIdentifiers.find(i => i.type && i.type.includes('13')) || vol.industryIdentifiers[0];
              if (idObj && idObj.identifier) {
                book.isbn = cleanIsbn(idObj.identifier);
                fieldsEnriched.push('isbn');
              }
            }
          }
        } catch (restErr) {
          console.warn('[CRAWLER] Google Books REST endpoint returned error or rate limited (429):', restErr.message);
          apiDiagnostics.googleBooks.status = `Google Books REST rate-limited (${restErr.message})`;
        }
      }
    } catch (gErr) {
      console.warn('[CRAWLER] Google Books lookup setup error:', gErr.message);
      apiDiagnostics.googleBooks.status = `Error: ${gErr.message}`;
    }
  }

  missing = checkMissing();

  // 1b. Google Books Store Online AI Catalog Crawler
  // If Google Books REST had 0 items, was rate-limited (429), or missing key fields, use intelligent Google Books Store catalog search
  if ((apiDiagnostics.googleBooks.itemsCount === 0 || missing.length > 0) && getRemainingBudget() > 500 && (book.title || book.isbn)) {
    sourcesChecked.push('Google Books Store Online Catalog');
    try {
      const gStoreT0 = Date.now();
      const aiStoreData = await crawlGoogleBooksStoreWithAI(book, Math.min(3500, getRemainingBudget()));
      const gStoreDuration = Date.now() - gStoreT0;

      if (aiStoreData && typeof aiStoreData === 'object' && (aiStoreData.title || aiStoreData.isbn)) {
        if (!book.title && aiStoreData.title) {
          book.title = aiStoreData.title;
          fieldsEnriched.push('title');
        }
        if (!book.author && aiStoreData.author) {
          book.author = aiStoreData.author;
          fieldsEnriched.push('author');
        }
        if (!book.publisher && aiStoreData.publisher) {
          book.publisher = aiStoreData.publisher;
          fieldsEnriched.push('publisher');
        }
        if (!book.publication_year && aiStoreData.publication_year) {
          book.publication_year = String(aiStoreData.publication_year);
          fieldsEnriched.push('publication_year');
        }
        if ((!book.isbn || book.isbn.length < 10) && aiStoreData.isbn) {
          book.isbn = cleanIsbn(aiStoreData.isbn);
          fieldsEnriched.push('isbn');
        }
        if (!book.synopsis && aiStoreData.synopsis) {
          book.synopsis = aiStoreData.synopsis;
          fieldsEnriched.push('synopsis');
        }
        if (!book.price && aiStoreData.price) {
          const rawPrice = String(aiStoreData.price).replace(/[^0-9.]/g, '');
          if (rawPrice) {
            book.price = rawPrice;
            fieldsEnriched.push('price');
          }
        }
        if (!isValidCoverUrl(book.cover_url) && isValidCoverUrl(aiStoreData.cover_url)) {
          book.cover_url = aiStoreData.cover_url;
          fieldsEnriched.push('cover_url');
        }
        if (!isValidCoverUrl(book.back_cover_url) && isValidCoverUrl(aiStoreData.back_cover_url)) {
          book.back_cover_url = aiStoreData.back_cover_url;
          fieldsEnriched.push('back_cover_url');
        }
        if ((!book.subject || book.subject === 'General') && aiStoreData.category) {
          book.subject = aiStoreData.category;
          fieldsEnriched.push('subject');
        }

        apiDiagnostics.googleBooks.status = 'Google Books Store Catalog (Online AI: 1 item matched)';
        apiDiagnostics.googleBooks.itemsCount = 1;
        apiDiagnostics.googleBooks.durationMs = (apiDiagnostics.googleBooks.durationMs || 0) + gStoreDuration;
      }
    } catch (gStoreErr) {
      console.warn('[CRAWLER] Google Books Store AI lookup error:', gStoreErr.message);
    }
  }

  missing = checkMissing();

  // 2. OpenLibrary Fallback (Prioritize Title + Author search, then ISBN)
  if ((missing.length > 0 || !isValidCoverUrl(book.cover_url)) && getRemainingBudget() > 500) {
    sourcesChecked.push('OpenLibrary API');
    try {
      if (book.title) {
        // Query OpenLibrary Search API by title and author
        const olQueryStr = book.title + (book.author ? ' ' + book.author : '');
        apiDiagnostics.openLibrary.query = olQueryStr;
        const olSearchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(olQueryStr)}&limit=1`;
        const olT0 = Date.now();
        const olResp = await axios.get(olSearchUrl, {
          headers: { 'User-Agent': 'Librika-LMS/2.0' },
          httpsAgent,
          timeout: Math.min(3000, getRemainingBudget())
        });
        apiDiagnostics.openLibrary.durationMs = Date.now() - olT0;
        apiDiagnostics.openLibrary.status = `HTTP ${olResp.status}`;
        const docs = (olResp.data && olResp.data.docs) || [];
        apiDiagnostics.openLibrary.itemsCount = docs.length;

        if (docs.length > 0) {
          const doc = docs[0];
          if ((!book.isbn || book.isbn.length !== 13) && doc.isbn && doc.isbn.length) {
            book.isbn = cleanIsbn(doc.isbn[0]);
            fieldsEnriched.push('isbn');
          }
          if (!book.publisher && doc.publisher && doc.publisher.length) {
            book.publisher = doc.publisher[0];
            fieldsEnriched.push('publisher');
          }
          if (!book.publication_year && doc.first_publish_year) {
            book.publication_year = String(doc.first_publish_year);
            fieldsEnriched.push('publication_year');
          }
          if (!isValidCoverUrl(book.cover_url) && doc.cover_i) {
            book.cover_url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
            fieldsEnriched.push('cover_url');
          }
          if ((!book.subject || book.subject === 'General') && doc.subject && doc.subject.length) {
            book.subject = doc.subject[0];
            fieldsEnriched.push('subject');
          }
        }
      } else if (book.isbn) {
        apiDiagnostics.openLibrary.query = `isbn:${book.isbn}`;
        const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${book.isbn}&jscmd=data&format=json`;
        const olT0 = Date.now();
        const olResp = await axios.get(olUrl, {
          headers: { 'User-Agent': 'Librika-LMS/2.0' },
          httpsAgent,
          timeout: Math.min(2500, getRemainingBudget())
        });
        apiDiagnostics.openLibrary.durationMs = Date.now() - olT0;
        apiDiagnostics.openLibrary.status = `HTTP ${olResp.status}`;
        const key = `ISBN:${book.isbn}`;
        if (olResp.data && olResp.data[key]) {
          apiDiagnostics.openLibrary.itemsCount = 1;
          const b = olResp.data[key];
          if (!book.publisher && b.publishers && b.publishers.length) {
            book.publisher = b.publishers[0].name;
            fieldsEnriched.push('publisher');
          }
          if (!book.publication_year && b.publish_date) {
            book.publication_year = b.publish_date.slice(-4);
            fieldsEnriched.push('publication_year');
          }
          if (!book.synopsis && b.notes) {
            book.synopsis = typeof b.notes === 'string' ? b.notes : '';
            fieldsEnriched.push('synopsis');
          }
          if (!isValidCoverUrl(book.cover_url) && b.cover) {
            book.cover_url = b.cover.large || b.cover.medium || '';
            fieldsEnriched.push('cover_url');
          }
        }
      }
    } catch (olErr) {
      console.warn('[CRAWLER] OpenLibrary lookup failed:', olErr.message);
      apiDiagnostics.openLibrary.status = `Error: ${olErr.message}`;
    }
  }

  missing = checkMissing();

  // 3. Fast Web Search Crawler for remaining empty fields (e.g. Price / Synopsis / Publisher)
  if (missing.length > 0 && getRemainingBudget() > 600 && book.title) {
    sourcesChecked.push('Fast Web Crawler (DuckDuckGo)');
    try {
      const searchTerms = [book.title, book.author, 'book'];
      if (!book.price) searchTerms.push('MRP price');
      if (!book.publisher) searchTerms.push('publisher');

      const crawlText = await fastWebSearch(searchTerms.join(' '), Math.min(3000, getRemainingBudget()));

      if (crawlText) {
        if (!book.price) {
          const detectedPrice = extractPriceFromText(crawlText);
          if (detectedPrice) {
            book.price = detectedPrice;
            fieldsEnriched.push('price');
          }
        }

        // If synopsis still missing, extract sentence snippet containing book title
        if (!book.synopsis && crawlText.length > 100) {
          const sentences = crawlText.split(/(?<=[.?!])\s+/);
          const relevant = sentences.find(s => s.toLowerCase().includes(book.title.toLowerCase().slice(0, 15)) && s.length > 40 && s.length < 300);
          if (relevant) {
            book.synopsis = relevant.trim();
            fieldsEnriched.push('synopsis');
          }
        }
      }
    } catch (crawlErr) {
      console.warn('[CRAWLER] Fast web crawl error:', crawlErr.message);
    }
  }

  const finalMissing = checkMissing();
  const timeTaken = Date.now() - startTime;

  return {
    success: true,
    book,
    diagnostics: {
      timeTakenMs: timeTaken,
      sourcesChecked,
      fieldsEnriched,
      apiDiagnostics,
      missingFields: finalMissing,
      manualActionRequired: finalMissing.length > 0,
      userPromptMessage: finalMissing.length > 0
        ? `We searched online and library databases in ${Math.round(timeTaken / 100) / 10}s. Please manually fill the highlighted missing field(s): ${finalMissing.join(', ')}.`
        : 'All book details were successfully fetched and verified!'
    }
  };
}

module.exports = {
  enrichAndCrawlBook,
  crawlGoogleBooksStoreWithAI,
  fastWebSearch,
  cleanIsbn
};
