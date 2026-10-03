import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('45.199.139.18', port=22, username='librika_1', password='Kalatota@123', timeout=15)
stdin, stdout, stderr = ssh.exec_command("python3 -c \"import sqlite3; conn = sqlite3.connect('public_html/library_v3.db'); c = conn.cursor(); c.execute('PRAGMA integrity_check;'); print(c.fetchall()); c.execute('SELECT count(*) FROM users;'); print('Users:', c.fetchone()); conn.close()\"")
print("Remote SQLite check:")
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
