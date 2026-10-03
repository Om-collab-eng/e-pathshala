import io
import sys
import paramiko

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "45.199.139.18"
PORT = 22
USER = "librika_1"
PASSWORD = "Kalatota@123"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)

def run_remote(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode('utf-8', errors='ignore').strip()

print("=== SERVER DISK USAGE ===")
print(run_remote("df -h /"))

print("\n=== PUBLIC_HTML TOTAL USAGE ===")
print(run_remote("du -sh ~/public_html"))

print("\n=== TOP DIRECTORIES IN PUBLIC_HTML ===")
print(run_remote("du -h --max-depth=1 ~/public_html | sort -hr | head -n 15"))

print("\n=== MYSQL DATABASE TABLES & SIZES ===")
mysql_cmd = 'mysql -u librika_1_librika -pkalatota@123 -e "SELECT table_name, ROUND(((data_length + index_length) / 1024), 2) AS size_kb, table_rows FROM information_schema.TABLES WHERE table_schema = \'librika_1_librika\' ORDER BY (data_length + index_length) DESC LIMIT 15;"'
print(run_remote(mysql_cmd))

ssh.close()
