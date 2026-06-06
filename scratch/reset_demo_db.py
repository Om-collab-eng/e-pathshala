import sqlite3
import os

BASE_DIR = r"c:\Users\ayush\Desktop\librARY"
DEMO_DB_FILE = os.path.join(BASE_DIR, 'demo.db')

if os.path.exists(DEMO_DB_FILE):
    os.remove(DEMO_DB_FILE)

conn = sqlite3.connect(DEMO_DB_FILE)
# Users Table
conn.execute('''CREATE TABLE users 
             (id INTEGER PRIMARY KEY, name TEXT, admission_no TEXT, class TEXT, 
              phone TEXT UNIQUE, password TEXT, role TEXT, session_token TEXT,
              school_code TEXT)''')

# Books Table
conn.execute('''CREATE TABLE books 
             (id INTEGER PRIMARY KEY, title TEXT, author TEXT, genre TEXT,
              barcode_id TEXT UNIQUE, total_copies INTEGER, available_copies INTEGER,
              school_code TEXT)''')

# Transactions Table
conn.execute('''CREATE TABLE transactions 
             (id INTEGER PRIMARY KEY, user_id INTEGER, book_id INTEGER, 
              issue_date TEXT, due_date TEXT, return_date TEXT, fine REAL,
              class TEXT, school_code TEXT)''')

# Add Demo Admin
conn.execute('INSERT INTO users (name, phone, password, role, admission_no, school_code) VALUES (?,?,?,?,?,?)',
             ('Admin Demo', '123', 'admin123', 'admin', '000', 'DEMO'))

# Add Demo Students
for i in range(1, 6):
    conn.execute('INSERT INTO users (name, phone, password, role, class, admission_no, school_code) VALUES (?,?,?,?,?,?,?)',
                 (f'Demo Student {i}', f'55500{i}', 'demo123', 'student', '9A', f'S{i}', 'DEMO'))

# Add some demo books
demo_books = [
    ("The Great Gatsby", "F. Scott Fitzgerald", "Classic", "GB1234567890", 5, 5, "DEMO"),
    ("To Kill a Mockingbird", "Harper Lee", "Fiction", "TK0987654321", 3, 3, "DEMO"),
    ("A Brief History of Time", "Stephen Hawking", "Science", "BH1122334455", 2, 2, "DEMO")
]
conn.executemany('INSERT INTO books (title, author, genre, barcode_id, total_copies, available_copies, school_code) VALUES (?,?,?,?,?,?,?)', demo_books)

conn.commit()
conn.close()
print("Demo DB fully re-initialized successfully.")
