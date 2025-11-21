import sqlite3
import time
import json
import uuid
from collections import namedtuple
import numpy as np
from typing import Any, List, Optional, Tuple, Dict

from openrecall.config import db_path

# Define the structure of a database entry using namedtuple
Entry = namedtuple(
    "Entry", ["id", "app", "title", "text", "timestamp", "embedding", "language", "event_id", "is_processed"]
)

Event = namedtuple(
    "Event", ["id", "start_time", "end_time", "title", "description", "type", "stats", "hero_image", "thumbnails", "tags"]
)

Job = namedtuple(
    "Job", ["id", "type", "payload", "status", "created_at", "updated_at"]
)


def create_db() -> None:
    """
    Creates the SQLite database and tables.
    DROPS EXISTING TABLES for a fresh start.
    """
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            
            # Fresh start: Drop tables
            cursor.execute("DROP TABLE IF EXISTS entries")
            cursor.execute("DROP TABLE IF EXISTS events")
            cursor.execute("DROP TABLE IF EXISTS jobs")

            # Create entries table
            cursor.execute(
                """CREATE TABLE entries (
                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                       app TEXT,
                       title TEXT,
                       text TEXT,
                       timestamp INTEGER UNIQUE,
                       embedding BLOB,
                       language TEXT,
                       event_id TEXT,
                       is_processed BOOLEAN DEFAULT 0,
                       FOREIGN KEY(event_id) REFERENCES events(id)
                   )"""
            )
            
            # Create events table
            cursor.execute(
                """CREATE TABLE events (
                       id TEXT PRIMARY KEY,
                       start_time INTEGER,
                       end_time INTEGER,
                       title TEXT,
                       description TEXT,
                       type TEXT,
                       stats TEXT,
                       hero_image TEXT,
                       thumbnails TEXT,
                       tags TEXT
                   )"""
            )
            
            # Create jobs table
            cursor.execute(
                """CREATE TABLE jobs (
                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                       type TEXT,
                       payload TEXT,
                       status TEXT,
                       created_at INTEGER,
                       updated_at INTEGER
                   )"""
            )

            # Indexes
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON entries (timestamp)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_event_id ON entries (event_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_event_start ON events (start_time)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_job_status ON jobs (status)")
            
            conn.commit()
            print("Database initialized with fresh schema.")
    except sqlite3.Error as e:
        print(f"Database error during table creation: {e}")


def get_all_entries() -> List[Entry]:
    entries: List[Entry] = []
    try:
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM entries ORDER BY timestamp DESC"
            )
            results = cursor.fetchall()
            for row in results:
                embedding = np.frombuffer(
                    row["embedding"], dtype=np.float32
                ) if row["embedding"] else None
                
                entries.append(
                    Entry(
                        id=row["id"],
                        app=row["app"],
                        title=row["title"],
                        text=row["text"],
                        timestamp=row["timestamp"],
                        embedding=embedding,
                        language=row["language"],
                        event_id=row["event_id"],
                        is_processed=bool(row["is_processed"])
                    )
                )
    except sqlite3.Error as e:
        print(f"Database error while fetching all entries: {e}")
    return entries


def get_timestamps() -> List[int]:
    timestamps: List[int] = []
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT timestamp FROM entries ORDER BY timestamp DESC")
            results = cursor.fetchall()
            timestamps = [result[0] for result in results]
    except sqlite3.Error as e:
        print(f"Database error while fetching timestamps: {e}")
    return timestamps


