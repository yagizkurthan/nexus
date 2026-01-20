import sqlite3
import os

db_path = 'databases/books.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print(f"Tables: {tables}")

for table in tables:
    tname = table[0]
    cursor.execute(f"PRAGMA table_info('{tname}')")
    columns = [c[1] for c in cursor.fetchall()]
    print(f"Table '{tname}' columns: {columns}")

conn.close()
