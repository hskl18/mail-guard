"""Smart Mailbox Monitor – FastAPI backend
================================================
Complete main.py with an HTML landing page at "/" and all API routes.
"""

import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import mysql.connector
from mysql.connector import pooling
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse

# --------------------------------------------------------------------------- #
# 1.  Environment & connection pooling
# --------------------------------------------------------------------------- #
DB: Dict[str, Any] = {
    "host":     os.getenv("MYSQL_HOST"),
    "port":     int(os.getenv("MYSQL_PORT", 3306)),
    "user":     os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASSWORD"),
    "database": os.getenv("MYSQL_DATABASE"),
    "ssl_ca":   os.getenv("MYSQL_SSL_CA"),
    "ssl_verify_cert": True,
}

POOL: Optional[pooling.MySQLConnectionPool] = None

def init_pool() -> None:
    """Initialise connection pool (idempotent)."""
    global POOL
    if POOL is None:
        _bootstrap_database()
        POOL = pooling.MySQLConnectionPool(
            pool_name="mailbox_pool", pool_size=10, **DB
        )


def _bootstrap_database() -> None:
    """Create database & tables if they don't yet exist."""
    # Ensure database exists
    with mysql.connector.connect(**{k: v for k, v in DB.items() if k != "database"}) as root:
        root.cursor().execute(f"CREATE DATABASE IF NOT EXISTS {DB['database']}")

    ddl = {
        "users": """
          CREATE TABLE IF NOT EXISTS users(
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255),
            email VARCHAR(255) UNIQUE,
            username VARCHAR(50) UNIQUE,
            password VARCHAR(255),
            region VARCHAR(100),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB
        """,
        "devices": """
          CREATE TABLE IF NOT EXISTS devices(
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            device_name VARCHAR(255),
            device_id VARCHAR(255) UNIQUE,
            location VARCHAR(255),
            firmware_version VARCHAR(50),
            is_active BOOLEAN DEFAULT TRUE,
            last_seen DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          ) ENGINE=InnoDB
        """,
        "mailbox_events": """
          CREATE TABLE IF NOT EXISTS mailbox_events(
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            device_id VARCHAR(255),
            event_type ENUM('open','close') NOT NULL,
            timestamp DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
          ) ENGINE=InnoDB
        """,
        "images": """
          CREATE TABLE IF NOT EXISTS images(
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            device_id VARCHAR(255),
            image_url VARCHAR(2083),
            timestamp DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
          ) ENGINE=InnoDB
        """,
        "notifications": """
          CREATE TABLE IF NOT EXISTS notifications(
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            device_id VARCHAR(255),
            notification_type VARCHAR(50),
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          ) ENGINE=InnoDB
        """,
    }

    with mysql.connector.connect(**DB) as conn:
        cur = conn.cursor()
        for stmt in ddl.values():
            cur.execute(stmt)
        conn.commit()


def _pool() -> mysql.connector.MySQLConnection:
    try:
        return POOL.get_connection()
    except mysql.connector.Error as exc:
        raise HTTPException(500, f"MySQL pool error: {exc}")

# --------------------------------------------------------------------------- #
# 2.  Helper functions
# --------------------------------------------------------------------------- #

def _user_id(email: str) -> int:
    with _pool() as conn:
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, f"No user found for email '{email}'")
    return row["id"]


def _insert(sql: str, params: tuple) -> Dict[str, int]:
    with _pool() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        return {"id": cur.lastrowid}


def _select(sql: str, params: tuple) -> List[Dict[str, Any]]:
    with _pool() as conn:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params)
        return cur.fetchall()

# --------------------------------------------------------------------------- #
# 3.  Pydantic request models
# --------------------------------------------------------------------------- #
from pydantic import BaseModel

class _BasePayload(BaseModel):
    email: str
    device_id: str
    timestamp: Optional[datetime] = None

class DevicePayload(BaseModel):
    email: str
    device_name: str
    device_id: str
    location: Optional[str] = None
    firmware_version: Optional[str] = None

class MailboxEventPayload(_BasePayload):
    event_type: str

class ImageRecordPayload(_BasePayload):
    image_url: str

class NotificationPayload(BaseModel):
    email: str
    device_id: str
    notification_type: str

# --------------------------------------------------------------------------- #
# 4.  FastAPI application
# --------------------------------------------------------------------------- #

