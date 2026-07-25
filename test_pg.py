import os
import psycopg2
import traceback

def run_test():
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        conn.autocommit = False
        cur = conn.cursor()
        
        print("Starting transaction block...")
        
        cur.execute("SAVEPOINT pg_execute_savepoint")
        try:
            print("Running ALTER TABLE that will fail...")
            cur.execute('ALTER TABLE non_existent_table ADD COLUMN foo TEXT')
            cur.execute("RELEASE SAVEPOINT pg_execute_savepoint")
        except Exception as e:
            print("Caught exception:", type(e).__name__)
            cur.execute("ROLLBACK TO SAVEPOINT pg_execute_savepoint")
            
        print("Running next statement...")
        try:
            cur.execute('CREATE TABLE IF NOT EXISTS test_schools (id SERIAL PRIMARY KEY)')
            print("CREATE TABLE succeeded!")
        except Exception as e:
            print("CREATE TABLE failed:", type(e).__name__)
            traceback.print_exc()
            
    except Exception as e:
        print("Fatal error:", e)

run_test()
