const { query } = require('../db');

async function main() {
  try {
    const userSql = await query("SELECT sql FROM sqlite_master WHERE name='users'");
    console.log('--- USERS TABLE DDL ---');
    console.log(userSql.rows[0]?.sql);

    const schoolSql = await query("SELECT sql FROM sqlite_master WHERE name='schools'");
    console.log('\n--- SCHOOLS TABLE DDL ---');
    console.log(schoolSql.rows[0]?.sql);

    const sampleUsers = await query("SELECT * FROM users LIMIT 2");
    console.log('\n--- SAMPLE USER 1 ---', sampleUsers.rows[0]);
    console.log('\n--- SAMPLE USER 2 ---', sampleUsers.rows[1]);

    const distinctRoles = await query("SELECT DISTINCT role FROM users");
    console.log('\n--- DISTINCT ROLES ---', distinctRoles.rows.map(r => r.role));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
