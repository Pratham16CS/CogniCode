import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'cognicode.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("DELETE FROM file_cache WHERE repo_url LIKE '%Med_Perplexity%'")
c.execute("DELETE FROM file_analyses")
conn.commit()
print("Cache and old analyses cleared")
