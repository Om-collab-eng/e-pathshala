import os
from dotenv import load_dotenv

load_dotenv()

# Select database adapter based on environment variables
DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL')

if DATABASE_URL:
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
