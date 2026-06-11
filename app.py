import os, uuid
from flask import Flask, render_template, request, redirect, session, url_for, has_request_context, jsonify, Response
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
import io
import csv
import pandas as pd
from datetime import datetime, timedelta
from urllib.parse import urlparse
import json
import google.generativeai as genai
from PIL import Image
from data_routes import data_bp
from billing_routes import billing_bp
import barcode
from barcode.writer import ImageWriter

import threading
import time
import firebase_admin
from firebase_admin import credentials, storage

app = Flask(__name__)
app.secret_key = "supersecretkey"
app.permanent_session_lifetime = timedelta(days=30)
app.register_blueprint(data_bp, url_prefix='/data')
app.register_blueprint(billing_bp)
SUPER_ADMIN_PASS = "MASTER_99" # Hard admin password for global access

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# FOR LOCAL/RENDER ENVIRONMENTS, USE BASE_DIR
TMP_DIR = BASE_DIR
DB_FILE = os.path.join(TMP_DIR, 'library_v3.db')
DEMO_DB_FILE = os.path.join(TMP_DIR, 'demo.db')
BARCODE_DIR = os.path.join(TMP_DIR, 'static', 'barcodes')
DIGITAL_CONTENT_DIR = os.path.join(TMP_DIR, 'static', 'digital_content')
UPLOADS_DIR = os.path.join(TMP_DIR, 'static', 'uploads')

if not os.path.exists(BARCODE_DIR):
    os.makedirs(BARCODE_DIR)
if not os.path.exists(DIGITAL_CONTENT_DIR):
    os.makedirs(DIGITAL_CONTENT_DIR)
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)

# --- FIREBASE PERSISTENCE SYNC FOR SERVERLESS ---
try:
    # On Cloud Functions, firebase_admin is already initialized by the environment usually,
    # but we initialize it if it isn't.
    if not firebase_admin._apps:
        cred = credentials.Certificate(os.path.join(BASE_DIR, 'firebase-key.json'))
        firebase_admin.initialize_app(cred, {
            'storageBucket': 'e-pathshala-39d28.firebasestorage.app'
        })
    print("Firebase initialized successfully.")
    
    # We download on cold start exactly once
    bucket = storage.bucket()
    blob = bucket.blob('backups/library_v3.db')
    if blob.exists():
        blob.download_to_filename(DB_FILE)
        print("Restored library_v3.db from Firebase Storage (Cold Start).")
        
    # Download digital content on cold start
    blobs = bucket.list_blobs(prefix="backups/digital_content/")
    for blob in blobs:
        filename = blob.name.split("/")[-1]
        if filename:
            blob.download_to_filename(os.path.join(DIGITAL_CONTENT_DIR, filename))

    @app.after_request
    def sync_to_firebase_after_request(response):
        # If the request was a POST, PUT, or DELETE, data was likely modified
        if request.method in ["POST", "PUT", "DELETE"]:
            try:
                # Sync Database
                if os.path.exists(DB_FILE):
                    blob = bucket.blob('backups/library_v3.db')
                    blob.upload_from_filename(DB_FILE)
                
                # We could sync files here too, but they are usually uploaded in specific routes.
                # For safety, let's do a quick sync of the folders.
                for root, _, files in os.walk(DIGITAL_CONTENT_DIR):
                    for file in files:
                        local_path = os.path.join(root, file)
                        blob = bucket.blob(f"backups/digital_content/{file}")
                        blob.upload_from_filename(local_path)
                        
                print("Lifecycle Sync: Synced DB and files to Firebase Storage.")
            except Exception as e:
                print(f"Firebase Lifecycle Sync Error: {e}")
        return response
    
except Exception as e:
    print(f"Firebase Initialization Error: {e}")
# --------------------------------------------

from flask import Flask, render_template, request, redirect, session, url_for, has_request_context

@app.before_request
def check_maintenance_mode():
    if request.path.startswith('/static') or request.path.startswith('/super-admin') or request.path == '/login' or request.path == '/logout':
        return None
    try:
        conn = get_db_connection()
        setting = conn.execute('SELECT value FROM system_settings WHERE key="maintenance_mode"').fetchone()
        conn.close()
        if setting and setting['value'] == '1' and session.get('role') != 'super_admin':
            return render_template('maintenance.html')
    except Exception as e:
        pass # system_settings might not exist yet
    return None

from permissions import get_school_plan, get_school_permissions, get_school_limits, PLANS, require_permission

@app.context_processor
def inject_permissions():
    if session.get('school_code') and session.get('school_code') != 'APP':
        conn = get_db_connection()
        try:
            plan = get_school_plan(conn, session.get('school_code'))
            perms = get_school_permissions(conn, session.get('school_code'))
            limits = get_school_limits(conn, session.get('school_code'))
            return dict(school_plan=plan, school_perms=perms, school_limits=limits)
        except Exception as e:
            pass
        finally:
            conn.close()
    return dict(school_plan="FREE", school_perms=PLANS["FREE"]["perms"], school_limits=PLANS["FREE"]["limits"])
def get_db_connection():
    # Dynamically select DB based on session
    use_db = DB_FILE
    if has_request_context():
        if session.get('is_demo'):
            use_db = DEMO_DB_FILE
    
    conn = sqlite3.connect(use_db)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    # Schools Table
    conn.execute('''CREATE TABLE IF NOT EXISTS schools 
                 (id INTEGER PRIMARY KEY, name TEXT, school_code TEXT UNIQUE, 
                  librarian_name TEXT, max_books INTEGER, max_students INTEGER, 
                  created_at TEXT)''')
    try: conn.execute('ALTER TABLE schools ADD COLUMN activePlan TEXT DEFAULT "FREE"')
    except: pass
    try: conn.execute('ALTER TABLE schools ADD COLUMN subscriptionStatus TEXT DEFAULT "active"')
    except: pass
    try: conn.execute('ALTER TABLE schools ADD COLUMN expiryDate TEXT')
    except: pass
    try: conn.execute('ALTER TABLE schools ADD COLUMN studentLimit INTEGER DEFAULT 50')
    except: pass
    try: conn.execute('ALTER TABLE schools ADD COLUMN librarianLimit INTEGER DEFAULT 1')
    except: pass
    try: conn.execute('ALTER TABLE schools ADD COLUMN adminLimit INTEGER DEFAULT 1')
    except: pass
                  
    conn.execute('''CREATE TABLE IF NOT EXISTS users 
                 (id INTEGER PRIMARY KEY, name TEXT, admission_no TEXT, class TEXT, 
                  phone TEXT, email TEXT, password TEXT, role TEXT, session_token TEXT,
                  school_code TEXT DEFAULT 'APP')''')
                  
    conn.execute('''CREATE TABLE IF NOT EXISTS books 
                 (id INTEGER PRIMARY KEY, title TEXT, author TEXT, genre TEXT,
                  barcode_id TEXT UNIQUE, total_copies INTEGER, available_copies INTEGER,
                  school_code TEXT)''')
                  
    conn.execute('''CREATE TABLE IF NOT EXISTS transactions 
                 (id INTEGER PRIMARY KEY, user_id INTEGER, book_id INTEGER, 
                  issue_date TEXT, due_date TEXT, return_date TEXT, fine REAL,
                  class TEXT, school_code TEXT)''')

    conn.execute('''CREATE TABLE IF NOT EXISTS pending_requests 
                 (id INTEGER PRIMARY KEY, user_id INTEGER, school_name TEXT, 
                  librarian_name TEXT, b_qty INTEGER, s_qty INTEGER, 
                  status TEXT DEFAULT 'pending', created_at TEXT, phone TEXT, password TEXT)''')
                  
    conn.execute('''CREATE TABLE IF NOT EXISTS organization_requests 
                 (id INTEGER PRIMARY KEY, org_name TEXT, contact_person TEXT, 
                  email TEXT, phone TEXT, status TEXT, created_at TEXT)''')
                  
    # Migration: Add email to users if it doesn't exist
    try:
        conn.execute('ALTER TABLE users ADD COLUMN email TEXT')
    except sqlite3.OperationalError:
        pass
                  
    conn.execute('''CREATE TABLE IF NOT EXISTS reservations 
                 (id INTEGER PRIMARY KEY, user_id INTEGER, book_id INTEGER, 
                  status TEXT DEFAULT 'Pending', created_at TEXT, school_code TEXT)''')
                  
    conn.execute('''CREATE TABLE IF NOT EXISTS notifications 
                 (id INTEGER PRIMARY KEY, user_id INTEGER, message TEXT, 
                  type TEXT, is_read INTEGER DEFAULT 0, created_at TEXT, school_code TEXT)''')
                  
    conn.execute('''CREATE TABLE IF NOT EXISTS logs 
                 (id INTEGER PRIMARY KEY, user_id INTEGER, action TEXT, 
                  module TEXT, ip_address TEXT, created_at TEXT, school_code TEXT)''')
                  
    conn.execute('''CREATE TABLE IF NOT EXISTS settings 
                 (id INTEGER PRIMARY KEY, setting_key TEXT UNIQUE, setting_value TEXT, 
                  school_code TEXT DEFAULT 'GLOBAL')''')
                  
    conn.execute('''CREATE TABLE IF NOT EXISTS digital_content (
            id INTEGER PRIMARY KEY, title TEXT, category TEXT, description TEXT,
            subject TEXT, class TEXT, tags TEXT, cover_url TEXT, file_url TEXT,
            student_id INTEGER, school_code TEXT, status TEXT DEFAULT 'Submitted',
            created_at TEXT, updated_at TEXT, rejection_reason TEXT,
            suggested_changes TEXT, featured INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0, downloads INTEGER DEFAULT 0)''')
            
    conn.execute('''CREATE TABLE IF NOT EXISTS content_reviews (
            id INTEGER PRIMARY KEY, content_id INTEGER, student_id INTEGER,
            rating INTEGER, review_title TEXT, review_comment TEXT,
            school_code TEXT, created_at TEXT)''')
            
    conn.execute('''CREATE TABLE IF NOT EXISTS content_reports (
            id INTEGER PRIMARY KEY, content_id INTEGER, reported_by INTEGER,
            reason TEXT, status TEXT DEFAULT 'Open', school_code TEXT,
            created_at TEXT)''')
            
    conn.execute('''CREATE TABLE IF NOT EXISTS content_moderation_logs 
                 (id INTEGER PRIMARY KEY, content_id INTEGER, title TEXT, author_name TEXT, 
                  school_code TEXT, removed_by INTEGER, removal_reason TEXT, created_at TEXT)''')
                  
    conn.execute('''CREATE TABLE IF NOT EXISTS reading_progress
                 (id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL, content_id INTEGER NOT NULL, 
                  last_page INTEGER DEFAULT 1, updated_at TEXT)''')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_progress_student ON reading_progress(student_id)')
    
    # Automated Migrations for Main DB
    for table, col in [('users', 'session_token'), ('users', 'admission_no'), ('books', 'genre'), 
                        ('users', 'school_code'), ('books', 'school_code'), ('transactions', 'school_code'),
                        ('pending_requests', 'phone'), ('pending_requests', 'password'),
                        ('books', 'cover_url'), ('books', 'description'), ('books', 'shelf_location'),
                        ('schools', 'status'), ('users', 'status'), ('users', 'is_banned'), ('users', 'permissions')]:
        try:
            conn.execute(f'ALTER TABLE {table} ADD COLUMN {col} TEXT')
        except sqlite3.OperationalError:
            pass
            
    # Database Indexes for Performance
    conn.execute('CREATE INDEX IF NOT EXISTS idx_users_school_code ON users(school_code)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_users_token ON users(session_token)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)')
            
    # Default School for existing data
    conn.execute('INSERT OR IGNORE INTO schools (name, school_code, librarian_name, created_at) VALUES (?,?,?,?)',
                 ('Legacy School', 'DEFAULT', 'Admin', '2024-01-01'))
    conn.execute('UPDATE users SET school_code = "DEFAULT" WHERE school_code IS NULL')
    conn.execute('UPDATE books SET school_code = "DEFAULT" WHERE school_code IS NULL')
    conn.execute('UPDATE transactions SET school_code = "DEFAULT" WHERE school_code IS NULL')
    
    conn.execute('UPDATE schools SET status = "active" WHERE status IS NULL')
    conn.execute('UPDATE users SET status = "active" WHERE status IS NULL')

    conn.commit()
    conn.close()

    # Sync Demo DB schema
    dconn = sqlite3.connect(DEMO_DB_FILE)
    # Ensure users table exists in Demo DB first
    dconn.execute('''CREATE TABLE IF NOT EXISTS users 
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            school_code TEXT,
            admission_no TEXT,
            class TEXT,
            session_token TEXT,
            is_banned INTEGER DEFAULT 0,
            email TEXT,
            permissions TEXT DEFAULT '["manage_books", "manage_students", "manage_transactions", "approve_content"]')''')
    
    dconn.execute('''CREATE TABLE IF NOT EXISTS schools 
                 (id INTEGER PRIMARY KEY, name TEXT, school_code TEXT UNIQUE, 
                  librarian_name TEXT, max_books INTEGER, max_students INTEGER, 
                  created_at TEXT)''')
                  
    dconn.execute('''CREATE TABLE IF NOT EXISTS books 
                 (id INTEGER PRIMARY KEY, title TEXT, author TEXT, genre TEXT,
                  barcode_id TEXT UNIQUE, total_copies INTEGER, available_copies INTEGER,
                  school_code TEXT)''')
                  
    dconn.execute('''CREATE TABLE IF NOT EXISTS transactions 
                 (id INTEGER PRIMARY KEY, user_id INTEGER, book_id INTEGER, 
                  issue_date TEXT, due_date TEXT, return_date TEXT, fine REAL,
                  class TEXT, school_code TEXT)''')
                  
    dconn.execute('''CREATE TABLE IF NOT EXISTS reservations 
                 (id INTEGER PRIMARY KEY, user_id INTEGER, book_id INTEGER, 
                  status TEXT DEFAULT 'Pending', created_at TEXT, school_code TEXT)''')
                  
    dconn.execute('''CREATE TABLE IF NOT EXISTS notifications 
                 (id INTEGER PRIMARY KEY, user_id INTEGER, message TEXT, 
                  type TEXT, is_read INTEGER DEFAULT 0, created_at TEXT, school_code TEXT)''')
                  
    dconn.execute('''CREATE TABLE IF NOT EXISTS organization_requests 
                 (id INTEGER PRIMARY KEY, org_name TEXT, contact_person TEXT, 
                  email TEXT, phone TEXT, status TEXT, created_at TEXT)''')
    
    # Migration for Demo DB: Add email to users if it doesn't exist
    try:
        dconn.execute('ALTER TABLE users ADD COLUMN email TEXT')
    except sqlite3.OperationalError:
        pass
                  
    dconn.execute('''CREATE TABLE IF NOT EXISTS digital_content (
            id INTEGER PRIMARY KEY, title TEXT, category TEXT, description TEXT,
            subject TEXT, class TEXT, tags TEXT, cover_url TEXT, file_url TEXT,
            student_id INTEGER, school_code TEXT, status TEXT DEFAULT 'Submitted',
            created_at TEXT, updated_at TEXT, rejection_reason TEXT,
            suggested_changes TEXT, featured INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0, downloads INTEGER DEFAULT 0)''')
            
    dconn.execute('''CREATE TABLE IF NOT EXISTS content_reviews (
            id INTEGER PRIMARY KEY, content_id INTEGER, student_id INTEGER,
            rating INTEGER, review_title TEXT, review_comment TEXT,
            school_code TEXT, created_at TEXT)''')
            
    dconn.execute('''CREATE TABLE IF NOT EXISTS content_reports (
            id INTEGER PRIMARY KEY, content_id INTEGER, reported_by INTEGER,
            reason TEXT, status TEXT DEFAULT 'Open', school_code TEXT,
            created_at TEXT)''')
            
    dconn.execute('''CREATE TABLE IF NOT EXISTS content_moderation_logs
                 (id INTEGER PRIMARY KEY, content_id INTEGER, title TEXT, author_name TEXT, 
                  school_code TEXT, removed_by INTEGER, removal_reason TEXT, created_at TEXT)''')

    dconn.execute('''CREATE TABLE IF NOT EXISTS reading_progress
                 (id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL, content_id INTEGER NOT NULL, 
                  last_page INTEGER DEFAULT 1, updated_at TEXT)''')
    dconn.execute('CREATE INDEX IF NOT EXISTS idx_progress_student ON reading_progress(student_id)')
    
    # Run migrations on Demo DB
    for table, col in [('users', 'session_token'), ('users', 'admission_no'), ('users', 'class'), ('users', 'school_code'),
                       ('books', 'school_code'), ('transactions', 'school_code'),
                       ('books', 'cover_url'), ('books', 'description'), ('books', 'shelf_location'), ('users', 'is_banned'), ('users', 'permissions')]:
        try:
            dconn.execute(f'ALTER TABLE {table} ADD COLUMN {col} TEXT')
        except sqlite3.OperationalError:
            pass
            
    # Check if demo admin exists, if not seed demo data
    demo_admin = dconn.execute("SELECT * FROM users WHERE role = 'admin' LIMIT 1").fetchone()
    if not demo_admin:
        # Add Demo Admin
        dconn.execute('INSERT OR IGNORE INTO users (name, phone, password, role, admission_no, school_code) VALUES (?,?,?,?,?,?)',
                     ('Admin Demo', '123', 'admin123', 'admin', '000', 'DEMO'))
        # Add Demo Students
        for i in range(1, 6):
            dconn.execute('INSERT OR IGNORE INTO users (name, phone, password, role, class, admission_no, school_code) VALUES (?,?,?,?,?,?,?)',
                         (f'Demo Student {i}', f'55500{i}', 'demo123', 'student', '9A', f'S{i}', 'DEMO'))
    
    # Ensure all demo users have school_code = 'DEMO'
    dconn.execute('UPDATE users SET school_code = "DEMO" WHERE school_code IS NULL')
    
    # Ensure demo admin has all permissions
    dconn.execute('UPDATE users SET permissions = \'["manage_books", "manage_students", "manage_transactions", "approve_content"]\' WHERE role = "admin" AND (permissions IS NULL OR permissions = "[]")')
    
    dconn.commit()
    dconn.close()

