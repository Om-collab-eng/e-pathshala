const { query } = require('./db');

(async () => {
  try {
    // Test a simple query on the users table
    const result = await query('SELECT * FROM users WHERE id = $1', [1]);
    console.log('Query result:', result);
    console.log('Number of rows:', result.rowCount);
    if (result.rows.length > 0) {
      console.log('First user:', result.rows[0]);
    }
  } catch (err) {
    console.error('Error:', err);
  }
})();