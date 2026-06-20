const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const Tesseract = require('tesseract.js');
require('dotenv').config();

const { getNextBookId, dbOperations } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and body parsers
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
fs.ensureDirSync(UPLOADS_DIR);

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only JPG, JPEG, PNG, and WEBP cover images are allowed.'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Categories list according to specifications
const VALID_CATEGORIES = [
    'Science', 'Mathematics', 'English', 'Hindi', 'Sanskrit',
    'Social Science', 'Computer Science', 'Fiction', 'Non Fiction',
    'Biography', 'Reference', 'Exam Preparation', 'Other'
];

/**
 * 1. Book Scanner & OCR & AI Extraction Endpoint
 */
app.post('/api/scan', upload.single('cover_image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded.' });
    }

    const imagePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;

    try {
        console.log(`[OCR] Starting text extraction on: ${imagePath}`);
        
        // Execute Tesseract OCR
        const ocrResult = await Tesseract.recognize(
            imagePath,
            'eng',
            { logger: m => console.log(`[Tesseract logger] ${m.status}: ${Math.round(m.progress * 100)}%`) }
        );

        const ocrText = ocrResult.data.text;
        const ocrConfidence = ocrResult.data.confidence;

        console.log(`[OCR] Extracted Text: "${ocrText.trim()}" (Confidence: ${ocrConfidence}%)`);

        if (!ocrText || ocrText.trim().length === 0) {
            await dbOperations.logScan('failed', '', 'No text could be extracted from image.');
            return res.json({
                success: false,
                confidence: ocrConfidence,
                message: 'No readable text was found on the cover. Please take a clearer picture.',
                image: imageUrl,
                extracted_text: ''
            });
        }

        // Call OpenRouter API to parse metadata from OCR text
        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterApiKey) {
            throw new Error('OPENROUTER_API_KEY is not defined in the environment variables.');
        }

        console.log('[AI] Querying OpenRouter for metadata extraction...');

        const aiPrompt = `Analyze the following OCR text extracted from a book cover and extract details like Title, Author, Publisher, ISBN, Subject, and Category.
Choose the "category" value strictly from this list: ${VALID_CATEGORIES.join(', ')}. If none fit, use "Other".

OCR Text:
"""
${ocrText}
"""

Return a valid, minified JSON object with the fields listed below. Return ONLY the JSON object, without any markdown formatting (do not include \`\`\`json or \`\`\`), no extra text, explanations, or warnings.

JSON Schema:
{
  "title": "Extracted Book Title (Title Case)",
  "author": "Extracted Book Author(s)",
  "publisher": "Extracted Publisher Name",
  "isbn": "10 or 13 digit ISBN number without spaces/hyphens (if found, else empty string)",
  "category": "One of the listed categories",
  "subject": "Compelling subject name or academic topic",
  "confidence": ${Math.round(ocrConfidence)}
}`;

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'cohere/north-mini-code:free',
                messages: [
                    {
                        role: 'user',
                        content: aiPrompt
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${openRouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://librika.in',
                    'X-Title': 'Library OCR Scanner'
                },
                timeout: 20000 // 20s timeout
            }
        );

        let aiText = response.data.choices[0].message.content.trim();
        console.log('[AI] Raw response:', aiText);

        // Clean markdown code blocks from response
        aiText = aiText.replace(/```json\n?|```/g, '').trim();

        let bookMetadata;
        try {
            bookMetadata = JSON.parse(aiText);
        } catch (parseErr) {
            console.error('[AI] JSON Parse Error. Attempting regex cleanup.', parseErr);
            // Fallback: extract JSON from string if there is surrounding text
            const jsonRegex = /\{[\s\S]*?\}/;
            const match = aiText.match(jsonRegex);
            if (match) {
                bookMetadata = JSON.parse(match[0]);
            } else {
                throw new Error('AI returned an invalid JSON response.');
            }
        }

        // Validate and ensure category matches the valid options
        if (!VALID_CATEGORIES.includes(bookMetadata.category)) {
            bookMetadata.category = 'Other';
        }

        // Ensure confidence is set
        bookMetadata.confidence = bookMetadata.confidence || Math.round(ocrConfidence);

        // Log successful scan
        await dbOperations.logScan('success', ocrText);

        res.json({
            success: true,
            image: imageUrl,
            extracted_text: ocrText,
            metadata: bookMetadata
        });

    } catch (err) {
        console.error('[Scan Error]', err.message);
        await dbOperations.logScan('failed', '', err.message);
        res.status(500).json({
            error: 'Failed to process cover image.',
            details: err.message,
            image: imageUrl
        });
    }
});

/**
 * 2. Save Final Book Metadata Endpoint
 */
app.post('/api/books', async (req, res) => {
    const { title, author, publisher, isbn, category, subject, image } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required to save a book.' });
    }

    try {
        // Auto-generate book ID: LIBdd/mm/yy/count
        const bookId = await getNextBookId();
        const addedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const newBook = {
            book_id: bookId,
            title,
            author,
            publisher,
            isbn,
            category: VALID_CATEGORIES.includes(category) ? category : 'Other',
            subject,
            image,
            added_date: addedDate
        };

        const result = await dbOperations.addBook(newBook);
        res.status(201).json({
            success: true,
            message: 'Book successfully saved in system database.',
            book: newBook
        });

    } catch (err) {
        console.error('[Save Error]', err.message);
        res.status(500).json({ error: 'Failed to save book to database.', details: err.message });
    }
});

/**
 * 3. Search and Retrieve Books Endpoint
 */
app.get('/api/books', async (req, res) => {
    const { search, category } = req.query;
    try {
        const books = await dbOperations.getBooks(search, category);
        res.json(books);
    } catch (err) {
        console.error('[Search Error]', err.message);
        res.status(500).json({ error: 'Failed to query database.', details: err.message });
    }
});

/**
 * 4. Statistics Dashboard Endpoint
 */
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await dbOperations.getStats();
        res.json(stats);
    } catch (err) {
        console.error('[Stats Error]', err.message);
        res.status(500).json({ error: 'Failed to fetch dashboard stats.', details: err.message });
    }
});

// Global error handler for multer uploads
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `File upload error: ${err.message}` });
    }
    if (err) {
        return res.status(500).json({ error: err.message });
    }
    next();
});

// Initialize Server
app.listen(PORT, () => {
    console.log(`Server successfully started on http://localhost:${PORT}`);
});
