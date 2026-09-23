/**
 * db/migrateLibrikaProductFixes.js
 * Ensures required database schema additions and data consistency for:
 * 1. books: adds back_cover_url column
 * 2. acquisition_items: adds registered_copies column
 * 3. acquisitions: ensures table exists
 * 4. vendors: ensures table exists
 * 5. users: synchronizes is_banned and status column consistency
 */
const { query } = require('../db');

async function migrate() {
  console.log('--- Starting Librika Product Fixes DB Migration ---');

  try {
    // 1. Ensure vendors table
    await query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_code VARCHAR(50) NOT NULL DEFAULT 'DPS123',
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(100) NULL,
        phone VARCHAR(50) NULL,
        email VARCHAR(100) NULL,
        address TEXT NULL,
        gstin VARCHAR(50) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(async () => {
      // Postgres fallback
      await query(`
        CREATE TABLE IF NOT EXISTS vendors (
          id SERIAL PRIMARY KEY,
          school_code VARCHAR(50) NOT NULL DEFAULT 'DPS123',
          name VARCHAR(255) NOT NULL,
          contact_person VARCHAR(100) NULL,
          phone VARCHAR(50) NULL,
          email VARCHAR(100) NULL,
          address TEXT NULL,
          gstin VARCHAR(50) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(e => console.warn('Vendors table init note:', e.message));
    });

    // 2. Ensure default vendor exists
    await query(`
      INSERT INTO vendors (school_code, name, phone, email, address)
      SELECT 'DPS123', 'National Book Depository', '9811002233', 'orders@nationalbooks.in', 'New Delhi'
      WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE school_code = 'DPS123' LIMIT 1)
    `).catch(e => console.warn('Vendor default seed note:', e.message));

    // 3. Ensure acquisitions table
    await query(`
      CREATE TABLE IF NOT EXISTS acquisitions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_code VARCHAR(50) NOT NULL DEFAULT 'DPS123',
        bill_number VARCHAR(100) NOT NULL,
        bill_date DATETIME NOT NULL,
        vendor_id INT NULL,
        total_books INT DEFAULT 0,
        total_copies INT DEFAULT 0,
        total_amount DECIMAL(10,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'Completed',
        created_by INT NULL,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_updated DATETIME NULL,
        invoice_image TEXT NULL
      )
    `).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS acquisitions (
          id SERIAL PRIMARY KEY,
          school_code VARCHAR(50) NOT NULL DEFAULT 'DPS123',
          bill_number VARCHAR(100) NOT NULL,
          bill_date TIMESTAMP NOT NULL,
          vendor_id INT NULL,
          total_books INT DEFAULT 0,
          total_copies INT DEFAULT 0,
          total_amount DECIMAL(10,2) DEFAULT 0.00,
          status VARCHAR(50) DEFAULT 'Completed',
          created_by INT NULL,
          created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_updated TIMESTAMP NULL,
          invoice_image TEXT NULL
        )
      `).catch(e => console.warn('Acquisitions table init note:', e.message));
    });

    // 4. Ensure acquisition_items table
    await query(`
      CREATE TABLE IF NOT EXISTS acquisition_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        acquisition_id INT NOT NULL,
        book_id INT NULL,
        isbn VARCHAR(100) NULL,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NULL,
        quantity INT DEFAULT 1,
        registered_copies INT DEFAULT 0,
        unit_price DECIMAL(10,2) DEFAULT 0.00,
        total_price DECIMAL(10,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'New'
      )
    `).catch(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS acquisition_items (
          id SERIAL PRIMARY KEY,
          acquisition_id INT NOT NULL,
          book_id INT NULL,
          isbn VARCHAR(100) NULL,
          title VARCHAR(255) NOT NULL,
          author VARCHAR(255) NULL,
          quantity INT DEFAULT 1,
          registered_copies INT DEFAULT 0,
          unit_price DECIMAL(10,2) DEFAULT 0.00,
          total_price DECIMAL(10,2) DEFAULT 0.00,
          status VARCHAR(50) DEFAULT 'New'
        )
      `).catch(e => console.warn('Acquisition items table init note:', e.message));
    });

    // 5. Add registered_copies to acquisition_items if column doesn't exist
    try {
      await query(`ALTER TABLE acquisition_items ADD COLUMN registered_copies INT DEFAULT 0`);
      console.log('✓ Added registered_copies column to acquisition_items');
    } catch (e) {
      // Column may already exist
    }

    // 6. Add back_cover_url to books if column doesn't exist
    try {
      await query(`ALTER TABLE books ADD COLUMN back_cover_url VARCHAR(500) NULL DEFAULT ''`);
      console.log('✓ Added back_cover_url column to books');
    } catch (e) {
      // Column may already exist
    }

    // 7. Synchronize user status and is_banned consistency
    // If is_banned is 1 or '1', set status to 'suspended'
    await query(`
      UPDATE users 
      SET status = 'suspended' 
      WHERE (is_banned = 1 OR is_banned = '1' OR is_banned = true) 
        AND (status IS NULL OR LOWER(status) != 'suspended')
    `).catch(e => console.warn('User status sync 1 note:', e.message));

    // If status is 'suspended', set is_banned = '1'
    await query(`
      UPDATE users 
      SET is_banned = '1' 
      WHERE LOWER(status) = 'suspended' 
        AND (is_banned IS NULL OR is_banned = 0 OR is_banned = '0' OR is_banned = false)
    `).catch(e => console.warn('User status sync 2 note:', e.message));

    console.log('✓ Synchronized user status and is_banned consistency');
    console.log('--- Librika Product Fixes DB Migration completed successfully ---');
  } catch (err) {
    console.error('Migration error:', err);
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = migrate;
