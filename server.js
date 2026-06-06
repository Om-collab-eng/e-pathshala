const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs-extra');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'vbps_library_secret_key';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
fs.ensureDirSync(path.join(__dirname, 'uploads', 'books'));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/books/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage: storage });

// Helpers to read/write JSON
const getData = (file) => fs.readJsonSync(path.join(__dirname, 'data', file));
const saveData = (file, data) => fs.writeJsonSync(path.join(__dirname, 'data', file), data, { spaces: 2 });

// Book ID Generator: VBPG + YYYY + ####
const generateBookId = () => {
    const year = new Date().getFullYear();
    const books = getData('books.json');
    const yearBooks = books.filter(b => b.book_id && b.book_id.startsWith(`VBPG${year}`));
    let nextNum = 1;
    if (yearBooks.length > 0) {
        const lastId = yearBooks[yearBooks.length - 1].book_id;
        const lastNum = parseInt(lastId.substring(8));
        nextNum = lastNum + 1;
    }
    return `VBPG${year}${nextNum.toString().padStart(4, '0')}`;
};

// Auth Middleware
const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') next();
    else res.status(403).json({ error: 'Access denied' });
};

// Login Routes
app.post('/api/login/admin', (req, res) => {
    const { admin_id, pin } = req.body;
    const admins = getData('admins.json');
    const admin = admins.find(a => a.admin_id === admin_id && a.pin === pin);

    if (admin) {
        const token = jwt.sign({ id: admin.admin_id, role: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        res.json({ success: true, role: 'admin' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/login/student', (req, res) => {
    const { admission_no, pin } = req.body;
    const students = getData('students.json');
    const student = students.find(s => s.admission_no === admission_no && s.pin === pin);

    if (student) {
        const token = jwt.sign({ id: student.admission_no, role: 'student' }, SECRET_KEY, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        res.json({ success: true, role: 'student' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// Admin API
app.get('/api/books', (req, res) => {
    res.json(getData('books.json'));
});

app.post('/api/books', authenticate, isAdmin, (req, res) => {
    const books = getData('books.json');
    const newBook = {
        book_id: Date.now().toString(),
        ...req.body,
        status: 'available'
    };
    books.push(newBook);
    saveData('books.json', books);
    res.json(newBook);
});

app.delete('/api/books/:id', authenticate, isAdmin, (req, res) => {
    let books = getData('books.json');
    books = books.filter(b => b.book_id !== req.params.id);
    saveData('books.json', books);
    res.json({ success: true });
});

app.get('/api/students', authenticate, isAdmin, (req, res) => {
    res.json(getData('students.json'));
});

app.post('/api/students', authenticate, isAdmin, (req, res) => {
    const students = getData('students.json');
    const newStudent = { ...req.body };
    students.push(newStudent);
    saveData('students.json', students);
    res.json(newStudent);
});

app.delete('/api/students/:id', authenticate, isAdmin, (req, res) => {
    let students = getData('students.json');
    students = students.filter(s => s.admission_no !== req.params.id);
    saveData('students.json', students);
    res.json({ success: true });
});

app.get('/api/stats', authenticate, isAdmin, (req, res) => {
    const booksCount = getData('books.json').length;
    const studentsCount = getData('students.json').length;
    res.json({ totalBooks: booksCount, totalStudents: studentsCount });
});

// Scanning & Metadata APIs
app.get('/api/lookup', authenticate, isAdmin, async (req, res) => {
    const { q } = req.query; // query can be title or isbn
    try {
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1`);
        if (response.data.items && response.data.items.length > 0) {
            const item = response.data.items[0].volumeInfo;
            res.json({
                title: item.title,
                author: item.authors ? item.authors.join(', ') : '',
                genre: item.categories ? item.categories[0] : '',
                description: item.description ? item.description.substring(0, 500) : '',
                publisher: item.publisher || '',
                publish_date: item.publishedDate || '',
                thumbnail: item.imageLinks ? item.imageLinks.thumbnail : ''
            });
        } else {
            res.status(404).json({ error: 'Book not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch book data' });
    }
});

app.post('/api/analyze-cover', authenticate, isAdmin, upload.fields([
    { name: 'front_image', maxCount: 1 },
    { name: 'back_image', maxCount: 1 }
]), async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const imageParts = [];

        ['front_image', 'back_image'].forEach(imgKey => {
            if (req.files[imgKey] && req.files[imgKey][0]) {
                const imgPath = req.files[imgKey][0].path;
                const minetype = req.files[imgKey][0].mimetype;
                const data = fs.readFileSync(imgPath).toString("base64");
                imageParts.push({
                    inlineData: {
                        data,
                        mimeType: minetype
                    }
                });
            }
        });

        if (imageParts.length === 0) {
            return res.status(400).json({ error: "No images provided." });
        }

        const prompt = "Extract the book details from these covers. Return ONLY a valid JSON object with the following fields: 'title', 'author', 'genre', 'publisher', 'publish_date', and 'description'. For 'description', generate a compelling 50-word summary about what this book is about.";

        const result = await model.generateContent([prompt, ...imageParts]);
        const responseText = result.response.text();
        
        let cleanJson = responseText.replace(/```json\n?|```/g, '').trim();
        const bookData = JSON.parse(cleanJson);
        
        // Clean up uploaded temporary files since they will be uploaded again on final save
        // Actually, let's leave them if we want, or delete them to save space. We'll let them persist for now.

        res.json(bookData);
    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ error: "Failed to analyze cover." });
    }
});

app.post('/api/books/scan', authenticate, isAdmin, upload.fields([
    { name: 'front_image', maxCount: 1 },
    { name: 'back_image', maxCount: 1 }
]), (req, res) => {
    const { title, author, genre, description, publisher, publish_date, price } = req.body;
    const books = getData('books.json');
    
    const newBook = {
        book_id: generateBookId(),
        title,
        author,
        genre,
        description: description || 'No description available.',
        publisher: publisher || 'Unknown',
        publish_date: publish_date || 'Unknown',
        price: price || '0',
        front_image: req.files['front_image'] ? `/uploads/books/${req.files['front_image'][0].filename}` : '',
        back_image: req.files['back_image'] ? `/uploads/books/${req.files['back_image'][0].filename}` : '',
        status: 'available',
        created_at: new Date().toISOString()
    };

    books.push(newBook);
    saveData('books.json', books);
    res.json(newBook);
});

// Student API
app.get('/api/profile', authenticate, (req, res) => {
    if (req.user.role === 'student') {
        const students = getData('students.json');
        const student = students.find(s => s.admission_no === req.user.id);
        res.json(student);
    } else {
        res.json({ role: 'admin', id: req.user.id });
    }
});

// Fallback for SPA
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).json({ error: 'Endpoint not found or method not allowed' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something broke!' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
