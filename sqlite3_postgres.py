import os
import re
import sqlite3
import urllib.parse
import psycopg2
import threading
from dotenv import load_dotenv

# Load env variables if .env exists
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL')

# Expose standard exception types so code can catch them transparently
OperationalError = sqlite3.OperationalError
IntegrityError = sqlite3.IntegrityError
ProgrammingError = sqlite3.ProgrammingError
Row = sqlite3.Row

def map_exception(e):
    if hasattr(e, 'pgcode') and e.pgcode in ('42P01', '42701', '42P07'):
        return sqlite3.OperationalError(str(e))
    if isinstance(e, psycopg2.OperationalError):
        return sqlite3.OperationalError(str(e))
    elif isinstance(e, psycopg2.IntegrityError):
        return sqlite3.IntegrityError(str(e))
    elif isinstance(e, psycopg2.ProgrammingError):
        return sqlite3.ProgrammingError(str(e))
    return e


def sqlite_to_postgres_query(query_str):
    if not query_str:
        return query_str
        
    query_upper = query_str.strip().upper()
    
    # 1. Handle schema PRAGMA replacements first
    if "SELECT" in query_upper and "SQL" in query_upper and "SQLITE_MASTER" in query_upper:
        if "personal_libraries" in query_str.lower():
            return 'SELECT \'CREATE TABLE personal_libraries (id INT)\' AS "sql"'
            
    if "PRAGMA TABLE_INFO" in query_upper:
        tbl_match = re.search(r'(?i)PRAGMA\s+table_info\s*\(\s*([a-zA-Z0-9_]+)\s*\)', query_str)
        if tbl_match:
            tbl_name = tbl_match.group(1)
            # Replicate PRAGMA table_info columns: (cid, name, type, notnull, dflt_value, pk)
            return f"""
                SELECT 
                    0 AS cid, 
                    c.column_name AS name, 
                    c.data_type AS type, 
                    CASE WHEN c.is_nullable='YES' THEN 0 ELSE 1 END AS notnull, 
                    c.column_default AS dflt_value, 
                    CASE WHEN tc.constraint_type='PRIMARY KEY' THEN 1 ELSE 0 END AS pk 
                FROM information_schema.columns c
                LEFT JOIN information_schema.key_column_usage kcu 
                  ON c.table_schema = kcu.table_schema 
                  AND c.table_name = kcu.table_name 
                  AND c.column_name = kcu.column_name
                LEFT JOIN information_schema.table_constraints tc 
                  ON kcu.constraint_name = tc.constraint_name 
                  AND kcu.table_schema = tc.table_schema 
                  AND tc.constraint_type = 'PRIMARY KEY'
                WHERE c.table_schema = 'public' AND c.table_name = '{tbl_name}'
            """
    
    # 2. Check if other PRAGMA statement
    if query_upper.startswith('PRAGMA'):
        return "SELECT 1" # No-op query for Postgres
        
    # 3. Parse and replace '?' with '%s' and '"' with "'" respecting quotes
    new_chars = []
    in_single = False
    in_double = False
    in_escape = False
    
    i = 0
    n = len(query_str)
    while i < n:
        c = query_str[i]
        if in_escape:
            in_escape = False
            new_chars.append(c)
        elif c == '\\':
            in_escape = True
            new_chars.append(c)
        elif c == "'" and not in_double:
            in_single = not in_single
            new_chars.append(c)
        elif c == '"' and not in_single:
            in_double = not in_double
            new_chars.append("'") # Translate double quotes to single quotes for literal compatibility
        elif c == '?' and not in_single and not in_double:
            new_chars.append('%s')
        else:
            new_chars.append(c)
        i += 1
        
    sql = "".join(new_chars)
    
    # 4. Keyword transformations
    # INSERT OR IGNORE -> INSERT
    sql = re.sub(r'(?i)\bINSERT\s+OR\s+IGNORE\b', 'INSERT', sql)
    
    # SQLite AUTOINCREMENT -> SERIAL
    sql = re.sub(r'(?i)\b(INTEGER|INT)\s+PRIMARY\s+KEY\s+(AUTOINCREMENT|AUTO_INCREMENT)\b', 'SERIAL PRIMARY KEY', sql)
    sql = re.sub(r'(?i)\b(INTEGER|INT)\s+PRIMARY\s+KEY\b', 'SERIAL PRIMARY KEY', sql)
    sql = re.sub(r'(?i)\bAUTOINCREMENT\b', '', sql)
    
    # SQLite sqlite_master -> information_schema.tables
    sql = re.sub(r'(?i)\bSELECT\s+name\s+FROM\s+sqlite_master\b', "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'public'", sql)
    sql = re.sub(
        r'(?i)\bFROM\s+sqlite_master\s+WHERE\s+type\s*=\s*[\'"]table[\'"]\s+AND\s+name\s*=\s*([^\s\)]+)', 
        r"FROM information_schema.tables WHERE table_schema = 'public' AND table_name = \1", 
        sql
    )
    sql = re.sub(
        r'(?i)\bFROM\s+sqlite_master\s+WHERE\s+type\s*=\s*[\'"]table[\'"]', 
        "FROM information_schema.tables WHERE table_schema = 'public'", 
        sql
    )
    
    # Translate INSERT OR REPLACE into ON CONFLICT UPDATE for settings
    if "INSERT OR REPLACE INTO settings" in sql:
        sql = sql.replace("INSERT OR REPLACE INTO settings", "INSERT INTO settings")
        sql += " ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value"
        
    # Strip FOREIGN KEY references lines from table creations to avoid ordering lock issues
    if "CREATE TABLE" in sql.upper():
        lines = sql.splitlines()
        new_lines = []
        for line in lines:
            if "FOREIGN KEY" in line.upper() and "REFERENCES" in line.upper():
                continue
            new_lines.append(line)
        sql = "\n".join(new_lines)
        sql = re.sub(r',\s*\)', '\n)', sql)

    return sql

