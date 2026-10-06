/**
 * Unified User Profile & Common Data Model Migration
 * - Adds canonical profile fields to `users` (father_name, mother_name, roll_no, username, joining_date)
 * - Creates `student_profiles`, `staff_profiles`, and `user_audit_logs`
 * - Migrates/populates initial values for existing records
 * - Hashes any plain-text passwords using bcrypt for complete data security
 */

const db = require('../db');
const bcrypt = require('bcrypt');

async function migrateUnifiedUserProfile() {
  console.log('=== Starting Unified User Profile Migration ===');

  // 1. Inspect existing columns in users
  const userColsRes = await db.query("SELECT name FROM pragma_table_info('users')");
  const existingCols = new Set(userColsRes.rows.map(r => r.name.toLowerCase()));

  const newCols = [
    { name: 'username', type: 'TEXT' },
    { name: 'father_name', type: 'TEXT' },
    { name: 'mother_name', type: 'TEXT' },
    { name: 'roll_no', type: 'TEXT' },
    { name: 'joining_date', type: 'TEXT' }
  ];

  for (const col of newCols) {
    if (!existingCols.has(col.name.toLowerCase())) {
      console.log(`Adding column '${col.name}' (${col.type}) to users table...`);
      await db.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`).catch(err => {
        console.warn(`Note adding ${col.name}:`, err.message);
      });
    } else {
      console.log(`Column '${col.name}' already exists in users table.`);
    }
  }

  // 2. Create student_profiles table
  console.log('Ensuring student_profiles table exists...');
  await db.query(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      user_id TEXT PRIMARY KEY,
      student_id TEXT,
      admission_no TEXT,
      roll_no TEXT,
      class_name TEXT,
      section TEXT,
      academic_year TEXT,
      father_name TEXT,
      mother_name TEXT,
      dob TEXT,
      digital_pass_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Create staff_profiles table
  console.log('Ensuring staff_profiles table exists...');
  await db.query(`
    CREATE TABLE IF NOT EXISTS staff_profiles (
      user_id TEXT PRIMARY KEY,
      employee_id TEXT,
      department TEXT,
      designation TEXT,
      joining_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. Create user_audit_logs table
  console.log('Ensuring user_audit_logs table exists...');
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      changed_by TEXT,
      target_user_id TEXT,
      school_code TEXT,
      field_name TEXT,
      old_value TEXT,
      new_value TEXT,
      module TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. Populate usernames and secure plaintext passwords
  console.log('Auditing and backfilling users...');
  const allUsersRes = await db.query('SELECT * FROM users');
  const allUsers = allUsersRes.rows || [];
  console.log(`Found ${allUsers.length} total users in database.`);

  const existingUsernames = new Set();
  for (const u of allUsers) {
    if (u.username && u.username.trim()) {
      existingUsernames.add(u.username.trim().toLowerCase());
    }
  }

  let passwordsHashed = 0;
  let usernamesGenerated = 0;

  for (const u of allUsers) {
    let needsUpdate = false;
    let targetUsername = u.username;
    let targetPassword = u.password;

    // A. Generate username if missing
    if (!targetUsername || !targetUsername.trim()) {
      let candidate = '';
      if (u.role === 'student' && u.admission_no && u.admission_no.trim() && u.admission_no !== 'null') {
        candidate = String(u.admission_no).trim();
      } else if (u.employee_id && u.employee_id.trim() && u.employee_id !== 'null') {
        candidate = String(u.employee_id).trim();
      } else if (u.phone && u.phone.trim() && u.phone !== 'null') {
        candidate = String(u.phone).trim();
      } else if (u.email && u.email.trim()) {
        candidate = u.email.split('@')[0].trim();
      } else {
        candidate = `user_${u.id}`;
      }

      // Check collision
      let finalUsername = candidate;
      let counter = 1;
      while (existingUsernames.has(finalUsername.toLowerCase())) {
        finalUsername = `${candidate}_${counter}`;
        counter++;
      }
      existingUsernames.add(finalUsername.toLowerCase());
      targetUsername = finalUsername;
      usernamesGenerated++;
      needsUpdate = true;
    }

    // B. Security fix: Hash plaintext password if not already bcrypt
    const passStr = String(targetPassword || '').trim();
    if (passStr && !passStr.startsWith('$2a$') && !passStr.startsWith('$2b$')) {
      targetPassword = await bcrypt.hash(passStr, 10);
      passwordsHashed++;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await db.query(
        'UPDATE users SET username = $1, password = $2 WHERE id = $3',
        [targetUsername, targetPassword, u.id]
      );
    }

    // C. Populate student_profiles extension record
    if (u.role === 'student') {
      await db.query(`
        INSERT INTO student_profiles (
          user_id, student_id, admission_no, roll_no, class_name, section,
          academic_year, father_name, mother_name, dob, digital_pass_token
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT(user_id) DO UPDATE SET
          admission_no = excluded.admission_no,
          class_name = excluded.class_name,
          section = excluded.section,
          updated_at = CURRENT_TIMESTAMP
      `, [
        String(u.id),
        u.student_id || `STD-${u.id}`,
        u.admission_no || null,
        u.roll_no || null,
        u.class || null,
        u.section || null,
        u.academic_year || null,
        u.father_name || null,
        u.mother_name || null,
        u.dob || null,
        `LIBPASS-${u.id}`
      ]).catch(async () => {
        // Fallback for older sqlite versions without ON CONFLICT DO UPDATE
        await db.query(`
          INSERT OR REPLACE INTO student_profiles (
            user_id, student_id, admission_no, roll_no, class_name, section,
            academic_year, father_name, mother_name, dob, digital_pass_token
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          String(u.id),
          u.student_id || `STD-${u.id}`,
          u.admission_no || null,
          u.roll_no || null,
          u.class || null,
          u.section || null,
          u.academic_year || null,
          u.father_name || null,
          u.mother_name || null,
          u.dob || null,
          `LIBPASS-${u.id}`
        ]).catch(() => {});
      });
    }

    // D. Populate staff_profiles extension record
    if (['teacher', 'librarian', 'staff', 'admin'].includes(u.role)) {
      await db.query(`
        INSERT INTO staff_profiles (
          user_id, employee_id, department, designation, joining_date
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT(user_id) DO UPDATE SET
          employee_id = excluded.employee_id,
          department = excluded.department,
          designation = excluded.designation,
          updated_at = CURRENT_TIMESTAMP
      `, [
        String(u.id),
        u.employee_id || null,
        u.department || null,
        u.designation || null,
        u.joining_date || null
      ]).catch(async () => {
        await db.query(`
          INSERT OR REPLACE INTO staff_profiles (
            user_id, employee_id, department, designation, joining_date
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          String(u.id),
          u.employee_id || null,
          u.department || null,
          u.designation || null,
          u.joining_date || null
        ]).catch(() => {});
      });
    }
  }

  console.log(`✅ Backfilled ${usernamesGenerated} usernames.`);
  console.log(`✅ Encrypted ${passwordsHashed} plaintext passwords with bcrypt hashes.`);

  // 6. Record verification report
  const studentProfilesCount = await db.query('SELECT COUNT(*) as c FROM student_profiles');
  const staffProfilesCount = await db.query('SELECT COUNT(*) as c FROM staff_profiles');
  console.log(`Student profiles active: ${studentProfilesCount.rows[0].c}`);
  console.log(`Staff profiles active: ${staffProfilesCount.rows[0].c}`);
  console.log('=== Unified User Profile Migration Complete ===');
}

if (require.main === module) {
  migrateUnifiedUserProfile().then(() => process.exit(0)).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { migrateUnifiedUserProfile };
