let currentUser = null;
let currentLoginType = 'admin';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    lucide.createIcons();
});

// Auth Logic
async function checkAuth() {
    try {
        const res = await fetch('/api/profile');
        if (res.ok) {
            currentUser = await res.json();
            renderDashboard();
        } else {
            renderLogin();
        }
    } catch (err) {
        renderLogin();
    }
}

function renderLogin() {
    const app = document.getElementById('app');
    const tpl = document.getElementById('tpl-login');
    app.innerHTML = tpl.innerHTML;
    
    document.getElementById('form-login').addEventListener('submit', handleLogin);
}

function switchLoginTab(type) {
    currentLoginType = type;
    document.getElementById('btn-tab-admin').classList.toggle('active', type === 'admin');
    document.getElementById('btn-tab-student').classList.toggle('active', type === 'student');
    document.getElementById('lbl-id').textContent = type === 'admin' ? 'Admin ID' : 'Admission Number';
    document.getElementById('input-id').placeholder = type === 'admin' ? 'Enter Admin ID' : 'Enter Admission No';
}

async function handleLogin(e) {
    e.preventDefault();
    const id = document.getElementById('input-id').value;
    const pin = document.getElementById('input-pin').value;
    
    const endpoint = currentLoginType === 'admin' ? '/api/login/admin' : '/api/login/student';
    const body = currentLoginType === 'admin' ? { admin_id: id, pin } : { admission_no: id, pin };

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (res.ok) {
        checkAuth();
    } else {
        alert('Invalid credentials');
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    location.reload();
}

// UI State
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const target = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', target);
    lucide.createIcons();
}

// Dashboard Logic
async function renderDashboard() {
    const app = document.getElementById('app');
    const tpl = document.getElementById('tpl-dashboard');
    app.innerHTML = tpl.innerHTML;
    
    if (currentUser.role !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
    
    loadView('home');
    lucide.createIcons();
}

async function loadView(view) {
    const content = document.getElementById('view-content');
    const tpl = document.getElementById(`tpl-view-${view}`);
    content.innerHTML = tpl.innerHTML;
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(view)) {
            btn.classList.add('active');
        }
    });

    if (currentUser.role !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }

    if (view === 'home') loadStats();
    if (view === 'books') loadBooks();
    if (view === 'students') loadStudents();
    
    lucide.createIcons();
}

// API Loaders
async function loadStats() {
    const res = await fetch('/api/stats');
    if (res.ok) {
        const stats = await res.json();
        document.getElementById('stat-books').textContent = stats.totalBooks;
        document.getElementById('stat-students').textContent = stats.totalStudents;
    }
}

async function loadBooks() {
    const res = await fetch('/api/books');
    const books = await res.json();
    const tbody = document.querySelector('#table-books tbody');
    tbody.innerHTML = books.map(book => `
        <tr>
            <td>${book.book_id}</td>
            <td><strong>${book.title}</strong></td>
            <td>${book.author}</td>
            <td>${book.genre}</td>
            <td><span class="badge ${book.status === 'available' ? 'status-green' : 'status-red'}">${book.status}</span></td>
            <td class="admin-only">
                <button class="btn btn-secondary btn-sm" onclick="deleteBook('${book.book_id}')" style="padding: 0.4rem; color: #ef4444;">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    if (currentUser.role !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
    lucide.createIcons();
}

async function loadStudents() {
    const res = await fetch('/api/students');
    const students = await res.json();
    const tbody = document.querySelector('#table-students tbody');
    tbody.innerHTML = students.map(s => `
        <tr>
            <td>${s.admission_no}</td>
            <td><strong>${s.name}</strong></td>
            <td>${s.class}</td>
            <td>${s.section}</td>
            <td>${s.email}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="deleteStudent('${s.admission_no}')" style="padding: 0.4rem; color: #ef4444;">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

// Handlers
async function deleteBook(id) {
    if (confirm('Are you sure you want to delete this book?')) {
        const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
        if (res.ok) loadBooks();
    }
}

async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
        if (res.ok) loadStudents();
    }
}

// Modals (Simplified as prompt-based for MVP, could be actual modals)
async function showAddBookModal() {
    const title = prompt('Book Title:');
    if (!title) return;
    const author = prompt('Author:');
    const genre = prompt('Genre:');
    const description = prompt('Description:');

    const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, genre, description })
    });
    if (res.ok) loadBooks();
}

async function showAddStudentModal() {
    const admission_no = prompt('Admission No:');
    if (!admission_no) return;
    const name = prompt('Name:');
    const className = prompt('Class:');
    const section = prompt('Section:');
    const email = prompt('Email:');
    const pin = prompt('Set PIN:');

    const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admission_no, name, class: className, section, email, pin })
    });
    if (res.ok) loadStudents();
}

// --- Scanning & OCR Logic ---
let capturedImages = { front: null, back: null };
let activeStreams = { front: null, back: null };

