import sqlite3
import time
from collections import namedtuple
import numpy as np
from typing import Any, List, Optional, Tuple

from openrecall.config import db_path

# Define the structure of a database entry using namedtuple
Entry = namedtuple(
    "Entry", ["id", "app", "title", "text", "timestamp", "embedding", "language"]
)


def create_db() -> None:
    """
    Creates the SQLite database and the 'entries' table if they don't exist.

    The table schema includes columns for an auto-incrementing ID, application name,
    window title, extracted text, timestamp, and text embedding.
    """
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """CREATE TABLE IF NOT EXISTS entries (
                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                       app TEXT,
                       title TEXT,
                       text TEXT,
                       timestamp INTEGER UNIQUE,
                       embedding BLOB,
                       language TEXT
                   )"""
            )
            # Add index on timestamp for faster lookups
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_timestamp ON entries (timestamp)"
            )
            conn.commit()
    except sqlite3.Error as e:
        print(f"Database error during table creation: {e}")


def get_all_entries() -> List[Entry]:
    """
    Retrieves all entries from the database.

    Returns:
        List[Entry]: A list of all entries as Entry namedtuples.
                     Returns an empty list if the table is empty or an error occurs.
    """
    entries: List[Entry] = []
    try:
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row  # Return rows as dictionary-like objects
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, app, title, text, timestamp, embedding, language FROM entries ORDER BY timestamp DESC"
            )
            results = cursor.fetchall()
            for row in results:
                # Deserialize the embedding blob back into a NumPy array
                embedding = np.frombuffer(
                    row["embedding"], dtype=np.float32
                )  # Assuming float32, adjust if needed
                entries.append(
                    Entry(
                        id=row["id"],
                        app=row["app"],
                        title=row["title"],
                        text=row["text"],
                        timestamp=row["timestamp"],
                        embedding=embedding,
                        language=row["language"],
                    )
                )
    except sqlite3.Error as e:
        print(f"Database error while fetching all entries: {e}")
    return entries


def get_timestamps() -> List[int]:
    """
    Retrieves all timestamps from the database, ordered descending.

    Returns:
        List[int]: A list of all timestamps.
                   Returns an empty list if the table is empty or an error occurs.
    """
    timestamps: List[int] = []
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            # Use the index for potentially faster retrieval
            cursor.execute("SELECT timestamp FROM entries ORDER BY timestamp DESC")
            results = cursor.fetchall()
            timestamps = [result[0] for result in results]
    except sqlite3.Error as e:
        print(f"Database error while fetching timestamps: {e}")
    return timestamps


def insert_entry(
    text: str,
    timestamp: int,
    embedding: np.ndarray,
    app: str,
    title: str,
    language: str,
) -> Optional[int]:
    """
    Inserts a new entry into the database.

    Args:
        text (str): The extracted text content.
        timestamp (int): The Unix timestamp of the screenshot.
        embedding (np.ndarray): The embedding vector for the text.
        app (str): The name of the active application.
        title (str): The title of the active window.

    Returns:
        Optional[int]: The ID of the newly inserted row, or None if insertion fails.
                       Prints an error message to stderr on failure.
    """
    embedding_bytes: bytes = embedding.astype(
        np.float32
    ).tobytes()  # Ensure consistent dtype
    last_row_id: Optional[int] = None
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO entries (text, timestamp, embedding, app, title, language)
                   VALUES (?, ?, ?, ?, ?, ?)
                   ON CONFLICT(timestamp) DO NOTHING""",  # Avoid duplicates based on timestamp
                (text, timestamp, embedding_bytes, app, title, language),
            )
            conn.commit()
            if cursor.rowcount > 0:  # Check if insert actually happened
                last_row_id = cursor.lastrowid
            # else:
            # Optionally log that a duplicate timestamp was encountered
            # print(f"Skipped inserting entry with duplicate timestamp: {timestamp}")

    except sqlite3.Error as e:
        # More specific error handling can be added (e.g., IntegrityError for UNIQUE constraint)
        print(f"Database error during insertion: {e}")
    return last_row_id


def get_entries_by_time_range(start_time: int, end_time: int) -> List[Entry]:
    with sqlite3.connect(db_path) as conn:
        c = conn.cursor()
        results = c.execute(
            "SELECT * FROM entries WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC",
            (start_time, end_time),
        ).fetchall()
        return [Entry(*result) for result in results]


def get_unique_apps() -> List[str]:
    """
    Retrieves a list of unique application names from the database.

    Returns:
        List[str]: A list of unique application names.
    """
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
    """
    Retrieves a list of unique languages from the database.

    Returns:
        List[str]: A list of unique languages.
    """
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
    """
    Retrieves a digest of the user's activity over a given time range.

    Args:
        time_range (str): The time range for the digest ("day" or "week").

    Returns:
        dict: A dictionary containing the most frequent apps and words.
    """
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
            # Most frequent apps
            cursor.execute(
                "SELECT app, COUNT(*) as count FROM entries WHERE timestamp >= ? GROUP BY app ORDER BY count DESC LIMIT 5",
                (start_time,),
            )
            digest["apps"] = cursor.fetchall()
            # Most frequent words
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
