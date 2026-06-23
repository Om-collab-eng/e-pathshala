const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

const DB_PATH = path.join(__dirname, 'library_ocr.db');

// Connect to SQLite Database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the library OCR SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    db.serialize(() => {
        // Drop old table to reload new schema
        db.run(`DROP TABLE IF EXISTS books`);

        // Create books table with camelCase schema
        db.run(`CREATE TABLE IF NOT EXISTS books (
            bookId TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT,
            publisher TEXT,
            isbn TEXT,
            edition TEXT,
            class TEXT,
            subject TEXT,
            description TEXT,
            coverImage TEXT,
            addedDate TEXT NOT NULL
        )`);

        // Scan history / stats table
        db.run(`CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL, -- 'success' or 'failed'
            extracted_text TEXT,
            error_message TEXT
        )`);
    });
}

// Generate sequential Library ID: VBPG[Year][Sequence] (e.g. VBPG20260001)
function getNextBookId() {
    return new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM books`, [], (err, row) => {
            if (err) {
                return reject(err);
            }
            
            const nextNum = (row ? row.count : 0) + 1;
            const year = new Date().getFullYear();
            const seqStr = String(nextNum).padStart(4, '0');
            
            resolve(`VBPG${year}${seqStr}`);
        });
    });
}

// Database helper operations
const dbOperations = {
    // Add a book
    addBook: (book) => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO books (bookId, title, author, publisher, isbn, edition, class, subject, description, coverImage, addedDate)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(
                query,
                [
                    book.bookId,
                    book.title,
                    book.author || '',
                    book.publisher || '',
                    book.isbn || '',
                    book.edition || '',
                    book.class || '',
                    book.subject || '',
                    book.description || '',
                    book.coverImage || '',
                    book.addedDate
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve({ success: true, bookId: book.bookId });
                }
            );
        });
    },

    // Get all books with optional search filtering
    getBooks: (search = '') => {
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM books WHERE 1=1`;
            const params = [];

            if (search) {
                query += ` AND (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR publisher LIKE ? OR subject LIKE ?)`;
                const term = `%${search}%`;
                params.push(term, term, term, term, term);
            }

            query += ` ORDER BY addedDate DESC`;

            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // Log scan execution
    logScan: (status, extractedText = '', errorMessage = '') => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO scan_history (timestamp, status, extracted_text, error_message) VALUES (?, ?, ?, ?)`;
            const timestamp = new Date().toISOString();
            db.run(query, [timestamp, status, extractedText, errorMessage], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    // Get statistics
    getStats: () => {
        return new Promise((resolve, reject) => {
            const stats = {
                totalBooks: 0,
                recentBooks: [],
                totalScans: 0,
                successfulScans: 0,
                failedScans: 0
            };

            db.get(`SELECT COUNT(*) as count FROM books`, [], (err, row) => {
                if (err) return reject(err);
                stats.totalBooks = row ? row.count : 0;

                db.all(`SELECT * FROM books ORDER BY addedDate DESC LIMIT 5`, [], (err, rows) => {
                    if (err) return reject(err);
                    stats.recentBooks = rows || [];

                    db.get(`SELECT 
                                COUNT(*) as total,
                                SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) as success,
                                SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed
                            FROM scan_history`, [], (err, row) => {
                        if (err) return reject(err);
                        stats.totalScans = row ? row.total : 0;
                        stats.successfulScans = row ? (row.success || 0) : 0;
                        stats.failedScans = row ? (row.failed || 0) : 0;
                        resolve(stats);
                    });
                });
            });
        });
    }
};

module.exports = {
    db,
    getNextBookId,
    dbOperations
};