async function startCamera(side) {
    const video = document.getElementById(`video-${side}`);
    const preview = document.getElementById(`preview-${side}`);
    const icon = preview.querySelector('i');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        activeStreams[side] = stream;
        video.srcObject = stream;
        video.style.display = 'block';
        icon.style.display = 'none';
        lucide.createIcons();
    } catch (err) {
        alert('Could not access camera: ' + err.message);
    }
}

function capturePhoto(side) {
    const video = document.getElementById(`video-${side}`);
    const canvas = document.getElementById(`canvas-${side}`);
    const preview = document.getElementById(`preview-${side}`);

    if (!video.srcObject) return alert('Start camera first!');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    capturedImages[side] = dataUrl;

    // Stop camera
    activeStreams[side].getTracks().forEach(track => track.stop());
    video.style.display = 'none';
    
    // Show static preview
    preview.style.backgroundImage = `url(${dataUrl})`;
    preview.style.backgroundSize = 'cover';
    preview.style.backgroundPosition = 'center';

    checkScanReady();
}

function handleFileSelect(side) {
    const fileInput = document.getElementById(`file-${side}`);
    const preview = document.getElementById(`preview-${side}`);
    const icon = preview.querySelector('i');

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            capturedImages[side] = dataUrl;
            preview.style.backgroundImage = `url(${dataUrl})`;
            preview.style.backgroundSize = 'cover';
            icon.style.display = 'none';
            checkScanReady();
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
}

function checkScanReady() {
    const btn = document.getElementById('btn-run-ocr');
    if (capturedImages.front) {
        btn.disabled = false;
    }
}

async function runOCR() {
    const feedback = document.getElementById('scan-feedback');
    const btn = document.getElementById('btn-run-ocr');
    btn.disabled = true;
    btn.innerHTML = '<i class="spinner"></i> AI Analyzing Covers...';

    try {
        feedback.innerHTML = '<p>🧠 Sending images to Google Gemini AI for extraction and summary generation...</p>';
        
        const formData = new FormData();
        if (capturedImages.front) {
            const blob = await (await fetch(capturedImages.front)).blob();
            formData.append('front_image', blob, 'front.jpg');
        }
        if (capturedImages.back) {
            const blob = await (await fetch(capturedImages.back)).blob();
            formData.append('back_image', blob, 'back.jpg');
        }

        if (!capturedImages.front && !capturedImages.back) {
            throw new Error("No images to scan");
        }

        const res = await fetch('/api/analyze-cover', {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            const data = await res.json();
            feedback.innerHTML += `<p style="color: #10b981;">✅ AI Extraction complete! Found: <strong>${data.title}</strong></p>`;
            showEditForm(data);
        } else {
            const errData = await res.json();
            feedback.innerHTML += `<p style="color: #ef4444;">❌ AI Error: ${errData.error || 'Failed to process'}</p>`;
            showEditForm({ title: '', author: '', genre: '', description: '' });
        }
    } catch (err) {
        console.error(err);
        alert('AI Request Failed. Redirecting to manual form.');
        showEditForm({ title: '', author: '', genre: '', description: '' });
    } finally {
        btn.innerHTML = '<i data-lucide="zap"></i> Run AI Extraction';
        btn.disabled = false;
        lucide.createIcons();
    }
}

function showEditForm(data) {
    loadView('edit-book');
    setTimeout(() => {
        document.getElementById('edit-title').value = data.title || '';
        document.getElementById('edit-author').value = data.author || '';
        document.getElementById('edit-genre').value = data.genre || '';
        document.getElementById('edit-description').value = data.description || '';
        document.getElementById('edit-publisher').value = data.publisher || '';
        document.getElementById('edit-publish-date').value = data.publish_date || '';
        document.getElementById('edit-img-front').src = capturedImages.front || '';
        document.getElementById('edit-img-back').src = capturedImages.back || '';
        
        document.getElementById('form-save-scanned-book').onsubmit = saveScannedBook;
    }, 100);
}

async function saveScannedBook(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const formData = new FormData();
    formData.append('title', document.getElementById('edit-title').value);
    formData.append('author', document.getElementById('edit-author').value);
    formData.append('genre', document.getElementById('edit-genre').value);
    formData.append('description', document.getElementById('edit-description').value);
    formData.append('publisher', document.getElementById('edit-publisher').value);
    formData.append('publish_date', document.getElementById('edit-publish-date').value);
    formData.append('price', document.getElementById('edit-price').value);

    if (capturedImages.front) {
        const blob = await (await fetch(capturedImages.front)).blob();
        formData.append('front_image', blob, 'front.jpg');
    }
    if (capturedImages.back) {
        const blob = await (await fetch(capturedImages.back)).blob();
        formData.append('back_image', blob, 'back.jpg');
    }

    const res = await fetch('/api/books/scan', {
        method: 'POST',
        body: formData
    });

    if (res.ok) {
        alert('Book saved successfully!');
        loadView('books');
    } else {
        alert('Failed to save book.');
        btn.disabled = false;
        btn.textContent = 'Save to Library';
    }
}
