import os
import mysql.connector
from mysql.connector import pooling
from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import HTTPException

# 1) Initialize the MySQL database if it doesn’t exist
def initialize_database():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST"),
            port=int(os.getenv("MYSQL_PORT", 3306)),
            user=os.getenv("MYSQL_USER"),
            password=os.getenv("MYSQL_PASSWORD"),
            database=""  # connect to server only
        )
        cursor = conn.cursor()
        db_name = os.getenv("MYSQL_DATABASE", "mailboxdb")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error creating database: {err}")

initialize_database()

# 2) Create a connection pool
dbconfig = {
    "host":     os.getenv("MYSQL_HOST"),
    "port":     int(os.getenv("MYSQL_PORT", 3306)),
    "user":     os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASSWORD"),
    "database": os.getenv("MYSQL_DATABASE", "mailboxdb"),
}
connection_pool = pooling.MySQLConnectionPool(
    pool_name="mailbox_pool",
    pool_size=10,
    **dbconfig
)

def get_mysql_connection():
    try:
        return connection_pool.get_connection()
    except mysql.connector.Error as err:
        print(f"Error connecting to MySQL: {err}")
        return None

# 3) Seed all necessary tables
def seed_db():
    conn = get_mysql_connection()
    if conn is None:
        raise RuntimeError("Unable to get DB connection for seeding")
    cursor = conn.cursor()
    # Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        full_name    VARCHAR(255),
        email        VARCHAR(255) UNIQUE,
        username     VARCHAR(50) UNIQUE,
        password     VARCHAR(255),
        region       VARCHAR(100),
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
    """)
    # Sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        session_id  VARCHAR(255) PRIMARY KEY,
        user_id     INT NOT NULL,
        created_at  DATETIME,
        expires_at  DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB;
    """)
    # Devices
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS devices (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        user_id           INT NOT NULL,
        device_name       VARCHAR(255),
        device_id         VARCHAR(255) UNIQUE,
        location          VARCHAR(255),
        firmware_version  VARCHAR(50),
        is_active         BOOLEAN DEFAULT TRUE,
        last_seen         DATETIME,
        created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB;
    """)
    # Mailbox open/close events
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mailbox_events (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT NOT NULL,
        device_id   VARCHAR(255),
        event_type  ENUM('open','close') NOT NULL,
        timestamp   DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB;
    """)
    # Mail weight readings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mail_weight (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT NOT NULL,
        device_id   VARCHAR(255),
        weight      DOUBLE NOT NULL,
        unit        VARCHAR(20),
        timestamp   DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB;
    """)
    # Camera snapshots (store S3 URLs)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS images (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT NOT NULL,
        device_id   VARCHAR(255),
        image_url   VARCHAR(2083),
        timestamp   DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB;
    """)
    # Notifications log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id                 INT AUTO_INCREMENT PRIMARY KEY,
        user_id            INT NOT NULL,
        device_id          VARCHAR(255),
        notification_type  VARCHAR(50),
        sent_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB;
    """)
    conn.commit()
    cursor.close()
    conn.close()

seed_db()

# 4) Helper to resolve Clerk email → internal user_id
def get_user_id_by_email(email: str) -> int:
    conn = get_mysql_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="DB connection unavailable")
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail=f"No user for email `{email}`")
    return row["id"]

# 5) CRUD for mailbox events
def add_mailbox_event_db(email: str, device_id: str, event_type: str, ts: datetime) -> Dict[str,int]:
    user_id = get_user_id_by_email(email)
    conn = get_mysql_connection(); cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO mailbox_events (user_id, device_id, event_type, timestamp) VALUES (%s,%s,%s,%s)",
        (user_id, device_id, event_type, ts)
    )
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close(); conn.close()
    return {"id": new_id}

def get_mailbox_events_db(email: str, device_id: str) -> List[Dict[str,Any]]:
    user_id = get_user_id_by_email(email)
    conn = get_mysql_connection(); cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM mailbox_events
         WHERE user_id=%s AND device_id=%s
         ORDER BY timestamp DESC
    """, (user_id, device_id))
    rows = cursor.fetchall()
    cursor.close(); conn.close()
    return rows

# 6) CRUD for mail weight readings
def add_mail_weight_db(email: str, device_id: str, weight: float, unit: str, ts: datetime) -> Dict[str,int]:
    user_id = get_user_id_by_email(email)
    conn = get_mysql_connection(); cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO mail_weight (user_id, device_id, weight, unit, timestamp) VALUES (%s,%s,%s,%s,%s)",
        (user_id, device_id, weight, unit, ts)
    )
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close(); conn.close()
    return {"id": new_id}

def get_mail_weight_db(email: str, device_id: str) -> List[Dict[str,Any]]:
    user_id = get_user_id_by_email(email)
    conn = get_mysql_connection(); cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM mail_weight
         WHERE user_id=%s AND device_id=%s
         ORDER BY timestamp DESC
    """, (user_id, device_id))
    rows = cursor.fetchall()
    cursor.close(); conn.close()
    return rows

# 7) CRUD for images (S3 URLs only)
def add_image_record_db(email: str, device_id: str, image_url: str, ts: datetime) -> Dict[str,int]:
    user_id = get_user_id_by_email(email)
    conn = get_mysql_connection(); cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO images (user_id, device_id, image_url, timestamp) VALUES (%s,%s,%s,%s)",
        (user_id, device_id, image_url, ts)
    )
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close(); conn.close()
    return {"id": new_id}

def get_images_db(email: str, device_id: str) -> List[Dict[str,Any]]:
    user_id = get_user_id_by_email(email)
    conn = get_mysql_connection(); cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM images
         WHERE user_id=%s AND device_id=%s
         ORDER BY timestamp DESC
    """, (user_id, device_id))
    rows = cursor.fetchall()
    cursor.close(); conn.close()
    return rows

# 8) CRUD for notifications
def add_notification_db(email: str, device_id: str, ntype: str) -> Dict[str,int]:
    user_id = get_user_id_by_email(email)
    conn = get_mysql_connection(); cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO notifications (user_id, device_id, notification_type) VALUES (%s,%s,%s)",
        (user_id, device_id, ntype)
    )
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close(); conn.close()
    return {"id": new_id}

def get_notifications_db(email: str) -> List[Dict[str,Any]]:
    user_id = get_user_id_by_email(email)
    conn = get_mysql_connection(); cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM notifications
         WHERE user_id=%s
         ORDER BY sent_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    cursor.close(); conn.close()
    return rows
