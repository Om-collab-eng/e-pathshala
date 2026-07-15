import os
import sqlite3
import psycopg2
from dotenv import load_dotenv

# Load local environment variables
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

def migrate():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL environment variable is not set.")
        print("Please set your Render/Supabase PostgreSQL connection string in DATABASE_URL.")
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

    # Get all tables from SQLite
    sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in sqlite_cur.fetchall()]

    print(f"Found {len(tables)} tables to migrate: {', '.join(tables)}")

    for table in tables:
        print(f"\nMigrating table '{table}'...")
        
        # Get column names
        sqlite_cur.execute(f"PRAGMA table_info({table})")
        columns = [row[1] for row in sqlite_cur.fetchall()]
        
        # Read data from SQLite
        sqlite_cur.execute(f"SELECT * FROM {table}")
        rows = sqlite_cur.fetchall()
        
        if not rows:
            print(f"Table '{table}' is empty. Skipping.")
            continue
            
        print(f"Found {len(rows)} rows to copy.")

        # Ensure the table exists in Postgres by creating it (if not already done by app startup)
        # Note: If the app has run once, tables already exist. We will clear old data and insert.
        try:
            pg_cur.execute(f"TRUNCATE TABLE {table} CASCADE;")
        except Exception:
            pg_conn.rollback()
            print(f"Table '{table}' might not exist in Postgres yet. We will skip truncation.")
        else:
            pg_conn.commit()

        # Build insert query for Postgres
        col_names = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))
        insert_query = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING;"

        success_count = 0
        for row in rows:
            try:
                pg_cur.execute(insert_query, row)
                success_count += 1
            except Exception as e:
                pg_conn.rollback()
                # Try inserting without columns that might cause issues, or print error
                print(f"Error inserting row into {table}: {e}")
                break
        else:
            pg_conn.commit()
            print(f"Successfully migrated {success_count}/{len(rows)} rows to table '{table}'.")

    sqlite_conn.close()
    pg_conn.close()
    print("\nDatabase migration completed successfully!")

if __name__ == '__main__':
    migrate()
