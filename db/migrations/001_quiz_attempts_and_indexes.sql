-- Migration: 001_quiz_attempts_and_indexes.sql
-- Description: Create quiz_attempts table and add composite index on book_reviews for student dashboard subqueries

-- 1. Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    book_id VARCHAR(255) NOT NULL,
    book_type VARCHAR(50) NOT NULL DEFAULT 'physical',
    score DECIMAL(5,2) DEFAULT 0.00,
    passed INT DEFAULT 0,
    attempted_at VARCHAR(100),
    KEY idx_quiz_attempts_lookup (user_id, book_id, book_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add composite index on book_reviews for (user_id, book_id, book_type)
ALTER TABLE book_reviews ADD INDEX idx_book_reviews_lookup (user_id(100), book_id(100), book_type(50));
