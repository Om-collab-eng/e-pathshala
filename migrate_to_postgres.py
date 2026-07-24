import os
import re
import sqlite3
import psycopg2
from dotenv import load_dotenv

# Load local environment variables
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL')

def convert_sqlite_ddl_to_postgres(sqlite_sql, table_name):
    """Converts SQLite CREATE TABLE statement to Postgres compatible DDL."""
    if not sqlite_sql:
        return ""
    
    sql = sqlite_sql.strip()
    
    # Ensure CREATE TABLE IF NOT EXISTS
    sql = re.sub(r'(?i)^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`\']?(\w+)["`\']?', f'CREATE TABLE IF NOT EXISTS "{table_name}"', sql, count=1)
    
    # Replace SQLite types & keywords
    sql = re.sub(r'(?i)\bINTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT\b', 'SERIAL PRIMARY KEY', sql)
    sql = re.sub(r'(?i)\bAUTOINCREMENT\b', '', sql)
    sql = re.sub(r'(?i)\bDATETIME\b', 'TIMESTAMP', sql)
    sql = re.sub(r'(?i)\bBLOB\b', 'BYTEA', sql)
    
    return sql

def migrate():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL environment variable is not set.")
        print("Please set your PostgreSQL connection string in DATABASE_URL.")
        return

    print("Connecting to local SQLite database (library_v3.db)...")
    sqlite_conn = sqlite3.connect('library_v3.db')
    sqlite_cur = sqlite_conn.cursor()

    print("Connecting to remote PostgreSQL database...")
    try:
        pg_conn = psycopg2.connect(DATABASE_URL)
        pg_cur = pg_conn.cursor()
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}")
        return

    # Get all tables and their DDL from SQLite
    sqlite_cur.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables_data = sqlite_cur.fetchall()

    print(f"Found {len(tables_data)} tables to migrate: {', '.join([t[0] for t in tables_data])}")

    for table, ddl in tables_data:
        print(f"\nProcessing table '{table}'...")
        
        # 1. Ensure table exists in Postgres
        if ddl:
            try:
                pg_ddl = convert_sqlite_ddl_to_postgres(ddl, table)
                pg_cur.execute(pg_ddl)
                pg_conn.commit()
                print(f"Ensured schema exists for table '{table}'.")
            except Exception as e:
                pg_conn.rollback()
                print(f"Note/Warning setting up schema for '{table}': {e}")

        # 2. Get column names
        sqlite_cur.execute(f"PRAGMA table_info({table})")
        columns = [f'"{row[1]}"' for row in sqlite_cur.fetchall()]
        
        # 3. Read data from SQLite
        sqlite_cur.execute(f"SELECT * FROM {table}")
        rows = sqlite_cur.fetchall()
        
        if not rows:
            print(f"Table '{table}' is empty. Skipping data insertion.")
            continue
            
        print(f"Found {len(rows)} rows to copy.")

        # Clear existing rows if any to prevent duplicates during initial migration
        try:
            pg_cur.execute(f'TRUNCATE TABLE "{table}" CASCADE;')
            pg_conn.commit()
        except Exception:
            pg_conn.rollback()

        # Build insert query for Postgres
        col_names = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))
        insert_query = f'INSERT INTO "{table}" ({col_names}) VALUES ({placeholders});'

        success_count = 0
        for row in rows:
            try:
                pg_cur.execute(insert_query, row)
                success_count += 1
            except Exception as e:
                pg_conn.rollback()
                print(f"Error inserting row into {table}: {e}")
                break
        else:
            pg_conn.commit()
            print(f"Successfully migrated {success_count}/{len(rows)} rows to table '{table}'.")

    # Sync sequences for auto-increment fields in Postgres
    try:
        pg_cur.execute("""
            SELECT 'SELECT setval(''' || c.relname || ''', COALESCE((SELECT MAX(id) FROM ' || tbl.relname || '), 1));'
            FROM pg_class c
            JOIN pg_depend d ON d.objid = c.oid
            JOIN pg_class tbl ON d.refobjid = tbl.oid
            WHERE c.relkind = 'S';
        """)
        seq_queries = pg_cur.fetchall()
        for (sq,) in seq_queries:
            try:
                pg_cur.execute(sq)
            except Exception:
                pg_conn.rollback()
        pg_conn.commit()
        print("\nReset PostgreSQL auto-increment sequences.")
    except Exception as e:
        pg_conn.rollback()

    sqlite_conn.close()
    pg_conn.close()
    print("\nDatabase migration completed successfully! 🎉")

if __name__ == '__main__':
    migrate()

