import sqlite3
import os

BASE_DIR = r"c:\Users\ayush\Desktop\librARY"
DB_FILE = os.path.join(BASE_DIR, 'library_v3.db')
DEMO_DB_FILE = os.path.join(BASE_DIR, 'demo.db')

def check_db(name, path):
    print(f"--- Checking {name} ({path}) ---")
    if not os.path.exists(path):
        print("Not found")
        return
    conn = sqlite3.connect(path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        for table in tables:
            tname = table[0]
            print(f"Table: {tname}")
            cursor.execute(f"PRAGMA table_info({tname})")
            cols = cursor.fetchall()
            for col in cols:
                print(f"  Col: {col[1]} ({col[2]})")
            
            if tname == 'users':
                # Check if school_code exists
                col_names = [col[1] for col in cols]
                query = "SELECT id, name, phone, password, role"
                if 'school_code' in col_names:
                    query += ", school_code"
                query += " FROM users LIMIT 5"
                
                cursor.execute(query)
                rows = cursor.fetchall()
                print("  Sample Data (Users):")
                for row in rows:
                    print(f"    {row}")
    except Exception as e:
        print(f"Error: {e}")
    conn.close()

check_db("Main DB", DB_FILE)
check_db("Demo DB", DEMO_DB_FILE)
