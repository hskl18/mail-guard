"""
Smart-Mailbox Monitor API 
----------------------------------------------
• MySQL bootstrap (CREATE DATABASE & CREATE TABLE IF NOT EXISTS)
• Connection pooling (mysql-connector-python)
•  coarse resources: mailbox_events, images, notifications
• Pydantic request models
• CRUD endpoints: POST (create) & GET (list)
"""

import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import mysql.connector
from mysql.connector import pooling
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# --------------------------------------------------------------------------- #
# 1.  Environment & pool
# --------------------------------------------------------------------------- #
DB = {
    "host":     os.getenv("MYSQL_HOST"),
    "port":     int(os.getenv("MYSQL_PORT", 3306)),
    "user":     os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASSWORD"),
    "database": os.getenv("MYSQL_DATABASE"),
    "ssl_ca":   os.getenv("MYSQL_SSL_CA"),  
    "ssl_verify_cert": True,
}

# Initialize pool as None, will be set during startup
POOL = None

def init_pool():
    """Initialize the database pool. Can be called multiple times safely."""
    global POOL
    if POOL is None:
        _bootstrap_database()
        POOL = pooling.MySQLConnectionPool(pool_name="mailbox_pool", pool_size=10, **DB)


def _bootstrap_database() -> None:
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
    except mysql.connector.Error as e:
        raise HTTPException(500, f"MySQL pool error: {e}")


# --------------------------------------------------------------------------- #
# 2.  Helpers
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
# 3.  Request models
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
# 4.  FastAPI
# --------------------------------------------------------------------------- #
app = FastAPI(
    title="Smart Mailbox Monitor API",
    description="""
    A comprehensive API for monitoring smart mailboxes. This API provides endpoints for:
    
    * Device Management - Register and manage smart mailbox devices
    * Mailbox Events - Track mailbox open/close events
    * Image Storage - Store and retrieve mailbox images
    * Notifications - Handle mailbox notifications
    
    For detailed API documentation, visit:
    * Swagger UI: `/docs`
    * ReDoc: `/redoc`
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint that provides basic API information and available endpoints.
    """
    return {
        "name": "Smart Mailbox Monitor API",
        "version": "1.0.0",
        "description": "API for monitoring smart mailboxes",
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        },
        "endpoints": {
            "devices": {
                "path": "/devices",
                "methods": ["GET", "POST", "PUT"],
                "description": "Device management endpoints"
            },
            "mailbox_events": {
                "path": "/mailbox/events",
                "methods": ["GET", "POST"],
                "description": "Mailbox event tracking"
            },
            "images": {
                "path": "/mailbox/images",
                "methods": ["GET", "POST"],
                "description": "Image storage and retrieval"
            },
            "notifications": {
                "path": "/mailbox/notifications",
                "methods": ["GET", "POST"],
                "description": "Notification handling"
            }
        }
    }

@app.on_event("startup")
def _startup():
    init_pool()

# --- devices ---------------------------------------------------------------- #
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

# --- mailbox events -------------------------------------------------------- #
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

# --- images ---------------------------------------------------------------- #
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

# --- notifications --------------------------------------------------------- #
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