# Single Session Enforcement Middleware
@app.before_request
def check_session():
    # List of endpoints that don't need session check
    if request.endpoint in ['login', 'register', 'static', 'index']:
        return
    
    if 'user_id' in session:
        # Super Admin or Demo Bypass
        if session.get('user_id') == -1 or session.get('is_demo'):
            return

        conn = get_db_connection()
        user = conn.execute('SELECT session_token, name, admission_no, school_code FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        
        # If the token in DB doesn't match the one in cookie, logout
        if not user or user['session_token'] != session.get('token'):
            conn.close()
            session.clear()
            return redirect(url_for('login'))
        
        # Dynamically refresh school name in session
        if user['school_code']:
            school = conn.execute('SELECT name FROM schools WHERE school_code = ?', (user['school_code'],)).fetchone()
            if school:
                session['school_name'] = school['name']
            else:
                session['school_name'] = "E-Pathshala Network"
        else:
            session['school_name'] = "E-Pathshala Network"
            
        session.modified = True
        conn.close()
        
        # Check for profile completion (except on completion page/logout)
        if request.endpoint not in ['complete_profile', 'logout', 'static']:
            if not user['name'] or not user['admission_no']:
                # Only prompt once or provide skip logic handled in the template
                pass 

def calculate_fine(due_date_str):
    due_date = datetime.strptime(due_date_str, '%Y-%m-%d')
    today = datetime.now()
    if today > due_date:
        days_overdue = (today - due_date).days
        return days_overdue * 5, True
    return 0, False

@app.route('/demo-mode')
def enter_demo():
    session.clear()
    session['is_demo'] = True
    session['user_name'] = "Demo Visitor"
    session.modified = True
    return redirect('/login')

@app.route('/exit-demo')
def exit_demo():
    session.clear()
    return redirect('/?clear_demo=1')

@app.route('/robots.txt')
def robots():
    content = "User-agent: *\nDisallow: /admin/\nDisallow: /super-admin/\nDisallow: /student/\nDisallow: /billing/\nAllow: /\n\nSitemap: https://librika.in/sitemap.xml"
    return Response(content, mimetype="text/plain")

@app.route('/sitemap.xml')
def sitemap():
    import datetime
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://librika.in/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>"""
    return Response(content, mimetype="application/xml")

@app.route('/')
def index():
    if 'user_id' in session and not session.get('is_demo'):
        if session.get('role') == 'admin': return redirect('/admin')
        if session.get('role') == 'super_admin' or session.get('user_id') == -1: return redirect('/super-admin')
        if session.get('role') == 'student': return redirect('/student')
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session and not session.get('is_demo') and request.method == 'GET':
        if session.get('role') == 'admin': return redirect('/admin')
        if session.get('role') == 'super_admin' or session.get('user_id') == -1: return redirect('/super-admin')
        if session.get('role') == 'student': return redirect('/student')
        
    error = None
    is_demo_session = session.get('is_demo')
    
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        school_code = request.form.get('school_code', '').strip().upper()
        conn = get_db_connection()
        
        # Hard Super Admin Bypass
        if username.lower() == 'superadmin' and password == SUPER_ADMIN_PASS:
            session.clear()
            session.permanent = True
            session['user_id'] = -1
            session['user_name'] = "SYSTEM MASTER"
            session['role'] = 'super_admin'
            session['school_code'] = 'GLOBAL'
            session['token'] = 'super-token-master'
            session['permissions'] = ['manage_books', 'manage_students', 'manage_transactions', 'approve_content']
            return redirect('/super-admin')
            
        user = conn.execute('''SELECT * FROM users 
                                WHERE phone = ? AND password = ? AND school_code = ?''', 
                            (username, password, school_code)).fetchone()
        
        if user:
            user = dict(user)
            
            if user.get('is_banned'):
                conn.close()
                error = "This account has been banned or the school has been suspended. Please contact the administrator."
                return render_template('login.html', error=error)
                
            new_token = str(uuid.uuid4())
            conn.execute('UPDATE users SET session_token = ? WHERE id = ?', (new_token, user['id']))
            conn.commit()
            
            school_name = "E-Pathshala Network"
            if user.get('school_code'):
                school = conn.execute('SELECT name FROM schools WHERE school_code = ?', (user['school_code'],)).fetchone()
                if school:
                    school_name = school['name']
                    
            conn.close()
            
            session.clear() # Clear any existing session (demo etc)
            session.permanent = True
            session['user_id'] = user['id']
            session['user_name'] = user['name'] or "Member"
            session['role'] = user['role']
            session['token'] = new_token
            session['school_code'] = user.get('school_code')
            session['school_name'] = school_name
            session['admission_no'] = user.get('admission_no')
            session['class'] = user.get('class')
            
            import json
            try:
                session['permissions'] = json.loads(user.get('permissions', '[]')) if user.get('permissions') else []
            except:
                session['permissions'] = []
            if is_demo_session: session['is_demo'] = True

            if user['role'] == 'super_admin': return redirect('/super-admin')
            if user['role'] == 'admin': return redirect('/admin')
            
            if user['role'] == 'student' and not user.get('name'):
                return redirect('/complete-profile')
                
            return redirect('/student')
        
        conn.close()
        error = "Invalid Credentials. Please check Identity and Password."
        if is_demo_session:
            error = "Demo Login Failed. Try using 'Admin Demo' button below or Admin: 123 / admin123"
    
    return render_template('login.html', error=error, is_demo=is_demo_session)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if 'user_id' in session and not session.get('is_demo'):
        if session.get('role') == 'admin': return redirect('/admin')
        if session.get('role') == 'super_admin' or session.get('user_id') == -1: return redirect('/super-admin')
        if session.get('role') == 'student': return redirect('/student')
        
    # Detect if user wants to register for a school or just for the app
    type = request.args.get('type', 'app') # 'school' or 'app'
    
    if request.method == 'POST':
        phone = request.form.get('phone')
        password = request.form.get('password')
        school_code = request.form.get('school_code', '').strip().upper()
        name = request.form.get('name')
        
        if not phone.isdigit():
            return "Error: Phone must only contain digits.", 400
        
        conn = get_db_connection()
        try:
            if school_code:
                # School Registration (Student)
                school = conn.execute('SELECT * FROM schools WHERE school_code = ?', (school_code,)).fetchone()
                if not school and school_code != "DEFAULT":
                    return f"Error: School Code '{school_code}' not found.", 404
                
                from billing import get_school_subscription
                sub = get_school_subscription(school_code)
                student_count = conn.execute('SELECT COUNT(*) FROM users WHERE role="student" AND school_code=?', (school_code,)).fetchone()[0]
                if student_count >= sub['max_students']:
                    return f"Registration Blocked: This institution has reached its student limit on the {sub['plan_name']} plan.", 403
                
                conn.execute('INSERT INTO users (phone, password, role, school_code, name) VALUES (?,?,?,?,?)',
                             (phone, password, 'student', school_code, name))
            else:
                return "Institution Code is required.", 400
            
            conn.commit()
            return redirect('/login')
        except sqlite3.IntegrityError:
            return "Phone number already in use.", 412
        finally:
            conn.close()
            
    return render_template('register.html', type=type)

@app.route('/complete-profile', methods=['GET', 'POST'])
def complete_profile():
    if 'user_id' not in session: return redirect('/login')
    if request.method == 'POST':
        name = request.form.get('name')
        admission_no = request.form.get('admission_no')
        class_name = request.form.get('class')
        
        conn = get_db_connection()
        conn.execute('UPDATE users SET name = ?, admission_no = ?, class = ? WHERE id = ?',
                     (name, admission_no, class_name, session['user_id']))
        conn.commit()
        conn.close()
        
        session['user_name'] = name
        session['class'] = class_name
        session['admission_no'] = admission_no
        return redirect('/student')
        
    return render_template('complete_profile.html')

@app.route('/super-admin')
def super_admin_panel():
    if session.get('role') != 'super_admin': return redirect('/login')
    conn = get_db_connection()
    
    # Overview Stats
    stats = {
        'total_schools': conn.execute('SELECT COUNT(*) FROM schools').fetchone()[0],
        'active_schools': conn.execute('SELECT COUNT(*) FROM schools WHERE status="active"').fetchone()[0],
        'total_students': conn.execute('SELECT COUNT(*) FROM users WHERE role="student"').fetchone()[0],
        'total_librarians': conn.execute('SELECT COUNT(*) FROM users WHERE role="admin"').fetchone()[0],
        'total_books': conn.execute('SELECT SUM(total_copies) FROM books').fetchone()[0] or 0,
        'available_books': conn.execute('SELECT SUM(available_copies) FROM books').fetchone()[0] or 0,
        'issued_books': conn.execute('SELECT COUNT(*) FROM transactions WHERE return_date IS NULL').fetchone()[0],
        'total_tx': conn.execute('SELECT COUNT(*) FROM transactions').fetchone()[0],
        'pending_reservations': conn.execute('SELECT COUNT(*) FROM reservations WHERE status="Pending"').fetchone()[0]
    }
    
    schools_raw = conn.execute('SELECT * FROM schools ORDER BY created_at DESC').fetchall()
    schools = [dict(s) for s in schools_raw]
    for s in schools:
        if not s.get('activePlan'):
            s['activePlan'] = 'FREE'
        s['plan_id'] = s['activePlan']
        s['plan_name'] = s['activePlan']
        s['sub_status'] = s.get('subscriptionStatus') or 'active'
    
    from permissions import PLANS
    plans = [{'id': k, 'name': k} for k in PLANS.keys()]
    
    users = conn.execute('SELECT * FROM users ORDER BY id DESC').fetchall()
    books = conn.execute('SELECT * FROM books ORDER BY id DESC').fetchall()
    
    transactions_raw = conn.execute('''
        SELECT t.*, u.name as student_name, b.title as book_title, b.cover_url
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        JOIN books b ON t.book_id = b.id
        ORDER BY t.issue_date DESC
    ''').fetchall()
    
    transactions = []
    overdue_count = 0
    for row in transactions_raw:
        tx = dict(row)
        if not tx['return_date']:
            fine, is_overdue = calculate_fine(tx['due_date'])
            tx['calculated_fine'] = fine
            tx['is_overdue'] = is_overdue
            if is_overdue: overdue_count += 1
        else:
            tx['calculated_fine'] = tx['fine']
            tx['is_overdue'] = False
        transactions.append(tx)
        
    stats['overdue_books'] = overdue_count
    
    recent_logs = conn.execute('SELECT * FROM logs ORDER BY created_at DESC LIMIT 50').fetchall()
    pending_requests = conn.execute('SELECT * FROM pending_requests WHERE status = "Pending"').fetchall()
    org_requests = conn.execute('SELECT * FROM organization_requests ORDER BY created_at DESC').fetchall()

    
    # Billing Stats
    revenue_mrr = conn.execute('SELECT SUM(p.monthly_price) FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.status="active" AND p.id != "plan_free"').fetchone()[0] or 0
    total_revenue = conn.execute('SELECT SUM(amount) FROM payments WHERE status="success"').fetchone()[0] or 0
    active_subs = conn.execute('SELECT COUNT(*) FROM subscriptions WHERE status="active"').fetchone()[0] or 0
    recent_payments = conn.execute('SELECT p.*, i.school_code FROM payments p JOIN invoices i ON p.invoice_id = i.id ORDER BY p.created_at DESC LIMIT 50').fetchall()
    
    stats['mrr'] = revenue_mrr
    stats['total_revenue'] = total_revenue
    stats['active_subs'] = active_subs
    
    conn.close()
    return render_template('super_admin.html', 
                           stats=stats, 
                           schools=schools, 
                           users=users, 
                           books=books, 
                           transactions=transactions,
                           logs=recent_logs,
                           pending_requests=pending_requests,
                           recent_payments=recent_payments,
                           org_requests=org_requests,
                           plans=plans)

import csv
from flask import Response

@app.route('/super-admin/add-school', methods=['POST'])
def super_admin_add_school():
    if session.get('role') != 'super_admin': return redirect('/login')
    name = request.form.get('name')
    code = request.form.get('code', '').strip().upper()
    lib_name = request.form.get('lib_name')
    lib_email = request.form.get('reqEmail')
    lib_phone = request.form.get('lib_phone')
    lib_pass = request.form.get('lib_pass')
    
    if not code:
        import random
        code = f"SCH{random.randint(1000, 9999)}"
        
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO schools (name, school_code, librarian_name, created_at) VALUES (?, ?, ?, ?)',
                     (name, code, lib_name, datetime.now().strftime('%Y-%m-%d %H:%M')))
        conn.execute('INSERT INTO users (name, phone, email, password, role, school_code) VALUES (?, ?, ?, ?, ?, ?)',
                     (lib_name, lib_phone, lib_email, lib_pass, 'admin', code))
        conn.execute('INSERT INTO logs (user_id, action, module, created_at) VALUES (?, ?, ?, ?)',
                     (session.get('user_id'), f"Created school {code}", "Schools", datetime.now().strftime('%Y-%m-%d %H:%M')))
        conn.commit()
    except sqlite3.IntegrityError:
        pass # Code or phone might be duplicate
    finally:
        conn.close()
    return redirect('/super-admin')

