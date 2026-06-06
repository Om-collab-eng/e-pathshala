import sqlite3
import os

DB_FILES = ['library_v3.db', 'library_demo.db']

def migrate():
    for db_file in DB_FILES:
        if not os.path.exists(db_file):
            continue
            
        print(f"Migrating {db_file}...")
        conn = sqlite3.connect(db_file)
        
        # 1. digital_content
        conn.execute('''CREATE TABLE IF NOT EXISTS digital_content (
            id INTEGER PRIMARY KEY,
            title TEXT,
            category TEXT,
            description TEXT,
            subject TEXT,
            class TEXT,
            tags TEXT,
            cover_url TEXT,
            file_url TEXT,
            student_id INTEGER,
            school_code TEXT,
            status TEXT DEFAULT 'Submitted',
            created_at TEXT,
            updated_at TEXT,
            rejection_reason TEXT,
            suggested_changes TEXT,
            featured INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            downloads INTEGER DEFAULT 0
        )''')
        
        # 2. content_reviews
        conn.execute('''CREATE TABLE IF NOT EXISTS content_reviews (
            id INTEGER PRIMARY KEY,
            content_id INTEGER,
            student_id INTEGER,
            rating INTEGER,
            review_title TEXT,
            review_comment TEXT,
            school_code TEXT,
            created_at TEXT
        )''')
        
        # 3. content_reports
        conn.execute('''CREATE TABLE IF NOT EXISTS content_reports (
            id INTEGER PRIMARY KEY,
            content_id INTEGER,
            reported_by INTEGER,
            reason TEXT,
            status TEXT DEFAULT 'Open',
            school_code TEXT,
            created_at TEXT
        )''')
        
        # 4. content_moderation_logs
        conn.execute('''CREATE TABLE IF NOT EXISTS content_moderation_logs (
            id INTEGER PRIMARY KEY,
            content_id INTEGER,
            title TEXT,
            author_name TEXT,
            school_code TEXT,
            removed_by INTEGER,
            removal_reason TEXT,
            created_at TEXT
        )''')
        
        # 5. users (add is_banned)
        try:
            conn.execute('ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0')
        except sqlite3.OperationalError:
            pass # Column exists
            
        conn.commit()
        conn.close()
        print(f"Done migrating {db_file}")

if __name__ == '__main__':
    migrate()
