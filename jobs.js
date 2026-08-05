const cron = require('node-cron');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs-extra');
const https = require('https');
const db = require('./db');

const pool = { query: (text, params) => db.query(text, params) };

const hasCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const UPLOADS_DIR = path.join(__dirname, 'static', 'uploads');
const DIGITAL_CONTENT_DIR = path.join(__dirname, 'static', 'digital_content');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.removeSync(dest);
        return reject(new Error(`Download failed: ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      file.close();
      fs.removeSync(dest);
      reject(err);
    });
  });
}

async function markOverdueBooks() {
  console.log('[Jobs] Checking for overdue books...');
  try {
    const result = await pool.query(
      `UPDATE transactions SET status = 'overdue'
       WHERE due_date < NOW() AND return_date IS NULL AND (status IS NULL OR status = 'issued' OR status = '')`
    );
    if (result && result.rowCount > 0) {
      console.log(`[Jobs] Marked ${result.rowCount} transaction(s) as overdue`);
    } else {
      console.log('[Jobs] No overdue transactions found');
    }
  } catch (err) {
    console.error('[Jobs] Overdue books error:', err.message);
  }
}

async function syncCloudinaryFolder(cloudFolder, localDir, label) {
  if (!hasCloudinary) {
    console.log(`[Jobs] Skipping Cloudinary sync for '${cloudFolder}' — Cloudinary not configured`);
    return;
  }
  console.log(`[Jobs] Syncing Cloudinary folder '${cloudFolder}' to ${localDir}...`);
  fs.ensureDirSync(localDir);
  try {
    let resources = [];
    let nextCursor = null;
    do {
      const opts = { type: 'upload', prefix: cloudFolder + '/', max_results: 500 };
      if (nextCursor) opts.next_cursor = nextCursor;
      const res = await cloudinary.api.resources(opts);
      resources = resources.concat(res.resources);
      nextCursor = res.next_cursor;
    } while (nextCursor);

    let downloaded = 0;
    let skipped = 0;
    for (const r of resources) {
      const fileName = r.public_id.replace(cloudFolder + '/', '');
      const ext = r.format ? '.' + r.format : '';
      const destPath = path.join(localDir, fileName + ext);
      if (fs.existsSync(destPath)) {
        skipped++;
        continue;
      }
      try {
        await downloadFile(r.secure_url, destPath);
        downloaded++;
      } catch (err) {
        console.error(`[Jobs] Failed to download ${r.secure_url}: ${err.message}`);
      }
    }
    console.log(`[Jobs] ${label}: downloaded ${downloaded}, skipped ${skipped}, total ${resources.length}`);
  } catch (err) {
    if (err.http_code === 401 || err.message.includes('api_secret')) {
      console.error(`[Jobs] Cloudinary auth failed for '${cloudFolder}' — check CLOUDINARY_API_SECRET`);
    } else {
      console.error(`[Jobs] Cloudinary sync error (${label}):`, err.message);
    }
  }
}

async function sendOverdueReminders() {
  console.log('[Jobs] Checking for overdue reminders...');
  try {
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.phone
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.due_date < NOW() AND t.return_date IS NULL`
    );
    if (!result || !result.rows || result.rows.length === 0) {
      console.log('[Jobs] No overdue reminders needed');
      return;
    }
    for (const user of result.rows) {
      console.log(`[Jobs] Reminder: User "${user.name}" (${user.email || user.phone}) has overdue books`);
    }
    console.log(`[Jobs] Sent ${result.rows.length} overdue reminder(s)`);
  } catch (err) {
    console.error('[Jobs] Overdue reminders error:', err.message);
  }
}

async function cleanupExpiredReservations() {
  console.log('[Jobs] Cleaning up expired reservations...');
  try {
    const result = await pool.query(
      `DELETE FROM reservations
       WHERE (status = 'Pending' OR status = 'pending') AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    if (result && result.rowCount > 0) {
      console.log(`[Jobs] Deleted ${result.rowCount} expired reservation(s)`);
    } else {
      console.log('[Jobs] No expired reservations to delete');
    }
  } catch (err) {
    console.error('[Jobs] Reservation cleanup error:', err.message);
  }
}

function startJobs() {
  cron.schedule('0 0 * * *', () => {
    markOverdueBooks();
  });

  setTimeout(() => {
    syncCloudinaryFolder('uploads', UPLOADS_DIR, 'Book covers');
    syncCloudinaryFolder('digital_content', DIGITAL_CONTENT_DIR, 'Digital content');
  }, 2000);

  cron.schedule('0 9 * * *', () => {
    sendOverdueReminders();
  });

  cron.schedule('0 0 * * 0', () => {
    cleanupExpiredReservations();
  });

  console.log('[Jobs] Scheduled background jobs initialized');
}

module.exports = { startJobs };