@app.route('/super-admin/add-admin', methods=['POST'])
def super_admin_add_admin():
    if session.get('role') != 'super_admin': return redirect('/login')
    name = request.form.get('name')
    phone = request.form.get('phone')
    password = request.form.get('password')
    
    conn = get_db_connection()
    conn.execute('INSERT INTO users (name, phone, password, role, school_code) VALUES (?, ?, ?, ?, ?)',
                 (name, phone, password, 'super_admin', 'GLOBAL'))
    conn.execute('INSERT INTO logs (user_id, action, module, created_at) VALUES (?, ?, ?, ?)',
                 (session.get('user_id'), f"Created Super Admin {name}", "Users", datetime.now().strftime('%Y-%m-%d %H:%M')))
    conn.commit()
    conn.close()
    return redirect('/super-admin')

@app.route('/super-admin/add-user', methods=['POST'])
def super_admin_add_user():
    if session.get('role') != 'super_admin': return redirect('/login')
    name = request.form.get('name')
    phone = request.form.get('phone')
    email = request.form.get('reqEmail')
    password = request.form.get('password')
    role = request.form.get('role')
    school_code = request.form.get('school_code')
    admission_no = request.form.get('admission_no', '')
    
    conn = get_db_connection()
    try:
        if role == 'student':
            conn.execute('INSERT INTO users (name, phone, email, password, role, school_code, admission_no, is_banned) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
                         (name, phone, email, password, role, school_code, admission_no))
        else:
            conn.execute('INSERT INTO users (name, phone, email, password, role, school_code, is_banned) VALUES (?, ?, ?, ?, ?, ?, 0)',
                         (name, phone, email, password, role, school_code))
        conn.commit()
    except Exception as e:
        pass
    finally:
        conn.close()
    return redirect('/super-admin')

@app.route('/super-admin/toggle-maintenance', methods=['POST'])
def super_admin_toggle_maintenance():
    if session.get('role') != 'super_admin': return redirect('/login')
    conn = get_db_connection()
    current = conn.execute('SELECT value FROM system_settings WHERE key="maintenance_mode"').fetchone()
    new_val = '1' if not current or current['value'] == '0' else '0'
    conn.execute('UPDATE system_settings SET value = ? WHERE key="maintenance_mode"', (new_val,))
    conn.commit()
    conn.close()
    return redirect('/super-admin')

@app.route('/super-admin/user/<int:id>/toggle-ban', methods=['POST'])
def super_admin_toggle_user_ban(id):
    if session.get('role') != 'super_admin': return redirect('/login')
    conn = get_db_connection()
    target_user = conn.execute('SELECT name, role, is_banned FROM users WHERE id = ?', (id,)).fetchone()
    if target_user and target_user['name'] == 'OM' and target_user['role'] == 'super_admin':
        conn.close()
        return "Cannot ban OM.", 403
    new_val = 1 if not target_user or target_user['is_banned'] == 0 else 0
    conn.execute('UPDATE users SET is_banned = ? WHERE id = ?', (new_val, id))
    conn.commit()
    conn.close()
    return redirect('/super-admin')

@app.route('/super-admin/user/<int:id>/update-permissions', methods=['POST'])
def super_admin_update_permissions(id):
    if session.get('role') != 'super_admin': return redirect('/login')
    
    perms = []
    if request.form.get('perm_manage_books'): perms.append('manage_books')
    if request.form.get('perm_manage_students'): perms.append('manage_students')
    if request.form.get('perm_manage_transactions'): perms.append('manage_transactions')
    if request.form.get('perm_approve_content'): perms.append('approve_content')
    
    import json
    perms_json = json.dumps(perms)
    
    conn = get_db_connection()
    conn.execute('UPDATE users SET permissions = ? WHERE id = ?', (perms_json, id))
    conn.commit()
    conn.close()
    
    return redirect('/super-admin')

