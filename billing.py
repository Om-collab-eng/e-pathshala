import uuid
from datetime import datetime, timedelta
import sqlite3
from permissions import PLANS

def get_db_connection():
    conn = sqlite3.connect('library_v3.db')
    conn.row_factory = sqlite3.Row
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
    conn = get_db_connection()
    school = conn.execute('SELECT activePlan, subscriptionStatus, expiryDate FROM schools WHERE school_code = ?', (school_code,)).fetchone()
    conn.close()
    
    if not school or not school['activePlan']:
        plan_id = "FREE"
    else:
        plan_id = school['activePlan']
        
    return {
        "status": school['subscriptionStatus'] if school else "active",
        "plan_name": plan_id,
        "plan_id": plan_id,
        "max_students": PLANS[plan_id]["limits"]["studentLimit"],
        "max_books": PLANS[plan_id]["limits"]["max_books"],
        "current_period_end": school['expiryDate'] if school and school['expiryDate'] else "Never (Free Tier)"
    }
