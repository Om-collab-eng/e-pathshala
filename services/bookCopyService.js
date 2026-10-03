const db = require('../db');
const bwipjs = require('bwip-js');
const PDFDocument = require('pdfkit');

class BookCopyService {
  /**
   * Ensure barcode_sequences table exists
   */
  async ensureSequenceTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS barcode_sequences (
          school_code TEXT PRIMARY KEY,
          last_serial INTEGER DEFAULT 0
        )
      `);
      // Seed initial sequence if table is empty
      const seqCheck = await db.query('SELECT COUNT(*) as count FROM barcode_sequences');
      if (parseInt(seqCheck.rows[0]?.count, 10) === 0) {
        const maxCopy = await db.query('SELECT COALESCE(MAX(serial_number), 0) as max_s FROM book_copies');
        const startSerial = parseInt(maxCopy.rows[0]?.max_s, 10) || 0;
        await db.query('INSERT OR IGNORE INTO barcode_sequences (school_code, last_serial) VALUES ($1, $2)', ['GLOBAL', startSerial]);
      }
    } catch (e) {
      console.warn('Sequence table init note:', e.message);
    }
  }

  /**
   * Retrieve Barcode & Book Code configuration for a school
   */
  async getBarcodeSettings(schoolCode = 'VBPGZ') {
    const sCode = (schoolCode || 'VBPGZ').toUpperCase();
    const defaults = {
      school_code: sCode,
      include_date: true,
      date_format: 'YYYYMMDD', // YYYYMMDD | YYYYMM | YYYY | NONE
      serial_length: 6,
      prefix: '',
      suffix: '',
      pattern: '{PREFIX}{SCHOOL}{DATE}{SERIAL}{SUFFIX}'
    };

    try {
      const res = await db.query(
        "SELECT setting_key, setting_value FROM library_settings WHERE school_code = $1 AND setting_key LIKE 'barcode_%'",
        [sCode]
      );
      if (!res.rows || res.rows.length === 0) return defaults;

      const map = {};
      res.rows.forEach(r => { map[r.setting_key] = r.setting_value; });

      return {
        school_code: map['barcode_school_code'] || defaults.school_code,
        include_date: map['barcode_include_date'] !== '0' && map['barcode_include_date'] !== 'false',
        date_format: map['barcode_date_format'] || defaults.date_format,
        serial_length: parseInt(map['barcode_serial_length'], 10) || defaults.serial_length,
        prefix: map['barcode_prefix'] || '',
        suffix: map['barcode_suffix'] || '',
        pattern: map['barcode_pattern'] || defaults.pattern
      };
    } catch (err) {
      console.warn('Error reading barcode settings:', err.message);
      return defaults;
    }
  }

  /**
   * Save Barcode configuration for a school
   */
  async saveBarcodeSettings(schoolCode, config) {
    const sCode = (schoolCode || 'VBPGZ').toUpperCase();
    const settings = [
      { key: 'barcode_school_code', val: (config.school_code || sCode).toUpperCase() },
      { key: 'barcode_include_date', val: config.include_date ? '1' : '0' },
      { key: 'barcode_date_format', val: config.date_format || 'YYYYMMDD' },
      { key: 'barcode_serial_length', val: String(config.serial_length || 6) },
      { key: 'barcode_prefix', val: config.prefix || '' },
      { key: 'barcode_suffix', val: config.suffix || '' },
      { key: 'barcode_pattern', val: config.pattern || '{PREFIX}{SCHOOL}{DATE}{SERIAL}{SUFFIX}' }
    ];

    for (const s of settings) {
      const ex = await db.query('SELECT id FROM library_settings WHERE school_code = $1 AND setting_key = $2', [sCode, s.key]);
      if (ex.rows && ex.rows.length > 0) {
        await db.query('UPDATE library_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [s.val, ex.rows[0].id]);
      } else {
        const maxIdRes = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM library_settings');
        const nextId = parseInt(maxIdRes.rows[0]?.next_id, 10) || 1;
        await db.query('INSERT INTO library_settings (id, school_code, setting_key, setting_value) VALUES ($1, $2, $3, $4)', [nextId, sCode, s.key, s.val]);
      }
    }

    return await this.getBarcodeSettings(sCode);
  }

  /**
   * Atomic & Transaction-Safe Serial Allocator
   */
  async allocateNextSerials(schoolCode, count = 1) {
    const sKey = (schoolCode || 'GLOBAL').toUpperCase();
    if (!this._allocationQueues) this._allocationQueues = new Map();

    const prevPromise = this._allocationQueues.get(sKey) || Promise.resolve();
    let releaseLock;
    const currentPromise = new Promise(resolve => { releaseLock = resolve; });
    this._allocationQueues.set(sKey, currentPromise);

    await prevPromise;
    try {
      await this.ensureSequenceTable();

      // Ensure row exists
      await db.query('INSERT OR IGNORE INTO barcode_sequences (school_code, last_serial) VALUES ($1, 0)', [sKey]);

      // Atomic update
      await db.query('UPDATE barcode_sequences SET last_serial = last_serial + $1 WHERE school_code = $2', [count, sKey]);

      const res = await db.query('SELECT last_serial FROM barcode_sequences WHERE school_code = $1', [sKey]);
      const endSerial = parseInt(res.rows[0]?.last_serial, 10);
      const startSerial = endSerial - count + 1;

      const serials = [];
      for (let s = startSerial; s <= endSerial; s++) {
        serials.push(s);
      }
      return serials;
    } finally {
      releaseLock();
    }
  }

  /**
   * Format a date string according to format specification
   */
  formatDateComponent(format = 'YYYYMMDD') {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    switch (format.toUpperCase()) {
      case 'YYYYMMDD': return `${yyyy}${mm}${dd}`;
      case 'YYYYMM': return `${yyyy}${mm}`;
      case 'YYYY': return `${yyyy}`;
      case 'YYMMDD': return `${yyyy.slice(2)}${mm}${dd}`;
      case 'NONE': return '';
      default: return `${yyyy}${mm}${dd}`;
    }
  }

  /**
   * Generate unique barcode string
   */
  buildBarcodeString(settings, serialNumber) {
    const schoolPart = (settings.school_code || 'VBPGZ').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const datePart = settings.include_date ? this.formatDateComponent(settings.date_format) : '';
    const serialPart = String(serialNumber).padStart(settings.serial_length || 6, '0');
    const prefix = (settings.prefix || '').toUpperCase().replace(/[^A-Z0-9_\-\.]/g, '');
    const suffix = (settings.suffix || '').toUpperCase().replace(/[^A-Z0-9_\-\.]/g, '');

    let code = settings.pattern || '{PREFIX}{SCHOOL}{DATE}{SERIAL}{SUFFIX}';
    code = code
      .replace('{PREFIX}', prefix)
      .replace('{SCHOOL}', schoolPart)
      .replace('{DATE}', datePart)
      .replace('{SERIAL}', serialPart)
      .replace('{SUFFIX}', suffix);

    return code.replace(/[^A-Za-z0-9_\-\.]/g, '');
  }

  /**
   * Phase 3: Book Grouping Logic (ISBN + Edition, or Normalized Title + Author + Edition)
   */
  async findOrCreateBookGroup(bookData, schoolCode = 'DEMO01') {
    const sCode = schoolCode || 'DEMO01';
    const cleanIsbn = (bookData.isbn || '').replace(/[^0-9X]/gi, '').trim();
    const cleanTitle = (bookData.title || '').trim();
    const cleanAuthor = (bookData.author || '').trim();
    const cleanEdition = (bookData.edition || '').trim();

    let matchedBook = null;

    // 1. Preferred matching: ISBN + Edition
    if (cleanIsbn) {
      let query = `
        SELECT * FROM books 
        WHERE (isbn = $1 OR barcode_id = $1)
          AND (LOWER(school_code) = LOWER($2) OR school_code = 'GLOBAL' OR school_code IS NULL OR school_code = '')
      `;
      let params = [cleanIsbn, sCode];

      if (cleanEdition) {
        query += ` AND LOWER(TRIM(COALESCE(edition, ''))) = LOWER($3)`;
        params.push(cleanEdition.trim());
      }
      query += ` LIMIT 1`;

      const isbnRes = await db.query(query, params);
      if (isbnRes.rows && isbnRes.rows.length > 0) {
        matchedBook = isbnRes.rows[0];
      }
    }

    // 2. Fallback matching: Normalized Title + Author + Edition
    if (!matchedBook && cleanTitle && cleanAuthor) {
      let query = `
        SELECT * FROM books 
        WHERE LOWER(TRIM(title)) = LOWER($1) 
          AND LOWER(TRIM(author)) = LOWER($2)
          AND (LOWER(school_code) = LOWER($3) OR school_code = 'GLOBAL' OR school_code IS NULL OR school_code = '')
      `;
      let params = [cleanTitle, cleanAuthor, sCode];

      if (cleanEdition) {
        query += ` AND LOWER(TRIM(COALESCE(edition, ''))) = LOWER($4)`;
        params.push(cleanEdition.trim());
      }
      query += ` LIMIT 1`;

      const normRes = await db.query(query, params);
      if (normRes.rows && normRes.rows.length > 0) {
        matchedBook = normRes.rows[0];
      }
    }

    // If existing group found, enrich any missing fields and return it
    if (matchedBook) {
      const updateFields = [];
      const updateParams = [];
      let pIdx = 1;

      const aiSummary = bookData.summary || bookData.synopsis || bookData.description || '';
      if (!matchedBook.summary && aiSummary) {
        updateFields.push(`summary = $${pIdx++}`);
        updateParams.push(aiSummary);
      }
      if (!matchedBook.synopsis && aiSummary) {
        updateFields.push(`synopsis = $${pIdx++}`);
        updateParams.push(aiSummary);
      }
      if (!matchedBook.publisher && bookData.publisher) {
        updateFields.push(`publisher = $${pIdx++}`);
        updateParams.push(bookData.publisher);
      }
      if (!matchedBook.publication_year && bookData.publication_year) {
        updateFields.push(`publication_year = $${pIdx++}`);
        updateParams.push(bookData.publication_year);
      }
      if (!matchedBook.cover_url && bookData.cover_url) {
        updateFields.push(`cover_url = $${pIdx++}`);
        updateParams.push(bookData.cover_url);
      }
      if (!matchedBook.back_cover_url && bookData.back_cover_url) {
        updateFields.push(`back_cover_url = $${pIdx++}`);
        updateParams.push(bookData.back_cover_url);
      }

      if (updateFields.length > 0) {
        updateParams.push(matchedBook.id);
        await db.query(`UPDATE books SET ${updateFields.join(', ')} WHERE id = $${pIdx}`, updateParams).catch(() => {});
        const refreshed = await db.query('SELECT * FROM books WHERE id = $1', [matchedBook.id]);
        if (refreshed.rows && refreshed.rows.length > 0) matchedBook = refreshed.rows[0];
      }

      return { book: matchedBook, isNew: false };
    }

    // Otherwise, create a new Book Group in `books`
    const finalBookId = (bookData.book_id && bookData.book_id.trim().startsWith('VBPG'))
      ? bookData.book_id.trim()
      : `VBPG${new Date().getFullYear()}${String(Date.now()).slice(-4)}`;

    const shelfLoc = bookData.shelf_location || `${bookData.rack || 'A'}-${bookData.shelf || '1'}`;
    const cleanSub = bookData.subject || bookData.genre || 'General';
    const bookSummary = bookData.summary || bookData.synopsis || bookData.description || '';

    const insRes = await db.query(`
      INSERT INTO books (
        book_id, title, author, publisher, edition, isbn, language, subject, class,
        price, publication_year, genre, barcode_id, total_copies, available_copies,
        school_code, description, shelf_location, book_condition, cover_url, back_cover_url,
        summary, synopsis
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, 0, 0,
        $14, $15, $16, $17, $18, $19,
        $20, $21
      )
    `, [
      finalBookId, cleanTitle, cleanAuthor || 'Unknown', bookData.publisher || '', cleanEdition || '1st Edition',
      cleanIsbn || '', bookData.language || 'English', cleanSub, bookData.class || '',
      bookData.price || '', bookData.publication_year || '', cleanSub, finalBookId,
      sCode, bookData.description || '', shelfLoc, bookData.book_condition || 'GOOD',
      bookData.cover_url || '', bookData.back_cover_url || '',
      bookSummary, bookSummary
    ]);

    const createdId = insRes.lastId;
    const fetchCreated = await db.query('SELECT * FROM books WHERE id = $1', [createdId]);
    return { book: fetchCreated.rows[0] || { id: createdId, book_id: finalBookId, title: cleanTitle }, isNew: true };
  }

  /**
   * Add Physical Copies to a Book Group
   */
  async addPhysicalCopies(bookId, count = 1, options = {}) {
    const copiesCount = Math.max(1, parseInt(count, 10) || 1);
    const bookRes = await db.query('SELECT * FROM books WHERE id = $1', [bookId]);
    if (!bookRes.rows || bookRes.rows.length === 0) {
      throw new Error(`Book Group with ID ${bookId} not found.`);
    }
    const book = bookRes.rows[0];
    const sCode = options.school_code || book.school_code || 'VBPGZ';
    const settings = await this.getBarcodeSettings(sCode);

    // Allocate sequential serials
    const serials = await this.allocateNextSerials(sCode, copiesCount);

    // Get current max copy_number for this book
    const maxCopyRes = await db.query('SELECT COALESCE(MAX(copy_number), 0) as max_c FROM book_copies WHERE book_id = $1', [bookId]);
    let currentCopyNum = parseInt(maxCopyRes.rows[0]?.max_c, 10) || 0;

    const createdCopies = [];
    const rack = options.rack || (book.shelf_location ? (book.shelf_location.match(/Rack\s*([A-Za-z0-9]+)/i)?.[1] || 'A') : 'A');
    const shelf = options.shelf || (book.shelf_location ? (book.shelf_location.match(/Shelf\s*([0-9]+)/i)?.[1] || '1') : '1');
    const condition = options.condition || book.book_condition || 'GOOD';
    const addedBy = options.added_by || 'Librarian';

    for (let i = 0; i < copiesCount; i++) {
      currentCopyNum++;
      const serial = serials[i];
      const barcode = this.buildBarcodeString(settings, serial);
      const copyId = `CP-${bookId}-${currentCopyNum}`;

      await db.query(`
        INSERT INTO book_copies (
          id, book_id, barcode, book_code, edition_id, serial_number, copy_number,
          shelf, rack, status, availability_status, condition_status,
          added_date, added_by, school_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'AVAILABLE', 'AVAILABLE', $10, $11, $12, $13)
      `, [
        copyId,
        bookId,
        barcode,
        barcode,
        book.edition || options.edition || '1st Edition',
        serial,
        currentCopyNum,
        shelf,
        rack,
        condition,
        new Date().toISOString(),
        addedBy,
        sCode
      ]);

      createdCopies.push({
        id: copyId,
        book_id: bookId,
        barcode,
        book_code: barcode,
        serial_number: serial,
        copy_number: currentCopyNum,
        status: 'AVAILABLE',
        condition_status: condition,
        shelf,
        rack
      });
    }

    // Update book totals
    await db.query(`
      UPDATE books 
      SET total_copies = COALESCE(total_copies, 0) + $1,
          available_copies = COALESCE(available_copies, 0) + $1
      WHERE id = $2
    `, [copiesCount, bookId]);

    return {
      bookId,
      addedCopiesCount: copiesCount,
      copies: createdCopies
    };
  }

  /**
   * Phase 8: Barcode Scanner Validation & Lookup
   * Scans a barcode or copy ID and returns full book group + copy details
   */
  async lookupPhysicalCopy(barcodeOrCode, schoolCode = null) {
    const rawCode = (barcodeOrCode || '').trim();
    if (!rawCode) return null;

    // Search book_copies by exact barcode, book_code, or id
    let copyQuery = `
      SELECT bc.*, 
             b.title as book_title, b.author as book_author, b.isbn as book_isbn,
             b.publisher as book_publisher, b.edition as book_edition, b.subject as book_subject,
             b.genre as book_genre, b.cover_url as book_cover, b.shelf_location as book_shelf_location,
             b.price as book_price, b.total_copies as book_total_copies, b.available_copies as book_available_copies
      FROM book_copies bc
      JOIN books b ON bc.book_id = b.id
      WHERE (bc.barcode = $1 OR bc.book_code = $1 OR bc.id = $1)
    `;
    let params = [rawCode];

    if (schoolCode && schoolCode !== 'GLOBAL') {
      copyQuery += ` AND (LOWER(bc.school_code) = LOWER($2) OR bc.school_code = 'GLOBAL' OR bc.school_code IS NULL OR bc.school_code = '')`;
      params.push(schoolCode);
    }
    copyQuery += ` LIMIT 1`;

    const copyRes = await db.query(copyQuery, params);
    if (copyRes.rows && copyRes.rows.length > 0) {
      const copy = copyRes.rows[0];
      return {
        type: 'PHYSICAL_COPY',
        copy: {
          id: copy.id,
          book_id: copy.book_id,
          barcode: copy.barcode,
          book_code: copy.book_code,
          serial_number: copy.serial_number,
          copy_number: copy.copy_number,
          status: copy.status || copy.availability_status || 'AVAILABLE',
          condition_status: copy.condition_status || 'GOOD',
          shelf: copy.shelf || '1',
          rack: copy.rack || 'A',
          location: `Rack ${copy.rack || 'A'}, Shelf ${copy.shelf || '1'}`,
          barcode_printed: copy.barcode_printed || 0,
          barcode_printed_at: copy.barcode_printed_at || null,
          barcode_printed_by: copy.barcode_printed_by || null,
          barcode_print_batch: copy.barcode_print_batch || null,
          added_date: copy.added_date,
          added_by: copy.added_by
        },
        book: {
          id: copy.book_id,
          title: copy.book_title,
          author: copy.book_author,
          isbn: copy.book_isbn,
          publisher: copy.book_publisher,
          edition: copy.book_edition,
          subject: copy.book_subject || copy.book_genre || 'General',
          cover_url: copy.book_cover,
          price: copy.book_price,
          total_copies: copy.book_total_copies,
          available_copies: copy.book_available_copies
        }
      };
    }

    // Fallback: If not found in book_copies, check if it's a Book Group ID or ISBN
    const bookRes = await db.query(`
      SELECT * FROM books 
      WHERE (book_id = $1 OR barcode_id = $1 OR isbn = $1)
      LIMIT 1
    `, [rawCode]);

    if (bookRes.rows && bookRes.rows.length > 0) {
      const b = bookRes.rows[0];
      // Fetch its copies
      const allCopies = await db.query('SELECT * FROM book_copies WHERE book_id = $1 ORDER BY copy_number ASC', [b.id]);
      return {
        type: 'BOOK_GROUP',
        book: b,
        copies: allCopies.rows || []
      };
    }

    return null;
  }

  /**
   * Phase 7: Print-Ready PDF Barcode Generator
   * Generates a multi-label A4 sheet with Code 128 barcodes
   */
  async generateBarcodesPDF(options = {}) {
    const { copyIds = [], bookId = null, all = false, schoolCode = 'DEMO01' } = options;

    let copiesQuery = `
      SELECT bc.*, 
             b.title as book_title, b.author as book_author, b.isbn as book_isbn,
             b.edition as book_edition
      FROM book_copies bc
      JOIN books b ON bc.book_id = b.id
    `;
    const params = [];

    if (Array.isArray(copyIds) && copyIds.length > 0) {
      const placeholders = copyIds.map((_, idx) => `$${idx + 1}`).join(',');
      copiesQuery += ` WHERE bc.id IN (${placeholders}) OR bc.barcode IN (${placeholders})`;
      params.push(...copyIds);
    } else if (bookId) {
      copiesQuery += ` WHERE bc.book_id = $1`;
      params.push(bookId);
    } else if (schoolCode && schoolCode !== 'GLOBAL') {
      copiesQuery += ` WHERE (LOWER(bc.school_code) = LOWER($1) OR bc.school_code = 'GLOBAL' OR bc.school_code IS NULL OR bc.school_code = '')`;
      params.push(schoolCode);
    }
    copiesQuery += ` ORDER BY bc.book_id ASC, bc.copy_number ASC`;

    const copiesRes = await db.query(copiesQuery, params);
    const copies = copiesRes.rows || [];

    if (copies.length === 0) {
      throw new Error('No physical book copies found for the selected criteria.');
    }

    // ── Barcode Print Audit: Persist printed status only on actual PDF generation ──
    const printedIds = copies.map(c => c.id).filter(Boolean);
    if (printedIds.length > 0) {
      const placeholders = printedIds.map((_, idx) => `$${idx + 1}`).join(',');
      const printedBy = options.printedBy || 'Librarian';
      const batchId = options.batchId || (`BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`);

      await db.query(`
        UPDATE book_copies 
        SET barcode_printed = 1,
            barcode_printed_at = datetime('now'),
            barcode_printed_by = $${printedIds.length + 1},
            barcode_print_batch = $${printedIds.length + 2}
        WHERE id IN (${placeholders})
      `, [...printedIds, printedBy, batchId]).catch(e => console.warn('Barcode print audit update note:', e.message));
    }

    // Generate Code 128 barcode image buffers
    const enrichedCopies = [];
    for (const c of copies) {
      try {
        const pngBuf = await bwipjs.toBuffer({
          bcid: 'code128',
          text: c.barcode,
          scale: 2,
          height: 10,
          includetext: false
        });
        enrichedCopies.push({ ...c, barcodePng: pngBuf });
      } catch (err) {
        console.warn(`Failed to generate barcode for ${c.barcode}:`, err.message);
        enrichedCopies.push({ ...c, barcodePng: null });
      }
    }

    // Build PDF Document (Standard A4: 595.28 x 841.89 points)
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 28, bottom: 28, left: 24, right: 24 }
    });

    const colWidth = 175; // 3 columns on A4
    const rowHeight = 104; // 7 rows on A4 (21 labels per page)
    const cols = 3;
    const rows = 7;
    const labelsPerPage = cols * rows;
    const startX = 28;
    const startY = 32;

    enrichedCopies.forEach((item, index) => {
      const pageIndex = index % labelsPerPage;
      if (index > 0 && pageIndex === 0) {
        doc.addPage();
      }

      const col = pageIndex % cols;
      const row = Math.floor(pageIndex / cols);
      const x = startX + col * (colWidth + 8);
      const y = startY + row * (rowHeight + 8);

      // Label border / thermal outline (dashed light gray for easy cutting)
      doc.save();
      doc.roundedRect(x, y, colWidth, rowHeight, 4)
         .lineWidth(0.6)
         .dash(3, { space: 3 })
         .stroke('#CBD5E1');

      // School & Library Header
      doc.font('Helvetica-Bold')
         .fontSize(6)
         .fillColor('#1E293B')
         .text('LIBRIKA DIGITAL LIBRARY', x + 4, y + 5, { width: colWidth - 8, align: 'center' });

      // Book Title
      doc.font('Helvetica-Bold')
         .fontSize(7.5)
         .fillColor('#0F172A')
         .text(item.book_title || 'Untitled Book', x + 4, y + 14, {
           width: colWidth - 8,
           align: 'center',
           height: 18,
           ellipsis: true
         });

      // Author & Edition
      const authorText = `by ${item.book_author || 'Unknown'}` + (item.book_edition ? ` (${item.book_edition})` : '');
      doc.font('Helvetica')
         .fontSize(6)
         .fillColor('#64748B')
         .text(authorText, x + 4, y + 33, {
           width: colWidth - 8,
           align: 'center',
           height: 9,
           ellipsis: true
         });

      // Barcode Image
      if (item.barcodePng) {
        doc.image(item.barcodePng, x + (colWidth - 140) / 2, y + 44, {
          width: 140,
          height: 28
        });
      }

      // Barcode string / Book Code (Large & bold monospace)
      doc.font('Courier-Bold')
         .fontSize(8)
         .fillColor('#0F172A')
         .text(item.barcode, x + 4, y + 75, { width: colWidth - 8, align: 'center' });

      // Copy Number & Location strip
      const copyBadge = `Copy #${String(item.copy_number || 1).padStart(3, '0')}  |  Rack ${item.rack || 'A'}-${item.shelf || '1'}`;
      doc.font('Helvetica')
         .fontSize(5.5)
         .fillColor('#475569')
         .text(copyBadge, x + 4, y + 88, { width: colWidth - 8, align: 'center' });

      doc.restore();
    });

    return doc;
  }
}

module.exports = new BookCopyService();
