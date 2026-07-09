const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const MYSQL_HOST = process.env.MYSQL_HOST;
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306');
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DB_OCR = process.env.MYSQL_DB_OCR || 'library_ocr';

let db = null;
let useMySQL = false;
let mysqlPool = null;

if (MYSQL_HOST) {
    useMySQL = true;
    const mysql = require('mysql2/promise');
    
    mysqlPool = mysql.createPool({
        host: MYSQL_HOST,
        port: MYSQL_PORT,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DB_OCR,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    
    console.log('Connected to MySQL for OCR Scanner System.');
    initializeMySQLTables();
} else {
    const sqlite3 = require('sqlite3').verbose();
    const DB_PATH = path.join(__dirname, 'library_ocr.db');
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error connecting to SQLite database:', err.message);
        } else {
            console.log('Connected to the library OCR SQLite database.');
            initializeSQLiteTables();
        }
    });
}

function initializeSQLiteTables() {
    db.serialize(() => {
        // Create books table
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
            status TEXT NOT NULL,
            extracted_text TEXT,
            error_message TEXT
        )`);
    });
}

async function initializeMySQLTables() {
    try {
        const mysqlRaw = require('mysql2/promise');
        const conn = await mysqlRaw.createConnection({
            host: MYSQL_HOST,
            port: MYSQL_PORT,
            user: MYSQL_USER,
            password: MYSQL_PASSWORD
        });
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DB_OCR}\`;`);
        await conn.end();

        await mysqlPool.query(`CREATE TABLE IF NOT EXISTS books (
            bookId VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            author VARCHAR(255),
            publisher VARCHAR(255),
            isbn VARCHAR(255),
            edition VARCHAR(255),
            class VARCHAR(255),
            subject VARCHAR(255),
            description TEXT,
            coverImage VARCHAR(255),
            addedDate VARCHAR(255) NOT NULL
        )`);

        await mysqlPool.query(`CREATE TABLE IF NOT EXISTS scan_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            timestamp VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL,
            extracted_text TEXT,
            error_message TEXT
        )`);
        console.log('MySQL OCR tables initialized.');
    } catch (err) {
        console.error('Error initializing MySQL tables:', err.message);
    }
}

function getNextBookId() {
    return new Promise((resolve, reject) => {
        if (useMySQL) {
            mysqlPool.query('SELECT COUNT(*) as count FROM books')
                .then(([rows]) => {
                    const nextNum = (rows && rows[0] ? rows[0].count : 0) + 1;
                    const year = new Date().getFullYear();
                    const seqStr = String(nextNum).padStart(4, '0');
                    resolve(`VBPG${year}${seqStr}`);
                })
                .catch(reject);
        } else {
            db.get(`SELECT COUNT(*) as count FROM books`, [], (err, row) => {
                if (err) return reject(err);
                const nextNum = (row ? row.count : 0) + 1;
                const year = new Date().getFullYear();
                const seqStr = String(nextNum).padStart(4, '0');
                resolve(`VBPG${year}${seqStr}`);
            });
        }
    });
}

const dbOperations = {
    addBook: (book) => {
        const query = `INSERT INTO books (bookId, title, author, publisher, isbn, edition, class, subject, description, coverImage, addedDate)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [
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
        ];

        if (useMySQL) {
            return mysqlPool.query(query, params)
                .then(() => ({ success: true, bookId: book.bookId }));
        } else {
            return new Promise((resolve, reject) => {
                db.run(query, params, function(err) {
                    if (err) reject(err);
                    else resolve({ success: true, bookId: book.bookId });
                });
            });
        }
    },

    getBooks: (search = '') => {
        let query = `SELECT * FROM books WHERE 1=1`;
        const params = [];

        if (search) {
            query += ` AND (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR publisher LIKE ? OR subject LIKE ?)`;
            const term = `%${search}%`;
            params.push(term, term, term, term, term);
        }

        query += ` ORDER BY addedDate DESC`;

        if (useMySQL) {
            return mysqlPool.query(query, params).then(([rows]) => rows);
        } else {
            return new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    },

    logScan: (status, extractedText = '', errorMessage = '') => {
        const query = `INSERT INTO scan_history (timestamp, status, extracted_text, error_message) VALUES (?, ?, ?, ?)`;
        const timestamp = new Date().toISOString();
        const params = [timestamp, status, extractedText, errorMessage];

        if (useMySQL) {
            return mysqlPool.query(query, params).then(([result]) => result.insertId);
        } else {
            return new Promise((resolve, reject) => {
                db.run(query, params, function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            });
        }
    },

    getStats: () => {
        if (useMySQL) {
            return (async () => {
                const stats = {
                    totalBooks: 0,
                    recentBooks: [],
                    totalScans: 0,
                    successfulScans: 0,
                    failedScans: 0
                };

                const [bookCountRows] = await mysqlPool.query('SELECT COUNT(*) as count FROM books');
                stats.totalBooks = bookCountRows && bookCountRows[0] ? bookCountRows[0].count : 0;

                const [recentBookRows] = await mysqlPool.query('SELECT * FROM books ORDER BY addedDate DESC LIMIT 5');
                stats.recentBooks = recentBookRows || [];

                const [scanRows] = await mysqlPool.query(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) as success,
                        SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed
                    FROM scan_history
                `);
                
                if (scanRows && scanRows[0]) {
                    stats.totalScans = scanRows[0].total;
                    stats.successfulScans = Number(scanRows[0].success || 0);
                    stats.failedScans = Number(scanRows[0].failed || 0);
                }

                return stats;
            })();
        } else {
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
    }
};

module.exports = {
    db,
    getNextBookId,
    dbOperations
};