class Row:
    def __init__(self, cursor, values):
        self._keys = [desc[0] for desc in cursor.description]
        self._values = values
        self._map = {}
        for k, v in zip(self._keys, values):
            self._map[k] = v
            self._map[k.lower()] = v

    def __getitem__(self, item):
        if isinstance(item, int):
            val = self._values[item]
            col_name = self._keys[item].lower()
            if col_name in ('is_banned', 'is_read', 'cancel_at_period_end', 'featured', 'passed', 'finished'):
                if val is not None:
                    if str(val) in ('1', 'True'):
                        return 1
                    elif str(val) in ('0', 'False'):
                        return 0
            return val
        elif isinstance(item, str):
            if item in self._map:
                val = self._map[item]
            elif item.lower() in self._map:
                val = self._map[item.lower()]
            else:
                raise KeyError(item)
                
            if item.lower() in ('is_banned', 'is_read', 'cancel_at_period_end', 'featured', 'passed', 'finished'):
                if val is not None:
                    if str(val) in ('1', 'True'):
                        return 1
                    elif str(val) in ('0', 'False'):
                        return 0
            return val
        raise TypeError("Row indices must be integers or strings")

    def keys(self):
        return self._keys

    def __len__(self):
        return len(self._values)

    def __iter__(self):
        return iter(self._values)
        
    def __repr__(self):
        return f"<Row {dict(zip(self._keys, self._values))}>"

