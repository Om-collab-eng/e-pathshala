const { query } = require('./db');
async function test() {
  try {
    const res = await query('SELECT * FROM users WHERE phone = $1 OR email = $1 OR admission_no = $1', ['8527198907']);
    console.log('Query Success! Matches found:', res.rows.length);
    console.log('First user role:', res.rows[0].role, 'name:', res.rows[0].name);
  } catch (e) {
    console.error('Query Error:', e);
  }
  process.exit(0);
}
test();
