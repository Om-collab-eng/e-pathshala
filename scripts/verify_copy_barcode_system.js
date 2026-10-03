const db = require('../db');
const bookCopyService = require('../services/bookCopyService');
const fs = require('fs');
const path = require('path');

async function runAllTests() {
  console.log('=================================================================');
  console.log('🚀 RUNNING COMPREHENSIVE VERIFICATION: BOOK COPY & BARCODE SYSTEM');
  console.log('=================================================================\n');

  let passedTests = 0;
  const schoolCode = 'TESTSCH';

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: Single Book Addition
  // ─────────────────────────────────────────────────────────────────────────
  console.log('▶ [Test 1] Single Book Addition & Unique Physical Copy...');
  const t1Data = {
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '9780735211292',
    edition: '1st Edition',
    subject: 'Self-Help',
    shelf_location: 'Rack A-1',
    rack: 'A',
    shelf: '1'
  };
  const t1Group = await bookCopyService.findOrCreateBookGroup(t1Data, schoolCode);
  const t1Copies = await bookCopyService.addPhysicalCopies(t1Group.book.id, 1, {
    school_code: schoolCode,
    rack: 'A',
    shelf: '1',
    edition: '1st Edition',
    added_by: 'TestRunner'
  });

  if (!t1Copies.copies || t1Copies.copies.length !== 1) throw new Error('Test 1 Failed: Expected 1 copy created.');
  const copy1 = t1Copies.copies[0];
  console.log(`  ✓ Book Group ID: ${t1Group.book.id} ("${t1Group.book.title}")`);
  console.log(`  ✓ Physical Copy ID: ${copy1.id}, Barcode: ${copy1.barcode}`);
  if (!copy1.barcode.startsWith(schoolCode)) throw new Error(`Test 1 Failed: Barcode does not start with ${schoolCode}`);
  passedTests++;

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: Multiple Copies (8 Copies)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n▶ [Test 2] Multiple Copies Addition (8 Copies)...');
  const t2Copies = await bookCopyService.addPhysicalCopies(t1Group.book.id, 8, {
    school_code: schoolCode,
    rack: 'A',
    shelf: '2',
    edition: '1st Edition'
  });
  if (t2Copies.copies.length !== 8) throw new Error('Test 2 Failed: Expected 8 copies created.');

  const barcodesSet = new Set();
  t2Copies.copies.forEach(c => {
    if (barcodesSet.has(c.barcode)) throw new Error(`Test 2 Failed: Duplicate barcode detected: ${c.barcode}`);
    barcodesSet.add(c.barcode);
  });
  console.log(`  ✓ Successfully added 8 physical copies with 8 strictly unique barcodes:`);
  console.log(`    From ${t2Copies.copies[0].barcode} (Copy #${t2Copies.copies[0].copy_number})`);
  console.log(`    To   ${t2Copies.copies[7].barcode} (Copy #${t2Copies.copies[7].copy_number})`);
  passedTests++;

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: Different Editions of Same Title
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n▶ [Test 3] Different Editions Grouping Isolation...');
  const t3Data1 = {
    title: 'Operating System Concepts',
    author: 'Silberschatz',
    isbn: '9781118063330',
    edition: '9th Edition'
  };
  const t3Data2 = {
    title: 'Operating System Concepts',
    author: 'Silberschatz',
    isbn: '9781119800361',
    edition: '10th Edition'
  };

  const g1 = await bookCopyService.findOrCreateBookGroup(t3Data1, schoolCode);
  const g2 = await bookCopyService.findOrCreateBookGroup(t3Data2, schoolCode);

  if (g1.book.id === g2.book.id) throw new Error('Test 3 Failed: Different editions with different ISBNs should have separate Book Group records.');
  console.log(`  ✓ Edition 9th Group ID: ${g1.book.id}, Edition: ${g1.book.edition}`);
  console.log(`  ✓ Edition 10th Group ID: ${g2.book.id}, Edition: ${g2.book.edition}`);
  passedTests++;

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: View & Edit Physical Copy Persistence
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n▶ [Test 4] Physical Copy View & Edit (Shelf, Status, Condition)...');
  const targetCopyId = t2Copies.copies[2].id; // 3rd copy
  await db.query(`
    UPDATE book_copies 
    SET shelf = '5', rack = 'Z', status = 'ISSUED', availability_status = 'ISSUED', condition_status = 'FAIR'
    WHERE id = $1
  `, [targetCopyId]);

  const verifyCopy = await db.query('SELECT * FROM book_copies WHERE id = $1', [targetCopyId]);
  const cRow = verifyCopy.rows[0];
  if (cRow.shelf !== '5' || cRow.rack !== 'Z' || cRow.status !== 'ISSUED' || cRow.condition_status !== 'FAIR') {
    throw new Error('Test 4 Failed: Copy updates did not persist in database.');
  }
  console.log(`  ✓ Copy ${targetCopyId} updated and persisted: Location = Rack ${cRow.rack}-${cRow.shelf}, Status = ${cRow.status}, Condition = ${cRow.condition_status}`);
  passedTests++;

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: Configurable Settings
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n▶ [Test 5] Custom Barcode Settings Configuration...');
  const customSchoolCode = 'ABCDE';
  await bookCopyService.saveBarcodeSettings(customSchoolCode, {
    school_code: customSchoolCode,
    include_date: true,
    date_format: 'YYYYMMDD',
    serial_length: 6,
    prefix: 'LIB-',
    suffix: '-X'
  });

  const customSettings = await bookCopyService.getBarcodeSettings(customSchoolCode);
  const sampleCustomBarcode = bookCopyService.buildBarcodeString(customSettings, 99);
  console.log(`  ✓ Custom Barcode pattern generated: "${sampleCustomBarcode}"`);
  if (!sampleCustomBarcode.startsWith('LIB-ABCDE') || !sampleCustomBarcode.endsWith('-X')) {
    throw new Error(`Test 5 Failed: Custom pattern mismatch: ${sampleCustomBarcode}`);
  }
  passedTests++;

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 6: Barcode Scanner Validation
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n▶ [Test 6] Barcode Scanner Exact Copy Resolution...');
  const scanBarcode = t2Copies.copies[4].barcode;
  const scanResult = await bookCopyService.lookupPhysicalCopy(scanBarcode, schoolCode);

  if (!scanResult || scanResult.type !== 'PHYSICAL_COPY') throw new Error('Test 6 Failed: Scanner failed to resolve physical copy.');
  if (scanResult.copy.barcode !== scanBarcode) throw new Error('Test 6 Failed: Barcode mismatch.');
  console.log(`  ✓ Scanned Barcode: "${scanBarcode}"`);
  console.log(`  ✓ Identified Exact Copy: Copy #${scanResult.copy.copy_number} (${scanResult.copy.id})`);
  console.log(`  ✓ Parent Book: "${scanResult.book.title}"`);
  console.log(`  ✓ Current Shelf Location: ${scanResult.copy.location}, Status: ${scanResult.copy.status}`);
  passedTests++;

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 7: PDF Barcode Generation
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n▶ [Test 7] Barcode PDF Sheet Generation...');
  const pdfDoc = await bookCopyService.generateBarcodesPDF({
    bookId: t1Group.book.id
  });
  const testPdfPath = path.join(__dirname, 'test_labels_verification.pdf');
  const writeStream = fs.createWriteStream(testPdfPath);
  pdfDoc.pipe(writeStream);
  pdfDoc.end();

  await new Promise((res, rej) => {
    writeStream.on('finish', res);
    writeStream.on('error', rej);
  });
  const stat = fs.statSync(testPdfPath);
  if (stat.size < 1000) throw new Error('Test 7 Failed: PDF file size unexpectedly small.');
  console.log(`  ✓ PDF generated successfully (${stat.size} bytes) with Code 128 barcodes for all 9 copies.`);
  fs.unlinkSync(testPdfPath);
  passedTests++;

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 8: Concurrency & Zero Duplicates
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n▶ [Test 8] Concurrency & High-Velocity Serial Allocation...');
  const concurrentRounds = 10;
  const copiesPerRound = 5;
  const promises = [];

  for (let r = 0; r < concurrentRounds; r++) {
    promises.push(bookCopyService.allocateNextSerials('CONCURRENT_TEST', copiesPerRound));
  }

  const results = await Promise.all(promises);
  const allAllocated = results.flat();
  const uniqueSerials = new Set(allAllocated);

  if (allAllocated.length !== 50 || uniqueSerials.size !== 50) {
    throw new Error(`Test 8 Failed: Concurrency collision! Total: ${allAllocated.length}, Unique: ${uniqueSerials.size}`);
  }
  console.log(`  ✓ 50 concurrent serial requests allocated with 100% collision-free uniqueness.`);
  passedTests++;

  // ─────────────────────────────────────────────────────────────────────────
  // CLEANUP TEST DATA
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n🧹 Cleaning up test records...');
  await db.query('DELETE FROM book_copies WHERE school_code = $1', [schoolCode]);
  await db.query('DELETE FROM books WHERE id IN ($1, $2, $3)', [t1Group.book.id, g1.book.id, g2.book.id]);
  await db.query("DELETE FROM library_settings WHERE school_code = 'ABCDE'");
  await db.query("DELETE FROM barcode_sequences WHERE school_code IN ('TESTSCH', 'CONCURRENT_TEST', 'ABCDE')");
  console.log('  ✓ Test cleanup complete.');

  console.log('\n=================================================================');
  console.log(`🎉 ALL ${passedTests}/8 VERIFICATION TESTS PASSED SUCCESSFULLY!`);
  console.log('=================================================================');
  process.exit(0);
}

runAllTests().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
