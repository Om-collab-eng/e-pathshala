import sqlite3
conn = sqlite3.connect('library_v3.db')
user = conn.execute("SELECT * FROM users WHERE role='admin' LIMIT 1").fetchone()
print(user)