def insert_entry(
    text: str,
    timestamp: int,
    embedding: Optional[np.ndarray],
    app: str,
    title: str,
    language: str,
    event_id: Optional[str] = None,
    is_processed: bool = False
) -> Optional[int]:
    embedding_bytes = embedding.astype(np.float32).tobytes() if embedding is not None else None
    last_row_id: Optional[int] = None
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO entries (text, timestamp, embedding, app, title, language, event_id, is_processed)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(timestamp) DO NOTHING""",
                (text, timestamp, embedding_bytes, app, title, language, event_id, is_processed),
            )
            conn.commit()
            if cursor.rowcount > 0:
                last_row_id = cursor.lastrowid
    except sqlite3.Error as e:
        print(f"Database error during insertion: {e}")
    return last_row_id


def update_entry_embedding(entry_id: int, embedding: np.ndarray) -> bool:
    embedding_bytes: bytes = embedding.astype(np.float32).tobytes()
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE entries SET embedding = ? WHERE id = ?",
                (embedding_bytes, entry_id),
            )
            conn.commit()
            return cursor.rowcount > 0
    except sqlite3.Error as e:
        print(f"Database error during update: {e}")
        return False


def get_entries_by_time_range(start_time: int, end_time: int) -> List[Entry]:
    # Simplified for now, might need full hydration like get_all_entries
    # But for legacy search it might be enough.
    # Let's implement it properly.
    entries: List[Entry] = []
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM entries WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC",
            (start_time, end_time),
        )
        results = cursor.fetchall()
        for row in results:
            embedding = np.frombuffer(
                row["embedding"], dtype=np.float32
            ) if row["embedding"] else None
            entries.append(
                Entry(
                    id=row["id"],
                    app=row["app"],
                    title=row["title"],
                    text=row["text"],
                    timestamp=row["timestamp"],
                    embedding=embedding,
                    language=row["language"],
                    event_id=row["event_id"],
                    is_processed=bool(row["is_processed"])
                )
            )
    return entries


def get_unique_apps() -> List[str]:
    apps: List[str] = []
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT app FROM entries ORDER BY app")
            results = cursor.fetchall()
            apps = [result[0] for result in results]
    except sqlite3.Error as e:
        print(f"Database error while fetching unique apps: {e}")
    return apps


def get_unique_languages() -> List[str]:
    languages: List[str] = []
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT language FROM entries ORDER BY language")
            results = cursor.fetchall()
            languages = [result[0] for result in results]
    except sqlite3.Error as e:
        print(f"Database error while fetching unique languages: {e}")
    return languages


def get_activity_digest(time_range: str) -> dict:
    if time_range == "day":
        start_time = int(time.time()) - 86400
    elif time_range == "week":
        start_time = int(time.time()) - 604800
    else:
        return {}

    digest = {"apps": [], "words": []}
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT app, COUNT(*) as count FROM entries WHERE timestamp >= ? GROUP BY app ORDER BY count DESC LIMIT 5",
                (start_time,),
            )
            digest["apps"] = cursor.fetchall()
            cursor.execute(
                "SELECT text FROM entries WHERE timestamp >= ?", (start_time,)
            )
            words = " ".join([row[0] for row in cursor.fetchall()]).split()
            word_counts = {}
            for word in words:
                word_counts[word] = word_counts.get(word, 0) + 1
            sorted_words = sorted(
                word_counts.items(), key=lambda item: item[1], reverse=True
            )
            digest["words"] = sorted_words[:10]
    except sqlite3.Error as e:
        print(f"Database error while fetching activity digest: {e}")
    return digest

# --- New Event Functions ---

def insert_event(event: dict) -> str:
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO events (id, start_time, end_time, title, description, type, stats, hero_image, thumbnails, tags)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(id) DO UPDATE SET
                   end_time=excluded.end_time,
                   title=excluded.title,
                   description=excluded.description,
                   stats=excluded.stats,
                   thumbnails=excluded.thumbnails,
                   tags=excluded.tags
                   """,
                (
                    event["id"],
                    event["start_time"],
                    event["end_time"],
                    event["title"],
                    event["description"],
                    event["type"],
                    json.dumps(event["stats"]),
                    event["hero_image"],
                    json.dumps(event["thumbnails"]),
                    json.dumps(event["tags"]),
                ),
            )
            conn.commit()
            return event["id"]
    except sqlite3.Error as e:
        print(f"Database error during event insertion: {e}")
        return None

def get_events(limit: int = 50, offset: int = 0) -> List[Event]:
    events = []
    try:
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM events ORDER BY start_time DESC LIMIT ? OFFSET ?",
                (limit, offset)
            )
            results = cursor.fetchall()
            for row in results:
                events.append(Event(
                    id=row["id"],
                    start_time=row["start_time"],
                    end_time=row["end_time"],
                    title=row["title"],
                    description=row["description"],
                    type=row["type"],
                    stats=json.loads(row["stats"]),
                    hero_image=row["hero_image"],
                    thumbnails=json.loads(row["thumbnails"]),
                    tags=json.loads(row["tags"])
                ))
    except sqlite3.Error as e:
        print(f"Database error fetching events: {e}")
    return events

def get_event_by_id(event_id: str) -> Optional[Event]:
    try:
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
            row = cursor.fetchone()
            if row:
                return Event(
                    id=row["id"],
                    start_time=row["start_time"],
                    end_time=row["end_time"],
                    title=row["title"],
                    description=row["description"],
                    type=row["type"],
                    stats=json.loads(row["stats"]),
                    hero_image=row["hero_image"],
                    thumbnails=json.loads(row["thumbnails"]),
                    tags=json.loads(row["tags"])
                )
    except sqlite3.Error as e:
        print(f"Database error fetching event: {e}")
    return None

# --- Job Functions ---

def insert_job(job_type: str, payload: dict) -> int:
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            now = int(time.time())
            cursor.execute(
                "INSERT INTO jobs (type, payload, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                (job_type, json.dumps(payload), "pending", now, now)
            )
            conn.commit()
            return cursor.lastrowid
    except sqlite3.Error as e:
        print(f"Database error inserting job: {e}")
        return -1

def get_pending_jobs(limit: int = 10) -> List[Job]:
    jobs = []
    try:
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?",
                (limit,)
            )
            results = cursor.fetchall()
            for row in results:
                jobs.append(Job(
                    id=row["id"],
                    type=row["type"],
                    payload=json.loads(row["payload"]),
                    status=row["status"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"]
                ))
    except sqlite3.Error as e:
        print(f"Database error fetching jobs: {e}")
    return jobs

def update_job_status(job_id: int, status: str) -> bool:
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            now = int(time.time())
            cursor.execute(
                "UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?",
                (status, now, job_id)
            )
            conn.commit()
            return True
    except sqlite3.Error as e:
        print(f"Database error updating job: {e}")
        return False
