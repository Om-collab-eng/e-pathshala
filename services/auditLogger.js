const db = require('../db');

let _tablesInitialized = false;

/**
 * Ensures all security and logging tables exist across SQLite, MySQL, and PostgreSQL.
 */
async function ensureSecurityTables() {
  if (_tablesInitialized) return;
  _tablesInitialized = true;

  try {
    // 1. Logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action TEXT,
        module VARCHAR(100),
        ip_address VARCHAR(45),
        school_code VARCHAR(50),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    // 2. Login history table
    await db.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        email VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(50),
        ip_address VARCHAR(45),
        user_agent TEXT,
        success INT DEFAULT 1,
        failure_reason VARCHAR(255),
        school_code VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    // 3. IP allowlist table
    await db.query(`
      CREATE TABLE IF NOT EXISTS ip_allowlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cidr VARCHAR(100) NOT NULL,
        label VARCHAR(255),
        enabled INT DEFAULT 1,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    // 4. Backup schedules table
    await db.query(`
      CREATE TABLE IF NOT EXISTS backup_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cron VARCHAR(100) NOT NULL,
        target VARCHAR(50) DEFAULT 'db',
        retention_days INT DEFAULT 30,
        enabled INT DEFAULT 1,
        last_run TIMESTAMP NULL DEFAULT NULL,
        last_status VARCHAR(50),
        last_error TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    // 5. Student devices / Active sessions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS student_devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        device_name VARCHAR(255),
        device_type VARCHAR(100),
        ip_address VARCHAR(45),
        session_token VARCHAR(255),
        user_agent TEXT,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_current INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    // 6. Advertisements table
    await db.query(`
      CREATE TABLE IF NOT EXISTS advertisements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        cta_text VARCHAR(100) DEFAULT 'Learn More',
        target_url VARCHAR(500) DEFAULT '#',
        image_url VARCHAR(500),
        bg_gradient VARCHAR(255) DEFAULT 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        start_time DATETIME NULL DEFAULT NULL,
        end_time DATETIME NULL DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'active',
        priority INT DEFAULT 1,
        target_section VARCHAR(100) DEFAULT 'all',
        impressions INT DEFAULT 0,
        clicks INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    // 7. Notifications table
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT 0,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read INT DEFAULT 0,
        school_code VARCHAR(50) DEFAULT 'GLOBAL',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    // 8. User 2FA columns & logs details column
    await db.query(`ALTER TABLE logs ADD COLUMN IF NOT EXISTS details TEXT`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read INT DEFAULT 0`).catch(() => {});
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS school_code VARCHAR(50) DEFAULT 'GLOBAL'`).catch(() => {});
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled INT DEFAULT 0`).catch(() => {});
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT`).catch(() => {});
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete TINYINT(1) DEFAULT 0`).catch(() => {});
  } catch (err) {
    // Silently ignore schema migration notes
  }
}

/**
 * Get client IP address helper
 */
