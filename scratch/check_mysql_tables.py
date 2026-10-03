import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('45.199.139.18', port=22, username='librika_1', password='Kalatota@123', timeout=15)
stdin, stdout, stderr = ssh.exec_command('mysql -u librika_1_librika -pkalatota@123 librika_1_librika -e "SELECT table_name, table_rows FROM information_schema.TABLES WHERE table_schema = \'librika_1_librika\';"')
print("MySQL tables in production:")
print(stdout.read().decode())
ssh.close()
