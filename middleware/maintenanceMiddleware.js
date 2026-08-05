const db = require('../db');

let cachedMaintenanceMode = null;
let lastCheckTime = 0;
const CACHE_TTL = 30000; // 30 seconds

async function maintenanceMiddleware(req, res, next) {
  const now = Date.now();

  if (now - lastCheckTime > CACHE_TTL) {
    try {
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
      lastCheckTime = now;
    } catch (err) {
      cachedMaintenanceMode = false;
      lastCheckTime = now;
    }
  }

  if (cachedMaintenanceMode) {
    if (req.session && req.session.role === 'super_admin') {
      return next();
    }
    return res.status(503).send('Site is under maintenance. Please try again later.');
  }

  next();
}

module.exports = maintenanceMiddleware;
