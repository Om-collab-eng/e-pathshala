-- ============================================================================
-- Migration 004: Online Live Classes, Video Conferencing & Course Management Studio
-- Compatible with PostgreSQL, MySQL, and SQLite
-- ============================================================================

-- 1. Live Courses Table
CREATE TABLE IF NOT EXISTS live_courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT,
    instructor_id INTEGER,
    instructor_name VARCHAR(255),
    category VARCHAR(100) DEFAULT 'Technology',
    level VARCHAR(50) DEFAULT 'All Levels', -- 'Beginner', 'Intermediate', 'Advanced', 'All Levels'
    price DECIMAL(10, 2) DEFAULT 0.00,
    cover_image TEXT,
    status VARCHAR(50) DEFAULT 'Published', -- 'Draft', 'Published', 'Archived'
    school_code VARCHAR(50) DEFAULT 'DPS123',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Course Modules (Chapters / Sections)
CREATE TABLE IF NOT EXISTS course_modules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    order_index INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Course Lessons (Lectures, Live Classes, Notes, Quizzes)
CREATE TABLE IF NOT EXISTS course_lessons (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) DEFAULT 'live_class', -- 'live_class', 'video', 'pdf', 'quiz'
    video_url TEXT,
    pdf_url TEXT,
    duration_minutes INTEGER DEFAULT 45,
    order_index INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Live Video Sessions (Zoom/Classplus-style scheduled meeting rooms)
CREATE TABLE IF NOT EXISTS live_sessions (
    id SERIAL PRIMARY KEY,
    course_id INTEGER,
    lesson_id INTEGER,
    title VARCHAR(255) NOT NULL,
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP,
    duration_minutes INTEGER DEFAULT 60,
    meeting_id VARCHAR(100) UNIQUE NOT NULL,
    passcode VARCHAR(50) DEFAULT '123456',
    host_user_id INTEGER,
    host_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'live', 'completed', 'cancelled'
    recording_url TEXT,
    shareable_token VARCHAR(255) UNIQUE,
    max_participants INTEGER DEFAULT 100,
    school_code VARCHAR(50) DEFAULT 'DPS123',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Course Enrollments (Student roster & progress)
CREATE TABLE IF NOT EXISTS course_enrollments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'student', -- 'student', 'teaching_assistant', 'instructor'
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_percent INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active'
);

-- 6. Live Session Attendance Logs
CREATE TABLE IF NOT EXISTS session_attendance (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    user_name VARCHAR(255),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'present' -- 'present', 'late', 'absent'
);
