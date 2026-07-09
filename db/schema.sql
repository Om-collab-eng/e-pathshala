-- Database schema for Library Management System (PostgreSQL)
-- This schema is derived from the SQLite schema of the original Flask application.

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS book_copies;
DROP TABLE IF EXISTS acquisition_items;
DROP TABLE IF EXISTS acquisitions;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS points_log;
DROP TABLE IF EXISTS book_reviews;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS book_quizzes;
DROP TABLE IF EXISTS personal_activity_logs;
DROP TABLE IF EXISTS personal_settings;
DROP TABLE IF EXISTS personal_favorites;
DROP TABLE IF EXISTS personal_wishlist;
DROP TABLE IF EXISTS personal_borrowings;
DROP TABLE IF EXISTS personal_reading_tracker;
DROP TABLE IF EXISTS personal_books;
DROP TABLE IF EXISTS organization_requests;
DROP TABLE IF EXISTS sqlite_sequence;
DROP TABLE IF EXISTS personal_libraries_shares;
DROP TABLE IF EXISTS personal_libraries;
DROP TABLE IF EXISTS addons;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS plans;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS reading_progress;
DROP TABLE IF EXISTS content_moderation_logs;
DROP TABLE IF EXISTS content_reports;
DROP TABLE IF EXISTS content_reviews;
DROP TABLE IF EXISTS digital_content;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS pending_requests;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schools;

-- Schools table
CREATE TABLE schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    school_code VARCHAR(50) UNIQUE NOT NULL,
    librarian_name VARCHAR(255),
    max_books INTEGER DEFAULT 500,
    max_students INTEGER DEFAULT 500,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Active',
    active_plan VARCHAR(50) DEFAULT 'FREE',
    subscription_status VARCHAR(50) DEFAULT 'active',
    expiry_date TIMESTAMP,
    student_limit INTEGER DEFAULT 50,
    librarian_limit INTEGER DEFAULT 1,
    admin_limit INTEGER DEFAULT 1,
    due_days INTEGER DEFAULT 3
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    admission_no VARCHAR(50),
    class VARCHAR(100),
    phone VARCHAR(20) UNIQUE,
    password TEXT, -- Note: storing plaintext as in original (not recommended for production)
    role VARCHAR(50) NOT NULL, -- 'admin', 'librarian', 'student', 'super_admin', 'super_super_admin', 'owner'
    session_token VARCHAR(255),
    school_code VARCHAR(50) REFERENCES schools(school_code),
    status VARCHAR(50) DEFAULT 'active',
    is_banned INTEGER DEFAULT 0,
    permissions TEXT DEFAULT '["manage_books", "manage_students", "manage_transactions", "approve_content"]',
    email VARCHAR(255),
    stream VARCHAR(255),
    dob DATE,
    plan_name VARCHAR(50) DEFAULT 'FREE',
    physical_reader_score INTEGER DEFAULT 0,
    digital_reader_score INTEGER DEFAULT 0,
    overall_reader_score INTEGER DEFAULT 0,
    quizzes_passed INTEGER DEFAULT 0,
    approved_reviews INTEGER DEFAULT 0,
    reading_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_read_date TIMESTAMP,
    badges TEXT DEFAULT '[]',
    section VARCHAR(255)
);

-- Books table
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    genre VARCHAR(100),
    barcode_id VARCHAR(50) UNIQUE,
    total_copies INTEGER DEFAULT 0,
    available_copies INTEGER DEFAULT 0,
    school_code VARCHAR(50) REFERENCES schools(school_code),
    cover_url TEXT,
    description TEXT,
    shelf_location VARCHAR(255),
    is_banned TEXT,
    isbn VARCHAR(50),
    publisher VARCHAR(255),
    class VARCHAR(100),
    subject VARCHAR(255),
    pages INTEGER DEFAULT 120,
    edition VARCHAR(100),
    ddc VARCHAR(50),
    category VARCHAR(100),
    book_type VARCHAR(50),
    language VARCHAR(50)
);

-- Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    book_id INTEGER REFERENCES books(id),
    issue_date TIMESTAMP,
    due_date TIMESTAMP,
    return_date TIMESTAMP,
    fine DECIMAL(10,2) DEFAULT 0,
    class VARCHAR(100),
    school_code VARCHAR(50) REFERENCES schools(school_code)
);

-- Pending requests table
CREATE TABLE pending_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    school_name VARCHAR(255),
    librarian_name VARCHAR(255),
    b_qty INTEGER DEFAULT 0,
    s_qty INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phone VARCHAR(20),
    password TEXT
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message TEXT,
    type VARCHAR(50),
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    school_code VARCHAR(50) REFERENCES schools(school_code)
);

-- Logs table
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action TEXT,
    module VARCHAR(100),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    school_code VARCHAR(50) REFERENCES schools(school_code)
);

-- Reservations table
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    book_id INTEGER REFERENCES books(id),
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    school_code VARCHAR(50) REFERENCES schools(school_code)
);

-- Digital content table
CREATE TABLE digital_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    subject VARCHAR(255),
    class VARCHAR(100),
    tags TEXT,
    cover_url TEXT,
    file_url TEXT,
    student_id INTEGER REFERENCES users(id),
    school_code VARCHAR(50) REFERENCES schools(school_code),
    status VARCHAR(50) DEFAULT 'Submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rejection_reason TEXT,
    suggested_changes TEXT,
    featured INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0
);

-- Content reviews table
CREATE TABLE content_reviews (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES digital_content(id),
    student_id INTEGER REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(255),
    review_comment TEXT,
    school_code VARCHAR(50) REFERENCES schools(school_code),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content reports table
CREATE TABLE content_reports (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES digital_content(id),
    reported_by INTEGER REFERENCES users(id),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Open',
    school_code VARCHAR(50) REFERENCES schools(school_code),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content moderation logs table
CREATE TABLE content_moderation_logs (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES digital_content(id),
    title VARCHAR(255),
    author_name VARCHAR(255),
    school_code VARCHAR(50) REFERENCES schools(school_code),
    removed_by INTEGER REFERENCES users(id),
    removal_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reading progress table
CREATE TABLE reading_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    content_id INTEGER REFERENCES digital_content(id),
    last_page INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_pages INTEGER DEFAULT 1,
    completed_at TIMESTAMP,
    reading_time INTEGER DEFAULT 0,
    streak_last_increment_date DATE,
    started_reading_at TIMESTAMP,
    awarded_50 INTEGER DEFAULT 0,
    awarded_100 INTEGER DEFAULT 0
);

-- System settings table
CREATE TABLE system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT
);

-- Plans table
CREATE TABLE plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    monthly_price DECIMAL(10,2),
    annual_price DECIMAL(10,2),
    max_students INTEGER,
    max_books INTEGER,
    features_json TEXT
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    school_code VARCHAR(50) REFERENCES schools(school_code),
    plan_id VARCHAR(50) REFERENCES plans(id),
    status VARCHAR(50),
    start_date TIMESTAMP,
    current_period_end TIMESTAMP,
    trial_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE
);

