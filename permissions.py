PLANS = {
    "FREE": {
        "price": 0,
        "limits": {"studentLimit": 50, "adminLimit": 1, "librarianLimit": 1, "max_books": 500},
        "perms": {
            "canImportCSV": False,
            "canExportCSV": False,
            "canUseAIScanner": False,
            "canUseBarcodeScanner": False,
            "canUseAdvancedAnalytics": False,
            "canUsePublishing": False,
            "canUseMultiBranch": False,
            "canUseAPI": False
        }
    },
    "BASIC": {
        "price": 999,
        "limits": {"studentLimit": 500, "adminLimit": 5, "librarianLimit": 5, "max_books": 10000},
        "perms": {
            "canImportCSV": True,
            "canExportCSV": True,
            "canUseAIScanner": True,
            "canUseBarcodeScanner": True,
            "canUseAdvancedAnalytics": False,
            "canUsePublishing": False,
            "canUseMultiBranch": False,
            "canUseAPI": False
        }
    },
    "PROFESSIONAL": {
        "price": 2999,
        "limits": {"studentLimit": 999999, "adminLimit": 999999, "librarianLimit": 999999, "max_books": 999999},
        "perms": {
            "canImportCSV": True,
            "canExportCSV": True,
            "canUseAIScanner": True,
            "canUseBarcodeScanner": True,
            "canUseAdvancedAnalytics": True,
            "canUsePublishing": True,
            "canUseMultiBranch": True,
            "canUseAPI": True
        }
    }
}

def get_school_plan(conn, school_code):
    if not school_code or school_code == 'APP':
        return "FREE"
    school = conn.execute("SELECT activePlan FROM schools WHERE school_code = ?", (school_code,)).fetchone()
    if not school or not school['activePlan']:
        return "FREE"
    return school['activePlan']

def get_school_permissions(conn, school_code):
    plan = get_school_plan(conn, school_code)
    return PLANS.get(plan, PLANS["FREE"])["perms"]

def get_school_limits(conn, school_code):
    plan = get_school_plan(conn, school_code)
    return PLANS.get(plan, PLANS["FREE"])["limits"]

def require_permission(perm_key):
    from functools import wraps
    from flask import session, jsonify, request
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            import sqlite3
            try:
                # Determine context DB
                db_file = 'demo.db' if session.get('is_demo') else 'library_v3.db'
                conn = sqlite3.connect(db_file)
                conn.row_factory = sqlite3.Row
                perms = get_school_permissions(conn, session.get('school_code'))
                conn.close()
            except Exception:
                perms = PLANS["FREE"]["perms"]

            if not perms.get(perm_key):
                if request.headers.get('Accept') == 'application/json' or request.is_json:
                    return jsonify({'status': 'error', 'message': f'Upgrade your school subscription to access {perm_key}.'}), 403
                return "Upgrade your school subscription to access this feature.", 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator
