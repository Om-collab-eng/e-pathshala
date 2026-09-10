const db = require('../db');

async function runAdsMigration() {
  console.log('[ADS MIGRATION] Starting advertisements table migration...');
  
  try {
    // 1. Create advertisements table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS advertisements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        cta_text VARCHAR(100) DEFAULT 'Explore Now',
        target_url VARCHAR(500) DEFAULT '#',
        image_url VARCHAR(500),
        bg_gradient VARCHAR(255) DEFAULT 'linear-gradient(135deg, #0B5ED7 0%, #5B4BDB 100%)',
        start_time DATETIME NULL DEFAULT NULL,
        end_time DATETIME NULL DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'active',
        priority INT DEFAULT 1,
        target_section VARCHAR(100) DEFAULT 'all',
        impressions INT DEFAULT 0,
        clicks INT DEFAULT 0,
        type VARCHAR(50) DEFAULT 'BANNER',
        media_url VARCHAR(1000) NULL,
        thumbnail_url VARCHAR(1000) NULL,
        content_text TEXT NULL,
        category VARCHAR(100) NULL,
        source VARCHAR(255) NULL,
        target_type VARCHAR(50) DEFAULT 'ALL_SCHOOLS',
        school_code VARCHAR(100) DEFAULT 'GLOBAL',
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(err => {
      // In SQLite AUTO_INCREMENT is AUTOINCREMENT (without underscore)
      return db.query(`
        CREATE TABLE IF NOT EXISTS advertisements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title VARCHAR(255) NOT NULL,
          subtitle VARCHAR(255),
          description TEXT,
          cta_text VARCHAR(100) DEFAULT 'Explore Now',
          target_url VARCHAR(500) DEFAULT '#',
          image_url VARCHAR(500),
          bg_gradient VARCHAR(255) DEFAULT 'linear-gradient(135deg, #0B5ED7 0%, #5B4BDB 100%)',
          start_time DATETIME NULL DEFAULT NULL,
          end_time DATETIME NULL DEFAULT NULL,
          status VARCHAR(50) DEFAULT 'active',
          priority INT DEFAULT 1,
          target_section VARCHAR(100) DEFAULT 'all',
          impressions INT DEFAULT 0,
          clicks INT DEFAULT 0,
          type VARCHAR(50) DEFAULT 'BANNER',
          media_url VARCHAR(1000) NULL,
          thumbnail_url VARCHAR(1000) NULL,
          content_text TEXT NULL,
          category VARCHAR(100) NULL,
          source VARCHAR(255) NULL,
          target_type VARCHAR(50) DEFAULT 'ALL_SCHOOLS',
          school_code VARCHAR(100) DEFAULT 'GLOBAL',
          display_order INT DEFAULT 0,
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });

    // 2. Add columns if table already existed without them
    const cols = [
      { name: 'type', def: "VARCHAR(50) DEFAULT 'BANNER'" },
      { name: 'media_url', def: "VARCHAR(1000) NULL" },
      { name: 'thumbnail_url', def: "VARCHAR(1000) NULL" },
      { name: 'content_text', def: "TEXT NULL" },
      { name: 'category', def: "VARCHAR(100) NULL" },
      { name: 'source', def: "VARCHAR(255) NULL" },
      { name: 'target_type', def: "VARCHAR(50) DEFAULT 'ALL_SCHOOLS'" },
      { name: 'school_code', def: "VARCHAR(100) DEFAULT 'GLOBAL'" },
      { name: 'display_order', def: "INT DEFAULT 0" },
      { name: 'is_active', def: "TINYINT(1) DEFAULT 1" }
    ];

    for (const c of cols) {
      await db.query(`ALTER TABLE advertisements ADD COLUMN ${c.name} ${c.def}`).catch(() => {});
    }

    // 3. Seed initial high-quality facts & announcements if none exist
    const countRes = await db.query('SELECT COUNT(*) as c FROM advertisements').catch(() => ({ rows: [{ c: 0 }] }));
    const totalCount = parseInt(countRes.rows[0]?.c || countRes.rows[0]?.C || 0, 10);

    if (totalCount === 0) {
      console.log('[ADS MIGRATION] Seeding initial advertisements and interesting facts...');
      
      // Item 1: Science Interesting Fact
      await db.query(`
        INSERT INTO advertisements (title, type, content_text, category, source, target_type, school_code, display_order, status, is_active, target_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        'Octopuses Have Three Hearts',
        'INTERESTING_FACT',
        'Did You Know? Octopuses have three hearts and blue blood. Two hearts pump blood to the gills, while the third pumps it through the body.',
        'Science & Biology',
        'National Geographic',
        'ALL_SCHOOLS',
        'GLOBAL',
        1,
        'active',
        1,
        '#'
      ]);

      // Item 2: Curriculum Text Announcement
      await db.query(`
        INSERT INTO advertisements (title, type, content_text, target_type, school_code, display_order, status, is_active, target_url, cta_text)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        'Class 9 & 10 Mathematics Study Material',
        'TEXT',
        '📢 New NCERT Mathematics Chapter-wise formula sheets & solved questions are now available in the E-Library!',
        'ALL_SCHOOLS',
        'GLOBAL',
        2,
        'active',
        1,
        '/student?module=e-library',
        'Explore Notes'
      ]);

      // Item 3: Promotional E-Library Banner
      await db.query(`
        INSERT INTO advertisements (title, subtitle, description, type, target_type, school_code, display_order, status, is_active, target_url, cta_text, bg_gradient)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        'Digital Vault & Research Papers',
        'Over 3,800+ accredited e-books & guides',
        'Discover peer-published notes, interactive video classes, and curriculum textbooks in your digital library.',
        'BANNER',
        'ALL_SCHOOLS',
        'GLOBAL',
        3,
        'active',
        1,
        '/student?module=e-library',
        'Browse Vault',
        'linear-gradient(135deg, #0B5ED7 0%, #5B4BDB 100%)'
      ]);

      // Item 4: Interesting Astronomy Fact
      await db.query(`
        INSERT INTO advertisements (title, type, content_text, category, source, target_type, school_code, display_order, status, is_active, target_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        'A Day on Venus is Longer Than Its Year',
        'INTERESTING_FACT',
        'Did You Know? Venus takes 243 Earth days to rotate once on its axis, but only 225 Earth days to complete an orbit around the Sun.',
        'Astronomy & Space',
        'NASA Solar System Exploration',
        'ALL_SCHOOLS',
        'GLOBAL',
        4,
        'active',
        1,
        '#'
      ]);

      console.log('[ADS MIGRATION] Seeded 4 initial announcement items.');
    }

    console.log('[ADS MIGRATION] Migration completed successfully.');
  } catch (err) {
    console.error('[ADS MIGRATION ERROR]', err);
  }
}

if (require.main === module) {
  runAdsMigration().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runAdsMigration;
