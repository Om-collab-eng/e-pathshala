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
        // Books table
        db.run(`CREATE TABLE IF NOT EXISTS books (
            book_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT,
            publisher TEXT,
            isbn TEXT,
            category TEXT,
            subject TEXT,
            image TEXT,
            added_date TEXT NOT NULL
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

// Generate sequential Library ID: LIBdd/mm/yy/no. of book scanned
function getNextBookId() {
    return new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM books`, [], (err, row) => {
            if (err) {
                return reject(err);
            }
            
            const nextNum = (row ? row.count : 0) + 1;
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yy = String(now.getFullYear()).substring(2);
            
            resolve(`LIB${dd}/${mm}/${yy}/${nextNum}`);
        });
    });
}

// Database helper operations
const dbOperations = {
    // Add a book
    addBook: (book) => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO books (book_id, title, author, publisher, isbn, category, subject, image, added_date)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(
                query,
                [
                    book.book_id,
                    book.title,
                    book.author || '',
                    book.publisher || '',
                    book.isbn || '',
                    book.category || 'Other',
                    book.subject || '',
                    book.image || '',
                    book.added_date
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve({ success: true, book_id: book.book_id });
                }
            );
        });
    },

    // Get all books with optional search filtering
    getBooks: (search = '', category = '') => {
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM books WHERE 1=1`;
            const params = [];

            if (search) {
                query += ` AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)`;
                const term = `%${search}%`;
                params.push(term, term, term);
            }

            if (category) {
                query += ` AND category = ?`;
                params.push(category);
            }

            query += ` ORDER BY added_date DESC`;

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

                db.all(`SELECT * FROM books ORDER BY added_date DESC LIMIT 5`, [], (err, rows) => {
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
