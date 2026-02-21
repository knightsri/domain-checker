import os
from datetime import datetime
from typing import Optional

import aiosqlite

DB_PATH = os.environ.get("DB_PATH", "./data/domains.db")


async def init_db() -> None:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS domains (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain TEXT UNIQUE NOT NULL,
                base_name TEXT NOT NULL,
                tld TEXT NOT NULL,
                status TEXT NOT NULL,
                registrar TEXT,
                expiry TEXT,
                checked_at TEXT NOT NULL
            )
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_domain ON domains(domain)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_status ON domains(status)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_tld ON domains(tld)")
        await db.commit()


async def upsert_result(
    domain: str,
    base_name: str,
    tld: str,
    status: str,
    registrar: Optional[str],
    expiry: Optional[str],
    checked_at: datetime,
) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """
            INSERT INTO domains (domain, base_name, tld, status, registrar, expiry, checked_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(domain) DO UPDATE SET
                status = excluded.status,
                registrar = excluded.registrar,
                expiry = excluded.expiry,
                checked_at = excluded.checked_at
            """,
            (domain, base_name, tld, status, registrar, expiry, checked_at.isoformat()),
        )
        await db.commit()
        return cursor.lastrowid or 0


async def get_results(
    status: Optional[str] = None,
    tld: Optional[str] = None,
    search: Optional[str] = None,
) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        query = "SELECT * FROM domains WHERE 1=1"
        params: list = []

        if status:
            query += " AND status = ?"
            params.append(status)
        if tld:
            query += " AND tld = ?"
            params.append(tld)
        if search:
            query += " AND domain LIKE ?"
            params.append(f"%{search}%")

        query += " ORDER BY checked_at DESC"

        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def get_result_by_id(result_id: int) -> Optional[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM domains WHERE id = ?", (result_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None


async def get_domains_by_ids(ids: list[int]) -> list[dict]:
    if not ids:
        return []
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        placeholders = ",".join("?" * len(ids))
        cursor = await db.execute(
            f"SELECT * FROM domains WHERE id IN ({placeholders})", ids
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def get_available_domains() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM domains WHERE status = 'AVAILABLE'"
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def delete_result(result_id: int) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("DELETE FROM domains WHERE id = ?", (result_id,))
        await db.commit()
        return cursor.rowcount > 0


async def delete_results(ids: list[int]) -> int:
    if not ids:
        return 0
    async with aiosqlite.connect(DB_PATH) as db:
        placeholders = ",".join("?" * len(ids))
        cursor = await db.execute(
            f"DELETE FROM domains WHERE id IN ({placeholders})", ids
        )
        await db.commit()
        return cursor.rowcount
