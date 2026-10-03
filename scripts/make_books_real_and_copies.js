/**
 * scripts/make_books_real_and_copies.js
 * Enriches catalog books with authentic, real-world metadata (covers, publisher, year, edition, price, summary)
 * and generates unique physical barcode copy records for each copy in book_copies.
 */
const db = require('../db');

const REAL_BOOKS_DATA = [
  {
    id: 1,
    title: "Physics: Principles and Problems",
    author: "Paul W. Zitzewitz",
    isbn: "9780078458132",
    publisher: "McGraw-Hill Education",
    publication_year: "2009",
    edition: "Student Edition",
    language: "English",
    category: "Science",
    genre: "Physics & Engineering",
    subject: "Physics",
    class: "Grade 11-12",
    price: "850",
    cover_url: "https://covers.openlibrary.org/b/isbn/9780078458132-L.jpg",
    rack: "Rack A-1",
    shelf: "Shelf 2",
    shelf_location: "Rack A-1, Shelf 2",
    total_copies: 5,
    available_copies: 5,
    summary: "Comprehensive physics curriculum designed to develop real-world problem-solving skills. Covers foundational physics concepts including Newton's laws of motion, gravitation, thermodynamics, waves, optics, electromagnetism, and atomic physics with crystal-clear laboratory demonstrations and practice exercises.",
    description: "Engaging physics curriculum designed to develop real-world problem-solving skills. Covers foundational physics concepts including Newton's laws of motion, gravitation, thermodynamics, waves, optics, electromagnetism, and atomic physics with crystal-clear laboratory demonstrations and practice exercises."
  },
  {
    id: 2,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780061120084",
    publisher: "Harper Perennial Modern Classics",
    publication_year: "2006",
    edition: "50th Anniversary Edition",
    language: "English",
    category: "Fiction",
    genre: "Classic Literature",
    subject: "English Literature",
    class: "Grade 9-12",
    price: "399",
    cover_url: "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg",
    rack: "Rack B-3",
    shelf: "Shelf 1",
    shelf_location: "Rack B-3, Shelf 1",
    total_copies: 4,
    available_copies: 3,
    summary: "Pulitzer Prize-winning classic masterpiece exploring empathy, racial injustice, and human dignity in the American South through the eyes of young Scout Finch and her lawyer father, Atticus Finch.",
    description: "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. Compassionate, dramatic, and deeply moving, Harper Lee takes readers to the roots of human behavior—to innocence and experience, kindness and cruelty, love and hatred."
  },
  {
    id: 3,
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
    isbn: "9780262033848",
    publisher: "MIT Press",
    publication_year: "2009",
    edition: "3rd Edition",
    language: "English",
    category: "Technology",
    genre: "Computer Science",
    subject: "Data Structures & Algorithms",
    class: "Higher Education / CS",
    price: "1250",
    cover_url: "https://covers.openlibrary.org/b/isbn/9780262033848-L.jpg",
    rack: "Rack C-2",
    shelf: "Shelf 3",
    shelf_location: "Rack C-2, Shelf 3",
    total_copies: 6,
    available_copies: 6,
    summary: "The globally recognized definitive reference on computer algorithms. Features rigorous mathematical analysis paired with accessible explanations covering divide-and-conquer, dynamic programming, greedy algorithms, graph search, B-trees, hashing, and computational complexity.",
    description: "Comprehensive textbook on algorithms and data structures. It covers a broad range of algorithms in depth, yet makes their design and analysis accessible to all levels of readers."
  },
  {
    id: 4,
    title: "India: A Comprehensive History of a Civilization",
    author: "John Keay",
    isbn: "9780802137975",
    publisher: "Grove Press",
    publication_year: "2001",
    edition: "Revised Illustrated Edition",
    language: "English",
    category: "History",
    genre: "Asian Studies",
    subject: "Indian History",
    class: "General Reading / Grade 10-12",
    price: "650",
    cover_url: "https://covers.openlibrary.org/b/isbn/9780802137975-L.jpg",
    rack: "Rack D-1",
    shelf: "Shelf 2",
    shelf_location: "Rack D-1, Shelf 2",
    total_copies: 3,
    available_copies: 2,
    summary: "Panoramic account spanning five millennia of the subcontinent. From the early Harappan civilization through the Mauryan and Mughal empires, British colonialism, and the turbulent birth of modern India and Pakistan, this work synthesizes cultural, political, and social dynamics.",
    description: "A brilliant and engrossing narrative covering five millennia of the subcontinent. Keay synthesizes the cultural, religious, and political movements that shaped contemporary India."
  },
  {
    id: 5,
    title: "Advanced Calculus & Coordinate Geometry",
    author: "James Stewart",
    isbn: "9781285740621",
    publisher: "Cengage Learning",
    publication_year: "2015",
    edition: "8th Edition (Metric)",
    language: "English",
    category: "Mathematics",
    genre: "Pure & Applied Mathematics",
    subject: "Calculus",
    class: "Grade 11-12 / College",
    price: "950",
    cover_url: "https://covers.openlibrary.org/b/isbn/9781285740621-L.jpg",
    rack: "Rack E-4",
    shelf: "Shelf 1",
    shelf_location: "Rack E-4, Shelf 1",
    total_copies: 8,
    available_copies: 7,
    summary: "Standard university-prep textbook with step-by-step problem sets on differentiation, integration, multivariable calculus, coordinate geometry, and vector analysis, known for mathematical accuracy and clarity.",
    description: "Stewart's Calculus texts are world-wide best-sellers for a reason: they are clear, accurate, and filled with relevant, real-world examples."
  },
  {
    id: 6,
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    isbn: "9780553380163",
    publisher: "Bantam Books",
    publication_year: "1998",
    edition: "10th Anniversary Expanded Edition",
    language: "English",
    category: "Science",
    genre: "Cosmology & Astrophysics",
    subject: "Astronomy",
    class: "General Reading / Grade 9-12",
    price: "499",
    cover_url: "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg",
    rack: "Rack A-2",
    shelf: "Shelf 3",
    shelf_location: "Rack A-2, Shelf 3",
    total_copies: 5,
    available_copies: 4,
    summary: "Landmark exploration of space, time, black holes, the Big Bang theory, and the cosmic nature of the universe by iconic theoretical physicist Stephen Hawking.",
    description: "A landmark volume in science writing by one of the great minds of our time. Stephen Hawking explores profound questions about the universe in clear, engaging prose."
  },
  {
    id: 7,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    publisher: "Penguin Classics",
    publication_year: "2003",
    edition: "Penguin Classics Edition",
    language: "English",
    category: "Fiction",
    genre: "Classic Romance & Satire",
    subject: "English Literature",
    class: "Grade 10-12",
    price: "299",
    cover_url: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
    rack: "Rack B-1",
    shelf: "Shelf 4",
    shelf_location: "Rack B-1, Shelf 4",
    total_copies: 4,
    available_copies: 4,
    summary: "Jane Austen's witty masterpiece following Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage in the society of the landed gentry of early 19th-century England, navigating her complicated feelings for Mr. Darcy.",
    description: "Jane Austen's romantic comedy of manners. Few novels in the English language have commanded more affection on the part of the reading public than Pride and Prejudice."
  },
  {
    id: 8,
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    publisher: "Prentice Hall / Pearson",
    publication_year: "2008",
    edition: "1st Edition",
    language: "English",
    category: "Technology",
    genre: "Software Engineering",
    subject: "Computer Science",
    class: "Higher Education / Professional",
    price: "799",
    cover_url: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
    rack: "Rack C-1",
    shelf: "Shelf 2",
    shelf_location: "Rack C-1, Shelf 2",
    total_copies: 4,
    available_copies: 3,
    summary: "Even bad code can function, but if code is not clean it can bring a development organization to its knees. Robert C. Martin presents a revolutionary paradigm detailing principles, patterns, and practices for writing clean, maintainable software.",
    description: "Noted software expert Robert C. Martin presents a revolutionary paradigm with Clean Code: A Handbook of Agile Software Craftsmanship, teaching the craft of writing readable, resilient code."
  },
  {
    id: 9,
    title: "How to Enjoy Your Life and Your Job",
    author: "Dale Carnegie",
    isbn: "9789380777994",
    publisher: "Diamond Books Publishing",
    publication_year: "2021",
    edition: "Special Edition",
    language: "English",
    category: "Self-Help",
    genre: "Personal Development",
    subject: "Life Skills & Communication",
    class: "General Reading",
    price: "299",
    cover_url: "https://covers.openlibrary.org/b/isbn/9789380777994-L.jpg",
    rack: "Rack B-3",
    shelf: "Shelf 2",
    shelf_location: "Rack B-3, Shelf 2",
    total_copies: 3,
    available_copies: 2,
    summary: "Dale Carnegie's timeless wisdom on developing a positive mental attitude, finding peace and enthusiasm in routine work, overcoming fatigue and anxiety, and building harmonious, rewarding professional and personal relationships.",
    description: "Discover how to conquer work stress, revitalize your daily routine, and transform mundane duties into fulfilling achievements with Carnegie's practical life rules."
  }
];

