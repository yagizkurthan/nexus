import sqlite3

from db_manager import execute_readonly_sql


def test_execute_readonly_sql_returns_rows(tmp_path, monkeypatch):
    import db_manager

    db_dir = tmp_path / "databases"
    db_dir.mkdir()
    monkeypatch.setattr(db_manager, "DB_DIR", str(db_dir))

    database = db_dir / "sample.db"
    with sqlite3.connect(database) as conn:
        conn.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)")
        conn.execute("INSERT INTO items (name) VALUES ('alpha')")

    result = execute_readonly_sql("sample", "SELECT id, name FROM items")

    assert result["rows"] == [{"id": 1, "name": "alpha"}]
    assert result["columns"] == ["id", "name"]


def test_execute_readonly_sql_rejects_writes(tmp_path, monkeypatch):
    import db_manager

    db_dir = tmp_path / "databases"
    db_dir.mkdir()
    monkeypatch.setattr(db_manager, "DB_DIR", str(db_dir))

    database = db_dir / "sample.db"
    with sqlite3.connect(database) as conn:
        conn.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)")
        conn.execute("INSERT INTO items (name) VALUES ('alpha')")

    result = execute_readonly_sql("sample", "UPDATE items SET name = 'changed'")

    assert "error" in result
    with sqlite3.connect(database) as conn:
        assert conn.execute("SELECT name FROM items").fetchone()[0] == "alpha"


def test_db_path_rejects_path_traversal(tmp_path, monkeypatch):
    import pytest
    import db_manager

    monkeypatch.setattr(db_manager, "DB_DIR", str(tmp_path))

    with pytest.raises(ValueError):
        db_manager.db_path("../outside")

    with pytest.raises(ValueError):
        db_manager.db_path("subdir/database")