app = FastAPI(
    title="Smart Mailbox Monitor API",
    description=(
        "A comprehensive API for monitoring smart mailboxes.\n\n"
        "* Device Management – Register and manage smart mailbox devices\n"
        "* Mailbox Events – Track mailbox open/close events\n"
        "* Image Storage – Store and retrieve mailbox images\n"
        "* Notifications – Handle mailbox notifications"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# --------------------------------------------------------------------------- #
# 4a.  Landing page (HTML) – excludes from OpenAPI schema
# --------------------------------------------------------------------------- #

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def landing_page() -> str:
    """Human‑friendly landing page instead of raw JSON."""
    return """
    <!DOCTYPE html>
    <html lang=\"en\">
    <head>
        <meta charset=\"utf-8\" />
        <title>Smart Mailbox Monitor API</title>
        <style>
            body { font-family: system-ui, sans-serif; margin: 3rem auto; max-width: 600px; line-height: 1.6; }
            code { background: #f5f5f5; padding: 0.15rem 0.35rem; border-radius: 4px; }
            a { color: #0070f3; text-decoration: none; }
            a:hover { text-decoration: underline; }
            pre { white-space: pre-wrap; }
        </style>
    </head>
    <body>
        <h1>Smart Mailbox Monitor API</h1>
        <p>This backend powers the Smart Mailbox Monitor project.</p>

        <h2>Interactive Documentation</h2>
        <ul>
            <li><a href=\"/docs\">Swagger UI</a></li>
            <li><a href=\"/redoc\">ReDoc</a></li>
        </ul>

        <h2>Key Endpoints</h2>
        <pre><code>
POST /devices                  Register a new device
GET  /devices                  List a user's devices
PUT  /devices/{device_id}      Update device info
POST /mailbox/events           Record an open/close event
GET  /mailbox/events           List events for a device
POST /mailbox/images           Save an image URL
GET  /mailbox/images           List images for a device
POST /mailbox/notifications    Record a notification
GET  /mailbox/notifications    List notifications for a user
        </code></pre>
        <p>🐳  Running inside Docker on <code>0.0.0.0:8000</code></p>
    </body>
    </html>
    """

# --------------------------------------------------------------------------- #
# 5.  Startup event – create pool
# --------------------------------------------------------------------------- #

@app.on_event("startup")
def _on_startup() -> None:
    init_pool()

# --------------------------------------------------------------------------- #
# 6.  Devices CRUD
# --------------------------------------------------------------------------- #

@app.post("/devices", response_model=Dict[str, int])
def create_device(p: DevicePayload):
    return _insert(
        """INSERT INTO devices(user_id,device_name,device_id,location,firmware_version)
           VALUES (%s,%s,%s,%s,%s)""",
        (_user_id(p.email), p.device_name, p.device_id, p.location, p.firmware_version),
    )

@app.get("/devices", response_model=List[Dict[str, Any]])
def list_devices(email: str):
    return _select(
        "SELECT * FROM devices WHERE user_id=%s ORDER BY created_at DESC",
        (_user_id(email),),
    )

@app.put("/devices/{device_id}", response_model=Dict[str, int])
def update_device(device_id: str, p: DevicePayload):
    with _pool() as conn:
        cur = conn.cursor()
        cur.execute(
            """UPDATE devices 
               SET device_name=%s, location=%s, firmware_version=%s, last_seen=NOW()
               WHERE device_id=%s AND user_id=%s""",
            (p.device_name, p.location, p.firmware_version, device_id, _user_id(p.email)),
        )
        conn.commit()
        return {"id": cur.lastrowid}

# --------------------------------------------------------------------------- #
# 7.  Mailbox events
# --------------------------------------------------------------------------- #

@app.post("/mailbox/events", response_model=Dict[str, int])
def create_event(p: MailboxEventPayload):
    ts = p.timestamp or datetime.utcnow()
    return _insert(
        "INSERT INTO mailbox_events(user_id,device_id,event_type,timestamp) VALUES (%s,%s,%s,%s)",
        (_user_id(p.email), p.device_id, p.event_type, ts),
    )

@app.get("/mailbox/events", response_model=List[Dict[str, Any]])
def list_events(email: str, device_id: str):
    return _select(
        "SELECT * FROM mailbox_events WHERE user_id=%s AND device_id=%s ORDER BY timestamp DESC",
        (_user_id(email), device_id),
    )

# --------------------------------------------------------------------------- #
# 8.  Images
# --------------------------------------------------------------------------- #

@app.post("/mailbox/images", response_model=Dict[str, int])
def create_image(p: ImageRecordPayload):
    ts = p.timestamp or datetime.utcnow()
    return _insert(
        "INSERT INTO images(user_id,device_id,image_url,timestamp) VALUES (%s,%s,%s,%s)",
        (_user_id(p.email), p.device_id, p.image_url, ts),
    )

@app.get("/mailbox/images", response_model=List[Dict[str, Any]])
def list_images(email: str, device_id: str):
    return _select(
        "SELECT * FROM images WHERE user_id=%s AND device_id=%s ORDER BY timestamp DESC",
        (_user_id(email), device_id),
    )

# --------------------------------------------------------------------------- #
# 9.  Notifications
# --------------------------------------------------------------------------- #

@app.post("/mailbox/notifications", response_model=Dict[str, int])
def create_notification(p: NotificationPayload):
    return _insert(
        "INSERT INTO notifications(user_id,device_id,notification_type) VALUES (%s,%s,%s)",
        (_user_id(p.email), p.device_id, p.notification_type),
    )

@app.get("/mailbox/notifications", response_model=List[Dict[str, Any]])
def list_notifications(email: str):
    return _select(
        "SELECT * FROM notifications WHERE user_id=%s ORDER BY sent_at DESC",
        (_user_id(email),),
    )
