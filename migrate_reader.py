import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'library.db')
DEMO_DB_FILE = os.path.join(BASE_DIR, 'demo.db')

def migrate():
    for db in [DB_FILE, DEMO_DB_FILE]:
        if not os.path.exists(db):
            print(f"Skipping {db}, file not found.")
            continue
            
        print(f"Migrating {db}...")
        conn = sqlite3.connect(db)
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS reading_progress (
                id INTEGER PRIMARY KEY,
                student_id INTEGER NOT NULL,
                content_id INTEGER NOT NULL,
                last_page INTEGER DEFAULT 1,
                updated_at TEXT
            )
        ''')
        
        # Add index for fast lookup
        conn.execute('CREATE INDEX IF NOT EXISTS idx_progress_student ON reading_progress(student_id)')
        
        conn.commit()
        conn.close()
        print(f"Finished {db}.")

if __name__ == '__main__':
    migrate()
