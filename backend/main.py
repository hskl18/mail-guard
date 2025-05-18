"""Smart Mailbox Monitor – FastAPI backend
================================================
main.py with an HTML landing page at "/" and all API routes.
"""
import os
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

import mysql.connector
from mysql.connector import pooling
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

# Import your notification sender
from backend.notify_user import send_notification

# --------------------------------------------------------------------------- #
# Configuration & Folders
# --------------------------------------------------------------------------- #
DB: Dict[str, Any] = {
    "host": os.getenv("MYSQL_HOST"),
    "port": int(os.getenv("MYSQL_PORT", 3306)),
    "user": os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASSWORD"),
    "database": os.getenv("MYSQL_DATABASE"),
    "ssl_ca": os.getenv("MYSQL_SSL_CA"),
    "ssl_verify_cert": True,
}

UPLOAD_FOLDER = "uploads"
STATIC_FOLDER = "static"
LOG_FILE = "weight_log.json"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STATIC_FOLDER, exist_ok=True)

# --------------------------------------------------------------------------- #
# Database pool setup
# --------------------------------------------------------------------------- #
POOL: Optional[pooling.MySQLConnectionPool] = None

def init_pool() -> None:
    global POOL
    if POOL is None:
        _bootstrap_database()
        POOL = pooling.MySQLConnectionPool(
            pool_name="mailbox_pool", pool_size=10, **DB
        )


def _bootstrap_database() -> None:
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
# Helper functions
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
# Pydantic request models
# --------------------------------------------------------------------------- #
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
# FastAPI application
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

@app.on_event("startup")
def on_startup() -> None:
    init_pool()

# --------------------------------------------------------------------------- #
### Landing page
# --------------------------------------------------------------------------- #
@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def landing_page() -> str:
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Smart Mailbox Monitor API</title>
        <style>
            :root {
                --primary-color: #0070f3;
                --bg-color: #fafafa;
                --text-color: #333;
                --code-bg: #f5f5f5;
                --border-radius: 8px;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: var(--text-color);
                background: var(--bg-color);
                padding: 2rem;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 2rem;
                border-radius: var(--border-radius);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            h1 { color: var(--primary-color); margin-bottom: 1.5rem; font-size: 2.5rem; }
            h2 { color: var(--text-color); margin: 2rem 0 1rem; font-size: 1.5rem; }
            p { margin-bottom: 1rem; }
            ul { list-style: none; margin: 1rem 0; }
            li { margin: 0.5rem 0; }
            a { color: var(--primary-color); text-decoration: none; font-weight: 500; transition: color 0.2s ease; }
            a:hover { color: #0051a8; text-decoration: underline; }
            code { background: var(--code-bg); padding: 0.2rem 0.4rem; border-radius: 4px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 0.9em; }
            pre { background: var(--code-bg); padding: 1rem; border-radius: var(--border-radius); overflow-x: auto; margin: 1rem 0; }
            pre code { background: none; padding: 0; }
            .endpoint { display: flex; align-items: center; gap: 1rem; margin: 0.5rem 0; }
            .method { font-weight: bold; min-width: 60px; }
            .path { font-family: monospace; }
            .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee; font-size: 0.9rem; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Smart Mailbox Monitor API</h1>
            <p>Welcome to the Smart Mailbox Monitor API backend. This service provides a comprehensive set of endpoints for managing and monitoring smart mailbox devices.</p>
            <h2>Interactive Documentation</h2>
            <ul>
                <li><a href="/docs">📚 Swagger UI</a> - Interactive API documentation with testing capabilities</li>
                <li><a href="/redoc">📖 ReDoc</a> - Alternative API documentation with a clean interface</li>
            </ul>
            <h2>Key Endpoints</h2>
            <div class="endpoint"><span class="method">POST</span><span class="path">/devices</span><span>Register a new device</span></div>
            <div class="endpoint"><span class="method">GET</span><span class="path">/devices</span><span>List a user's devices</span></div>
            <div class="endpoint"><span class="method">PUT</span><span class="path">/devices/{device_id}</span><span>Update device info</span></div>
            <div class="endpoint"><span class="method">POST</span><span class="path">/mailbox/events</span><span>Record an open/close event</span></div>
            <div class="endpoint"><span class="method">GET</span><span class="path">/mailbox/events</span><span>List events for a device</span></div>
            <div class="endpoint"><span class="method">POST</span><span class="path">/mailbox/images</span><span>Save an image URL</span></div>
            <div class="endpoint"><span class="method">GET</span><span class="path">/mailbox/images</span><span>List images for a device</span></div>
            <div class="endpoint"><span class="method">POST</span><span class="path">/mailbox/notifications</span><span>Record a notification</span></div>
            <div class="endpoint"><span class="method">GET</span><span class="path">/mailbox/notifications</span><span>List notifications for a user</span></div>
            <div class="footer"><p>🐳 Running inside Docker on <code>0.0.0.0:8000</code></p></div>
        </div>
    </body>
    </html>
    """

# --------------------------------------------------------------------------- #
# Devices CRUD
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
# Mailbox events
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
# Images
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
# Notifications
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

# --------------------------------------------------------------------------- #
# Upload endpoint (binary image + weight header)
# --------------------------------------------------------------------------- #

@app.post("/upload")
async def upload(request: Request, weight: Optional[str] = Header(None)):
    # Read raw body
    image_data = await request.body()
    # Determine filename
    filename = datetime.now().strftime("image_%Y%m%d_%H%M%S.jpg")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    # Save to uploads folder
    with open(filepath, "wb") as f:
        f.write(image_data)
    # Also update latest image
    latest_path = os.path.join(STATIC_FOLDER, "latest.jpg")
    with open(latest_path, "wb") as f:
        f.write(image_data)
    # Log the upload event
    log_entry = {"time": datetime.now().isoformat(), "weight": weight or "unknown", "image": filename}
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            log = json.load(f)
    else:
        log = []
    log.append(log_entry)
    with open(LOG_FILE, "w") as f:
        json.dump(log, f, indent=2)
    # Send notification
    try:
        send_notification(weight or "unknown", filename)
    except Exception as exc:
        return JSONResponse(status_code=500, content={"message": "Uploaded but notification failed.", "error": str(exc)})

    return {"message": "Upload complete", "file": filename}