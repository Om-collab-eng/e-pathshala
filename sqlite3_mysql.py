import os
import re
import sqlite3
import pymysql
import pymysql.constants.CLIENT
from dotenv import load_dotenv

# Load env variables if .env exists
load_dotenv()

import socket
import subprocess

def resolve_host(host):
    if not host or host == 'localhost' or host == '127.0.0.1':
        return host
    try:
        return socket.gethostbyname(host)
    except Exception:
        try:
            output = subprocess.check_output(["nslookup", host], text=True)
            for line in output.splitlines():
                if "Address:" in line and "#" not in line:
                    ip = line.split("Address:")[1].strip()
                    if ip:
                        return ip
        except Exception:
            pass
    return host

MYSQL_HOST = resolve_host(os.getenv('MYSQL_HOST').strip() if os.getenv('MYSQL_HOST') else None)
MYSQL_PORT = int(os.getenv('MYSQL_PORT').strip()) if os.getenv('MYSQL_PORT') else 3306
MYSQL_USER = os.getenv('MYSQL_USER', 'root').strip()
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '').strip()
MYSQL_DB_PROD = os.getenv('MYSQL_DB_PROD', 'library_v3').strip()
MYSQL_DB_DEMO = os.getenv('MYSQL_DB_DEMO', 'library_demo').strip()

# Expose standard exception types so code can catch them transparently
if not MYSQL_HOST:
    OperationalError = sqlite3.OperationalError
    IntegrityError = sqlite3.IntegrityError
    ProgrammingError = sqlite3.ProgrammingError
    Row = sqlite3.Row
else:
    class OperationalError(sqlite3.OperationalError):
        pass

    class IntegrityError(sqlite3.IntegrityError):
        pass

    class ProgrammingError(sqlite3.ProgrammingError):
        pass

def map_exception(e):
    if isinstance(e, pymysql.err.OperationalError):
        return OperationalError(str(e))
    elif isinstance(e, pymysql.err.IntegrityError):
        return IntegrityError(str(e))
    elif isinstance(e, pymysql.err.ProgrammingError):
        return ProgrammingError(str(e))
    return e

def sqlite_to_mysql_query(query_str):
    if not query_str:
        return query_str
        
    query_upper = query_str.strip().upper()
    
    # 1. Handle schema PRAGMA replacements first
    if "SELECT" in query_upper and "SQL" in query_upper and "SQLITE_MASTER" in query_upper:
        if "personal_libraries" in query_str.lower():
            return "SELECT 'CREATE TABLE personal_libraries (id INT)' AS `sql`"
            
    if "PRAGMA TABLE_INFO" in query_upper:
        tbl_match = re.search(r'(?i)PRAGMA\s+table_info\s*\(\s*([a-zA-Z0-9_]+)\s*\)', query_str)
        if tbl_match:
            tbl_name = tbl_match.group(1)
            # Replicate PRAGMA table_info columns: (cid, name, type, notnull, dflt_value, pk)
            return f"""
                SELECT 
                    0 AS cid, 
                    column_name AS name, 
                    data_type AS type, 
                    IF(is_nullable='YES', 0, 1) AS notnull, 
                    column_default AS dflt_value, 
                    IF(column_key='PRI', 1, 0) AS pk 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() AND table_name = '{tbl_name}'
            """
    
    # 2. Check if other PRAGMA statement
    if query_upper.startswith('PRAGMA'):
        return "SELECT 1" # No-op query for MySQL
        
    # 3. Parse and replace '?' with '%s' respecting quotes
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
            new_chars.append(c)
        elif c == '?' and not in_single and not in_double:
            new_chars.append('%s')
        else:
            new_chars.append(c)
        i += 1
        
    sql = "".join(new_chars)
    
    # 4. Keyword transformations
    # INSERT OR IGNORE -> INSERT IGNORE
    sql = re.sub(r'(?i)\bINSERT\s+OR\s+IGNORE\b', 'INSERT IGNORE', sql)
    # INSERT OR REPLACE -> REPLACE
    sql = re.sub(r'(?i)\bINSERT\s+OR\s+REPLACE\b', 'REPLACE', sql)
    
    # SQLite AUTOINCREMENT -> AUTO_INCREMENT and ensure INTEGER PRIMARY KEY maps to AUTO_INCREMENT
    sql = re.sub(r'(?i)\b(INTEGER|INT)\s+PRIMARY\s+KEY\s+(AUTOINCREMENT|AUTO_INCREMENT)\b', 'INT AUTO_INCREMENT PRIMARY KEY', sql)
    sql = re.sub(r'(?i)\b(INTEGER|INT)\s+PRIMARY\s+KEY\b', 'INT AUTO_INCREMENT PRIMARY KEY', sql)
    sql = re.sub(r'(?i)\bAUTOINCREMENT\b', 'AUTO_INCREMENT', sql)
    
    # Map TEXT columns with DEFAULT constraints to VARCHAR(255) for MySQL compatibility
    sql = re.sub(r'(?i)\bTEXT\s+DEFAULT\b', 'VARCHAR(255) DEFAULT', sql)
    
    # SQLite sqlite_master -> information_schema.tables
    sql = re.sub(r'(?i)\bSELECT\s+name\s+FROM\s+sqlite_master\b', 'SELECT table_name AS name FROM sqlite_master', sql)
    sql = re.sub(
        r'(?i)\bFROM\s+sqlite_master\s+WHERE\s+type\s*=\s*[\'"]table[\'"]\s+AND\s+name\s*=\s*([^\s\)]+)', 
        r'FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = \1', 
        sql
    )
    sql = re.sub(
        r'(?i)\bFROM\s+sqlite_master\s+WHERE\s+type\s*=\s*[\'"]table[\'"]', 
        'FROM information_schema.tables WHERE table_schema = DATABASE()', 
        sql
    )
    
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

class MySQLCursorWrapper:
    def __init__(self, cursor, conn_wrapper):
        self.cursor = cursor
        self.conn_wrapper = conn_wrapper
        
    def execute(self, sql, parameters=None):
        translated = sqlite_to_mysql_query(sql)
        try:
            self.cursor.execute(translated, parameters)
        except Exception as e:
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
        return self.cursor.lastrowid
        
    def close(self):
        self.cursor.close()

class MySQLConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn
        self.row_factory = None
        
    def cursor(self):
        return MySQLCursorWrapper(self.conn.cursor(), self)
        
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

# Proxy connect function
def connect(database, *args, **kwargs):
    if not MYSQL_HOST:
        # Fallback to standard SQLite connection
        return sqlite3.connect(database, *args, **kwargs)
        
    # Map production database files to MySQL database name
    db_name = MYSQL_DB_PROD
    if 'demo.db' in database:
        db_name = MYSQL_DB_DEMO
        
    # Connect to MySQL
    conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=db_name,
        client_flag=pymysql.constants.CLIENT.MULTI_STATEMENTS
    )
    return MySQLConnectionWrapper(conn)
