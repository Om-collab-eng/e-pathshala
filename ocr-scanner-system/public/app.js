// Tab switching logic
function showTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all nav buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show active tab
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    // Find matching nav button and set active
    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    const targetBtn = navItems.find(btn => btn.textContent.toLowerCase().includes(tabId));
    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    // Load tab specific data
    if (tabId === 'dashboard') {
        loadDashboardStats();
    } else if (tabId === 'inventory') {
        executeSearch();
    }
}

// Drag & Drop event bindings
const dropzone = document.getElementById('dropzone');

['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
    }, false);
});

dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        uploadFile(files[0]);
    }
});

function triggerFileInput() {
    document.getElementById('file-input').click();
}

function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        uploadFile(files[0]);
    }
}

// Web Camera controls
let cameraStream = null;

async function openCamera() {
    const cameraModal = document.getElementById('camera-modal');
    const videoFeed = document.getElementById('video-feed');
    
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }, // Back camera for mobile devices
            audio: false
        });
        
        videoFeed.srcObject = cameraStream;
        cameraModal.style.display = 'flex';
    } catch (err) {
        console.error('Error accessing web camera:', err);
        showToast('Unable to open web camera. Please check camera permissions or upload an image.', 'error');
    }
}

function closeCamera() {
    const cameraModal = document.getElementById('camera-modal');
    const videoFeed = document.getElementById('video-feed');
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    videoFeed.srcObject = null;
    cameraModal.style.display = 'none';
}

function captureImage() {
    const video = document.getElementById('video-feed');
    const canvas = document.getElementById('capture-canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame onto canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas image to blob and upload
    canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        closeCamera();
        uploadFile(file);
    }, 'image/jpeg', 0.9);
}

