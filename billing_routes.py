from flask import Blueprint, render_template, request, session, redirect, url_for, flash, jsonify
from billing import get_school_subscription, process_checkout, get_db_connection
import json

billing_bp = Blueprint('billing', __name__, url_prefix='/billing')

def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get('role') != 'admin':
            flash("Admin access required for billing.")
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated_function

@billing_bp.route('/')
@login_required
@admin_required
def dashboard():
    school_code = session.get('school_code')
    sub = get_school_subscription(school_code)
    
    conn = get_db_connection()
    plans = conn.execute('SELECT * FROM plans').fetchall()
    invoices = conn.execute('SELECT * FROM invoices WHERE school_code = ? ORDER BY created_at DESC', (school_code,)).fetchall()
    
    # Calculate usage metrics
    students_count = conn.execute('SELECT COUNT(*) FROM users WHERE role="student" AND school_code=?', (school_code,)).fetchone()[0]
    books_count = conn.execute('SELECT COUNT(*) FROM books WHERE school_code=?', (school_code,)).fetchone()[0]
    conn.close()
    
    return render_template('billing_dashboard.html', sub=sub, plans=plans, invoices=invoices, students_count=students_count, books_count=books_count, json=json)

@billing_bp.route('/checkout', methods=['POST'])
@login_required
@admin_required
def checkout():
    school_code = session.get('school_code')
    plan_id = request.form.get('plan_id')
    billing_cycle = request.form.get('billing_cycle', 'monthly')
    
    res = process_checkout(school_code, plan_id, billing_cycle)
    if 'error' in res:
        flash(res['error'], 'error')
    else:
        flash(res['message'], 'success')
        
    return redirect(url_for('billing.dashboard'))

@billing_bp.route('/cancel', methods=['POST'])
@login_required
@admin_required
def cancel():
    school_code = session.get('school_code')
    conn = get_db_connection()
    # Mark subscription to cancel at period end
    conn.execute('UPDATE subscriptions SET cancel_at_period_end = 1 WHERE school_code = ?', (school_code,))
    conn.commit()
    conn.close()
    flash('Your subscription has been marked for cancellation and will not renew.', 'success')
    return redirect(url_for('billing.dashboard'))
