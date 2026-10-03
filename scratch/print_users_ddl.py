with open('mysql_dump.sql', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()
start = text.find('CREATE TABLE "users"')
end = text.find(';', start)
print(text[start:end+1])
