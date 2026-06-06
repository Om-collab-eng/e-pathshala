import sqlite3
from datetime import datetime

conn = sqlite3.connect('library_v3.db')

# Add School
conn.execute('INSERT OR IGNORE INTO schools (name, school_code, librarian_name, created_at) VALUES (?, ?, ?, ?)',
             ('Springfield High', 'SPRING01', 'Demo Librarian', datetime.now().strftime('%Y-%m-%d %H:%M')))

# Add Admin
# Check if admin exists
admin_exists = conn.execute('SELECT 1 FROM users WHERE phone = "999888777"').fetchone()
if not admin_exists:
    conn.execute('INSERT INTO users (name, phone, password, role, school_code) VALUES (?, ?, ?, ?, ?)',
                 ('Demo Librarian', '999888777', 'adminpass', 'admin', 'SPRING01'))

# Add Student
student_exists = conn.execute('SELECT 1 FROM users WHERE phone = "111222333"').fetchone()
if not student_exists:
    conn.execute('INSERT INTO users (name, admission_no, phone, password, role, class, school_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
                 ('Demo Student', 'STU100', '111222333', 'studentpass', 'student', '10th Grade', 'SPRING01'))

conn.commit()
conn.close()
print("Test data fully inserted into library_v3.db")
