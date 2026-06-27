import uuid
from datetime import datetime, timedelta
import sqlite3
from permissions import PLANS

def get_db_connection():
    from flask import session, has_request_context
    db_name = 'demo.db' if (has_request_context() and session.get('is_demo')) else 'library_v3.db'
    conn = sqlite3.connect(db_name, timeout=10.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('PRAGMA busy_timeout=10000')
    except Exception as e:
        print("PRAGMA setting failed:", e)
    return conn

class DummyGateway:
    @staticmethod
    def create_subscription(school_code, plan_id, amount):
        txn_id = f"txn_dummy_{uuid.uuid4().hex[:10]}"
        return {
            "status": "active",
            "subscription_id": f"sub_{uuid.uuid4().hex[:10]}",
            "transaction_id": txn_id,
            "amount": amount
        }

def process_checkout(school_code, plan_id, billing_cycle):
    if plan_id not in PLANS:
        return {"error": "Invalid plan selected."}

    plan = PLANS[plan_id]
    amount = plan['price'] * 12 if billing_cycle == 'annual' else plan['price']
    
    # Simulate payment
    gateway_res = DummyGateway.create_subscription(school_code, plan_id, amount)
    
    now = datetime.now()
    period_end = now + timedelta(days=365) if billing_cycle == 'annual' else now + timedelta(days=30)
    
    conn = get_db_connection()
    limits = plan['limits']
    
    # Upgrade school plan directly
    conn.execute('''
        UPDATE schools 
        SET activePlan = ?, subscriptionStatus = "active", expiryDate = ?,
            studentLimit = ?, librarianLimit = ?, adminLimit = ?
        WHERE school_code = ?
    ''', (plan_id, period_end.strftime('%Y-%m-%d %H:%M:%S'), 
          limits['studentLimit'], limits['librarianLimit'], limits['adminLimit'], school_code))

    # Generate Invoice
    inv_id = f"inv_{uuid.uuid4().hex[:10]}"
    conn.execute('''
        INSERT INTO invoices (id, school_code, amount, tax, total, status, due_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (inv_id, school_code, amount, amount * 0.18, amount * 1.18, 'paid', now.strftime('%Y-%m-%d'), now.strftime('%Y-%m-%d %H:%M:%S')))
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": f"Successfully upgraded to {plan_id} Plan!"}

def get_school_subscription(school_code):
    from flask import session, has_request_context
    conn = get_db_connection()
    school = conn.execute('SELECT activePlan, subscriptionStatus, expiryDate FROM schools WHERE school_code = ?', (school_code,)).fetchone()
    conn.close()
    
    is_demo = has_request_context() and session.get('is_demo')
    
    if not school or not school['activePlan']:
        plan_id = "PROFESSIONAL" if is_demo else "FREE"
        status = "active"
        expiry = "Never (Demo Sandbox)" if is_demo else "Never (Free Tier)"
    else:
        plan_id = school['activePlan']
        status = school['subscriptionStatus'] or "active"
        expiry = school['expiryDate'] or "Never"
        
    return {
        "status": status,
        "plan_name": plan_id,
        "plan_id": plan_id,
        "max_students": PLANS[plan_id]["limits"]["studentLimit"],
        "max_books": PLANS[plan_id]["limits"]["max_books"],
        "current_period_end": expiry
    }