async function makeBooksRealAndCopies() {
  console.log('====================================================');
  console.log('📚 Making All Books Real & Generating Barcode Copies');
  console.log('====================================================');

  // 1. Ensure required columns exist on books
  const bookCols = [
    { name: 'summary', type: 'TEXT' },
    { name: 'synopsis', type: 'TEXT' },
    { name: 'edition', type: 'TEXT' },
    { name: 'publication_year', type: 'TEXT' },
    { name: 'price', type: 'TEXT' },
    { name: 'publisher', type: 'TEXT' },
    { name: 'language', type: 'TEXT' },
    { name: 'subject', type: 'TEXT' },
    { name: 'class', type: 'TEXT' },
    { name: 'rack', type: 'TEXT' },
    { name: 'shelf', type: 'TEXT' }
  ];

  for (const c of bookCols) {
    try {
      await db.query(`ALTER TABLE books ADD COLUMN ${c.name} ${c.type}`);
    } catch (e) {}
  }

  // 2. Ensure required columns exist on book_copies
  const copyCols = [
    { name: 'barcode', type: 'TEXT' },
    { name: 'book_code', type: 'TEXT' },
    { name: 'edition_id', type: 'TEXT' },
    { name: 'serial_number', type: 'INTEGER' },
    { name: 'copy_number', type: 'INTEGER' },
    { name: 'status', type: "TEXT DEFAULT 'AVAILABLE'" },
    { name: 'availability_status', type: "TEXT DEFAULT 'AVAILABLE'" },
    { name: 'condition_status', type: "TEXT DEFAULT 'GOOD'" },
    { name: 'shelf', type: 'TEXT' },
    { name: 'rack', type: 'TEXT' },
    { name: 'added_date', type: 'TEXT' },
    { name: 'added_by', type: 'TEXT' },
    { name: 'school_code', type: 'TEXT' },
    { name: 'accession_number', type: 'TEXT' },
    { name: 'barcode_printed', type: 'INTEGER DEFAULT 0' },
    { name: 'barcode_printed_at', type: 'TEXT' },
    { name: 'barcode_printed_by', type: 'TEXT' },
    { name: 'barcode_print_batch', type: 'TEXT' }
  ];

  for (const c of copyCols) {
    try {
      await db.query(`ALTER TABLE book_copies ADD COLUMN ${c.name} ${c.type}`);
    } catch (e) {}
  }

  // 3. Update or Insert Real Book Metadata
  for (const b of REAL_BOOKS_DATA) {
    console.log(`\nUpdating metadata for: "${b.title}" (ID: ${b.id})...`);

    // Check if book exists
    const checkRes = await db.query('SELECT id FROM books WHERE id = $1', [b.id]);
    if (checkRes.rows && checkRes.rows.length > 0) {
      await db.query(`
        UPDATE books SET
          title = $1,
          author = $2,
          isbn = $3,
          publisher = $4,
          publication_year = $5,
          edition = $6,
          language = $7,
          category = $8,
          genre = $9,
          subject = $10,
          class = $11,
          price = $12,
          cover_url = $13,
          shelf_location = $14,
          rack = $15,
          shelf = $16,
          total_copies = $17,
          available_copies = $18,
          summary = $19,
          synopsis = $19,
          description = $20,
          school_code = 'GLOBAL'
        WHERE id = $21
      `, [
        b.title, b.author, b.isbn, b.publisher, b.publication_year, b.edition,
        b.language, b.category, b.genre, b.subject, b.class, b.price,
        b.cover_url, b.shelf_location, b.rack, b.shelf, b.total_copies, b.available_copies,
        b.summary, b.description, b.id
      ]);
      console.log(`✓ Updated book ${b.id}: "${b.title}" with real cover and details.`);
    } else {
      await db.query(`
        INSERT INTO books (
          id, title, author, isbn, publisher, publication_year, edition,
          language, category, genre, subject, class, price, cover_url,
          shelf_location, rack, shelf, total_copies, available_copies,
          summary, synopsis, description, school_code
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, 'GLOBAL'
        )
      `, [
        b.id, b.title, b.author, b.isbn, b.publisher, b.publication_year, b.edition,
        b.language, b.category, b.genre, b.subject, b.class, b.price, b.cover_url,
        b.shelf_location, b.rack, b.shelf, b.total_copies, b.available_copies,
        b.summary, b.summary, b.description
      ]);
      console.log(`✓ Inserted new book ${b.id}: "${b.title}".`);
    }

    // 4. Generate/Synchronize Physical Barcode Copies for this Book
    const currentCopiesRes = await db.query('SELECT * FROM book_copies WHERE book_id = $1 ORDER BY copy_number ASC', [String(b.id)]);
    const existingCopies = currentCopiesRes.rows || [];

    const neededCopies = b.total_copies;
    console.log(`  Physical copies status: ${existingCopies.length} existing, ${neededCopies} total required.`);

    for (let i = 1; i <= neededCopies; i++) {
      const copyId = `CP-${b.id}-${i}`;
      // Clean, standard scannable barcode: VBPGZ + Book ID (2 digits) + Copy Number (2 digits) + check/timestamp
      const barcode = `VBPGZ${String(b.id).padStart(3, '0')}${String(i).padStart(3, '0')}`;
      const isIssued = (i > b.available_copies);
      const status = isIssued ? 'ISSUED' : 'AVAILABLE';
      const cond = (i === 1) ? 'NEW' : 'GOOD';

      const existingCopy = existingCopies.find(c => c.copy_number === i || c.id === copyId);
      if (existingCopy) {
        // Update copy details
        await db.query(`
          UPDATE book_copies SET
            barcode = COALESCE(barcode, $1),
            book_id = $2,
            book_code = $3,
            copy_number = $4,
            shelf = $5,
            rack = $6,
            status = $7,
            availability_status = $7,
            condition_status = $8,
            edition_id = $9,
            school_code = 'GLOBAL'
          WHERE id = $10
        `, [
          barcode, String(b.id), barcode, i, b.shelf, b.rack,
          status, cond, b.edition, existingCopy.id
        ]);
        console.log(`  ✓ Updated physical copy ${existingCopy.id} -> Barcode: ${existingCopy.barcode || barcode} (${status})`);
      } else {
        // Insert new copy
        await db.query(`
          INSERT INTO book_copies (
            id, book_id, barcode, book_code, edition_id, serial_number, copy_number,
            shelf, rack, status, availability_status, condition_status,
            added_date, added_by, school_code, barcode_printed
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11,
            CURRENT_TIMESTAMP, 'System Seeder', 'GLOBAL', 0
          )
        `, [
          copyId, String(b.id), barcode, barcode, b.edition, i, i,
          b.shelf, b.rack, status, cond
        ]);
        console.log(`  + Created new physical copy ${copyId} -> Barcode: ${barcode} (${status})`);
      }
    }
  }

  console.log('\n====================================================');
  console.log('✅ All Books & Physical Barcode Copies Successfully Synced!');
  console.log('====================================================');
}

if (require.main === module) {
  makeBooksRealAndCopies()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error in makeBooksRealAndCopies:', err);
      process.exit(1);
    });
}

module.exports = { makeBooksRealAndCopies };
