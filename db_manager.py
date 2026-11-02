import os
import sqlite3
from typing import List, Dict, Any

DB_DIR = os.path.join(os.path.dirname(__file__), 'databases')
if not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR)


def db_path(name: str) -> str:
    if not name.endswith('.db'):
        name = f"{name}.db"
    return os.path.join(DB_DIR, name)


def list_databases() -> List[str]:
    files = [f for f in os.listdir(DB_DIR) if f.endswith('.db')]
    return files


def create_database(name: str) -> str:
    path = db_path(name)
    if os.path.exists(path):
        return "exists"
    conn = sqlite3.connect(path)
    conn.close()
    return "created"


def execute_sql(db_name: str, sql: str, params: List[Any] = None) -> Dict[str, Any]:
    path = db_path(db_name)
    if not os.path.exists(path):
        return {"error": "db_not_found"}
    conn = sqlite3.connect(path)
    # Enable WAL mode for better concurrency
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    try:
        if params:
            cur.execute(sql, params)
        else:
            cur.execute(sql)
        if sql.strip().lower().startswith('select') or sql.strip().lower().startswith('pragma'):
            rows = cur.fetchall()
            cols = rows[0].keys() if rows else []
            data = [dict(row) for row in rows]
            return {"rows": data, "columns": list(cols)}
        else:
            conn.commit()
            return {"status": "ok", "rowcount": cur.rowcount}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()


def list_tables(db_name: str) -> List[str]:
    path = db_path(db_name)
    if not os.path.exists(path):
        return []
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    rows = cur.fetchall()
    conn.close()
    return [r[0] for r in rows]


def replace_table(db_name: str, table_name: str, columns: List[str], rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Replace a table: drop if exists, create with given columns (TEXT), and insert provided rows.
    columns: list of column names
    rows: list of dicts mapping column->value
    """
    path = db_path(db_name)
    if not os.path.exists(path):
        return {"error": "db_not_found"}
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    try:
        # sanitize table and column names (very basic)
        tbl = ''.join(c for c in table_name if c.isalnum() or c == '_')
        cols = [ ''.join(c for c in col if c.isalnum() or c == '_') for col in columns ]
        if not tbl or not cols:
            return {"error": "invalid_table_or_columns"}

        cur.execute(f"DROP TABLE IF EXISTS \"{tbl}\"")
        create_sql = f"CREATE TABLE \"{tbl}\" (" + ','.join([f'\"{c}\" TEXT' for c in cols]) + ")"
        cur.execute(create_sql)

        if rows:
            placeholders = ','.join(['?'] * len(cols))
            insert_sql = f"INSERT INTO \"{tbl}\" (" + ','.join([f'\"{c}\"' for c in cols]) + ") VALUES (" + placeholders + ")"
            to_insert = []
            for r in rows:
                row_vals = [ str(r.get(c, '')) for c in columns ]
                to_insert.append(row_vals)
            cur.executemany(insert_sql, to_insert)

        conn.commit()
        return {"status": "ok", "rows": len(rows)}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()


def optimize_database(db_name: str) -> Dict[str, Any]:
    """Run VACUUM and ANALYZE to optimize the database."""
    path = db_path(db_name)
    if not os.path.exists(path):
        return {"error": "db_not_found"}
    conn = sqlite3.connect(path)
    try:
        conn.execute("VACUUM;")
        conn.execute("ANALYZE;")
        return {"status": "optimized"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

def create_index(db_name: str, table_name: str, column_name: str) -> Dict[str, Any]:
    """Create an index on a specific column."""
    path = db_path(db_name)
    if not os.path.exists(path):
        return {"error": "db_not_found"}
    conn = sqlite3.connect(path)
    try:
        # Sanitize names
        tbl = ''.join(c for c in table_name if c.isalnum() or c == '_')
        col = ''.join(c for c in column_name if c.isalnum() or c == '_')
        idx_name = f"idx_{tbl}_{col}"
        
        conn.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {tbl} ({col});")
        return {"status": "index_created", "index": idx_name}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()


def delete_database(db_name: str) -> Dict[str, Any]:
    """Delete an entire database file."""
    path = db_path(db_name)
    if not os.path.exists(path):
        return {"error": "db_not_found"}
    try:
        os.remove(path)
        # Also remove WAL and SHM files if they exist
        wal_path = path + "-wal"
        shm_path = path + "-shm"
        if os.path.exists(wal_path):
            os.remove(wal_path)
        if os.path.exists(shm_path):
            os.remove(shm_path)
        return {"status": "deleted", "database": db_name}
    except Exception as e:
        return {"error": str(e)}


def delete_table(db_name: str, table_name: str) -> Dict[str, Any]:
    """Delete a table from a database."""
    path = db_path(db_name)
    if not os.path.exists(path):
        return {"error": "db_not_found"}
    conn = sqlite3.connect(path)
    try:
        # Sanitize table name
        tbl = ''.join(c for c in table_name if c.isalnum() or c == '_')
        if not tbl:
            return {"error": "invalid_table_name"}
        
        conn.execute(f"DROP TABLE IF EXISTS \"{tbl}\"")
        conn.commit()
        return {"status": "deleted", "table": table_name}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()


def execute_readonly_sql(db_name: str, sql: str, params: List[Any] = None) -> Dict[str, Any]:
    """Execute one read-only SQL statement for the AI tool without granting write access."""
    from pathlib import Path

    path = Path(db_path(db_name)).resolve()
    if not path.is_file():
        return {"error": "db_not_found"}

    # SQLite URI mode=ro prevents writes even if the model emits DML/DDL.
    uri = path.as_uri() + "?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA query_only = ON")
        cur = conn.cursor()
        if params:
            cur.execute(sql, params)
        else:
            cur.execute(sql)

        if cur.description is None:
            return {"error": "read_only_query_required"}
        rows = cur.fetchall()
        columns = [column[0] for column in cur.description]
        return {"rows": [dict(row) for row in rows], "columns": columns}
    except sqlite3.Error as exc:
        return {"error": str(exc)}
    finally:
        conn.close()
