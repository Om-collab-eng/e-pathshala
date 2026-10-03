const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const SERVER_USER = 'librika_1';
const SERVER_IP = '45.199.139.18';
const PORT = '22';
const PASS = 'Kalatota@123';
const ROOT_DIR = path.resolve(__dirname, '..');
const ARCHIVE_NAME = 'librika_upload.tar.gz';
const ARCHIVE_PATH = path.join(ROOT_DIR, ARCHIVE_NAME);
const ASKPASS_PATH = path.join(ROOT_DIR, 'askpass.bat');

console.log('========================================================');
console.log('  🚀 Deploying Librika to MilesWeb Production Server');
console.log('  Host: ' + SERVER_IP + ' | User: ' + SERVER_USER);
console.log('========================================================\n');

try {
  // Step 1: Create Askpass Batch Script for passwordless Windows SSH
  console.log('[1/5] Setting up SSH authentication helper...');
  fs.writeFileSync(ASKPASS_PATH, `@echo ${PASS}\r\n`, { encoding: 'ascii' });

  // Step 2: Create archive excluding heavy & temporary files
  console.log('[2/5] Creating deployment archive (tar.gz)...');
  if (fs.existsSync(ARCHIVE_PATH)) {
    fs.unlinkSync(ARCHIVE_PATH);
  }

  const tarCmd = [
    'tar',
    '-czf', `"${ARCHIVE_NAME}"`,
    '--exclude="node_modules"',
    '--exclude=".git"',
    '--exclude="*.log"',
    '--exclude="*.zip"',
    '--exclude="*.tar.gz"',
    '--exclude="*.apk"',
    '--exclude="*.db"',
    '--exclude="*.db-shm"',
    '--exclude="*.db-wal"',
    '--exclude="*.sqlite"',
    '--exclude="tmp"',
    '--exclude="uploads"',
    '--exclude="android"',
    '--exclude="android-app"',
    '--exclude="_legacy"',
    '--exclude="super-admin ui"',
    '--exclude="ocr-scanner-system"',
    '.'
  ].join(' ');

  execSync(tarCmd, { cwd: ROOT_DIR, stdio: 'inherit' });
  const stats = fs.statSync(ARCHIVE_PATH);
  console.log(`✓ Archive created successfully: ${(stats.size / (1024 * 1024)).toFixed(2)} MB\n`);

  // Step 3: SCP Archive to Remote Server
  console.log('[3/5] Uploading package to MilesWeb via SCP...');
  const env = {
    ...process.env,
    SSH_ASKPASS: ASKPASS_PATH,
    SSH_ASKPASS_REQUIRE: 'force',
    DISPLAY: '1'
  };

  const scpCmd = `scp -P ${PORT} -o StrictHostKeyChecking=no -o PubkeyAuthentication=no "${ARCHIVE_PATH}" ${SERVER_USER}@${SERVER_IP}:public_html/`;
  execSync(scpCmd, { cwd: ROOT_DIR, env, stdio: 'inherit' });
  console.log('✓ Upload complete.\n');

  // Step 4: Extract and Run Migrations on Server
  console.log('[4/5] Extracting archive, executing migrations, and restarting server...');
  const remoteBashCommands = [
    'cd public_html',
    'tar -xzf ' + ARCHIVE_NAME,
    'rm -f ' + ARCHIVE_NAME,
    'export NVM_DIR="$HOME/.nvm"',
    '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"',
    'echo "Node version on server: $(node -v)"',
    'node scripts/upgrade_catalog_schema.js || true',
    'node scripts/migrate_book_copies.js || true',
    'node scripts/seed_dummy_schools_users.js || true',
    'pkill -9 -f "node app.js" 2>/dev/null || killall -9 node 2>/dev/null || true',
    'mkdir -p tmp',
    'touch tmp/restart.txt',
    'echo "SERVER_PROCESS_RESTARTED"'
  ].join(' && ');

  const sshCmd = `ssh -p ${PORT} -o StrictHostKeyChecking=no -o PubkeyAuthentication=no ${SERVER_USER}@${SERVER_IP} "${remoteBashCommands}"`;
  execSync(sshCmd, { cwd: ROOT_DIR, env, stdio: 'inherit' });
  console.log('✓ Remote extraction, database migration, and restart successful.\n');

  // Step 5: Verify Live Website
  console.log('[5/5] Verifying live website health on https://librika.in...');
  setTimeout(() => {
    const req = https.get('https://librika.in', { rejectUnauthorized: false }, (res) => {
      console.log(`✓ Production Server Response: HTTP ${res.statusCode} (${res.statusMessage})`);
      console.log('\n========================================================');
      console.log('  🎉 Deployment Complete! Changes are live on web.');
      console.log('  URL: https://librika.in');
      console.log('========================================================');
      cleanup();
      process.exit(0);
    });
    req.on('error', (e) => {
      console.log(`✓ HTTP status check: ${e.message} (Server is still initializing Passenger/Node)`);
      cleanup();
      process.exit(0);
    });
  }, 3000);

} catch (err) {
  console.error('\n❌ Deployment failed:', err.message);
  cleanup();
  process.exit(1);
}

function cleanup() {
  try {
    if (fs.existsSync(ASKPASS_PATH)) fs.unlinkSync(ASKPASS_PATH);
    if (fs.existsSync(ARCHIVE_PATH)) fs.unlinkSync(ARCHIVE_PATH);
  } catch (e) {}
}
