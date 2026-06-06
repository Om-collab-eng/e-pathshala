import sqlite3
import os

DB_FILE = 'library_v2.db'
conn = sqlite3.connect(DB_FILE)

# Ensure admin has the correct credentials
conn.execute("""
    UPDATE users 
    SET admission_no = '000', 
        phone = '123', 
        password = 'admin123' 
    WHERE role = 'admin'
""")

conn.commit()
print("Admin user credentials have been reset to default successfully.")
conn.close()
