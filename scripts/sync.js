const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const action = process.argv[2] === 'push' ? 'push' : 'pull';
const syncPy = path.join(__dirname, 'sync_milesweb.py');

const isWin = process.platform === 'win32';
const localAppData = process.env.LOCALAPPDATA || '';
const winPythonPaths = [
  path.join(localAppData, 'Python', 'bin', 'python.exe'),
  path.join(localAppData, 'Programs', 'Python', 'Python312', 'python.exe'),
  path.join(localAppData, 'Programs', 'Python', 'Python311', 'python.exe'),
  path.join(localAppData, 'Programs', 'Python', 'Python310', 'python.exe'),
  'py',
  'python',
  'python3'
].filter(p => p && (p.includes(path.sep) ? fs.existsSync(p) : true));

const pyCommands = isWin ? winPythonPaths : ['python3', 'python'];

function runPython(cmdIndex) {
  if (cmdIndex >= pyCommands.length) {
    if (!isWin) {
      const script = action === 'push' ? 'push_to_milesweb.sh' : 'pull_from_milesweb.sh';
      const child = spawn('bash', [path.join(__dirname, '..', script)], { stdio: 'inherit' });
      child.on('exit', code => process.exit(code || 0));
      return;
    }
    console.error('Error: Python is required to run sync on Windows.');
    process.exit(1);
    return;
  }

  const cmd = pyCommands[cmdIndex];
  const child = spawn(cmd, [syncPy, action], { stdio: 'inherit' });

  child.on('error', () => {
    runPython(cmdIndex + 1);
  });

  child.on('exit', code => {
    if (code !== 0 && cmdIndex + 1 < pyCommands.length) {
      runPython(cmdIndex + 1);
    } else {
      process.exit(code || 0);
    }
  });
}

runPython(0);