class PostgresCursorWrapper:
    def __init__(self, cursor, conn_wrapper):
        self.cursor = cursor
        self.conn_wrapper = conn_wrapper
        
    def execute(self, sql, parameters=None):
        translated = sqlite_to_postgres_query(sql)
        is_insert_ignore = "INSERT OR IGNORE" in sql.upper() or "INSERT IGNORE" in sql.upper()
        is_create_index = "CREATE INDEX" in sql.upper() or "CREATE UNIQUE INDEX" in sql.upper()
        
        conn = self.conn_wrapper.conn
        has_savepoint = False
        
        try:
            with conn.cursor() as tx_cur:
                tx_cur.execute("SAVEPOINT pg_execute_savepoint")
            has_savepoint = True
        except Exception:
            pass

        try:
            if is_insert_ignore:
                try:
                    self.cursor.execute(translated, parameters)
                    if has_savepoint:
                        with conn.cursor() as tx_cur:
                            tx_cur.execute("RELEASE SAVEPOINT pg_execute_savepoint")
                except Exception as e:
                    if has_savepoint:
                        with conn.cursor() as tx_cur:
                            tx_cur.execute("ROLLBACK TO SAVEPOINT pg_execute_savepoint")
                    # Catch Unique Violation (SQLSTATE 23505) and ignore it
                    if hasattr(e, 'pgcode') and e.pgcode == '23505':
                        return self
                    raise map_exception(e)
            else:
                try:
                    self.cursor.execute(translated, parameters)
                    if has_savepoint:
                        with conn.cursor() as tx_cur:
                            tx_cur.execute("RELEASE SAVEPOINT pg_execute_savepoint")
                except Exception as e:
                    if is_create_index and hasattr(e, 'pgcode') and e.pgcode == '42P01':
                        if has_savepoint:
                            with conn.cursor() as tx_cur:
                                tx_cur.execute("ROLLBACK TO SAVEPOINT pg_execute_savepoint")
                                tx_cur.execute("RELEASE SAVEPOINT pg_execute_savepoint")
                        return self
                    raise e
        except Exception as e:
            if has_savepoint:
                try:
                    with conn.cursor() as tx_cur:
                        tx_cur.execute("ROLLBACK TO SAVEPOINT pg_execute_savepoint")
                except Exception:
                    pass
            raise map_exception(e)
        return self



        
    def fetchone(self):
        try:
            row = self.cursor.fetchone()
        except Exception as e:
            raise map_exception(e)
        if row is None:
            return None
        if self.conn_wrapper.row_factory:
            return self.conn_wrapper.row_factory(self, row)
        return row
        
    def fetchall(self):
        try:
            rows = self.cursor.fetchall()
        except Exception as e:
            raise map_exception(e)
        if self.conn_wrapper.row_factory:
            return [self.conn_wrapper.row_factory(self, r) for r in rows]
        return rows
        
    @property
    def description(self):
        return self.cursor.description
        
    @property
    def lastrowid(self):
        # Postgres uses RETURNING to get insert IDs, but for standard SERIAL primary keys,
        # we can query lastval() if supported, or fetch it. Since Flask app doesn't rely
        # heavily on lastrowid in SQLite code, we return cursor.lastrowid or 0.
        try:
            self.cursor.execute("SELECT lastval()")
            return self.cursor.fetchone()[0]
        except Exception:
            return 0
        
    def close(self):
        self.cursor.close()

class PostgresConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn
        self.row_factory = None
        
    def cursor(self):
        return PostgresCursorWrapper(self.conn.cursor(), self)
        
    def execute(self, sql, parameters=None):
        cur = self.cursor()
        cur.execute(sql, parameters)
        return cur
        
    def commit(self):
        try:
            self.conn.commit()
        except Exception as e:
            raise map_exception(e)
            
    def rollback(self):
        try:
            self.conn.rollback()
        except Exception as e:
            raise map_exception(e)
            
    def close(self):
        self.conn.close()

# Connection Pool for Postgres
from psycopg2.pool import ThreadedConnectionPool

class PostgresConnectionPool:
    def __init__(self, dsn, max_size=20):
        url = urllib.parse.urlparse(dsn)
        self._pool = ThreadedConnectionPool(
            1, max_size,
            host=url.hostname,
            port=url.port,
            user=url.username,
            password=url.password,
            database=url.path[1:],
            sslmode='require',
            connect_timeout=10
        )

    def get(self):
        return self._pool.getconn()

    def put(self, conn):
        try:
            self._pool.putconn(conn)
        except Exception:
            pass

_pg_pool = None
_pg_pool_lock = threading.Lock()

class PooledPostgresConnectionWrapper(PostgresConnectionWrapper):
    def __init__(self, conn, pool):
        super().__init__(conn)
        self._pool = pool
        self._closed = False

    def close(self):
        if not self._closed:
            self._closed = True
            try:
                self.conn.commit()
            except Exception:
                pass
            self._pool.put(self.conn)

# Proxy connect function
def connect(database, *args, **kwargs):
    global _pg_pool
    if not DATABASE_URL or 'demo.db' in database:
        # Fallback to standard SQLite connection for demo database
        return sqlite3.connect(database, *args, **kwargs)
        
    if _pg_pool is None:
        with _pg_pool_lock:
            if _pg_pool is None:
                _pg_pool = PostgresConnectionPool(DATABASE_URL, max_size=3)
                
    raw_conn = _pg_pool.get()
    return PooledPostgresConnectionWrapper(raw_conn, _pg_pool)


