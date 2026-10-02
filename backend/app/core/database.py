import sqlite3
import json
from datetime import datetime, timezone
from typing import Generator
from app.core.config import settings

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.SQLITE_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

def init_db() -> None:
    """Initialize database tables and seed starter data if empty."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create lectures table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lectures (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            subject TEXT NOT NULL,
            raw_notes TEXT NOT NULL,
            summary TEXT,
            key_concepts TEXT, -- JSON array of strings
            action_items TEXT, -- JSON array of objects {id, task, completed}
            status TEXT DEFAULT 'processed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Check if empty, and seed sample lecture for immediate testing
    cursor.execute("SELECT COUNT(*) as count FROM lectures;")
    row = cursor.fetchone()
    if row and row["count"] == 0:
        now = datetime.now(timezone.utc).isoformat()
        sample_concepts = json.dumps([
            "Neural Attention Mechanisms & Query-Key-Value paradigm",
            "Self-Attention vs. Multi-Head Attention Trade-offs",
            "Positional Encodings: Sinusoidal vs. Learned representations"
        ])
        sample_actions = json.dumps([
            {"id": "task-1", "task": "Review Vaswani et al. Section 3.2 on scaled dot-product formula", "completed": False},
            {"id": "task-2", "task": "Implement naive Multi-Head Attention layer in PyTorch", "completed": True},
            {"id": "task-3", "task": "Complete weekly problem set on sequence-to-sequence translation", "completed": False}
        ])
        sample_summary = (
            "This lecture covered the foundational concepts of the Transformer architecture, "
            "focusing on how self-attention replaces recurrence for parallelizable sequence modeling. "
            "We derived the Scaled Dot-Product formula and analyzed multi-head attention's ability "
            "to attend to information from different representation subspaces."
        )
        cursor.execute("""
            INSERT INTO lectures (id, title, subject, raw_notes, summary, key_concepts, action_items, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "lec-101",
            "Introduction to Transformers & Self-Attention",
            "Deep Learning & NLP",
            "Transformers replace RNNs. Attention is all you need. Query, Key, Value vectors. Scaled dot product prevents gradient saturation at high dimensions.",
            sample_summary,
            sample_concepts,
            sample_actions,
            "processed",
            now,
            now
        ))
        
        # Second sample lecture
        sample_concepts_2 = json.dumps([
            "ACID Properties & Transaction Isolation Levels",
            "Two-Phase Locking (2PL) vs Optimistic Concurrency Control",
            "Write-Ahead Logging (WAL) for durability"
        ])
        sample_actions_2 = json.dumps([
            {"id": "task-4", "task": "Draw concurrency schedule diagram demonstrating phantom reads", "completed": False},
            {"id": "task-5", "task": "Prepare for Lab 3 benchmark on SQLite vs Postgres write throughput", "completed": False}
        ])
        sample_summary_2 = (
            "Exploration of database concurrency control mechanisms, contrasting pessimistic lock-based strategies "
            "with optimistic validation techniques. Discussed how WAL enables crash recovery while maintaining high write throughput."
        )
        cursor.execute("""
            INSERT INTO lectures (id, title, subject, raw_notes, summary, key_concepts, action_items, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "lec-102",
            "Distributed Transactions & WAL Protocols",
            "Database Systems",
            "Concurrency control, isolation levels, serializability, WAL, undo/redo logs, checkpoints.",
            sample_summary_2,
            sample_concepts_2,
            sample_actions_2,
            "processed",
            now,
            now
        ))
        conn.commit()

    conn.close()
