"""
Global pytest fixtures
----------------------
• db_conn      ➜ pooled MySQL connection to the same DB your app uses
• client       ➜ FastAPI TestClient (in-memory HTTP)
• test_user    ➜ inserts a random user, yields its email, then cleans up
"""
import os
import sys
import uuid
import pytest
import mysql.connector
from mysql.connector import pooling
from fastapi.testclient import TestClient

# Add the parent directory to Python path so we can import main
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app, DB, init_pool

# Initialize the database pool for tests
init_pool()

@pytest.fixture(scope="session")
def db_conn():
    """One MySQL connection for the full test session."""
    conn = mysql.connector.connect(**DB)
    yield conn
    conn.close()


@pytest.fixture(scope="session")
def client():
    """In-process HTTP client."""
    return TestClient(app)


@pytest.fixture
def test_user(db_conn):
    """Insert a disposable user, yield its email, then delete."""
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    cur = db_conn.cursor()
    
    # Insert test user
    cur.execute(
        """INSERT INTO users(full_name,email,username,password)
           VALUES(%s,%s,%s,'dummy')""",
        ("Test User", email, email.split("@")[0]),
    )
    db_conn.commit()
    
    yield email
    
    # Clean up all related records first
    cur.execute("DELETE FROM mailbox_events WHERE user_id IN (SELECT id FROM users WHERE email=%s)", (email,))
    cur.execute("DELETE FROM images WHERE user_id IN (SELECT id FROM users WHERE email=%s)", (email,))
    cur.execute("DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email=%s)", (email,))
    cur.execute("DELETE FROM devices WHERE user_id IN (SELECT id FROM users WHERE email=%s)", (email,))
    
    # Finally delete the user
    cur.execute("DELETE FROM users WHERE email=%s", (email,))
    db_conn.commit()
    cur.close()