-- Invoices table
CREATE TABLE invoices (
    id VARCHAR(50) PRIMARY KEY,
    school_code VARCHAR(50) REFERENCES schools(school_code),
    amount DECIMAL(10,2),
    tax DECIMAL(10,2),
    total DECIMAL(10,2),
    status VARCHAR(50),
    due_date TIMESTAMP,
    pdf_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id VARCHAR(50) PRIMARY KEY,
    invoice_id VARCHAR(50) REFERENCES invoices(id),
    gateway_txn_id VARCHAR(255),
    amount DECIMAL(10,2),
    method VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coupons table
CREATE TABLE coupons (
    code VARCHAR(50) PRIMARY KEY,
    discount_percent DECIMAL(5,2),
    valid_until TIMESTAMP,
    max_uses INTEGER,
    times_used INTEGER DEFAULT 0
);

-- Addons table
CREATE TABLE addons (
    id VARCHAR(50) PRIMARY KEY,
    school_code VARCHAR(50) REFERENCES schools(school_code),
    type VARCHAR(50),
    quantity INTEGER,
    price DECIMAL(10,2),
    purchased_at TIMESTAMP
);

-- Organization requests table
CREATE TABLE organization_requests (
    id SERIAL PRIMARY KEY,
    org_name VARCHAR(255),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personal libraries table
CREATE TABLE personal_libraries (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id),
    library_name VARCHAR(255) NOT NULL,
    profile_photo TEXT,
    plan_name VARCHAR(50) DEFAULT 'FREE',
    subscription_status VARCHAR(50) DEFAULT 'active',
    expiry_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personal library shares table
CREATE TABLE personal_library_shares (
    id SERIAL PRIMARY KEY,
    library_id INTEGER REFERENCES personal_libraries(id) ON DELETE CASCADE,
    shared_with_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(50) DEFAULT 'view',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personal books table
CREATE TABLE personal_books (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    category VARCHAR(100),
    publisher VARCHAR(255),
    isbn VARCHAR(50),
    language VARCHAR(50),
    description TEXT,
    cover_image_url TEXT,
    quantity INTEGER DEFAULT 1,
    book_condition VARCHAR(50),
    purchase_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    library_id INTEGER REFERENCES personal_libraries(id)
);

-- Personal reading tracker table
CREATE TABLE personal_reading_tracker (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) NOT NULL,
    book_id INTEGER REFERENCES personal_books(id) NOT NULL,
    start_date TIMESTAMP,
    finish_date TIMESTAMP,
    current_page INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0,
    reading_status VARCHAR(50) DEFAULT 'Not Started',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personal borrowings table
CREATE TABLE personal_borrowings (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) NOT NULL,
    book_id INTEGER REFERENCES personal_books(id) NOT NULL,
    borrower_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    issue_date TIMESTAMP NOT NULL,
    expected_return_date TIMESTAMP NOT NULL,
    actual_return_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Issued'
);

-- Personal wishlist table
CREATE TABLE personal_wishlist (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    priority VARCHAR(50) DEFAULT 'Medium',
    price DECIMAL(10,2),
    purchase_link TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personal favorites table
CREATE TABLE personal_favorites (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personal activity logs table
CREATE TABLE personal_activity_logs (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personal settings table
CREATE TABLE personal_settings (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) NOT NULL,
    setting_key VARCHAR(255),
    setting_value TEXT,
    UNIQUE(owner_id, setting_key)
);

-- Personal books index
CREATE INDEX idx_p_books_owner ON personal_books(owner_id);
-- Personal reading tracker index
CREATE INDEX idx_p_read_owner ON personal_reading_tracker(owner_id);
-- Personal borrowings index
CREATE INDEX idx_p_borrow_owner ON personal_borrowings(owner_id);
-- Personal wishlist index
CREATE INDEX idx_p_wish_owner ON personal_wishlist(owner_id);
-- Personal favorites index
CREATE INDEX idx_p_favs_owner ON personal_favorites(owner_id);
-- Personal activity logs index
CREATE INDEX idx_p_logs_owner ON personal_activity_logs(owner_id);
-- Personal settings index
CREATE INDEX idx_p_settings_owner ON personal_settings(owner_id);

-- Book quizzes table
CREATE TABLE book_quizzes (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) NOT NULL,
    book_type VARCHAR(50) NOT NULL,
    questions TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz attempts table
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    book_id INTEGER REFERENCES books(id) NOT NULL,
    book_type VARCHAR(50) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    passed INTEGER DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book reviews table
CREATE TABLE book_reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    book_id INTEGER REFERENCES books(id) NOT NULL,
    book_type VARCHAR(50) NOT NULL,
    learned TEXT NOT NULL,
    favorite TEXT NOT NULL,
    recommend TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    school_code VARCHAR(50) REFERENCES schools(school_code)
);

-- Points log table
CREATE TABLE points_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    points INTEGER NOT NULL,
    score_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    school_code VARCHAR(50) REFERENCES schools(school_code)
);

-- Vendors table
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    school_code VARCHAR(50) REFERENCES schools(school_code),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Acquisitions table
CREATE TABLE acquisitions (
    id SERIAL PRIMARY KEY,
    school_code VARCHAR(50) NOT NULL REFERENCES schools(school_code),
    bill_number VARCHAR(50) NOT NULL,
    bill_date TIMESTAMP NOT NULL,
    vendor_id INTEGER REFERENCES vendors(id),
    total_books INTEGER DEFAULT 0,
    total_copies INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'Pending',
    created_by INTEGER REFERENCES users(id) NOT NULL,
    created_date TIMESTAMP NOT NULL,
    last_updated TIMESTAMP,
    invoice_image TEXT
);

-- Acquisition items table
CREATE TABLE acquisition_items (
    id SERIAL PRIMARY KEY,
    acquisition_id INTEGER REFERENCES acquisitions(id) NOT NULL,
    book_id INTEGER REFERENCES books(id),
    isbn VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) DEFAULT 0.0,
    total_price DECIMAL(10,2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'New'
);

-- Book copies table
CREATE TABLE book_copies (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) NOT NULL,
    accession_number VARCHAR(100) UNIQUE NOT NULL,
    shelf VARCHAR(100),
    rack VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Available',
    condition VARCHAR(50) DEFAULT 'Good',
    acquisition_id INTEGER REFERENCES acquisition_items(id)
);

-- Global sections table
CREATE TABLE global_sections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Digital chapters table
CREATE TABLE digital_chapters (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) NOT NULL,
    chapter_num INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    summary TEXT,
    notes TEXT,
    vocabulary TEXT,
    qna TEXT,
    quiz TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chapter quiz attempts table
CREATE TABLE chapter_quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    chapter_id INTEGER REFERENCES digital_chapters(id) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    passed INTEGER DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chapter reading progress table
CREATE TABLE chapter_reading_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    chapter_id INTEGER REFERENCES digital_chapters(id) NOT NULL,
    progress DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    finished INTEGER DEFAULT 0,
    last_read TIMESTAMP,
    UNIQUE(user_id, chapter_id)
);

