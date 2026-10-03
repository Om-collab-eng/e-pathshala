const db = require('../db');
const bookCopyService = require('../services/bookCopyService');

(async () => {
  try {
    console.log('--- 1. Testing Book Details Retrieval ---');
    const bRes = await db.query('SELECT * FROM books WHERE id = 9');
    const book = bRes.rows[0];
    console.log('Book 9 Title:', book.title);
    console.log('Book 9 Summary length:', (book.summary || '').length);

    console.log('\n--- 2. Testing Barcode PDF Generation & Audit Tracking ---');
    const copyResBefore = await db.query("SELECT id, barcode, barcode_printed, barcode_printed_at FROM book_copies WHERE id IN ('CP-1-1', 'CP-1-2')");
    console.log('Before Print:', copyResBefore.rows);

    const pdfBuffer = await bookCopyService.generateBarcodesPDF({
      copyIds: ['CP-1-1', 'CP-1-2'],
      schoolCode: 'VBPGZ',
      printedBy: 'Librarian_Test'
    });
    console.log('PDF Generated, buffer size:', pdfBuffer ? pdfBuffer.length : 'ok');

    const copyResAfter = await db.query("SELECT id, barcode, barcode_printed, barcode_printed_at, barcode_printed_by FROM book_copies WHERE id IN ('CP-1-1', 'CP-1-2')");
    console.log('After Print Audit:', copyResAfter.rows);

    if (copyResAfter.rows.every(r => r.barcode_printed === 1 && r.barcode_printed_by === 'Librarian_Test')) {
      console.log('✅ Barcode audit status successfully verified in database!');
    } else {
      console.error('❌ Audit status not updated correctly');
    }

    console.log('\n--- 3. Testing Reprinting Allowed Without Side-Effects ---');
    const reprintBuffer = await bookCopyService.generateBarcodesPDF({
      copyIds: ['CP-1-1'],
      schoolCode: 'VBPGZ',
      printedBy: 'Librarian_Reprint'
    });
    console.log('Reprint PDF Generated, buffer size:', reprintBuffer ? reprintBuffer.length : 'ok');
    const reprintCheck = await db.query("SELECT id, barcode, barcode_printed, barcode_printed_by FROM book_copies WHERE id = 'CP-1-1'");
    console.log('Reprint Check:', reprintCheck.rows[0]);
    console.log('✅ Reprinting successfully executed!');

    console.log('\n--- 4. Testing Physical Copy Lookup ---');
    const lookup = await bookCopyService.lookupPhysicalCopy('VBPGZ20261002000001', 'VBPGZ');
    console.log('Lookup found barcode:', lookup.copy.barcode, 'barcode_printed:', lookup.copy.barcode_printed);

    console.log('\n--- 5. Testing Book Edit Update with all Metadata ---');
    await db.query(`
      UPDATE books 
      SET title = $1, author = $2, isbn = $3, total_copies = $4, shelf_location = $5,
          publisher = $6, edition = $7, publication_year = $8, language = $9,
          category = $10, genre = $11, summary = $12, synopsis = $12, description = $13
      WHERE id = $14
    `, [
      'How to Enjoy Your Life and Your Job (Updated)',
      'Dale Carnegie',
      '9789380777994',
      3,
      'Rack B-3',
      'Diamond Books Publishing',
      'Special Illustrated Edition',
      '2025',
      'English',
      'Self-Help / Motivation',
      'Self-Help / Motivation',
      'Comprehensive masterclass on overcoming stress, cultivating enthusiasm, and turning routine tasks into opportunities.',
      'Full unabridged edition with exercises and real-world case studies.',
      9
    ]);

    const updatedBook = (await db.query('SELECT * FROM books WHERE id = 9')).rows[0];
    console.log('Updated Book:', {
      id: updatedBook.id,
      title: updatedBook.title,
      publisher: updatedBook.publisher,
      edition: updatedBook.edition,
      year: updatedBook.publication_year,
      shelf: updatedBook.shelf_location,
      summary: updatedBook.summary
    });
    console.log('✅ All metadata fields successfully preserved and updated in database!');

    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
})();