// File uploading & OCR extraction execution
async function uploadFile(file) {
    const loadingOverlay = document.getElementById('loading-overlay');
    const stepTitle = document.getElementById('loading-step-title');
    const stepDesc = document.getElementById('loading-step-desc');
    const verificationPane = document.getElementById('verification-pane');
    
    // Reset layout
    verificationPane.style.display = 'none';
    
    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast('Invalid file format. Please upload JPG, PNG or WEBP.', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('File is too large. Max size allowed is 5MB.', 'error');
        return;
    }

    // Show loading spinner
    loadingOverlay.style.display = 'flex';
    stepTitle.innerText = 'Extracting OCR Text...';
    stepDesc.innerText = 'Tesseract is processing the text details.';

    const formData = new FormData();
    formData.append('cover_image', file);

    try {
        // Change text right before calling OpenRouter AI refinement
        setTimeout(() => {
            if (loadingOverlay.style.display === 'flex') {
                stepTitle.innerText = 'Extracting metadata using AI...';
                stepDesc.innerText = 'Cohere AI is structuring book attributes from cover text.';
            }
        }, 3000);

        const response = await fetch('/api/scan', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Server error occurred during scan.');
        }

        if (result.success === false) {
            showToast(result.message, 'error');
            loadingOverlay.style.display = 'none';
            return;
        }

        // Show metadata verification form
        populateVerificationForm(result);
        showToast('OCR Book Scanning Successful!', 'success');
        
    } catch (err) {
        console.error(err);
        showToast(err.message || 'An error occurred during scanning.', 'error');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

// Populate the correction fields with OCR / AI structured results
function populateVerificationForm(data) {
    const pane = document.getElementById('verification-pane');
    const alertBanner = document.getElementById('low-confidence-alert');
    const confidenceValSpan = document.getElementById('alert-confidence-val');
    
    // Set fields
    document.getElementById('scanned-image-preview').src = data.image;
    document.getElementById('metadata-image-path').value = data.image;
    document.getElementById('raw-ocr-text').value = data.extracted_text;
    
    const meta = data.metadata;
    document.getElementById('form-title').value = meta.title || '';
    document.getElementById('form-author').value = meta.author || '';
    document.getElementById('form-publisher').value = meta.publisher || '';
    document.getElementById('form-isbn').value = meta.isbn || '';
    document.getElementById('form-edition').value = meta.edition || '';
    document.getElementById('form-class').value = meta.class || '';
    document.getElementById('form-subject').value = meta.subject || '';
    document.getElementById('form-description').value = meta.description || '';
    
    // Handle low confidence score (threshold < 70)
    const confidence = meta.confidence || 0;
    if (confidence < 70) {
        confidenceValSpan.innerText = confidence;
        alertBanner.style.display = 'flex';
    } else {
        alertBanner.style.display = 'none';
    }
    
    // Render and scroll to verification panel
    pane.style.display = 'block';
    pane.scrollIntoView({ behavior: 'smooth' });
}

function resetScanner() {
    document.getElementById('verify-form').reset();
    document.getElementById('verification-pane').style.display = 'none';
    document.getElementById('file-input').value = '';
    showToast('Scanner reset successfully.', 'success');
}

// Save verified details to SQLite Database
async function saveVerifiedBook(event) {
    event.preventDefault();
    
    const bookData = {
        title: document.getElementById('form-title').value.trim(),
        author: document.getElementById('form-author').value.trim(),
        publisher: document.getElementById('form-publisher').value.trim(),
        isbn: document.getElementById('form-isbn').value.trim(),
        edition: document.getElementById('form-edition').value.trim(),
        class: document.getElementById('form-class').value.trim(),
        subject: document.getElementById('form-subject').value.trim(),
        description: document.getElementById('form-description').value.trim(),
        image: document.getElementById('metadata-image-path').value
    };

    try {
        const response = await fetch('/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to save book record.');
        }

        showToast(`Saved Book! Generated ID: ${result.book.bookId}`, 'success');
        resetScanner();
        loadDashboardStats(); // Refresh dashboard counts
        
    } catch (err) {
        console.error(err);
        showToast(err.message || 'An error occurred while saving the book.', 'error');
    }
}

// Load Statistics
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        // Update counters
        document.getElementById('stat-total-books').innerText = stats.totalBooks;
        document.getElementById('stat-success-scans').innerText = stats.successfulScans;
        document.getElementById('stat-failed-scans').innerText = stats.failedScans;
        
        // Compute scan success rate percentage
        if (stats.totalScans > 0) {
            const rate = Math.round((stats.successfulScans / stats.totalScans) * 100);
            document.getElementById('stat-success-rate').innerText = `${rate}%`;
        } else {
            document.getElementById('stat-success-rate').innerText = '0%';
        }
        
        // Populate recent books table
        const tbody = document.getElementById('recent-books-list');
        tbody.innerHTML = '';
        
        if (stats.recentBooks.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No books added yet.</td></tr>`;
            return;
        }
        
        stats.recentBooks.forEach(book => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="book-row-id">${book.bookId}</span></td>
                <td style="font-weight: 700;">${book.title}</td>
                <td>${book.author || 'N/A'}</td>
                <td>${book.edition || 'N/A'}</td>
                <td>${book.addedDate.substring(0, 10)}</td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
    }
}

// Fetch Inventory Lookup List
async function executeSearch() {
    const searchVal = document.getElementById('search-input').value.trim();
    const tbody = document.getElementById('inventory-list');
    
    try {
        const params = new URLSearchParams();
        if (searchVal) params.append('search', searchVal);
        
        const response = await fetch(`/api/books?${params.toString()}`);
        const books = await response.json();
        
        tbody.innerHTML = '';
        
        if (books.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" class="table-empty">No matching books found in inventory.</td></tr>`;
            return;
        }
        
        books.forEach(book => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="book-row-id">${book.bookId}</span></td>
                <td><img src="${book.coverImage || 'placeholder.png'}" class="book-table-thumb" alt="Cover"></td>
                <td style="font-weight: 700;">${book.title}</td>
                <td>${book.author || 'N/A'}</td>
                <td>${book.publisher || 'N/A'}</td>
                <td>${book.isbn || 'N/A'}</td>
                <td>${book.edition || 'N/A'}</td>
                <td>${book.class || 'N/A'}</td>
                <td>${book.subject || 'N/A'}</td>
                <td class="book-row-desc" title="${book.description || ''}">${book.description ? book.description.substring(0, 50) + (book.description.length > 50 ? '...' : '') : 'N/A'}</td>
                <td>${book.addedDate.substring(0, 10)}</td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        console.error('Error loading inventory list:', err);
        tbody.innerHTML = `<tr><td colspan="11" class="table-empty" style="color: var(--accent-error);">Failed to load books database.</td></tr>`;
    }
}

// Toast Toast Notification Helper
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast-notification');
    const msgSpan = document.getElementById('toast-message');
    
    toast.className = 'toast'; // Reset
    if (type === 'success') toast.classList.add('success');
    if (type === 'error') toast.classList.add('error');
    
    msgSpan.innerText = message;
    toast.classList.add('show');
    
    // Hide toast after 3.5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// Initial App State load
window.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
});
