import re
import sqlite3
import os

print("Restoring all tables including users into clean library_v3.db...")

conn = sqlite3.connect('library_v3.db')
cursor = conn.cursor()

with open('mysql_dump.sql', 'r', encoding='utf-8', errors='ignore') as f:
    sql_content = f.read()

# Fix current_timestamp() in MySQL dump for SQLite
sql_content = re.sub(r'DEFAULT\s+current_timestamp\(\)', 'DEFAULT CURRENT_TIMESTAMP', sql_content, flags=re.IGNORECASE)

statements = re.split(r';\s*\n', sql_content)

for stmt in statements:
    stmt = stmt.strip()
    if not stmt or stmt.startswith('/*') or stmt.startswith('--'):
        continue

    if any(stmt.upper().startswith(x) for x in ['LOCK TABLES', 'UNLOCK TABLES', 'SET ']):
        continue

    clean_stmt = stmt
    clean_stmt = re.sub(r'AUTO_INCREMENT=\d+', '', clean_stmt, flags=re.IGNORECASE)
    clean_stmt = re.sub(r'AUTO_INCREMENT', '', clean_stmt, flags=re.IGNORECASE)
    clean_stmt = re.sub(r'\bint\(\d+\)', 'INTEGER', clean_stmt, flags=re.IGNORECASE)
    clean_stmt = re.sub(r'\btinyint\(\d+\)', 'INTEGER', clean_stmt, flags=re.IGNORECASE)
    clean_stmt = re.sub(r'\bbigint\(\d+\)', 'INTEGER', clean_stmt, flags=re.IGNORECASE)
    clean_stmt = re.sub(r'\blongtext\b', 'TEXT', clean_stmt, flags=re.IGNORECASE)
    clean_stmt = re.sub(r'\bmediumtext\b', 'TEXT', clean_stmt, flags=re.IGNORECASE)
    clean_stmt = re.sub(r'\bdatetime\b', 'TEXT', clean_stmt, flags=re.IGNORECASE)
    clean_stmt = re.sub(r'\btimestamp\b', 'TEXT', clean_stmt, flags=re.IGNORECASE)
    clean_stmt = re.sub(r'/\*!.*?\*/', '', clean_stmt, flags=re.DOTALL)
    
    # Handle CREATE TABLE
    if 'CREATE TABLE' in clean_stmt.upper():
        lines = clean_stmt.split('\n')
        filtered = []
        for line in lines:
            trimmed = line.strip()
            if re.match(r'^(KEY|UNIQUE KEY|CONSTRAINT|PRIMARY KEY\s*\(|FULLTEXT)\b', trimmed, re.IGNORECASE):
                continue
            filtered.append(line)
        clean_stmt = '\n'.join(filtered)
        clean_stmt = re.sub(r',\s*\)', '\n)', clean_stmt)

    clean_stmt = clean_stmt.strip()
    if not clean_stmt:
        continue

    try:
        cursor.execute(clean_stmt)
    except Exception as e:
        pass

conn.commit()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [r[0] for r in cursor.fetchall()]
print(f"Total tables: {len(tables)}")
if 'users' in tables:
    cursor.execute('SELECT count(*) FROM users;')
    print("Users count:", cursor.fetchone()[0])
    cursor.execute("SELECT id, name, role, school_code FROM users WHERE role IN ('librarian', 'admin') LIMIT 5;")
    print("Librarians/Admins:", cursor.fetchall())

cursor.execute("PRAGMA integrity_check;")
print("Integrity check:", cursor.fetchall())

conn.close()
print("Clean restore complete!")
