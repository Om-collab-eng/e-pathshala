import paramiko
import sqlite3
import os
import json

HOST = "45.199.139.18"
PORT = 22
USER = "librika_1"
PASSWORD = "Kalatota@123"

print("Connecting to MilesWeb to export MySQL schema and data...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)

# Export mysqldump to sqlite or generate json
export_py = """
import mysql.connector
import json
import decimal
import datetime

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat()
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return super().default(obj)

conn = mysql.connector.connect(
    host='localhost',
    user='librika_1_librika',
    password='kalatota@123',
    database='librika_1_librika'
)
cursor = conn.cursor(dictionary=True)

tables = [
    'schools', 'users', 'books', 'book_copies', 'transactions', 'plans',
    'library_settings', 'roles', 'permissions', 'role_permissions', 'user_roles',
    'advertisements', 'digital_content', 'book_reviews', 'quizzes', 'quiz_questions',
    'notifications', 'points_log'
]

data = {}
for t in tables:
    try:
        cursor.execute(f"SELECT * FROM `{t}`")
        data[t] = cursor.fetchall()
    except Exception as e:
        data[t] = []

print(json.dumps(data, cls=CustomEncoder))
conn.close()
"""

# Save remote export script
stdin, stdout, stderr = ssh.exec_command("cat << 'EOF' > export_to_sqlite.py\n" + export_py + "\nEOF\npython3 export_to_sqlite.py")
output_json = stdout.read().decode('utf-8', errors='ignore')
err_text = stderr.read().decode('utf-8', errors='ignore')

if not output_json.strip().startswith('{'):
    print("Remote execution stderr:", err_text)
    # Try via mysql CLI JSON
    print("Falling back to mysqldump...")
    stdin, stdout, stderr = ssh.exec_command("mysqldump -u librika_1_librika -pkalatota@123 --compatible=ansi --skip-extended-insert --compact librika_1_librika > dump.sql && cat dump.sql")
    sql_dump = stdout.read().decode('utf-8', errors='ignore')
    with open('mysql_dump.sql', 'w', encoding='utf-8') as f:
        f.write(sql_dump)
    print("Saved mysql_dump.sql, length:", len(sql_dump))
else:
    db_data = json.loads(output_json)
    print("Fetched table records from MySQL:")
    for t, rows in db_data.items():
        print(f" - {t}: {len(rows)} records")

    # Remove corrupt local database files
    for f in ['library_v3.db', 'library_v3.db-wal', 'library_v3.db-shm']:
        if os.path.exists(f):
            try: os.remove(f)
            except: pass

    # Build fresh SQLite database
    conn = sqlite3.connect('library_v3.db')
    cursor = conn.cursor()
    
    # We will initialize using sqlite schema
    print("Initializing clean SQLite database...")
    # Clean remote export script
    ssh.exec_command("rm -f export_to_sqlite.py dump.sql")

ssh.close()
