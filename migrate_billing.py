import sqlite3
import json

def init_billing_tables(db_name):
    conn = sqlite3.connect(db_name)
    
    conn.execute('''CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        name TEXT,
        monthly_price REAL,
        annual_price REAL,
        max_students INTEGER,
        max_books INTEGER,
        features_json TEXT
    )''')

    conn.execute('''CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        school_code TEXT,
        plan_id TEXT,
        status TEXT,
        start_date TEXT,
        current_period_end TEXT,
        trial_end TEXT,
        cancel_at_period_end BOOLEAN,
        FOREIGN KEY(school_code) REFERENCES schools(school_code),
        FOREIGN KEY(plan_id) REFERENCES plans(id)
    )''')

    conn.execute('''CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        school_code TEXT,
        amount REAL,
        tax REAL,
        total REAL,
        status TEXT,
        due_date TEXT,
        pdf_url TEXT,
        created_at TEXT,
        FOREIGN KEY(school_code) REFERENCES schools(school_code)
    )''')

    conn.execute('''CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        invoice_id TEXT,
        gateway_txn_id TEXT,
        amount REAL,
        method TEXT,
        status TEXT,
        created_at TEXT,
        FOREIGN KEY(invoice_id) REFERENCES invoices(id)
    )''')

    conn.execute('''CREATE TABLE IF NOT EXISTS coupons (
        code TEXT PRIMARY KEY,
        discount_percent REAL,
        valid_until TEXT,
        max_uses INTEGER,
        times_used INTEGER DEFAULT 0
    )''')

    conn.execute('''CREATE TABLE IF NOT EXISTS addons (
        id TEXT PRIMARY KEY,
        school_code TEXT,
        type TEXT,
        quantity INTEGER,
        price REAL,
        purchased_at TEXT,
        FOREIGN KEY(school_code) REFERENCES schools(school_code)
    )''')
    
    # Seed default plans
    plans = [
        ('plan_free', 'Free', 0.0, 0.0, 50, 100, json.dumps({"analytics": False, "api": False, "multi_branch": False})),
        ('plan_basic', 'Basic', 29.0, 290.0, 500, 2000, json.dumps({"analytics": True, "api": False, "multi_branch": False})),
        ('plan_pro', 'Professional', 99.0, 990.0, 2000, 10000, json.dumps({"analytics": True, "api": True, "multi_branch": False})),
        ('plan_enterprise', 'Enterprise', 299.0, 2990.0, 10000, 50000, json.dumps({"analytics": True, "api": True, "multi_branch": True})),
        ('plan_gov', 'Government/Education District', 499.0, 4990.0, 100000, 500000, json.dumps({"analytics": True, "api": True, "multi_branch": True}))
    ]
    
    for p in plans:
        conn.execute('INSERT OR IGNORE INTO plans (id, name, monthly_price, annual_price, max_students, max_books, features_json) VALUES (?, ?, ?, ?, ?, ?, ?)', p)

    conn.commit()
    conn.close()
    print(f"Billing tables created/verified for {db_name}")

if __name__ == '__main__':
    init_billing_tables('library_v3.db')
    init_billing_tables('demo.db')