function getClientIp(req) {
  if (!req) return '127.0.0.1';
  return (
    req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers?.['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
}

/**
 * Log any general application activity (Admin, Super Admin, Student)
 */
async function logActivity(req, { userId, action, module = 'system', schoolCode, ip, details = '' }) {
  try {
    await ensureSecurityTables();
    const effectiveUserId = userId || (req && req.session && req.session.user_id) || 0;
    const effectiveSchool = schoolCode || (req && req.session && req.session.school_code) || 'GLOBAL';
    const effectiveIp = ip || getClientIp(req);
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');

    // Try with details column, fallback to standard columns
    try {
      await db.query(
        `INSERT INTO logs (user_id, action, module, ip_address, school_code, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [effectiveUserId, action, module, effectiveIp, effectiveSchool, detailsStr]
      );
    } catch (e) {
      await db.query(
        `INSERT INTO logs (user_id, action, module, ip_address, school_code, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [effectiveUserId, action, module, effectiveIp, effectiveSchool]
      );
    }
  } catch (err) {
    // Non-blocking logging failure
    console.error('[AuditLogger] logActivity error:', err.message);
  }
}

/**
 * Log login attempts (success and failure)
 */
async function logLoginAttempt({
  userId = null,
  email = null,
  phone = null,
  role = null,
  schoolCode = null,
  ip = null,
  userAgent = null,
  success = 1,
  failureReason = null
}) {
  try {
    await ensureSecurityTables();
    await db.query(
      `INSERT INTO login_history (user_id, email, phone, role, ip_address, user_agent, success, failure_reason, school_code, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
      [
        userId,
        email,
        phone,
        role,
        ip || '127.0.0.1',
        userAgent ? String(userAgent).slice(0, 500) : '',
        success ? 1 : 0,
        failureReason,
        schoolCode || 'GLOBAL'
      ]
    );

    // Also record into general logs table
    const actionDesc = success
      ? `User logged in (${role || 'user'}${schoolCode ? ` - ${schoolCode}` : ''})`
      : `Failed login attempt: ${failureReason || 'Invalid credentials'} (${phone || email || 'unknown'})`;

    try {
      await db.query(
        `INSERT INTO logs (user_id, action, module, ip_address, school_code, details, created_at)
         VALUES ($1, $2, 'auth', $3, $4, $5, CURRENT_TIMESTAMP)`,
        [
          userId || 0,
          actionDesc,
          ip || '127.0.0.1',
          schoolCode || 'GLOBAL',
          JSON.stringify({ phone, email, success, reason: failureReason })
        ]
      );
    } catch (e) {
      await db.query(
        `INSERT INTO logs (user_id, action, module, ip_address, school_code, created_at)
         VALUES ($1, $2, 'auth', $3, $4, CURRENT_TIMESTAMP)`,
        [
          userId || 0,
          actionDesc,
          ip || '127.0.0.1',
          schoolCode || 'GLOBAL'
        ]
      );
    }
  } catch (err) {
    console.error('[AuditLogger] logLoginAttempt error:', err.message);
  }
}

/**
 * Record or update active device session
 */
async function recordDevice({ userId, req, sessionToken }) {
  if (!userId) return;
  try {
    await ensureSecurityTables();
    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] || 'Browser';

    // Identify device type roughly from user-agent
    let deviceType = 'Desktop';
    let deviceName = 'Web Browser';
    if (/mobile/i.test(ua)) {
      deviceType = 'Mobile';
      deviceName = /android/i.test(ua) ? 'Android Device' : /iphone|ipad/i.test(ua) ? 'iOS Device' : 'Mobile Browser';
    } else if (/tablet|ipad/i.test(ua)) {
      deviceType = 'Tablet';
      deviceName = 'Tablet';
    } else if (/windows/i.test(ua)) {
      deviceName = 'Windows PC';
    } else if (/macintosh|mac os/i.test(ua)) {
      deviceName = 'Mac';
    } else if (/linux/i.test(ua)) {
      deviceName = 'Linux Workstation';
    }

    const token = sessionToken || (req.sessionID || 'sess_' + Date.now());

    // Check if device session already recorded
    const existing = await db.query(
      `SELECT id FROM student_devices WHERE user_id = $1 AND (session_token = $2 OR ip_address = $3)`,
      [userId, token, ip]
    );

    if (existing.rows && existing.rows.length > 0) {
      await db.query(
        `UPDATE student_devices SET last_active = CURRENT_TIMESTAMP, ip_address = $1, user_agent = $2, device_name = $3 WHERE id = $4`,
        [ip, ua, deviceName, existing.rows[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO student_devices (user_id, device_name, device_type, ip_address, session_token, user_agent, last_active, is_current)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, 1)`,
        [userId, deviceName, deviceType, ip, token, ua]
      );
    }
  } catch (err) {
    console.error('[AuditLogger] recordDevice error:', err.message);
  }
}

module.exports = {
  ensureSecurityTables,
  getClientIp,
  logActivity,
  logLoginAttempt,
  recordDevice
};