-- Insert default system settings
INSERT INTO system_settings (key, value) VALUES ('maintenance_mode', '0');
INSERT INTO system_settings (key, value) VALUES ('currency_symbol', '$');
INSERT INTO system_settings (key, value) VALUES ('date_format', 'YYYY-MM-DD');
INSERT INTO system_settings (key, value) VALUES ('time_format', 'HH:mm:ss');

-- Insert default plans
INSERT INTO plans (id, name, monthly_price, annual_price, max_students, max_books, features_json) VALUES
('FREE', 'Free Plan', 0, 0, 50, 500, '{"canImportCSV":false,"canExportCSV":false,"canUseAIScanner":true,"canUseBarcodeScanner":true,"canUseAdvancedAnalytics":false,"canUsePublishing":false,"canUseMultiBranch":false,"canUseAPI":false,"canUseAIChat":true}'),
('BASIC', 'Basic Plan', 999, 9990, 500, 10000, '{"canImportCSV":true,"canExportCSV":true,"canUseAIScanner":true,"canUseBarcodeScanner":true,"canUseAdvancedAnalytics":false,"canUsePublishing":false,"canUseMultiBranch":false,"canUseAPI":false,"canUseAIChat":true}'),
('PROFESSIONAL', 'Professional Plan', 2999, 29990, 999999, 999999, '{"canImportCSV":true,"canExportCSV":true,"canUseAIScanner":true,"canUseBarcodeScanner":true,"canUseAdvancedAnalytics":true,"canUsePublishing":true,"canUseMultiBranch":true,"canUseAPI":true,"canUseAIChat":true}');

-- Note: The passwords in the seed data are plaintext. We will rely on the existing data if we migrate.
-- For a fresh install, we might want to hash passwords, but to maintain compatibility we keep as is.
-- We'll leave the users and schools tables to be populated by the application or a separate seed script.