@app.route('/super-admin/user/<int:id>/delete', methods=['POST'])
def super_admin_delete_user(id):
    if session.get('role') != 'super_admin': return redirect('/login')
    conn = get_db_connection()
    target_user = conn.execute('SELECT name, role FROM users WHERE id = ?', (id,)).fetchone()
    if target_user and target_user['name'] == 'OM' and target_user['role'] == 'super_admin':
        conn.close()
        return "Cannot delete OM.", 403
    conn.execute('DELETE FROM users WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return redirect('/super-admin')

@app.route('/super-admin/school/<int:id>/toggle-block', methods=['POST'])
def super_admin_toggle_school_block(id):
    if session.get('role') != 'super_admin': return redirect('/login')
    conn = get_db_connection()
    current = conn.execute('SELECT status FROM schools WHERE id = ?', (id,)).fetchone()
    new_status = 'Blocked' if not current or current['status'] == 'Active' else 'Active'
    conn.execute('UPDATE schools SET status = ? WHERE id = ?', (new_status, id))
    # Also ban/unban all students under this school
    ban_val = 1 if new_status == 'Blocked' else 0
    school = conn.execute('SELECT school_code FROM schools WHERE id = ?', (id,)).fetchone()
    if school:
        conn.execute('UPDATE users SET is_banned = ? WHERE school_code = ?', (ban_val, school['school_code']))
    conn.commit()
    conn.close()
    return redirect('/super-admin')

@app.route('/super-admin/school/<int:id>/delete', methods=['POST'])
def super_admin_delete_school(id):
    if session.get('role') != 'super_admin': return redirect('/login')
    conn = get_db_connection()
    school = conn.execute('SELECT school_code FROM schools WHERE id = ?', (id,)).fetchone()
    if school:
        code = school['school_code']
        conn.execute('DELETE FROM users WHERE school_code = ?', (code,))
        conn.execute('DELETE FROM books WHERE school_code = ?', (code,))
        conn.execute('DELETE FROM digital_content WHERE school_code = ?', (code,))
        conn.execute('DELETE FROM schools WHERE id = ?', (id,))
        conn.commit()
    conn.close()
    return redirect('/super-admin')

@app.route('/super-admin/school/<school_code>/subscription/update', methods=['POST'])
def super_admin_update_subscription(school_code):
    if session.get('role') != 'super_admin': return redirect('/login')
    plan_id = request.form.get('plan_id')
    if not plan_id:
        return redirect('/super-admin')
        
    from permissions import PLANS
    if plan_id not in PLANS:
        return redirect('/super-admin')
        
    conn = get_db_connection()
    from datetime import datetime, timedelta
    now = datetime.now()
    period_end = now + timedelta(days=365) # Grant 1 year manually
    
    limits = PLANS[plan_id]["limits"]
    conn.execute('''
        UPDATE schools 
        SET activePlan = ?, subscriptionStatus = "active", expiryDate = ?,
            studentLimit = ?, librarianLimit = ?, adminLimit = ?
        WHERE school_code = ?
    ''', (plan_id, period_end.strftime('%Y-%m-%d %H:%M:%S'), 
          limits['studentLimit'], limits['librarianLimit'], limits['adminLimit'], school_code))
          
    conn.execute('INSERT INTO logs (user_id, action, module, created_at) VALUES (?, ?, ?, ?)',
                 (session.get('user_id'), f"Updated subscription for {school_code} to {plan_id}", "Billing", now.strftime('%Y-%m-%d %H:%M')))
    conn.commit()
    conn.close()
    return redirect('/super-admin')

@app.route('/super-admin/school/<school_code>/subscription/cancel', methods=['POST'])
def super_admin_cancel_subscription(school_code):
    if session.get('role') != 'super_admin': return redirect('/login')
    
    conn = get_db_connection()
    # Cancel immediately
    conn.execute('UPDATE subscriptions SET cancel_at_period_end = 1 WHERE school_code = ?', (school_code,))
    
    from datetime import datetime
    conn.execute('INSERT INTO logs (user_id, action, module, created_at) VALUES (?, ?, ?, ?)',
                 (session.get('user_id'), f"Cancelled subscription for {school_code}", "Billing", datetime.now().strftime('%Y-%m-%d %H:%M')))
    conn.commit()
    conn.close()
    return redirect('/super-admin')

def get_om_totp(offset=0):
    import time
    import hashlib
    window = int(time.time() / 15) + offset
    secret = "OM_MASTER_WIPE_SECRET_" + str(window)
    return hashlib.sha256(secret.encode()).hexdigest()[:6].upper()

@app.route('/super-admin/om-otp', methods=['GET'])
def get_om_otp():
    if session.get('role') != 'super_admin' or session.get('name') != 'OM':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
    import time
    otp = get_om_totp(0)
    remaining = 15 - (int(time.time()) % 15)
    return jsonify({'status': 'success', 'otp': otp, 'remaining': remaining})

@app.route('/super-admin/wipe-data', methods=['POST'])
def super_admin_wipe_data():
    if session.get('role') != 'super_admin': return redirect('/login')
    
    if session.get('name') != 'OM':
        otp = request.form.get('otp', '').strip().upper()
        if otp != get_om_totp(0) and otp != get_om_totp(-1):
            return "Incorrect or expired OTP. Please contact OM.", 400


    # NUCLEAR OPTION - Wipes all non-super-admin data
    conn = get_db_connection()
    tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    for row in tables:
        table = row['name']
        if table in ['sqlite_sequence', 'system_settings']: continue
        if table == 'users':
            conn.execute('DELETE FROM users WHERE role != "super_admin"')
        else:
            conn.execute(f'DELETE FROM {table}')
    conn.commit()
    conn.close()
    return redirect('/super-admin')

@app.route('/super-admin/force-backup', methods=['POST'])
def super_admin_force_backup():
    if session.get('role') != 'super_admin': return redirect('/login')
    # Trigger an immediate Firebase backup
    try:
        if os.path.exists(DB_FILE):
            bucket = storage.bucket()
            blob = bucket.blob('backups/library_v3.db')
            blob.upload_from_filename(DB_FILE)
    except:
        pass
    return redirect('/super-admin')

@app.route('/super-admin/settings', methods=['POST'])
def super_admin_settings():
    if session.get('role') != 'super_admin': return redirect('/login')
    # For MVP, we will just log this action
    conn = get_db_connection()
    conn.execute('INSERT INTO logs (user_id, action, module, created_at) VALUES (?, ?, ?, ?)',
                 (session.get('user_id'), "Updated Global Settings", "Settings", datetime.now().strftime('%Y-%m-%d %H:%M')))
    conn.commit()
    conn.close()
    return redirect('/super-admin')

@app.route('/super-admin/export-report')
def super_admin_export():
    if session.get('role') != 'super_admin': return redirect('/login')
    fmt = request.args.get('format', 'csv')
    conn = get_db_connection()
    txs = conn.execute('''SELECT t.id, u.name as student, b.title as book, t.school_code, 
                                 t.issue_date, t.due_date, t.return_date, t.fine
                          FROM transactions t 
                          JOIN users u ON t.user_id = u.id 
                          JOIN books b ON t.book_id = b.id
                          ORDER BY t.issue_date DESC''').fetchall()
    
    # For txt summary
    total_schools = conn.execute('SELECT COUNT(*) FROM schools').fetchone()[0]
    total_students = conn.execute('SELECT COUNT(*) FROM users WHERE role="student"').fetchone()[0]
    conn.close()
    
    if fmt == 'txt':
        def generate_txt():
            yield f"E-PATHSHALA GLOBAL SYSTEM SUMMARY\n"
            yield f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            yield f"--------------------------------------------------\n"
            yield f"Total Registered Schools: {total_schools}\n"
            yield f"Total Active Students:    {total_students}\n"
            yield f"Total Lifetime Trans.:    {len(txs)}\n"
            yield f"--------------------------------------------------\n\n"
            yield f"RECENT TRANSACTIONS LOG:\n\n"
            for row in txs:
                status = f"Returned ({row['return_date']})" if row['return_date'] else "Active/Overdue"
                yield f"[{row['school_code']}] {row['student']} borrowed '{row['book']}' | Issued: {row['issue_date']} | Status: {status}\n"
        
        return Response(generate_txt(), mimetype='text/plain', headers={'Content-Disposition': 'attachment; filename=global_summary.txt'})
    
    else:
        def generate_csv():
            yield 'ID,Student,Book,School,Issue Date,Due Date,Return Date,Fine\n'
            for row in txs:
                yield f"{row['id']},{row['student']},{row['book']},{row['school_code']},{row['issue_date']},{row['due_date']},{row['return_date'] or 'Active'},{row['fine'] or 0}\n"
                
        return Response(generate_csv(), mimetype='text/csv', headers={'Content-Disposition': 'attachment; filename=global_report.csv'})

@app.route('/admin')
def admin_panel():
    if session.get('role') != 'admin': return redirect('/login')
    s_code = session.get('school_code')
    class_filter = request.args.get('class')
    conn = get_db_connection()
    
    query = '''SELECT t.*, u.name as user_name, b.title as book_title 
               FROM transactions t 
               JOIN users u ON t.user_id = u.id 
               JOIN books b ON t.book_id = b.id 
               WHERE t.return_date IS NULL AND t.school_code = ?'''
    params = [s_code]
    if class_filter: 
        query += " AND u.class = ?"
        params.append(class_filter)
        
    transactions_raw = conn.execute(query, params).fetchall()
    transactions = []
    for row in transactions_raw:
        tx = dict(row)
        tx['fine'], tx['is_overdue'] = calculate_fine(tx['due_date'])
        transactions.append(tx)
        
    available_books = conn.execute('SELECT SUM(available_copies) FROM books WHERE school_code = ?', (s_code,)).fetchone()[0] or 0
    books = conn.execute('SELECT * FROM books WHERE school_code = ?', (s_code,)).fetchall()
    
    students = []
    if 'manage_students' in session.get('permissions', []):
        students = conn.execute('SELECT * FROM users WHERE role = "student" AND school_code = ? ORDER BY id DESC', (s_code,)).fetchall()
        
    total_issued = conn.execute('SELECT COUNT(*) FROM transactions WHERE school_code = ?', (s_code,)).fetchone()[0] or 0
    total_returned = conn.execute('SELECT COUNT(*) FROM transactions WHERE return_date IS NOT NULL AND school_code = ?', (s_code,)).fetchone()[0] or 0
        
    conn.close()
    template_name = 'demo_admin.html' if session.get('is_demo') else 'admin.html'
    return render_template(template_name, transactions=transactions, class_filter=class_filter, available_books=available_books, books=books, overdue_count=len([t for t in transactions if t['is_overdue']]), students=students, total_students=len(students), total_issued=total_issued, total_returned=total_returned)

@app.route('/admin/student/add', methods=['POST'])
def admin_add_student():
    if session.get('role') != 'admin': return redirect('/login')
    if 'manage_students' not in session.get('permissions', []): return redirect('/admin')
    
    s_code = session.get('school_code')
    name = request.form['name']
    admission_no = request.form['admission_no']
    phone = request.form['phone']
    cls = request.form['class']
    password = request.form['password']
    
    conn = get_db_connection()
    try:
        from billing import get_school_subscription
        sub = get_school_subscription(s_code)
        student_count = conn.execute('SELECT COUNT(*) FROM users WHERE role="student" AND school_code=?', (s_code,)).fetchone()[0]
        if sub['max_students'] != float('inf') and student_count >= sub['max_students']:
            return "Upgrade your school subscription to add more students.", 403
            
        conn.execute('INSERT INTO users (name, admission_no, phone, class, role, password, school_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
                     (name, admission_no, phone, cls, 'student', password, s_code))
        conn.commit()
    except sqlite3.IntegrityError:
        pass # phone might be duplicate
    finally:
        conn.close()
    return redirect('/admin')

@app.route('/admin/student/<int:id>/toggle-ban', methods=['POST'])
def admin_toggle_student_ban(id):
    if session.get('role') != 'admin': return redirect('/login')
    if 'manage_students' not in session.get('permissions', []): return redirect('/admin')
    
    s_code = session.get('school_code')
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ? AND school_code = ?', (id, s_code)).fetchone()
    if user:
        new_status = 0 if user['is_banned'] else 1
        conn.execute('UPDATE users SET is_banned = ? WHERE id = ?', (new_status, id))
        conn.commit()
    conn.close()
    return redirect('/admin')

@app.route('/admin/student/<int:id>/delete', methods=['POST'])
def admin_delete_student(id):
    if session.get('role') != 'admin': return redirect('/login')
    if 'manage_students' not in session.get('permissions', []): return redirect('/admin')
    
    s_code = session.get('school_code')
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ? AND school_code = ?', (id, s_code)).fetchone()
    if user:
        conn.execute('DELETE FROM users WHERE id = ?', (id,))
        conn.commit()
    conn.close()
    return redirect('/admin')

@app.route('/admin/settings', methods=['GET', 'POST'])
def admin_settings():
    if session.get('role') != 'admin': return redirect('/login')
    old_code = session.get('school_code')
    
    conn = get_db_connection()
    if request.method == 'POST':
        new_code = request.form.get('new_code', '').strip().upper()
        new_name = request.form.get('new_name', '').strip()
        
        if new_code and new_code != old_code:
            # 1. Update Schools table
            conn.execute('UPDATE schools SET school_code = ?, name = ? WHERE school_code = ?', (new_code, new_name, old_code))
            # 2. Cascade to Users
            conn.execute('UPDATE users SET school_code = ? WHERE school_code = ?', (new_code, old_code))
            # 3. Cascade to Books
            conn.execute('UPDATE books SET school_code = ? WHERE school_code = ?', (new_code, old_code))
            # 4. Cascade to Transactions
            conn.execute('UPDATE transactions SET school_code = ? WHERE school_code = ?', (new_code, old_code))
            conn.commit()
            conn.close()
            session.clear()
            return redirect('/login')
            
        conn.execute('UPDATE schools SET name = ? WHERE school_code = ?', (new_name, old_code))
        conn.commit()
        
    school = conn.execute('SELECT * FROM schools WHERE school_code = ?', (old_code,)).fetchone()
    conn.close()
    return render_template('admin_settings.html', school=school)

@app.route('/admin/add_book', methods=['GET', 'POST'])
def add_book():
    if session.get('role') != 'admin': return redirect('/login')
    if 'manage_books' not in session.get('permissions', []): return redirect('/admin')
    s_code = session.get('school_code')
    if request.method == 'POST':
        from billing import get_school_subscription
        sub = get_school_subscription(s_code)
        conn = get_db_connection()
        book_count = conn.execute('SELECT COUNT(*) FROM books WHERE school_code=?', (s_code,)).fetchone()[0]
        if book_count >= sub['max_books']:
            flash(f"Upgrade Required: Your {sub['plan_name']} plan allows {sub['max_books']} books.", "error")
            return redirect('/billing')
        conn.close()
        title = request.form.get('title')
        author = request.form.get('author')
        genre = request.form.get('genre')
        copies = int(request.form.get('copies'))
        isbn = request.form.get('isbn', '').strip()
        description = request.form.get('description', '').strip()
        
        import time
        # If user provides ISBN, use it, else generate one
        barcode_id = isbn if isbn else str(int(time.time() * 100))[-12:]
        
        EAN = barcode.get_barcode_class('code128')
        my_barcode = EAN(barcode_id, writer=ImageWriter())
        my_barcode.save(os.path.join(BARCODE_DIR, barcode_id))
        
        conn = get_db_connection()
        conn.execute('INSERT INTO books (title, author, genre, barcode_id, total_copies, available_copies, school_code, description) VALUES (?,?,?,?,?,?,?,?)',
                     (title, author, genre, barcode_id, copies, copies, s_code, description))
        conn.commit()
        conn.close()
        return redirect('/admin')
    return render_template('add_book.html')

@app.route('/admin/issue', methods=['GET', 'POST'])
def issue_book():
    if session.get('role') != 'admin': return redirect('/login')
    if 'manage_transactions' not in session.get('permissions', []): return redirect('/admin')
    s_code = session.get('school_code')
    conn = get_db_connection()
    if request.method == 'POST':
        student_id = request.form.get('student_id')
        barcode_id = request.form.get('barcode_id')
        book_id = request.form.get('book_id')
        book = None
        if barcode_id:
            book = conn.execute('SELECT * FROM books WHERE barcode_id = ? AND available_copies > 0 AND school_code = ?', (barcode_id, s_code)).fetchone()
        elif book_id:
            book = conn.execute('SELECT * FROM books WHERE id = ? AND available_copies > 0 AND school_code = ?', (book_id, s_code)).fetchone()
        if book:
            student = conn.execute('SELECT * FROM users WHERE id = ? AND school_code = ?', (student_id, s_code)).fetchone()
            issue_date = datetime.now().strftime('%Y-%m-%d')
            due_date = (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')
            conn.execute('INSERT INTO transactions (user_id, book_id, issue_date, due_date, class, school_code) VALUES (?,?,?,?,?,?)',
                         (student_id, book['id'], issue_date, due_date, student['class'], s_code))
            conn.execute('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', (book['id'],))
            conn.commit()
            conn.close()
            return redirect('/admin')
    students = conn.execute('SELECT * FROM users WHERE role = "student" AND school_code = ?', (s_code,)).fetchall()
    books = conn.execute('SELECT * FROM books WHERE available_copies > 0 AND school_code = ?', (s_code,)).fetchall()
    conn.close()
    return render_template('issue_book.html', students=students, books=books)

@app.route('/admin/return/<int:tx_id>')
def return_book(tx_id):
    if session.get('role') != 'admin': return redirect('/login')
    if 'manage_transactions' not in session.get('permissions', []): return redirect('/admin')
    s_code = session.get('school_code')
    conn = get_db_connection()
    tx = conn.execute('SELECT * FROM transactions WHERE id = ? AND school_code = ?', (tx_id, s_code)).fetchone()
    if tx:
        conn.execute('UPDATE transactions SET return_date = ? WHERE id = ?', (datetime.now().strftime('%Y-%m-%d'), tx_id))
        conn.execute('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?', (tx['book_id'],))
        conn.commit()
    conn.close()
    return redirect('/admin')

@app.route('/student')
def student_panel():
    if 'user_id' not in session: return redirect('/login')
    s_code = session.get('school_code')
    user_id = session.get('user_id')
    conn = get_db_connection()
    
    # Dynamically verify and refresh school name in session
    if s_code:
        school = conn.execute('SELECT name FROM schools WHERE school_code = ?', (s_code,)).fetchone()
        if school:
            session['school_name'] = school['name']
        else:
            session['school_name'] = "E-Pathshala Network"
    else:
        session['school_name'] = "E-Pathshala Network"
    session.modified = True
    
    txs = conn.execute('SELECT t.*, b.title, b.author, b.cover_url FROM transactions t JOIN books b ON b.id = t.book_id WHERE t.user_id = ? AND t.return_date IS NULL', (user_id,)).fetchall()
    
    # Fetch Recommended Books (Random 4 available books in the school)
    recommended_books = conn.execute('SELECT * FROM books WHERE school_code = ? AND available_copies > 0 ORDER BY RANDOM() LIMIT 4', (s_code,)).fetchall()
    
    # Stats Calculation
    total_issued = conn.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,)).fetchone()[0]
    currently_borrowed = len(txs)
    total_books_read = conn.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ? AND return_date IS NOT NULL', (user_id,)).fetchone()[0]
    
    transactions = []
    due_soon = []
    overdue_books = []
    total_fine = 0
    
    for tx in txs:
        tx = dict(tx)
        fine, is_overdue = calculate_fine(tx['due_date'])
        tx['calculated_fine'] = fine
        tx['is_overdue'] = is_overdue
        total_fine += fine
        
        # Calculate days until due
        due_date = datetime.strptime(tx['due_date'], '%Y-%m-%d')
        days_until_due = (due_date - datetime.now()).days
        tx['days_until_due'] = days_until_due
        
        if is_overdue:
            overdue_books.append(tx)
        elif 0 <= days_until_due <= 7:
            due_soon.append(tx)
            
        transactions.append(tx)
        
    stats = {
        'total_issued': total_issued,
        'currently_borrowed': currently_borrowed,
        'due_soon_count': len(due_soon),
        'overdue_count': len(overdue_books),
        'total_read': total_books_read,
        'pending_fines': total_fine
    }
        
    conn.close()
    template_name = 'demo_student.html' if session.get('is_demo') else 'student.html'
    return render_template(template_name, transactions=transactions, recommended_books=recommended_books, stats=stats, due_soon=due_soon, overdue_books=overdue_books, school_name=session['school_name'])

