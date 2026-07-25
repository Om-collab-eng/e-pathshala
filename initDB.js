const { poolMain } = require('./db');

// SQL to create the session table for connect-pg-simple
const createSessionTable = `
  CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
  );
  CREATE INDEX IF NOT EXISTS IDX_sessions_expire ON sessions(expire);
`;

const createPersonalTables = `
  CREATE TABLE IF NOT EXISTS personal_libraries (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    library_name VARCHAR(255) NOT NULL,
    plan_name VARCHAR(50) DEFAULT 'FREE',
    subscription_status VARCHAR(50) DEFAULT 'active',
    profile_photo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS personal_books (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    library_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255),
    category VARCHAR(255),
    publisher VARCHAR(255),
    isbn VARCHAR(50),
    language VARCHAR(50) DEFAULT 'English',
    description TEXT,
    cover_image_url TEXT,
    quantity INTEGER DEFAULT 1,
    book_condition VARCHAR(50),
    purchase_date DATE,
    status VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS personal_reading_tracker (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    start_date DATE,
    finish_date DATE,
    current_page INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0,
    reading_status VARCHAR(50) DEFAULT 'Reading',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS personal_borrowings (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    borrower_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    issue_date DATE,
    expected_return_date DATE,
    actual_return_date DATE,
    status VARCHAR(50) DEFAULT 'Issued'
  );

  CREATE TABLE IF NOT EXISTS personal_wishlist (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255),
    priority VARCHAR(50) DEFAULT 'Medium',
    price DECIMAL(10,2),
    purchase_link TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS personal_favorites (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS personal_library_shares (
    id SERIAL PRIMARY KEY,
    library_id INTEGER NOT NULL,
    shared_with_user_id INTEGER NOT NULL,
    permission_level VARCHAR(50) DEFAULT 'view',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS personal_activity_logs (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    fcm_token TEXT NOT NULL UNIQUE,
    device_type VARCHAR(20) NOT NULL DEFAULT 'web',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
`;

async function initializeDatabase() {
  try {
    const client = await poolMain.connect();
    try {
      await client.query(createSessionTable);
      console.log('Session table ensured.');
      await client.query(createPersonalTables);
      console.log('Personal library tables and user_devices table ensured.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

module.exports = initializeDatabase;