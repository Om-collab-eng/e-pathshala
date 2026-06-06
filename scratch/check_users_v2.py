import sqlite3
import os

DB_FILE = 'library_v2.db'
if os.path.exists(DB_FILE):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    users = conn.execute('SELECT id, name, phone, password, role, admission_no FROM users').fetchall()
    print("--- Users in library_v2.db ---")
    for user in users:
        print(dict(user))
    conn.close()
else:
    print("library_v2.db not found")