@app.route('/student/profile', methods=['GET', 'POST'])
def student_profile():
    if 'user_id' not in session: return redirect('/login')
    conn = get_db_connection()
    if request.method == 'POST':
        name = request.form.get('name')
        password = request.form.get('password')
        admission_no = request.form.get('admission_no')
        class_name = request.form.get('class')
        
        conn.execute('UPDATE users SET name = ?, password = ?, admission_no = ?, class = ? WHERE id = ?',
                     (name, password, admission_no, class_name, session['user_id']))
        conn.commit()
        session['user_name'] = name
        session['class'] = class_name
        session['admission_no'] = admission_no
        return redirect('/student')
    user = conn.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    
    # Extended Statistics
    total_read = conn.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ? AND return_date IS NOT NULL', (session['user_id'],)).fetchone()[0]
    
    # Favorite Category
    fav_genre_row = conn.execute('''
        SELECT b.genre, COUNT(*) as count 
        FROM transactions t 
        JOIN books b ON t.book_id = b.id 
        WHERE t.user_id = ? AND b.genre IS NOT NULL 
        GROUP BY b.genre 
        ORDER BY count DESC LIMIT 1
    ''', (session['user_id'],)).fetchone()
    
    fav_category = fav_genre_row[0] if fav_genre_row else "N/A"
    
    stats = {
        'total_read': total_read,
        'favorite_category': fav_category
    }
    
    conn.close()
    return render_template('student_profile.html', user=user, stats=stats)

@app.route('/student/book/<int:book_id>')
def book_details(book_id):
    if 'user_id' not in session: return redirect('/login')
    s_code = session.get('school_code')
    conn = get_db_connection()
    book = conn.execute('SELECT * FROM books WHERE id = ? AND school_code = ?', (book_id, s_code)).fetchone()
    
    if not book:
        conn.close()
        return "Book not found", 404
        
    # Check if user already has a pending reservation
    existing_res = conn.execute('SELECT * FROM reservations WHERE user_id = ? AND book_id = ? AND status = "Pending"', (session['user_id'], book_id)).fetchone()
    
    conn.close()
    return render_template('book_details.html', book=book, has_reservation=bool(existing_res))

@app.route('/student/reserve/<int:book_id>', methods=['POST'])
def reserve_book(book_id):
    if 'user_id' not in session: return redirect('/login')
    s_code = session.get('school_code')
    user_id = session.get('user_id')
    
    conn = get_db_connection()
    book = conn.execute('SELECT * FROM books WHERE id = ? AND school_code = ?', (book_id, s_code)).fetchone()
    if book:
        # Prevent duplicate pending reservations
        existing = conn.execute('SELECT * FROM reservations WHERE user_id = ? AND book_id = ? AND status = "Pending"', (user_id, book_id)).fetchone()
        if not existing:
            conn.execute('INSERT INTO reservations (user_id, book_id, status, created_at, school_code) VALUES (?, ?, ?, ?, ?)',
                         (user_id, book_id, 'Pending', datetime.now().strftime('%Y-%m-%d %H:%M'), s_code))
            
            # Create a notification for the user
            msg = f"Your reservation for '{book['title']}' has been placed."
            conn.execute('INSERT INTO notifications (user_id, message, type, created_at, school_code) VALUES (?, ?, ?, ?, ?)',
                         (user_id, msg, 'reservation', datetime.now().strftime('%Y-%m-%d %H:%M'), s_code))
            conn.commit()
    conn.close()
    return redirect(f'/student/book/{book_id}')

