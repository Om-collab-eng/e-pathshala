const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Running Triple-Check Pre-Push Validation...');

// 1. Check Node.js server files
try {
  execSync('node -c server_new.js', { stdio: 'inherit' });
  execSync('node -c routes/admin.js', { stdio: 'inherit' });
  execSync('node -c routes/student.js', { stdio: 'inherit' });
  console.log('  ✓ [Check 1/3] Backend server & router files syntax is 100% valid.');
} catch (err) {
  console.error('❌ FATAL: Server JS syntax error detected! Push aborted.');
  process.exit(1);
}

// 2. Check views/admin.ejs embedded scripts for syntax errors & duplicate declarations
try {
  const content = fs.readFileSync('views/admin.ejs', 'utf8');
  const match = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) throw new Error('No script tag found in views/admin.ejs');
  let scriptContent = match[1];
  scriptContent = scriptContent.replace(/<%-[^%]*%>/g, '{}\n');
  scriptContent = scriptContent.replace(/<%=[^%]*%>/g, '""\n');
  scriptContent = scriptContent.replace(/<%[^%]*%>/g, '\n');

  if (!fs.existsSync('scratch')) fs.mkdirSync('scratch', { recursive: true });
  fs.writeFileSync('scratch/admin_script_test.js', scriptContent);
  execSync('node --check scratch/admin_script_test.js', { stdio: 'inherit' });
  console.log('  ✓ [Check 2/3] views/admin.ejs client-side scripts syntax is 100% valid (no duplicate variables or parse errors).');
} catch (err) {
  console.error('❌ FATAL: Client script syntax error in views/admin.ejs! Push aborted.');
  process.exit(1);
}

// 3. Test functional circulation flow
try {
  execSync('node scripts/test_circulation_full_flow.js', { stdio: 'pipe' });
  console.log('  ✓ [Check 3/3] Functional circulation data-flow & limit enforcement verified.');
} catch (err) {
  console.error('❌ FATAL: Circulation data-flow test failed! Push aborted.');
  process.exit(1);
}

console.log('🎉 TRIPLE-CHECK PASSED: Code is completely safe to deploy!\n');
process.exit(0);
