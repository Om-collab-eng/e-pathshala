import os
from dotenv import load_dotenv

load_dotenv()

# Select database adapter based on environment variables
USE_SQLITE = os.getenv('USE_SQLITE', '').lower() in ('1', 'true', 'yes')
DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL')

if USE_SQLITE:
    print("Database Adapter: Using SQLite (built-in sqlite3)")
    import sqlite3 as adapter
elif DATABASE_URL:
    print("Database Adapter: Using Postgres (sqlite3_postgres)")
    import sqlite3_postgres as adapter
else:
    print("Database Adapter: Using MySQL (sqlite3_mysql)")
    import sqlite3_mysql as adapter

# Expose everything from the selected adapter
connect = adapter.connect
Row = adapter.Row
OperationalError = adapter.OperationalError
IntegrityError = adapter.IntegrityError
ProgrammingError = adapter.ProgrammingError
