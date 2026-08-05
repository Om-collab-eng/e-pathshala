-- ────────────────────────────────────────────────────────────────────
-- 002_super_admin_extensions.sql
-- Phase 2 + 3 of the Super Admin Dashboard rebuild.
-- Adds: school branding columns, 2FA columns on users, delivery tracking
-- on notifications, plus new tables for: reading_goals, scheduled_notifications,
-- backup_schedules, ip_allowlist, login_history, rfid_records.
--
-- Safe to run repeatedly — every CREATE uses IF NOT EXISTS, every
-- ALTER uses ADD COLUMN IF NOT EXISTS (Postgres syntax; for MySQL and
-- SQLite we use the bundled JS runner `scripts/migrate.js` which
-- wraps these in portable guard checks).
-- ────────────────────────────────────────────────────────────────────

-- Schools: branding columns
ALTER TABLE schools ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT '#6366f1';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(20) DEFAULT '#a855f7';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS school_name_override VARCHAR(255);

-- Users: 2FA + impersonation bookkeeping
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);

-- Notifications: delivery tracking
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'in_app';

-- Reading Goals
CREATE TABLE IF NOT EXISTS reading_goals (
    id SERIAL PRIMARY KEY,
    school_code VARCHAR(50),
    role VARCHAR(50),
    target INTEGER NOT NULL DEFAULT 10,
    period VARCHAR(50) DEFAULT 'monthly', -- 'weekly' | 'monthly' | 'yearly'
    description TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled notifications
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    scope VARCHAR(50) NOT NULL,           -- 'all' | 'school' | 'role' | 'user'
    school_code VARCHAR(50),
    role_target VARCHAR(50),
    user_id INTEGER,
    run_at TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'sent' | 'failed' | 'cancelled'
    sent_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backup schedules
CREATE TABLE IF NOT EXISTS backup_schedules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cron VARCHAR(100) NOT NULL,           -- e.g. '0 2 * * *' (2am daily)
    target VARCHAR(50) DEFAULT 'db',      -- 'db' | 'uploads' | 'full'
    retention_days INTEGER DEFAULT 30,
    enabled INTEGER DEFAULT 1,
    last_run TIMESTAMP,
    last_status VARCHAR(50),
    last_error TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IP allowlist
CREATE TABLE IF NOT EXISTS ip_allowlist (
    id SERIAL PRIMARY KEY,
    cidr VARCHAR(100) NOT NULL,           -- '1.2.3.4' or '1.2.3.0/24'
    label VARCHAR(255),
    enabled INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login history
CREATE TABLE IF NOT EXISTS login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    email VARCHAR(255),
    phone VARCHAR(30),
    role VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    success INTEGER DEFAULT 1,
    failure_reason VARCHAR(255),
    school_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RFID records
CREATE TABLE IF NOT EXISTS rfid_records (
    id SERIAL PRIMARY KEY,
    rfid_tag VARCHAR(100) UNIQUE NOT NULL,
    book_id INTEGER,
    barcode_id VARCHAR(100),
    accession_number VARCHAR(100),
    shelf_location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    school_code VARCHAR(50),
    last_scanned_at TIMESTAMP,
    scan_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Impersonation log (audit trail for super-admin acting-as-user)
CREATE TABLE IF NOT EXISTS impersonation_log (
    id SERIAL PRIMARY KEY,
    impersonator_id INTEGER NOT NULL,
    impersonated_id INTEGER NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    ip_address VARCHAR(45)
);

-- 2FA backup codes
CREATE TABLE IF NOT EXISTS two_factor_backup_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_reading_goals_school ON reading_goals(school_code);
CREATE INDEX IF NOT EXISTS idx_sched_notif_run_at ON scheduled_notifications(run_at);
CREATE INDEX IF NOT EXISTS idx_sched_notif_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_ip ON login_history(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at);
CREATE INDEX IF NOT EXISTS idx_rfid_tag ON rfid_records(rfid_tag);
CREATE INDEX IF NOT EXISTS idx_rfid_book ON rfid_records(book_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_impersonator ON impersonation_log(impersonator_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_impersonated ON impersonation_log(impersonated_id);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_enabled ON backup_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_ip_allowlist_enabled ON ip_allowlist(enabled);