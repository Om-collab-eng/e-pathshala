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

/**
 * 1. Book Scanner & OCR & AI Extraction Endpoint
 */
// DuckDuckGo search helper
async function searchWeb(query) {
    try {
        console.log(`[Web Search] Querying DuckDuckGo for: "${query}"`);
        const response = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 8000
        });
        const html = response.data;
        const snippets = [];
        const regex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
        let match;
        while ((match = regex.exec(html)) !== null && snippets.length < 5) {
            snippets.push(match[1].replace(/<[^>]*>/g, '').trim());
        }
        return snippets.join('\n');
    } catch (e) {
        console.error("[Web Search] Search failed:", e.message);
        return "";
    }
}

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

        // Call NVIDIA Integration API to parse metadata from OCR text using nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
        const nvidiaApiKey = (process.env.NVIDIA_API_KEY || "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").trim();

        console.log('[AI] Querying NVIDIA Integrate (nvidia/nemotron-3-nano-omni-30b-a3b-reasoning) for metadata extraction...');

        const aiPrompt = `Analyze the following OCR text extracted from a book cover.
Extract:
* Book title
* Author
* Publisher
* ISBN
* Edition
* Subject
* Class level
* Short description

Return ONLY a valid, minified JSON object matching the JSON schema below. DO NOT wrap it in markdown formatting (do not include \`\`\`json or \`\`\`), no extra text, explanations, or reasoning. Missing values should be returned as empty strings.

JSON Schema:
{
  "title": "Book Title",
  "author": "Book Author",
  "publisher": "Book Publisher",
  "isbn": "10 or 13 digit ISBN number without spaces/hyphens",
  "edition": "Book Edition",
  "class": "Class level",
  "subject": "Subject",
  "description": "Short description of the book"
}

OCR Text to analyze:
"""
${ocrText}
"""`;

        let response = await axios.post(
            'https://integrate.api.nvidia.com/v1/chat/completions',
            {
                model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
                messages: [
                    {
                        role: 'user',
                        content: aiPrompt
                    }
                ],
                temperature: 0.6,
                top_p: 0.95,
                max_tokens: 65536,
                extra_body: {
                    chat_template_kwargs: {
                        enable_thinking: true
                    },
                    reasoning_budget: 16384
                },
                stream: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${nvidiaApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60s timeout
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
            const jsonRegex = /\{[\s\S]*?\}/;
            const match = aiText.match(jsonRegex);
            if (match) {
                bookMetadata = JSON.parse(match[0]);
            } else {
                throw new Error('AI returned an invalid JSON response.');
            }
        }

        // Web Search Fallback Check
        const isMissingData = !bookMetadata.title || 
                              !bookMetadata.author || bookMetadata.author.toLowerCase().includes('unknown') ||
                              !bookMetadata.publisher || bookMetadata.publisher.toLowerCase().includes('unknown') ||
                              !bookMetadata.subject ||
                              !bookMetadata.isbn;

        if (isMissingData) {
            console.log("[AI] Missing metadata detected. Running Web Search Fallback...");
            const searchQuery = `"${bookMetadata.title || ocrText.slice(0, 60).replace(/\n/g, ' ')}" book author publisher isbn class subject`;
            const searchResults = await searchWeb(searchQuery);
            if (searchResults) {
                console.log("[AI] Search results retrieved. Running validation completion with google/gemma-4-31b-it:free...");
                
                const validationPrompt = `We searched the web for details about the book: "${bookMetadata.title || ocrText.substring(0, 50)}".
Here are some search results:
"""
${searchResults}
"""

We initially extracted these metadata details from the cover OCR:
${JSON.stringify(bookMetadata, null, 2)}

Use the search results to fill in any missing details (such as author, publisher, subject, class, isbn, edition, or description) and correct any incorrect fields.

Return ONLY a valid, minified JSON object matching the JSON schema below. DO NOT wrap it in markdown formatting (do not include \`\`\`json or \`\`\`), no extra text, explanations, or reasoning. Missing values should be returned as empty strings.

JSON Schema:
{
  "title": "Book Title",
  "author": "Book Author",
  "publisher": "Book Publisher",
  "isbn": "10 or 13 digit ISBN number without spaces/hyphens",
  "edition": "Book Edition",
  "class": "Class level",
  "subject": "Subject",
  "description": "Short description of the book"
}`;

                const validateRes = await axios.post(
                    'https://integrate.api.nvidia.com/v1/chat/completions',
                    {
                        model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
                        messages: [
                            {
                                role: 'user',
                                content: validationPrompt
                            }
                        ],
                        temperature: 0.6,
                        top_p: 0.95,
                        max_tokens: 8192,
                        extra_body: {
                            chat_template_kwargs: {
                                enable_thinking: true
                            },
                            reasoning_budget: 2048
                        },
                        stream: false
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${nvidiaApiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 60000
                    }
                );

                let valText = validateRes.data.choices[0].message.content.trim();
                valText = valText.replace(/```json\n?|```/g, '').trim();
                
                try {
                    const parsedVal = JSON.parse(valText);
                    // Merge validated properties
                    bookMetadata = { ...bookMetadata, ...parsedVal };
                } catch(e) {
                    console.error("[AI] Failed to parse validation response, keeping original metadata:", e.message);
                }
            }
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
    const { title, author, publisher, isbn, edition, class: className, subject, description, image } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required to save a book.' });
    }

    try {
        // Auto-generate book ID: VBPG[Year][Sequence]
        const bookId = await getNextBookId();
        const addedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const newBook = {
            bookId,
            title,
            author: author || '',
            publisher: publisher || '',
            isbn: isbn || '',
            edition: edition || '',
            class: className || '',
            subject: subject || '',
            description: description || '',
            coverImage: image || '',
            addedDate
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
    const { search } = req.query;
    try {
        const books = await dbOperations.getBooks(search);
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