@app.route('/student/browse')
def student_browse():
    if 'user_id' not in session: return redirect('/login')
    s_code = session.get('school_code')
    genre_filter = request.args.get('genre')
    search_query = request.args.get('q', '').strip()
    
    conn = get_db_connection()
    
    query = 'SELECT * FROM books WHERE 1=1'
    params = []
    
    if genre_filter:
        query += ' AND genre = ?'
        params.append(genre_filter)
        
    if search_query:
        query += ' AND (title LIKE ? OR author LIKE ?)'
        params.extend([f'%{search_query}%', f'%{search_query}%'])
        
    books = conn.execute(query, params).fetchall()
    genres = [row[0] for row in conn.execute('SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL').fetchall()]
    conn.close()
    return render_template('student_browse.html', books=books, genres=genres, active_genre=genre_filter, search_query=search_query)

@app.route('/student/issue/<int:book_id>')
def student_self_issue(book_id):
    if 'user_id' not in session: return redirect('/login')
    conn = get_db_connection()
    book = conn.execute('SELECT * FROM books WHERE id = ? AND available_copies > 0', (book_id,)).fetchone()
    if book:
        # Prevent duplicate active borrows
        if not conn.execute('SELECT * FROM transactions WHERE user_id = ? AND book_id = ? AND return_date IS NULL', (session['user_id'], book_id)).fetchone():
            conn.execute('INSERT INTO transactions (user_id, book_id, issue_date, due_date, class, school_code) VALUES (?,?,?,?,?,?)',
                         (session['user_id'], book['id'], datetime.now().strftime('%Y-%m-%d'), (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d'), session['class'], book['school_code']))
            conn.execute('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', (book['id'],))
            conn.commit()
    conn.close()
    return redirect('/student')

@app.route('/student/publish', methods=['GET', 'POST'])
@require_permission('canUsePublishing')
def student_publish():
    if 'user_id' not in session or session.get('role') != 'student':
        return redirect('/login')
        
    s_code = session.get('school_code')
    user_id = session.get('user_id')
    
    if request.method == 'POST':
        title = request.form.get('title')
        category = request.form.get('category')
        description = request.form.get('description')
        subject = request.form.get('subject')
        class_name = request.form.get('class')
        tags = request.form.get('tags')
        
        # File Handling
        cover_file = request.files.get('cover')
        doc_file = request.files.get('document')
        
        cover_url = ""
        file_url = ""
        
        import time
        from werkzeug.utils import secure_filename
        
        if cover_file and cover_file.filename:
            cover_filename = f"c_{user_id}_{int(time.time())}_{secure_filename(cover_file.filename)}"
            cover_path = os.path.join(app.config['UPLOAD_FOLDER'] if 'UPLOAD_FOLDER' in app.config else os.path.join(BASE_DIR, 'static', 'uploads'), cover_filename)
            # Ensure upload folder exists
            os.makedirs(os.path.dirname(cover_path), exist_ok=True)
            cover_file.save(cover_path)
            cover_url = f"/static/uploads/{cover_filename}"
            
        if doc_file and doc_file.filename:
            doc_filename = f"d_{user_id}_{int(time.time())}_{secure_filename(doc_file.filename)}"
            doc_path = os.path.join(DIGITAL_CONTENT_DIR, doc_filename)
            doc_file.save(doc_path)
            file_url = f"/static/digital_content/{doc_filename}"
            
        conn = get_db_connection()
        conn.execute('''
            INSERT INTO digital_content (title, category, description, subject, class, tags, 
                                         cover_url, file_url, student_id, school_code, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?)
        ''', (title, category, description, subject, class_name, tags, cover_url, file_url, user_id, s_code, datetime.now().strftime('%Y-%m-%d %H:%M')))
        conn.commit()
        conn.close()
        
        return redirect('/student/my-publications')
        
    return render_template('student_publish.html')

@app.route('/student/my-publications')
def student_my_publications():
    if 'user_id' not in session or session.get('role') != 'student':
        return redirect('/login')
    
    s_code = session.get('school_code')
    user_id = session.get('user_id')
    
    conn = get_db_connection()
    pubs = conn.execute('SELECT * FROM digital_content WHERE student_id = ? AND school_code = ? ORDER BY id DESC', (user_id, s_code)).fetchall()
    conn.close()
    
    return render_template('student_my_publications.html', publications=pubs)

@app.route('/api/chat-action', methods=['POST'])
def chat_action():
    data = request.json
    action_type = data.get('type')
    
    if 'user_id' not in session and action_type == 'creds':
        return {"status": "error", "message": "Please Login to update credentials."}

    conn = get_db_connection()
    
    if action_type == 'creds':
        s_code = data.get('sCode')
        new_name = data.get('newName')
        new_pass = data.get('newPass')
        
        if session.get('role') == 'super_admin':
            admin = conn.execute('SELECT * FROM users WHERE role = "admin" AND school_code = ?', (s_code,)).fetchone()
            if admin:
                conn.execute('UPDATE users SET name = ?, password = ? WHERE id = ?', (new_name, new_pass, admin['id']))
                conn.commit()
                conn.close()
                return {"status": "success", "message": f"Admin credentials for {s_code} updated successfully."}
            else:
                conn.close()
                return {"status": "error", "message": f"No admin found for school code {s_code}."}
        else:
            admin = conn.execute('SELECT * FROM users WHERE role = "admin" AND school_code = ?', (s_code,)).fetchone()
            if not admin:
                admin = conn.execute('SELECT * FROM users WHERE role = "admin"').fetchone()
            if admin and (data.get('oldPass') == admin['password'] or data.get('sCode') == admin['password']):
                conn.execute('UPDATE users SET name = ?, password = ? WHERE id = ?',
                             (new_name, new_pass, admin['id']))
                conn.commit()
                conn.close()
                return {"status": "success", "message": "Admin credentials updated."}
            else:
                conn.close()
                return {"status": "error", "message": "Unauthorized."}
    elif action_type == 'create_school':
        sName = data.get('sName')
        lName = data.get('lName')
        bQty = data.get('bQty') or 0
        sQty = data.get('sQty') or 0
        email = data.get('reqEmail')
        reqCode = data.get('reqCode', '')
        uId = session.get('user_id') # Might be None
        
        if not email:
             return {"status": "error", "message": "Gmail is required to provision an admin account."}
        
        try:
            conn.execute('''INSERT INTO pending_requests 
                         (user_id, school_name, librarian_name, b_qty, s_qty, phone, password, created_at) 
                         VALUES (?,?,?,?,?,?,?,?)''',
                         (uId, sName, lName, bQty, sQty, email, reqCode, datetime.now().strftime('%Y-%m-%d %H:%M')))
            
            conn.commit()
            conn.close()
            return {
                "status": "success", 
                "message": f"Request Sent to System Master!\n\n🏢 School: {sName}\n👤 Requested By: {lName}\n\nPlease wait for approval (checked in Super Admin panel)."
            }
        except Exception as e:
            conn.close()
            return {"status": "error", "message": f"Request failed: {str(e)}"}
            
    elif action_type == 'search_school':
        query = data.get('query', '')
        if not query: return {"status": "error", "message": "Query required."}
        schools = conn.execute("SELECT name, school_code FROM schools WHERE name LIKE ? OR school_code LIKE ? LIMIT 10", (f"%{query}%", f"%{query}%")).fetchall()
        conn.close()
        if not schools: return {"status": "success", "message": "No schools found matching your query."}
        msg = "Found these schools:<br>" + "<br>".join([f"• {s['name']} (Code: <b>{s['school_code']}</b>)" for s in schools])
        return {"status": "success", "message": msg}
        
    elif action_type == 'search_book':
        query = data.get('query', '')
        if not query: return {"status": "error", "message": "Query required."}
        s_code = session.get('school_code')
        if session.get('role') == 'super_admin':
            books = conn.execute("SELECT id, title, author, school_code FROM books WHERE title LIKE ? OR author LIKE ? LIMIT 10", (f"%{query}%", f"%{query}%")).fetchall()
        else:
            books = conn.execute("SELECT id, title, author, school_code FROM books WHERE (title LIKE ? OR author LIKE ?) AND school_code = ? LIMIT 10", (f"%{query}%", f"%{query}%", s_code)).fetchall()
        conn.close()
        if not books: return {"status": "success", "message": "No books found matching your query."}
        msg = "Found these books:<br>" + "<br>".join([f"• <a href='/student/book/{b['id']}' style='color:var(--accent-primary);text-decoration:underline;' target='_blank'>{b['title']}</a> by {b['author']} (School: {b['school_code']})" for b in books])
        return {"status": "success", "message": msg}

            
    elif action_type == 'delete_user':
        if session.get('role') != 'super_admin' and (session.get('role') != 'admin' or 'manage_students' not in session.get('permissions', [])):
            return {"status": "error", "message": "Permission Denied."}
        name = data.get('name')
        s_code = session.get('school_code')
        if session.get('role') == 'super_admin':
            user = conn.execute('SELECT * FROM users WHERE name = ?', (name,)).fetchone()
        else:
            user = conn.execute('SELECT * FROM users WHERE name = ? AND school_code = ?', (name, s_code)).fetchone()
        if user:
            conn.execute('DELETE FROM users WHERE id = ?', (user['id'],))
            conn.commit()
            conn.close()
            return {"status": "success", "message": f"User {name} deleted successfully."}
        conn.close()
        return {"status": "error", "message": "User not found."}

    elif action_type == 'ban_user':
        if session.get('role') != 'super_admin' and (session.get('role') != 'admin' or 'manage_students' not in session.get('permissions', [])):
            return {"status": "error", "message": "Permission Denied."}
        name = data.get('name')
        s_code = session.get('school_code')
        if session.get('role') == 'super_admin':
            user = conn.execute('SELECT * FROM users WHERE name = ?', (name,)).fetchone()
        else:
            user = conn.execute('SELECT * FROM users WHERE name = ? AND school_code = ?', (name, s_code)).fetchone()
        if user:
            new_status = 0 if user.get('is_banned') else 1
            conn.execute('UPDATE users SET is_banned = ? WHERE id = ?', (new_status, user['id']))
            conn.commit()
            conn.close()
            return {"status": "success", "message": f"User {name} ban status toggled."}
        conn.close()
        return {"status": "error", "message": "User not found."}
        
    elif action_type == 'perms':
        if session.get('role') != 'super_admin':
            return {"status": "error", "message": "Only Super Admin can change permissions."}
        name = data.get('name')
        perms_list = data.get('permissions', [])
        user = conn.execute('SELECT * FROM users WHERE name = ? AND role = "admin"', (name,)).fetchone()
        if user:
            import json
            conn.execute('UPDATE users SET permissions = ? WHERE id = ?', (json.dumps(perms_list), user['id']))
            conn.commit()
            conn.close()
            return {"status": "success", "message": f"Permissions updated for {name}."}
        conn.close()
        return {"status": "error", "message": "Admin user not found."}
        
    elif action_type == 'add_user':
        if session.get('role') != 'admin' or 'manage_students' not in session.get('permissions', []):
            return {"status": "error", "message": "You do not have permission to add students."}
            
        s_code = session.get('school_code')
        name = data.get('name')
        admission_no = data.get('admission_no', 'AI-Gen')
        phone = data.get('phone')
        cls = data.get('class', '1')
        
        if not name or not phone:
             return {"status": "error", "message": "Name and Phone are required to add a user."}
             
        try:
            conn.execute('INSERT INTO users (name, admission_no, phone, class, role, password, school_code) VALUES (?, ?, ?, ?, "student", "studentpass", ?)',
                         (name, admission_no, phone, cls, s_code))
            conn.commit()
            conn.close()
            return {"status": "success", "message": f"Successfully created student '{name}'!"}
        except sqlite3.IntegrityError:
            conn.close()
            return {"status": "error", "message": "A user with this phone number already exists."}
            
    elif action_type == 'add_book':
        if session.get('role') != 'admin' or 'manage_books' not in session.get('permissions', []):
            return {"status": "error", "message": "You do not have permission to add books."}
            
        s_code = session.get('school_code')
        title = data.get('title')
        author = data.get('author')
        barcode = data.get('barcode')
        copies = data.get('copies', 1)
        
        if not title or not author or not barcode:
            return {"status": "error", "message": "Title, Author, and Barcode are required to add a book."}
            
        try:
            conn.execute('''INSERT INTO books (title, author, barcode_id, genre, total_copies, available_copies, school_code, description, shelf_location) 
                            VALUES (?, ?, ?, "General", ?, ?, ?, "", "")''',
                         (title, author, barcode, copies, copies, s_code))
            conn.commit()
            conn.close()
            return {"status": "success", "message": f"Successfully added '{title}' to the library!"}
        except sqlite3.IntegrityError:
            conn.close()
            return {"status": "error", "message": "A book with this barcode already exists."}

    elif action_type == 'add_school':
        if session.get('role') != 'super_admin':
            return {"status": "error", "message": "Only Super Admin can add schools."}
            
        name = data.get('name')
        code = data.get('code') or data.get('school_code')
        lib_name = data.get('lib_name') or data.get('principal_head_name') or 'Admin'
        lib_phone = data.get('lib_phone') or data.get('contact_phone') or '0000000000'
        lib_pass = data.get('lib_pass') or 'adminpass'
        
        if not name or not code:
            return {"status": "error", "message": "School Name and Code are required."}
            
        try:
            conn.execute('INSERT INTO schools (name, school_code, librarian_name, created_at) VALUES (?, ?, ?, ?)',
                         (name, code, lib_name, datetime.now().strftime('%Y-%m-%d %H:%M')))
            conn.execute('INSERT INTO users (name, phone, password, role, school_code) VALUES (?, ?, ?, ?, ?)',
                         (lib_name, lib_phone, lib_pass, 'admin', code))
            conn.commit()
            conn.close()
            return {"status": "success", "message": f"Successfully created school '{name}' with code '{code}'!"}
        except sqlite3.IntegrityError:
            conn.close()
            return {"status": "error", "message": "School code or phone might already exist."}

    conn.close()
    return {"status": "error", "message": "Unknown action type."}
    return {"status": "error", "message": "Action not recognized."}

@app.route('/super-admin/approve/<int:req_id>')
def approve_request(req_id):
    if session.get('role') != 'super_admin': return redirect('/login')
    
    conn = get_db_connection()
    req = conn.execute('SELECT * FROM pending_requests WHERE id = ?', (req_id,)).fetchone()
    
    if req:
        # Use provided code or generate unique school code
        sCode = req['password'] if req['password'] else ("SCH-" + str(uuid.uuid4().hex[:6]).upper())
        
        # 1. Create the School
        conn.execute('INSERT INTO schools (name, school_code, librarian_name, max_books, max_students, created_at) VALUES (?,?,?,?,?,?)',
                     (req['school_name'], sCode, req['librarian_name'], req['b_qty'], req['s_qty'], datetime.now().strftime('%Y-%m-%d')))
        
        # 2. Create or Update the Admin User
        # If user_id exists, update them (legacy support), otherwise create a new user.
        if req['user_id']:
            conn.execute('UPDATE users SET role = "admin", school_code = ?, name = ? WHERE id = ?',
                         (sCode, req['librarian_name'], req['user_id']))
        else:
            conn.execute('INSERT INTO users (phone, password, role, school_code, name) VALUES (?,?,?,?,?)',
                         (req['phone'], 'welcome123', 'admin', sCode, req['librarian_name']))
        
        # 3. Mark request as approved
        conn.execute('UPDATE pending_requests SET status = "approved" WHERE id = ?', (req_id,))
        
        conn.commit()
    
    conn.close()
    return redirect('/super-admin')

# ---------------------------------------------------------
# SMART SCANNER MODULE
# ---------------------------------------------------------
@app.route('/admin/scanner')
@require_permission('canUseAIScanner')
def smart_scanner():
    if session.get('role') not in ['admin', 'demo_admin']: return redirect('/login')
    return render_template('scanner_v2.html')

@app.route('/admin/api/upload-cover', methods=['POST'])
@require_permission('canUseAIScanner')
def api_upload_cover():
    if session.get('role') not in ['admin', 'demo_admin']: return {"status": "error", "message": "Unauthorized"}
    
    front_img = request.files.get('front')
    if not front_img:
        return {"status": "error", "message": "Front cover is required"}

    ext = front_img.filename.split('.')[-1]
    filename = f"scan_{uuid.uuid4().hex[:8]}.{ext}"
    cover_path = os.path.join('static', 'uploads', filename)
    os.makedirs(os.path.dirname(cover_path), exist_ok=True)
    front_img.seek(0)
    front_img.save(cover_path)
    front_url = f"/static/uploads/{filename}"

    return {"status": "success", "cover_url": front_url}

@app.route('/digital-library')
def digital_library():
    if 'user_id' not in session: return redirect('/login')
    s_code = session.get('school_code')
    
    conn = get_db_connection()
    # Fetch approved/published content
    query = '''
        SELECT d.*, u.name as student_name, u.class as student_class
        FROM digital_content d
        JOIN users u ON d.student_id = u.id
        WHERE d.school_code = ? AND d.status = 'Published'
        ORDER BY d.featured DESC, d.created_at DESC
    '''
    content_list = conn.execute(query, (s_code,)).fetchall()
    conn.close()
    
    return render_template('digital_library.html', content_list=content_list)

@app.route('/digital-library/content/<int:content_id>')
def view_digital_content(content_id):
    if 'user_id' not in session: return redirect('/login')
    
    conn = get_db_connection()
    # Increment views
    conn.execute('UPDATE digital_content SET views = views + 1 WHERE id = ?', (content_id,))
    conn.commit()
    
    content = conn.execute('''
        SELECT d.*, u.name as student_name, u.class as student_class, s.name as school_name
        FROM digital_content d
        JOIN users u ON d.student_id = u.id
        JOIN schools s ON d.school_code = s.school_code
        WHERE d.id = ?
    ''', (content_id,)).fetchone()
    
    reviews = conn.execute('''
        SELECT r.*, u.name as reviewer_name
        FROM content_reviews r
        JOIN users u ON r.student_id = u.id
        WHERE r.content_id = ?
        ORDER BY r.created_at DESC
    ''', (content_id,)).fetchall()
    
    conn.close()
    
    if not content:
        return "Content not found or hidden", 404
        
    return render_template('content_view.html', content=content, reviews=reviews)

@app.route('/author/<int:author_id>')
def view_author_profile(author_id):
    if 'user_id' not in session: return redirect('/login')
    
    conn = get_db_connection()
    author = conn.execute('SELECT name, class, school_code FROM users WHERE id = ?', (author_id,)).fetchone()
    
    # Author stats
    stats = conn.execute('''
        SELECT COUNT(*) as total_pubs, SUM(views) as total_views, SUM(downloads) as total_downloads
        FROM digital_content
        WHERE student_id = ? AND status = 'Published'
    ''', (author_id,)).fetchone()
    
    pubs = conn.execute('''
        SELECT * FROM digital_content 
        WHERE student_id = ? AND status = 'Published' 
        ORDER BY created_at DESC
    ''', (author_id,)).fetchall()
    
    conn.close()
    
    if not author:
        return "Author not found", 404
        
    return render_template('author_profile.html', author=author, stats=stats, publications=pubs)

@app.route('/digital-library/api/track-download', methods=['POST'])
def api_track_download():
    if 'user_id' not in session: return {"status": "error"}
    content_id = request.json.get('content_id')
    conn = get_db_connection()
    conn.execute('UPDATE digital_content SET downloads = downloads + 1 WHERE id = ?', (content_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.route('/api/submit-review', methods=['POST'])
def submit_review():
    if 'user_id' not in session: return {"status": "error", "message": "Unauthorized"}
    
    data = request.json
    conn = get_db_connection()
    
    content = conn.execute('SELECT school_code FROM digital_content WHERE id = ?', (data['content_id'],)).fetchone()
    if not content:
        content = conn.execute('SELECT school_code FROM books WHERE id = ?', (data['content_id'],)).fetchone()
    
    target_school = content['school_code'] if content else session.get('school_code')
    
    conn.execute('''
        INSERT INTO content_reviews (content_id, student_id, rating, review_title, review_comment, school_code, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (data['content_id'], session['user_id'], data['rating'], data['title'], data['comment'], target_school, datetime.now().strftime('%Y-%m-%d %H:%M')))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.route('/digital-library/api/report', methods=['POST'])
def api_report_content():
    if 'user_id' not in session: return {"status": "error"}
    data = request.json
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO content_reports (content_id, reported_by, reason, school_code, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['content_id'], session['user_id'], data['reason'], session.get('school_code'), datetime.now().strftime('%Y-%m-%d %H:%M')))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.route('/digital-library/read/<int:content_id>')
def digital_library_reader(content_id):
    if 'user_id' not in session: return redirect('/login')
    
    conn = get_db_connection()
    content = conn.execute('SELECT * FROM digital_content WHERE id = ?', (content_id,)).fetchone()
    
    # Get last reading progress
    progress = conn.execute('SELECT last_page FROM reading_progress WHERE student_id = ? AND content_id = ?', 
                            (session['user_id'], content_id)).fetchone()
    last_page = progress['last_page'] if progress else 1
    
    conn.close()
    
    if not content: return "Content not found", 404
    
    # If not a PDF, fall back to standard content view
    if not content['file_url'].lower().endswith('.pdf'):
        return redirect(f'/digital-library/content/{content_id}')
        
    return render_template('reader.html', content=content, start_page=last_page)

@app.route('/api/save-progress', methods=['POST'])
def api_save_progress():
    if 'user_id' not in session: return {"status": "error"}
    data = request.json
    
    conn = get_db_connection()
    # Check if exists
    exists = conn.execute('SELECT id FROM reading_progress WHERE student_id = ? AND content_id = ?', 
                          (session['user_id'], data['content_id'])).fetchone()
    
    now = datetime.now().strftime('%Y-%m-%d %H:%M')
    if exists:
        conn.execute('UPDATE reading_progress SET last_page = ?, updated_at = ? WHERE id = ?', 
                     (data['page'], now, exists['id']))
    else:
        conn.execute('INSERT INTO reading_progress (student_id, content_id, last_page, updated_at) VALUES (?, ?, ?, ?)',
                     (session['user_id'], data['content_id'], data['page'], now))
                     
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.route('/api/live-stats')
def api_live_stats():
    # Returns the latest view counts for all published content
    conn = get_db_connection()
    stats = conn.execute('SELECT id, views FROM digital_content WHERE status = "Published"').fetchall()
    conn.close()
    return {"status": "success", "stats": {row['id']: row['views'] for row in stats}}

@app.route('/student/bookmarks')
def student_bookmarks():
    if 'user_id' not in session or session.get('role') != 'student': return redirect('/login')
    
    conn = get_db_connection()
    # Join with digital_content to get book details
    query = '''
        SELECT p.last_page, p.updated_at, d.* 
        FROM reading_progress p
        JOIN digital_content d ON p.content_id = d.id
        WHERE p.student_id = ?
        ORDER BY p.updated_at DESC
    '''
    bookmarks = conn.execute(query, (session['user_id'],)).fetchall()
    conn.close()
    
    return render_template('student_bookmarks.html', bookmarks=bookmarks)

@app.route('/super-admin/global-content')
def superadmin_global_content():
    if session.get('role') != 'super_admin': return redirect('/login')
    
    conn = get_db_connection()
    # Fetch all content globally
    query = '''
        SELECT d.*, u.name as student_name, s.name as school_name
        FROM digital_content d
        JOIN users u ON d.student_id = u.id
        JOIN schools s ON d.school_code = s.school_code
        ORDER BY d.created_at DESC
    '''
    content_list = conn.execute(query).fetchall()
    
    # Fetch all open reports
    reports = conn.execute('''
        SELECT r.*, c.title as content_title, u.name as reporter_name
        FROM content_reports r
        JOIN digital_content c ON r.content_id = c.id
        JOIN users u ON r.reported_by = u.id
        WHERE r.status = 'Open'
    ''').fetchall()
    conn.close()
    
    return render_template('superadmin_moderation.html', content_list=content_list, reports=reports)

@app.route('/super-admin/api/moderate-content', methods=['POST'])
def superadmin_moderate_content():
    if session.get('role') != 'super_admin': return {"status": "error"}
    
    data = request.json
    content_id = data.get('content_id')
    action = data.get('action') # 'Delete', 'Feature', 'Ban'
    reason = data.get('reason', 'Super Admin Intervention')
    
    conn = get_db_connection()
    
    if action == 'Delete':
        # Log it
        content = conn.execute('SELECT title, student_id, school_code FROM digital_content WHERE id = ?', (content_id,)).fetchone()
        if content:
            author = conn.execute('SELECT name FROM users WHERE id = ?', (content['student_id'],)).fetchone()
            author_name = author['name'] if author else "Unknown"
            conn.execute('''
                INSERT INTO content_moderation_logs (content_id, title, author_name, school_code, removed_by, removal_reason, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (content_id, content['title'], author_name, content['school_code'], session['user_id'], reason, datetime.now().strftime('%Y-%m-%d %H:%M')))
            
        conn.execute('DELETE FROM digital_content WHERE id = ?', (content_id,))
        # Also close related reports
        conn.execute('UPDATE content_reports SET status = "Resolved" WHERE content_id = ?', (content_id,))
        
    elif action == 'Feature':
        current = conn.execute('SELECT featured FROM digital_content WHERE id = ?', (content_id,)).fetchone()
        new_val = 1 if current['featured'] == 0 else 0
        conn.execute('UPDATE digital_content SET featured = ? WHERE id = ?', (new_val, content_id))
        
    elif action == 'Ban':
        # Ban the author of the content
        content = conn.execute('SELECT student_id FROM digital_content WHERE id = ?', (content_id,)).fetchone()
        if content:
            conn.execute('UPDATE users SET is_banned = 1 WHERE id = ?', (content['student_id'],))
            
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.route('/admin/review-queue')
def admin_review_queue():
    if session.get('role') not in ['admin', 'demo_admin']: return redirect('/login')
    if 'approve_content' not in session.get('permissions', []) and session.get('role') != 'demo_admin': return redirect('/admin')
    
    s_code = session.get('school_code')
    
    conn = get_db_connection()
    # Fetch content with student details
    query = '''
        SELECT d.*, u.name as student_name, u.admission_no 
        FROM digital_content d 
        JOIN users u ON d.student_id = u.id 
        WHERE d.school_code = ? AND d.status IN ('Submitted', 'Under Review')
        ORDER BY d.created_at DESC
    '''
    pending_content = conn.execute(query, (s_code,)).fetchall()
    conn.close()
    
    return render_template('admin_review.html', content_list=pending_content)

@app.route('/admin/api/moderate', methods=['POST'])
def admin_moderate_content():
    if session.get('role') not in ['admin', 'demo_admin']: return {"status": "error", "message": "Unauthorized"}
    if 'approve_content' not in session.get('permissions', []) and session.get('role') != 'demo_admin': return {"status": "error", "message": "Permission Denied"}
    
    data = request.json
    content_id = data.get('content_id')
    action = data.get('action') # 'Approve' or 'Reject'
    reason = data.get('rejection_reason', '')
    suggestions = data.get('suggested_changes', '')
    
    conn = get_db_connection()
    if action == 'Approve':
        conn.execute('UPDATE digital_content SET status = "Published" WHERE id = ?', (content_id,))
    elif action == 'Reject':
        conn.execute('UPDATE digital_content SET status = "Rejected", rejection_reason = ?, suggested_changes = ? WHERE id = ?', 
                     (reason, suggestions, content_id))
    
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.route('/admin/api/save-scanned', methods=['POST'])
def api_save_scanned():
    if session.get('role') not in ['admin', 'demo_admin']: return {"status": "error", "message": "Unauthorized"}
    data = request.json
    s_code = session.get('school_code')
    
    try:
        conn = get_db_connection()
        conn.execute('''
            INSERT INTO books (title, author, barcode_id, genre, description, total_copies, available_copies, cover_url, school_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('title'),
            data.get('author'),
            data.get('isbn'),
            data.get('genre'),
            data.get('description'),
            int(data.get('total_copies', 1)),
            int(data.get('total_copies', 1)),
            data.get('cover_url'),
            s_code
        ))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.route('/api/log-error', methods=['POST'])
def api_log_error():
    data = request.json or {}
    error_msg = data.get('error', 'Unknown error')
    url = data.get('url', '')
    line = data.get('line', '')
    col = data.get('col', '')
    stack = data.get('stack', '')
    
    log_dir = os.path.join(BASE_DIR, 'scratch')
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
        
    with open(os.path.join(log_dir, 'frontend_errors.log'), 'a', encoding='utf-8') as f:
        f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {error_msg} at {url}:{line}:{col}\nStack: {stack}\n\n")
        
    return {"status": "success"}

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login?clear_demo=1')

@app.route('/api/ai-context')
def api_ai_context():
    if 'user_id' not in session: return jsonify({"status": "error", "message": "Not logged in"})
    
    conn = get_db_connection()
    user_id = session.get('user_id')
    role = session.get('role')
    s_code = session.get('school_code')
    
    context = {
        "role": role,
        "school_code": s_code,
        "name": session.get('user_name')
    }
    
    if role == 'student':
        txs = conn.execute('SELECT t.*, b.title, b.author FROM transactions t JOIN books b ON b.id = t.book_id WHERE t.user_id = ? AND t.return_date IS NULL', (user_id,)).fetchall()
        total_read = conn.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ? AND return_date IS NOT NULL', (user_id,)).fetchone()[0]
        
        currently_issued = []
        total_fine = 0
        overdue_books = []
        
        for tx in txs:
            tx_dict = dict(tx)
            fine, is_overdue = calculate_fine(tx_dict['due_date'])
            total_fine += fine
            currently_issued.append(tx_dict['title'])
            if is_overdue:
                overdue_books.append(tx_dict['title'])
                
        context.update({
            "total_books_read": total_read,
            "currently_issued_books": currently_issued,
            "overdue_books": overdue_books,
            "total_pending_fine": total_fine
        })
        
    elif role in ['admin', 'demo_admin']:
        available_books = conn.execute('SELECT SUM(available_copies) FROM books WHERE school_code = ?', (s_code,)).fetchone()[0] or 0
        total_books = conn.execute('SELECT SUM(total_copies) FROM books WHERE school_code = ?', (s_code,)).fetchone()[0] or 0
        total_students = conn.execute('SELECT COUNT(*) FROM users WHERE role="student" AND school_code=?', (s_code,)).fetchone()[0]
        active_issued = conn.execute('SELECT COUNT(*) FROM transactions WHERE return_date IS NULL AND school_code=?', (s_code,)).fetchone()[0]
        
        context.update({
            "total_books_inventory": total_books,
            "available_books": available_books,
            "total_students": total_students,
            "currently_issued_books": active_issued
        })
        
    elif role == 'super_admin':
        total_schools = conn.execute('SELECT COUNT(*) FROM schools').fetchone()[0]
        total_students = conn.execute('SELECT COUNT(*) FROM users WHERE role="student"').fetchone()[0]
        total_librarians = conn.execute('SELECT COUNT(*) FROM users WHERE role="admin"').fetchone()[0]
        context.update({
            "total_registered_schools": total_schools,
            "total_students_across_all_schools": total_students,
            "total_librarians": total_librarians
        })
        
    conn.close()
    return jsonify({"status": "success", "context": context})

# Static Footer Pages
@app.route('/api-docs')
def api_docs():
    return render_template('page.html', title='API Documentation')

@app.route('/integrations')
def integrations():
    return render_template('page.html', title='Integrations')

@app.route('/help-center')
def help_center():
    return render_template('page.html', title='Help Center')

@app.route('/blog')
def blog():
    return render_template('page.html', title='Blog & Case Studies')

@app.route('/privacy')
def privacy():
    return render_template('page.html', title='Privacy Policy')

@app.route('/terms')
def terms():
    return render_template('page.html', title='Terms & Conditions')

@app.route('/refund')
def refund():
    return render_template('page.html', title='Refund Policy')

import requests

def send_organization_email(to_email, contact_person, code=None, login_id=None, password=None):
    # This is deprecated as we are moving EmailJS to the frontend
    pass

@app.route('/api/check-user', methods=['POST'])
def check_user():
    data = request.json
    try:
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE phone = ?', (data['phone'],)).fetchone()
        if user:
            if user['role'] != 'admin':
                return jsonify({"status": "error", "message": "Password reset is only available for Admins. Please contact your school administrator."})

            # First check if user has a direct email attached
            if user['email']:
                email = user['email']
            else:
                # Attempt to find email from organization requests as fallback for admins
                req = conn.execute('SELECT email FROM organization_requests WHERE phone = ? ORDER BY id DESC LIMIT 1', (data['phone'],)).fetchone()
                email = req['email'] if req else 'noreply@librika.in'
                
            return jsonify({"status": "success", "email": email})
        return jsonify({"status": "error", "message": "User not found"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    try:
        conn = get_db_connection()
        conn.execute('UPDATE users SET password = ? WHERE phone = ?', (data['new_password'], data['phone']))
        conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/apply-organization', methods=['POST'])
def apply_organization():
    data = request.json
    try:
        conn = get_db_connection()
        conn.execute('INSERT INTO organization_requests (org_name, contact_person, email, phone, status, created_at) VALUES (?,?,?,?,?,?)',
                     (data['org_name'], data['contact_person'], data['email'], data['phone'], 'pending', datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/super-admin/request/<int:req_id>/accept', methods=['POST'])
def accept_org_request(req_id):
    if session.get('role') != 'super_admin': return jsonify({"status": "error"}), 403
    try:
        import string, random
        conn = get_db_connection()
        req = conn.execute('SELECT * FROM organization_requests WHERE id = ?', (req_id,)).fetchone()
        if req:
            org_id = "ORG" + "".join(random.choices(string.digits, k=5))
            password = "".join(random.choices(string.ascii_letters + string.digits, k=8))
            
            # Create school
            conn.execute('INSERT INTO schools (name, school_code, librarian_name, max_books, max_students, created_at) VALUES (?,?,?,?,?,?)',
                         (req['org_name'], org_id, req['contact_person'], 1000, 500, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
            # Create user (Admin)
            conn.execute('INSERT INTO users (name, phone, email, password, role, school_code) VALUES (?,?,?,?,?,?)',
                         (req['contact_person'], req['phone'], req['email'], password, 'admin', org_id))
            
            # Update status
            conn.execute('UPDATE organization_requests SET status = "Approved" WHERE id = ?', (req_id,))
            conn.commit()
            
            # We don't send from backend anymore. Return data so frontend can send it via emailjs
            return jsonify({
                "status": "success", 
                "org_id": org_id, 
                "password": password, 
                "contact_person": req['contact_person'], 
                "email": req['email'], 
                "phone": req['phone']
            })
            
        return jsonify({"status": "error", "message": "Request not found"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/super-admin/request/<int:req_id>/reject', methods=['POST'])
def reject_org_request(req_id):
    if session.get('role') != 'super_admin': return jsonify({"status": "error"}), 403
    try:
        conn = get_db_connection()
        req = conn.execute('SELECT * FROM organization_requests WHERE id = ?', (req_id,)).fetchone()
        if req:
            conn.execute('UPDATE organization_requests SET status = "Rejected" WHERE id = ?', (req_id,))
            conn.commit()
            # For rejection, we don't send code/password
            send_organization_email(req['email'], req['contact_person'], None, None, None)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

# Ensure database is initialized even when run via Gunicorn
init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
