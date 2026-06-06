import uuid
from datetime import datetime, timedelta
import sqlite3

def get_db_connection():
    # Helper to connect to the right db depending on context
    # This will be injected by the app, or we can default to library_v3.db
    conn = sqlite3.connect('library_v3.db')
    conn.row_factory = sqlite3.Row
    return conn

class DummyGateway:
    """A simulated payment gateway that always succeeds."""
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
    conn = get_db_connection()
    plan = conn.execute('SELECT * FROM plans WHERE id = ?', (plan_id,)).fetchone()
    
    if not plan:
        conn.close()
        return {"error": "Invalid plan selected."}

    amount = plan['annual_price'] if billing_cycle == 'annual' else plan['monthly_price']
    
    # Simulate payment
    gateway_res = DummyGateway.create_subscription(school_code, plan_id, amount)
    
    now = datetime.now()
    period_end = now + timedelta(days=365) if billing_cycle == 'annual' else now + timedelta(days=30)
    
    # Create or update subscription
    existing_sub = conn.execute('SELECT id FROM subscriptions WHERE school_code = ?', (school_code,)).fetchone()
    sub_id = existing_sub['id'] if existing_sub else f"sub_{uuid.uuid4().hex[:10]}"
    
    if existing_sub:
        conn.execute('''
            UPDATE subscriptions 
            SET plan_id = ?, status = ?, current_period_end = ?, cancel_at_period_end = 0
            WHERE id = ?
        ''', (plan_id, 'active', period_end.strftime('%Y-%m-%d %H:%M:%S'), sub_id))
    else:
        conn.execute('''
            INSERT INTO subscriptions (id, school_code, plan_id, status, start_date, current_period_end, trial_end, cancel_at_period_end)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (sub_id, school_code, plan_id, 'active', now.strftime('%Y-%m-%d %H:%M:%S'), period_end.strftime('%Y-%m-%d %H:%M:%S'), None, False))

    # Generate Invoice
    inv_id = f"inv_{uuid.uuid4().hex[:10]}"
    conn.execute('''
        INSERT INTO invoices (id, school_code, amount, tax, total, status, due_date, pdf_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (inv_id, school_code, amount, amount * 0.18, amount * 1.18, 'paid', now.strftime('%Y-%m-%d'), None, now.strftime('%Y-%m-%d %H:%M:%S')))
    
    # Record Payment
    conn.execute('''
        INSERT INTO payments (id, invoice_id, gateway_txn_id, amount, method, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (f"pay_{uuid.uuid4().hex[:10]}", inv_id, gateway_res['transaction_id'], amount * 1.18, 'dummy_card', 'success', now.strftime('%Y-%m-%d %H:%M:%S')))

    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Payment processed successfully. Subscription activated."}

def get_school_subscription(school_code):
    conn = get_db_connection()
    sub = conn.execute('''
        SELECT s.*, p.name as plan_name, p.max_students, p.max_books, p.features_json 
        FROM subscriptions s 
        JOIN plans p ON s.plan_id = p.id 
        WHERE s.school_code = ?
    ''', (school_code,)).fetchone()
    
    if not sub:
        # Default to Free plan if none exists
        sub = conn.execute('SELECT * FROM plans WHERE id = "plan_free"').fetchone()
        conn.close()
        if not sub: return None
        return {
            "status": "active",
            "plan_name": sub['name'],
            "plan_id": sub['id'],
            "max_students": sub['max_students'],
            "max_books": sub['max_books'],
            "features_json": sub['features_json'],
            "current_period_end": "Never (Free Tier)"
        }
        
    conn.close()
    return dict(sub)
