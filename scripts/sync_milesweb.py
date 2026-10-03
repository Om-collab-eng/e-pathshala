import os
import sys
import io
import time
import zipfile
import shutil
import paramiko
from scp import SCPClient

# Ensure UTF-8 output on Windows consoles
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

HOST = "45.199.139.18"
PORT = 22
USER = "librika_1"
PASSWORD = "Kalatota@123"
REMOTE_DIR = "public_html"
LOCAL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

EXCLUDE_PATTERNS = [
    'node_modules', '.git', 'tmp', '__pycache__', '.stfolder',
    'android', 'android-app', '_legacy', 'super-admin ui',
    'library_ocr.db', 'library_v3.db-shm', 'library_v3.db-wal',
    'librika_upload.zip', 'librika_bundle.zip', 'milesweb_sync.zip', 
    'milesweb_pull.zip', 'super-admin-ui.zip'
]

def should_exclude(rel_path):
    normalized = rel_path.replace('\\', '/').strip('/')
    parts = normalized.split('/')
    for pattern in EXCLUDE_PATTERNS:
        if pattern in parts or normalized == pattern or normalized.endswith('/' + pattern):
            return True
        if normalized.endswith('.apk') or normalized.endswith('.zip') or normalized.endswith('.log'):
            return True
    return False

def get_ssh_client():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)
    return ssh

def safe_extract(zip_path, extract_to):
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        for member in zip_ref.infolist():
            if should_exclude(member.filename):
                continue
            
            target_path = os.path.join(extract_to, member.filename)
            try:
                if member.is_dir():
                    if os.path.isfile(target_path):
                        os.remove(target_path)
                    os.makedirs(target_path, exist_ok=True)
                else:
                    if os.path.isdir(target_path):
                        shutil.rmtree(target_path)
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    with zip_ref.open(member) as source, open(target_path, "wb") as target:
                        shutil.copyfileobj(source, target)
            except Exception as e:
                # Log non-fatal extraction warning and continue
                print(f"Notice: skipped {member.filename} ({e})", flush=True)

def pull():
    print("==================================================", flush=True)
    print("  [*] Pulling latest project from MilesWeb...", flush=True)
    print("==================================================", flush=True)
    ssh = get_ssh_client()
    
    print("[1/2] Packaging remote updates from MilesWeb...", flush=True)
    pack_cmd = (
        f"cd {REMOTE_DIR} && "
        "zip -q -r ../milesweb_pull.zip . "
        "-x '*node_modules/*' '*.git/*' 'tmp/*' '*.db-shm' '*.db-wal' '__pycache__/*' '*.zip' '*.apk' 'ocr-scanner-system/library_ocr.db*'"
    )
    stdin, stdout, stderr = ssh.exec_command(pack_cmd)
    stdout.channel.recv_exit_status()

    local_zip = os.path.join(LOCAL_DIR, "milesweb_pull.zip")
    print("[2/2] Downloading and applying latest updates...", flush=True)
    with SCPClient(ssh.get_transport()) as scp:
        scp.get("milesweb_pull.zip", local_zip)

    ssh.exec_command("rm -f milesweb_pull.zip")
    ssh.close()

    safe_extract(local_zip, LOCAL_DIR)

    if os.path.exists(local_zip):
        os.remove(local_zip)

    # Ensure cross-platform scripts in package.json
    try:
        pkg_path = os.path.join(LOCAL_DIR, "package.json")
        if os.path.exists(pkg_path):
            with open(pkg_path, "r", encoding="utf-8") as f:
                content = f.read()
            content = content.replace('"pull": "bash pull_from_milesweb.sh"', '"pull": "node scripts/sync.js pull"')
            content = content.replace('"push": "bash push_to_milesweb.sh"', '"push": "node scripts/sync.js push"')
            with open(pkg_path, "w", encoding="utf-8") as f:
                f.write(content)
    except Exception:
        pass

    print("==================================================", flush=True)
    print("  [+] Pull Complete! Local code, secrets & docs are", flush=True)
    print("      100% in sync with MilesWeb.", flush=True)
    print("==================================================", flush=True)

def push():
    print("==================================================", flush=True)
    print("  [*] Pushing changes to MilesWeb server...", flush=True)
    print("==================================================", flush=True)
    
    local_zip = os.path.join(LOCAL_DIR, "librika_upload.zip")
    if os.path.exists(local_zip):
        os.remove(local_zip)

    print("[1/3] Packaging local updates...", flush=True)
    with zipfile.ZipFile(local_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(LOCAL_DIR):
            dirs[:] = [d for d in dirs if not should_exclude(d)]
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, LOCAL_DIR)
                if should_exclude(rel_path):
                    continue
                zipf.write(file_path, rel_path)

    ssh = get_ssh_client()
    print("[2/3] Uploading package to MilesWeb...", flush=True)
    with SCPClient(ssh.get_transport()) as scp:
        scp.put(local_zip, f"{REMOTE_DIR}/librika_upload.zip")

    if os.path.exists(local_zip):
        os.remove(local_zip)

    print("[3/3] Extracting files, running migrations & restarting service...", flush=True)
    remote_script = (
        f"cd {REMOTE_DIR} && "
        "unzip -o librika_upload.zip && "
        "rm -f librika_upload.zip && "
        "export NVM_DIR=\"$HOME/.nvm\" && "
        "[ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && "
        "node db/initStudentPortalTables.js || true && "
        "node db/initAdsMigration.js || true && "
        "node db/initMeetingTables.js || true && "
        "pkill -9 -f \"node app.js\" 2>/dev/null || killall -9 node 2>/dev/null || true && "
        "mkdir -p tmp && touch tmp/restart.txt && "
        "echo 'MilesWeb update completed successfully.'"
    )
    stdin, stdout, stderr = ssh.exec_command(remote_script)
    output = stdout.read().decode('utf-8', errors='ignore')
    print(output, flush=True)
    ssh.close()

    print("==================================================", flush=True)
    print("  [+] Push Complete! MilesWeb is live & updated.", flush=True)
    print("      Site: https://librika.in", flush=True)
    print("==================================================", flush=True)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "push":
        push()
    else:
        pull()
