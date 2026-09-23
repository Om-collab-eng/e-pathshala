/**
 * services/bookMetadataService.js
 * Comprehensive book metadata fetcher with Google Books API + OpenLibrary fallback,
 * duplicate detection, and acquisition record matching.
 */
const https = require('https');
const http = require('http');
const { query } = require('../db');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Librika-LMS/2.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', err => resolve(null));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

function cleanIsbn(str) {
  return String(str || '').replace(/[^0-9X]/gi, '').trim();
}

/**
 * Lookup metadata from Google Books and OpenLibrary
 */
async function fetchBookMetadata(searchQuery) {
  const q = String(searchQuery || '').trim();
  if (!q) return null;

  const isbn = cleanIsbn(q);
  const isLikelyIsbn = (isbn.length === 10 || isbn.length === 13);

  let result = null;

  // 1. Google Books Lookup
  try {
    const googleQuery = isLikelyIsbn ? `isbn:${isbn}` : encodeURIComponent(q);
    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${googleQuery}&maxResults=1`;
    const googleData = await fetchJson(googleUrl);

    if (googleData && googleData.items && googleData.items.length > 0) {
      const vol = googleData.items[0].volumeInfo || {};
      const img = vol.imageLinks || {};
      const coverUrl = (img.thumbnail || img.smallThumbnail || '').replace(/^http:\/\//i, 'https://');
      
      const identifiers = vol.industryIdentifiers || [];
      const foundIsbnObj = identifiers.find(i => i.type.includes('13')) || identifiers[0];
      const bookIsbn = foundIsbnObj ? foundIsbnObj.identifier : (isLikelyIsbn ? isbn : '');

      result = {
        title: vol.title || '',
        author: (vol.authors && vol.authors.length) ? vol.authors.join(', ') : '',
        publisher: vol.publisher || '',
        published_year: vol.publishedDate ? vol.publishedDate.substring(0, 4) : '',
        description: vol.description ? vol.description.substring(0, 400) + '...' : '',
        category: (vol.categories && vol.categories.length) ? vol.categories[0] : 'General',
        isbn: bookIsbn || isbn,
        cover_url: coverUrl,
        page_count: vol.pageCount || 0,
        source: 'Google Books'
      };
    }
  } catch (err) {
    console.warn('[METADATA] Google Books error:', err.message);
  }

  // 2. OpenLibrary Fallback if Google Books returned nothing
  if (!result && isLikelyIsbn) {
    try {
      const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`;
      const olData = await fetchJson(olUrl);
      const key = `ISBN:${isbn}`;
      if (olData && olData[key]) {
        const b = olData[key];
        const cover = b.cover ? (b.cover.large || b.cover.medium || b.cover.small || '') : '';
        const authors = (b.authors || []).map(a => a.name).join(', ');
        result = {
          title: b.title || '',
          author: authors || '',
          publisher: (b.publishers && b.publishers.length) ? b.publishers[0].name : '',
          published_year: b.publish_date ? b.publish_date.slice(-4) : '',
          description: typeof b.notes === 'string' ? b.notes : '',
          category: (b.subjects && b.subjects.length) ? b.subjects[0].name : 'General',
          isbn: isbn,
          cover_url: cover,
          page_count: b.number_of_pages || 0,
          source: 'OpenLibrary'
        };
      }
    } catch (err) {
      console.warn('[METADATA] OpenLibrary error:', err.message);
    }
  }

  return result;
}

/**
 * Check for duplicate books and matching acquisitions
 */
async function checkDuplicateAndAcquisitions(isbn, title, author, schoolCode) {
  const cleanI = cleanIsbn(isbn);
  const cleanT = String(title || '').trim().toLowerCase();
  const cleanA = String(author || '').trim().toLowerCase();
  const sCode = schoolCode || 'DPS123';

  let duplicateBook = null;
  let matchingAcquisition = null;

  try {
    // 1. Check existing books
    const bookRes = await query(
      `SELECT id, title, author, isbn, barcode_id, total_copies, available_copies, shelf_location
       FROM books 
       WHERE (
         ($1 != '' AND (isbn = $1 OR barcode_id = $1))
         OR ($2 != '' AND LOWER(title) = $2 AND ($3 = '' OR LOWER(author) = $3))
       ) AND (school_code = $4 OR school_code = 'DPS123' OR school_code = 'GLOBAL')
       LIMIT 1`,
      [cleanI, cleanT, cleanA, sCode]
    );

    if (bookRes && bookRes.rows && bookRes.rows.length > 0) {
      duplicateBook = bookRes.rows[0];
    }
  } catch (err) {
    console.warn('[METADATA] Duplicate book check note:', err.message);
  }

  try {
    // 2. Check matching acquisition items
    const acqRes = await query(
      `SELECT ai.id as item_id, ai.acquisition_id, ai.title, ai.author, ai.isbn, 
              ai.quantity as total_quantity, COALESCE(ai.registered_copies, 0) as registered_copies,
              (ai.quantity - COALESCE(ai.registered_copies, 0)) as remaining_copies,
              a.bill_number, a.bill_date
       FROM acquisition_items ai
       JOIN acquisitions a ON ai.acquisition_id = a.id
       WHERE (
         ($1 != '' AND ai.isbn = $1)
         OR ($2 != '' AND LOWER(ai.title) = $2)
       ) AND (a.school_code = $3 OR a.school_code = 'DPS123')
       ORDER BY ai.id DESC
       LIMIT 1`,
      [cleanI, cleanT, sCode]
    );

    if (acqRes && acqRes.rows && acqRes.rows.length > 0) {
      matchingAcquisition = acqRes.rows[0];
    }
  } catch (err) {
    console.warn('[METADATA] Acquisition item check note:', err.message);
  }

  return { duplicateBook, matchingAcquisition };
}

module.exports = {
  cleanIsbn,
  fetchBookMetadata,
  checkDuplicateAndAcquisitions
};
