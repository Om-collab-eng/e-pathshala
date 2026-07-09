import os
import re
import sqlite3
import pymysql
from dotenv import load_dotenv

# Load env variables from .env
load_dotenv()

MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306')) if os.getenv('MYSQL_PORT') else 3306
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DB_PROD = os.getenv('MYSQL_DB_PROD', 'library_v3')
MYSQL_DB_DEMO = os.getenv('MYSQL_DB_DEMO', 'library_demo')

def map_sqlite_type_to_mysql(col_name, col_type, is_pk=False):
    col_name_lower = col_name.lower()
    col_type_upper = col_type.upper()
    
    if is_pk:
        if 'INT' in col_type_upper or not col_type:
            # SQLite default primary key is INTEGER if type is empty/None
            return "INT AUTO_INCREMENT PRIMARY KEY"
        else:
            return "VARCHAR(255) PRIMARY KEY"
            
    # List of known long text columns
    long_text_cols = {
        'content', 'summary', 'notes', 'vocabulary', 'qna', 'quiz', 
        'questions', 'message', 'setting_value', 'description', 
        'address', 'permissions', 'rejection_reason', 'suggested_changes', 
        'review_comment', 'reason', 'removal_reason', 'extracted_text', 
        'error_message'
    }
    
    if col_name_lower in long_text_cols:
        return "TEXT"
        
    if 'INT' in col_type_upper:
        return "INT"
    elif 'REAL' in col_type_upper or 'DOUBLE' in col_type_upper or 'FLOAT' in col_type_upper:
        return "DOUBLE"
    elif 'BOOLEAN' in col_type_upper:
        return "TINYINT(1) DEFAULT 0"
    else:
        # Default to VARCHAR(255) for general string data to support indexes
        return "VARCHAR(255)"

def migrate_database(sqlite_file, mysql_db_name):
    if not os.path.exists(sqlite_file):
        print(f"[-] SQLite database file '{sqlite_file}' not found. Skipping.")
        return
        
    print(f"\n[*] Starting migration: '{sqlite_file}' -> MySQL database '{mysql_db_name}'")
    
    # 1. Connect to MySQL and create database if not exists
    mysql_conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD
    )
    with mysql_conn.cursor() as cur:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{mysql_db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    mysql_conn.close()
    
    # Reconnect to target database
    mysql_conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=mysql_db_name
    )
    
    sqlite_conn = sqlite3.connect(sqlite_file)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()
    
    # Disable foreign key checks during migration to prevent insertion order issues
    with mysql_conn.cursor() as mysql_cur:
        mysql_cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
        
    # Get all tables in SQLite database
    sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = [row['name'] for row in sqlite_cur.fetchall()]
    
    for table in tables:
        print(f"  [+] Migrating table: {table}")
        
        # 1. Fetch table columns information
        sqlite_cur.execute(f"PRAGMA table_info(`{table}`)")
        cols = sqlite_cur.fetchall()
        
        col_defs = []
        col_names = []
        
        for col in cols:
            c_name = col['name']
            c_type = col['type']
            c_notnull = col['notnull']
            c_dflt = col['dflt_value']
            c_pk = col['pk']
            
            mysql_type = map_sqlite_type_to_mysql(c_name, c_type, is_pk=(c_pk > 0))
            
            def_str = f"`{c_name}` {mysql_type}"
            if c_notnull and not c_pk:
                def_str += " NOT NULL"
            if c_dflt is not None and not c_pk:
                # Handle default value escaping
                def_str += f" DEFAULT {c_dflt}"
                
            col_defs.append(def_str)
            col_names.append(c_name)
            
        # 2. Check for unique index constraints or composite uniques in table schema
        sqlite_cur.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name = ?", (table,))
        table_sql = sqlite_cur.fetchone()[0]
        
        # Look for composite UNIQUE constraints like UNIQUE(user_id, chapter_id)
        unique_matches = re.findall(r'(?i)\bUNIQUE\s*\(([^)]+)\)', table_sql)
        for u_match in unique_matches:
            col_defs.append(f"UNIQUE ({u_match})")
            
        # 3. Drop existing table if it exists in MySQL (to recreate with correct schema)
        with mysql_conn.cursor() as mysql_cur:
            mysql_cur.execute(f"DROP TABLE IF EXISTS `{table}`")
            
            # Create the table in MySQL
            create_sql = f"CREATE TABLE `{table}` (\n  " + ",\n  ".join(col_defs) + "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
            mysql_cur.execute(create_sql)
            
        # 4. Copy data rows from SQLite to MySQL
        sqlite_cur.execute(f"SELECT * FROM `{table}`")
        rows = sqlite_cur.fetchall()
        
        if rows:
            # Map row dict values to tuple list for executemany
            data_list = [tuple(row[col] for col in col_names) for row in rows]
            placeholders = ", ".join(["%s"] * len(col_names))
            insert_cols = ", ".join(f"`{c}`" for c in col_names)
            insert_sql = f"INSERT INTO `{table}` ({insert_cols}) VALUES ({placeholders})"
            
            with mysql_conn.cursor() as mysql_cur:
                mysql_cur.executemany(insert_sql, data_list)
            print(f"    [!] Migrated {len(rows)} rows.")
        else:
            print("    [!] Table is empty.")
            
        # 5. Recreate secondary indexes (non-primary, non-composite uniques)
        sqlite_cur.execute(f"SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name = ? AND sql IS NOT NULL", (table,))
        indexes = sqlite_cur.fetchall()
        for idx in indexes:
            idx_sql = idx['sql']
            # Reformat index SQL to make it compatible
            idx_sql = re.sub(r'(?i)\bIF\s+NOT\s+EXISTS\b', '', idx_sql)
            try:
                with mysql_conn.cursor() as mysql_cur:
                    mysql_cur.execute(idx_sql)
            except Exception as idx_err:
                # Ignore index creation failure if index already exists
                pass

    # Enable foreign key checks back
    with mysql_conn.cursor() as mysql_cur:
        mysql_cur.execute("SET FOREIGN_KEY_CHECKS = 1;")
        
    mysql_conn.commit()
    mysql_conn.close()
    sqlite_conn.close()
    print(f"[+] Successfully migrated '{sqlite_file}' database.")

if __name__ == '__main__':
    migrate_database('library_v3.db', MYSQL_DB_PROD)
    migrate_database('demo.db', MYSQL_DB_DEMO)
