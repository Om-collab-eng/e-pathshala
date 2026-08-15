const db = require('../db');
const { getClientIp, ensureSecurityTables } = require('../services/auditLogger');

let cachedMaintenanceMode = null;
let cachedIpRules = null;
let lastCheckTime = 0;
const CACHE_TTL = 15000; // 15 seconds

async function maintenanceMiddleware(req, res, next) {
  const now = Date.now();

  if (now - lastCheckTime > CACHE_TTL) {
    try {
      await ensureSecurityTables();
      let result;
      try {
        result = await db.query('SELECT * FROM system_settings WHERE `key` = $1', ['maintenance_mode']);
      } catch (e) {
        try {
          result = await db.query('SELECT * FROM system_settings WHERE setting_key = $1', ['maintenance_mode']);
        } catch (e2) {
          result = { rows: [] };
        }
      }
      if (result && result.rows && result.rows.length > 0) {
        const val = result.rows[0].setting_value || result.rows[0].value || 'false';
        cachedMaintenanceMode = val === 'true';
      } else {
        cachedMaintenanceMode = false;
      }

      // Check active IP rules
      try {
        const ipRes = await db.query('SELECT cidr, enabled FROM ip_allowlist WHERE enabled = 1');
        cachedIpRules = ipRes.rows || [];
      } catch (e) {
        cachedIpRules = [];
      }

      lastCheckTime = now;
    } catch (err) {
      cachedMaintenanceMode = false;
      cachedIpRules = [];
      lastCheckTime = now;
    }
  }

  const clientIp = getClientIp(req);

  // Check IP restrictions if rules exist
  if (cachedIpRules && cachedIpRules.length > 0) {
    const isSuper = req.session && (req.session.role === 'super_admin' || req.session.role === 'superadmin');
    if (!isSuper) {
      const allowed = cachedIpRules.some(r => {
        const cleanCidr = String(r.cidr || '').trim();
        if (cleanCidr === '*' || cleanCidr === '0.0.0.0/0') return true;
        if (cleanCidr === clientIp) return true;
        if (clientIp.startsWith(cleanCidr.replace(/\/[0-9]+$/, ''))) return true;
        return false;
      });

      if (!allowed) {
        return res.status(403).send('Access denied: IP restriction active on this network.');
      }
    }
  }

  if (cachedMaintenanceMode) {
    if (req.session && (req.session.role === 'super_admin' || req.session.role === 'superadmin')) {
      return next();
    }
    return res.status(503).send('Site is under maintenance. Please try again later.');
  }

  next();
}

module.exports = maintenanceMiddleware;

