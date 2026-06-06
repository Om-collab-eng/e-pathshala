import sqlite3

def add_col():
    try:
        conn = sqlite3.connect('library_v3.db')
        conn.execute('ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT \'["manage_books", "manage_students", "manage_transactions", "approve_content"]\'')
        conn.commit()
        conn.close()
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

add_col()
