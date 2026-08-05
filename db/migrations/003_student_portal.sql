-- ────────────────────────────────────────────────────────────────────
-- 003_student_portal.sql
-- Student Portal expansion: favorites, wishlist, book requests,
-- downloads, assignments, notes/highlights, personal settings,
-- devices, calendar events, announcements, AI usage log.
-- Safe to run repeatedly via scripts/migrate.js.
-- ────────────────────────────────────────────────────────────────────

-- Users: profile photo + library identifiers
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS library_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS rfid_tag VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS ui_density VARCHAR(10) DEFAULT 'comfortable';

-- Favorites (books or digital content)
CREATE TABLE IF NOT EXISTS student_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    item_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_student_favorites_user ON student_favorites(user_id);

-- Wishlist (books)
CREATE TABLE IF NOT EXISTS student_wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_student_wishlist_user ON student_wishlist(user_id);

-- Book requests / suggestions
CREATE TABLE IF NOT EXISTS book_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255),
    author VARCHAR(255),
    request_type VARCHAR(50) DEFAULT 'book',
    details TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    admin_note TEXT,
    school_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_book_requests_user ON book_requests(user_id);

-- Download history / offline library
CREATE TABLE IF NOT EXISTS student_downloads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content_id INTEGER,
    title VARCHAR(255),
    file_url TEXT,
    file_size INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_student_downloads_user ON student_downloads(user_id);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    school_code VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    class VARCHAR(100),
    subject VARCHAR(255),
    due_date TIMESTAMP,
    file_url TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assignments_school ON assignments(school_code);

-- Assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    file_url TEXT,
    notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'submitted',
    grade VARCHAR(50),
    feedback TEXT
);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user ON assignment_submissions(user_id);

-- Student notes & highlights (book reader)
CREATE TABLE IF NOT EXISTS student_notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    item_type VARCHAR(20),
    item_id INTEGER,
    page INTEGER DEFAULT 1,
    note TEXT,
    color VARCHAR(20) DEFAULT 'yellow',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_student_notes_user ON student_notes(user_id);

-- Personal settings
CREATE TABLE IF NOT EXISTS student_settings (
    user_id INTEGER PRIMARY KEY,
    notifications_enabled INTEGER DEFAULT 1,
    email_notifications INTEGER DEFAULT 1,
    due_reminders INTEGER DEFAULT 1,
    community_notifications INTEGER DEFAULT 1,
    ai_recommendations INTEGER DEFAULT 1,
    assignment_reminders INTEGER DEFAULT 1,
    theme VARCHAR(20) DEFAULT 'dark',
    accent_color VARCHAR(20) DEFAULT '#6366f1',
    font_size VARCHAR(10) DEFAULT 'medium',
    ui_density VARCHAR(10) DEFAULT 'comfortable',
    language VARCHAR(10) DEFAULT 'en',
    privacy_show_progress INTEGER DEFAULT 1,
    privacy_show_badges INTEGER DEFAULT 1,
    privacy_show_activity INTEGER DEFAULT 1,
    auto_download INTEGER DEFAULT 0,
    offline_content INTEGER DEFAULT 0,
    data_saver INTEGER DEFAULT 0
);

-- Devices / active sessions
CREATE TABLE IF NOT EXISTS student_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    ip VARCHAR(45),
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current INTEGER DEFAULT 0,
    token VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_student_devices_user ON student_devices(user_id);

-- Calendar events (library / school / personal)
CREATE TABLE IF NOT EXISTS student_events (
    id SERIAL PRIMARY KEY,
    school_code VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP,
    category VARCHAR(50) DEFAULT 'library',
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_student_events_school ON student_events(school_code);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    school_code VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    audience VARCHAR(50) DEFAULT 'all',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_announcements_school ON announcements(school_code);

-- AI usage log
CREATE TABLE IF NOT EXISTS ai_usage_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    tool VARCHAR(100),
    prompt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user ON ai_usage_log(user_id);

-- Support tickets (bug reports / feature requests / contact)
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category VARCHAR(50) DEFAULT 'question',
    subject VARCHAR(255),
    message TEXT,
    status VARCHAR(50) DEFAULT 'open',
    reply TEXT,
    school_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
