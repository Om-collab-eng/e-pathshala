import sqlite3
import os

print("Checking library_v3.db...")
try:
    conn = sqlite3.connect('library_v3.db')
    cursor = conn.cursor()
    cursor.execute('PRAGMA wal_checkpoint(TRUNCATE);')
    print("Checkpoint:", cursor.fetchall())
    cursor.execute('PRAGMA integrity_check;')
    print("Integrity:", cursor.fetchall())
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cursor.fetchall()]
    print("Tables:", tables)
    if 'users' in tables:
        cursor.execute("SELECT count(*) FROM users;")
        print("Users count:", cursor.fetchone()[0])
    if 'books' in tables:
        cursor.execute("SELECT count(*) FROM books;")
        print("Books count:", cursor.fetchone()[0])
    conn.close()
except Exception as e:
    print("Error with WAL:", e)

# If checkpoint failed, test dumping or check what is on MilesWeb
