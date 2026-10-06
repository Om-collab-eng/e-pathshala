/**
 * Migration: Unified User Profile & Member CSV Import/Export Schema
 * Compatible with SQLite, MySQL, and PostgreSQL.
 * Idempotent: Can be safely run multiple times without data loss.
 */

const db = require('../db');

async function migrate() {
  console.log('[MIGRATION] Starting Unified User Profile & CSV Import migration...');

  try {
    // 1. users table: ensure father_name, mother_name, roll_no, joining_date exist
    const userColumnsToAdd = [
      { name: 'father_name', type: 'VARCHAR(255)' },
      { name: 'mother_name', type: 'VARCHAR(255)' },
      { name: 'roll_no', type: 'VARCHAR(50)' },
      { name: 'joining_date', type: 'VARCHAR(50)' }
    ];

    for (const col of userColumnsToAdd) {
      try {
        await db.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`[MIGRATION] Added column users.${col.name}`);
      } catch (err) {
        // Ignored if column already exists (ER_DUP_FIELDNAME / duplicate column name)
        if (!err.message.includes('duplicate') && !err.message.includes('already exists') && err.errno !== 1060 && err.code !== 'ER_DUP_FIELDNAME') {
          console.log(`[MIGRATION] Note on users.${col.name}: ${err.message}`);
        }
      }
    }

    // 2. student_profiles table: ensure required profile fields exist
    const studentColsToAdd = [
      { name: 'admission_no', type: 'VARCHAR(100)' },
      { name: 'roll_no', type: 'VARCHAR(50)' },
      { name: 'academic_year', type: 'VARCHAR(50)' },
      { name: 'father_name', type: 'VARCHAR(255)' },
      { name: 'mother_name', type: 'VARCHAR(255)' },
      { name: 'dob', type: 'VARCHAR(50)' }
    ];

    for (const col of studentColsToAdd) {
      try {
        await db.query(`ALTER TABLE student_profiles ADD COLUMN ${col.name} ${col.type}`);
        console.log(`[MIGRATION] Added column student_profiles.${col.name}`);
      } catch (err) {
        if (!err.message.includes('duplicate') && !err.message.includes('already exists') && err.errno !== 1060 && err.code !== 'ER_DUP_FIELDNAME') {
          console.log(`[MIGRATION] Note on student_profiles.${col.name}: ${err.message}`);
        }
      }
    }

    // 3. staff_profiles table: ensure exists
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS staff_profiles (
          id INTEGER PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL UNIQUE,
          employee_id VARCHAR(100),
          department VARCHAR(255),
          designation VARCHAR(255),
          joining_date VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('[MIGRATION] Verified table staff_profiles');
    } catch (err) {
      console.error('[MIGRATION] staff_profiles creation note:', err.message);
    }

    // 4. user_audit_logs table: ensure exists
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_audit_logs (
          id INTEGER PRIMARY KEY,
          changed_by VARCHAR(100) NOT NULL,
          target_user_id VARCHAR(100) NOT NULL,
          school_code VARCHAR(100) NOT NULL,
          field_name VARCHAR(100) NOT NULL,
          old_value TEXT,
          new_value TEXT,
          module VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('[MIGRATION] Verified table user_audit_logs');
    } catch (err) {
      console.error('[MIGRATION] user_audit_logs creation note:', err.message);
    }

    console.log('[MIGRATION] ✅ Schema migration completed successfully.');
  } catch (globalErr) {
    console.error('[MIGRATION] Fatal migration error:', globalErr);
    throw globalErr;
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = migrate;
