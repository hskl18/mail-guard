import os
from datetime import datetime
from typing import Any, Dict, List, Optional
import mysql.connector
from mysql.connector import pooling
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel
import boto3
from mangum import Mangum
import dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env if present; override empty placeholders handed in by Lambda env
dotenv.load_dotenv(override=True)

# Log environment variables (excluding sensitive ones)
logger.info(f"MYSQL_HOST: {os.getenv('MYSQL_HOST')}")
logger.info(f"MYSQL_PORT: {os.getenv('MYSQL_PORT')}")
logger.info(f"MYSQL_DATABASE: {os.getenv('MYSQL_DATABASE')}")
logger.info(f"MYSQL_SSL_CA defined: {os.getenv('MYSQL_SSL_CA') is not None}")
if os.getenv('MYSQL_SSL_CA'):
    logger.info(f"MYSQL_SSL_CA file exists: {os.path.exists(os.getenv('MYSQL_SSL_CA'))}")

DB = {
    "host": os.getenv("MYSQL_HOST"),
    "port": int(os.getenv("MYSQL_PORT") or 16956),
    "user": os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASSWORD"),
    "database": os.getenv("MYSQL_DATABASE"),
}

# Only add SSL config if certificate path is provided and exists
ssl_ca = os.getenv("MYSQL_SSL_CA")
if ssl_ca and os.path.exists(ssl_ca):
    DB["ssl_ca"] = ssl_ca
    DB["ssl_verify_cert"] = True
    logger.info(f"SSL certificate configured with {ssl_ca}")
else:
    logger.warning(f"SSL certificate not found at {ssl_ca}, connecting without SSL verification")

POOL: Optional[pooling.MySQLConnectionPool] = None

def init_pool():
    global POOL
    if POOL is None:
        try:
            logger.info("Attempting to connect to database...")
            
            # First check if the SSL certificate exists 
            ssl_ca = DB.get("ssl_ca")
            if ssl_ca:
                if os.path.exists(ssl_ca):
                    logger.info(f"SSL certificate found at {ssl_ca}")
                else:
                    logger.warning(f"SSL certificate not found at {ssl_ca}")
                    logger.info(f"Current working directory: {os.getcwd()}")
                    dir_path = os.path.dirname(ssl_ca) or '.'
                    if os.path.exists(dir_path):
                        logger.info(f"Files in directory {dir_path}: {os.listdir(dir_path)}")
            
            # Connect to server without specifying database first
            db_params = {k: v for k, v in DB.items() if k != "database"}
            try:
                logger.info(f"Connecting to MySQL server at {DB['host']}:{DB['port']}")
                with mysql.connector.connect(**db_params) as root:
                    logger.info("Successfully connected to database server")
                    try:
                        root.cursor().execute(f"CREATE DATABASE IF NOT EXISTS {DB['database']}")
                        logger.info(f"Ensured database {DB['database']} exists")
                    except mysql.connector.Error as e:
                        logger.error(f"Error creating database: {e}")
                        raise
            except mysql.connector.Error as e:
                logger.error(f"Failed to connect to MySQL server: {e}")
                raise
            
            # Now create connection pool with database specified
            try:
                logger.info("Creating connection pool...")
                POOL = pooling.MySQLConnectionPool(pool_name="mailbox_pool", pool_size=10, **DB)
                logger.info("Connection pool created successfully")
            except mysql.connector.Error as e:
                logger.error(f"Failed to create connection pool: {e}")
                raise
            
            ddl = {
                "devices": """
                  CREATE TABLE IF NOT EXISTS devices (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    clerk_id VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    location VARCHAR(255),
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    last_seen DATETIME,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_devices_clerk_id (clerk_id)
                  ) ENGINE=InnoDB;
                """,
                "devices_indices": """
                  CREATE INDEX idx_devices_clerk_id ON devices(clerk_id);
                """,
                "mailbox_events": """
                  CREATE TABLE IF NOT EXISTS mailbox_events (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    device_id INT NOT NULL,
                    event_type ENUM('open','close') NOT NULL,
                    occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
                  ) ENGINE=InnoDB;
                """,
                "events_indices": """
                  CREATE INDEX idx_events_device_id ON mailbox_events(device_id);
                  CREATE INDEX idx_events_event_type ON mailbox_events(event_type);
                """,
                "images": """
                  CREATE TABLE IF NOT EXISTS images (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    device_id INT NOT NULL,
                    image_url VARCHAR(2083) NOT NULL,
                    captured_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
                  ) ENGINE=InnoDB;
                """,
                "images_indices": """
                  CREATE INDEX idx_images_device_id ON images(device_id);
                """,
                "notifications": """
                  CREATE TABLE IF NOT EXISTS notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    device_id INT NOT NULL,
                    notification_type VARCHAR(50) NOT NULL,
                    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
                  ) ENGINE=InnoDB;
                """,
                "notifs_indices": """
                  CREATE INDEX idx_notifs_device_id ON notifications(device_id);
                  CREATE INDEX idx_notifs_type ON notifications(notification_type);
                """,
            }
            
            # First create all base tables
            with mysql.connector.connect(**DB) as conn:
                c = conn.cursor()
                
                # Create tables first - in order to avoid foreign key constraint issues
                for table_name in ["devices", "mailbox_events", "images", "notifications"]:
                    try:
                        logger.info(f"Creating table {table_name} if not exists")
                        c.execute(ddl[table_name])
                    except mysql.connector.Error as e:
                        # Ignore duplicate table errors
                        if e.errno != 1050:  # Table already exists
                            logger.error(f"Error creating table {table_name}: {e}")
                            raise
                        
                # Now create indices
                for index_name in ["devices_indices", "events_indices", "images_indices", "notifs_indices"]:
                    # Split the multi-statement DDL into individual CREATE INDEX statements
                    index_statements = [
                        stmt.strip() 
                        for stmt in ddl[index_name].split(';') 
                        if stmt.strip()
                    ]
                    
                    for stmt in index_statements:
                        try:
                            logger.info(f"Creating index: {stmt}")
                            c.execute(stmt)
                        except mysql.connector.Error as e:
                            # Ignore duplicate index errors (1061)
                            if e.errno != 1061:  # Index already exists 
                                logger.error(f"Error creating index {stmt}: {e}")
                                raise
                            else:
                                logger.info(f"Index already exists, continuing: {stmt}")
                
                conn.commit()
                logger.info("Base tables and indices created successfully")

            # Check for column existence rather than trying to add directly
            with mysql.connector.connect(**DB) as conn:
                c = conn.cursor()
                
                # Check if clerk_id column exists
                c.execute("""
                    SELECT COUNT(*) 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = %s 
                    AND TABLE_NAME = 'devices' 
                    AND COLUMN_NAME = 'clerk_id'
                """, (DB['database'],))
                
                if c.fetchone()[0] == 0:
                    logger.info("Adding clerk_id column to devices table")
                    c.execute("ALTER TABLE devices ADD COLUMN clerk_id VARCHAR(255) NOT NULL")
                
                # Check if email column exists
                c.execute("""
                    SELECT COUNT(*) 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = %s 
                    AND TABLE_NAME = 'devices' 
                    AND COLUMN_NAME = 'email'
                """, (DB['database'],))
                
                if c.fetchone()[0] == 0:
                    logger.info("Adding email column to devices table")
                    c.execute("ALTER TABLE devices ADD COLUMN email VARCHAR(255) NOT NULL")
                
                conn.commit()
                
        except mysql.connector.Error as e:
            logger.error(f"Database connection error: {e}")
            raise HTTPException(500, f"MySQL connection error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during database initialization: {e}")
            raise HTTPException(500, f"Unexpected error: {e}")
        else:
            logger.info("Database initialization completed successfully")

def _pool():
    try:
        if POOL is None:
            logger.error("Database pool not initialized")
            raise HTTPException(500, "Database connection pool not initialized")
        return POOL.get_connection()
    except mysql.connector.Error as e:
        logger.error(f"MySQL pool error: {e}")
        raise HTTPException(500, f"MySQL pool error: {e}")

def _insert(sql: str, params: tuple) -> Dict[str, int]:
    with _pool() as conn:
        try:
            cur = conn.cursor()
            cur.execute(sql, params)
            conn.commit()
            return {"id": cur.lastrowid}
        except mysql.connector.Error as e:
            logger.error(f"Insert error: {sql} - {e}")
            raise HTTPException(500, f"Database error: {e}")

def _select(sql: str, params: tuple) -> List[Dict[str, Any]]:
    with _pool() as conn:
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute(sql, params)
            return cur.fetchall()
        except mysql.connector.Error as e:
            logger.error(f"Select error: {sql} - {e}")
            raise HTTPException(500, f"Database error: {e}")

class DevicePayload(BaseModel):
    email: str
    clerk_id: str
    name: str
    location: Optional[str] = None
    is_active: Optional[bool] = True

class MailboxEventPayload(BaseModel):
    device_id: int
    event_type: str
    timestamp: Optional[datetime] = None

class NotificationPayload(BaseModel):
    device_id: int
    notification_type: str

class DeviceStatusPayload(BaseModel):
    clerk_id: str
    is_active: bool

class HeartbeatPayload(BaseModel):
    clerk_id: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_pool()
    try:
        yield
    finally:
        # mysql-connector pool objects don't have close(); just drop the reference
        global POOL
        POOL = None

app = FastAPI(title="Smart Mailbox Monitor API", version="1.0.0", lifespan=lifespan)

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def landing_page():
    return "<html><body><h1>Smart Mailbox Monitor API</h1><ul><li><a href='/docs'>Swagger UI</a></li><li><a href='/redoc'>ReDoc</a></li></ul></body></html>"

@app.post("/devices")
def create_device(p: DevicePayload):
    return _insert(
        "INSERT INTO devices(clerk_id,email,name,location,is_active) VALUES (%s,%s,%s,%s,%s)",
        (p.clerk_id, p.email, p.name, p.location, p.is_active),
    )

@app.get("/devices", response_model=List[Dict[str, Any]])
def list_devices(clerk_id: str):
    return _select(
        "SELECT * FROM devices WHERE clerk_id=%s ORDER BY created_at DESC",
        (clerk_id,),
    )

@app.get("/devices/{device_id}", response_model=Dict[str, Any])
def get_device(device_id: int, clerk_id: str):
    results = _select(
        "SELECT * FROM devices WHERE id=%s AND clerk_id=%s",
        (device_id, clerk_id),
    )
    if not results:
        raise HTTPException(status_code=404, detail="Device not found")
    return results[0]

@app.put("/devices/{device_id}", response_model=Dict[str, int])
def update_device(device_id: int, p: DevicePayload):
    return _insert(
        "UPDATE devices SET name=%s,location=%s,is_active=%s,last_seen=NOW() WHERE id=%s AND clerk_id=%s",
        (p.name, p.location, p.is_active, device_id, p.clerk_id),
    )

@app.delete("/devices/{device_id}", response_model=Dict[str, int])
def delete_device(device_id: int, clerk_id: str):
    with _pool() as conn:
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM devices WHERE id=%s AND clerk_id=%s", 
                       (device_id, clerk_id))
            conn.commit()
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Device not found")
            return {"id": device_id}
        except mysql.connector.Error as e:
            logger.error(f"Delete error: {e}")
            raise HTTPException(500, f"Database error: {e}")

@app.patch("/devices/{device_id}/status", response_model=Dict[str, int])
def update_device_status(device_id: int, p: DeviceStatusPayload):
    return _insert(
        "UPDATE devices SET is_active=%s,last_seen=NOW() WHERE id=%s AND clerk_id=%s",
        (p.is_active, device_id, p.clerk_id),
    )

@app.post("/devices/{device_id}/heartbeat", response_model=Dict[str, int])
def device_heartbeat(device_id: int, p: HeartbeatPayload):
    return _insert(
        "UPDATE devices SET last_seen=NOW() WHERE id=%s AND clerk_id=%s",
        (device_id, p.clerk_id),
    )

@app.post("/mailbox/events", response_model=Dict[str, int])
def create_event(p: MailboxEventPayload):
    ts = p.timestamp or datetime.utcnow()
    return _insert(
        "INSERT INTO mailbox_events(device_id,event_type,occurred_at) VALUES (%s,%s,%s)",
        (p.device_id, p.event_type, ts),
    )

@app.get("/mailbox/events", response_model=List[Dict[str, Any]])
def list_events(device_id: int):
    return _select(
        "SELECT * FROM mailbox_events WHERE device_id=%s ORDER BY occurred_at DESC",
        (device_id,),
    )

@app.delete("/mailbox/events/{event_id}", response_model=Dict[str, int])
def delete_event(event_id: int):
    with _pool() as conn:
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM mailbox_events WHERE id=%s", (event_id,))
            conn.commit()
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Event not found")
            return {"id": event_id}
        except mysql.connector.Error as e:
            logger.error(f"Delete error: {e}")
            raise HTTPException(500, f"Database error: {e}")

@app.post("/mailbox/images", response_model=Dict[str, int])
async def upload_image(device_id: int, file: UploadFile = File(...)):
    s3 = boto3.client("s3")
    bucket = os.getenv("S3_BUCKET")
    key = f"{device_id}/{int(datetime.utcnow().timestamp())}_{file.filename}"
    s3.upload_fileobj(file.file, bucket, key, ExtraArgs={"ContentType": file.content_type})
    url = f"https://{bucket}.s3.amazonaws.com/{key}"
    ts = datetime.utcnow()
    return _insert(
        "INSERT INTO images(device_id,image_url,captured_at) VALUES (%s,%s,%s)",
        (device_id, url, ts),
    )

@app.get("/mailbox/images", response_model=List[Dict[str, Any]])
def list_images(device_id: int):
    return _select(
        "SELECT * FROM images WHERE device_id=%s ORDER BY captured_at DESC",
        (device_id,),
    )

@app.delete("/mailbox/images/{image_id}", response_model=Dict[str, int])
def delete_image(image_id: int):
    # First get the image URL to delete from S3
    with _pool() as conn:
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("SELECT image_url FROM images WHERE id=%s", (image_id,))
            result = cur.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Image not found")
            
            # Parse the S3 URL to get bucket and key
            url = result["image_url"]
            parts = url.replace("https://", "").split(".")
            if len(parts) >= 3 and parts[1] == "s3":
                bucket = parts[0]
                key = "/".join(url.split("/")[3:])
                
                # Delete from S3
                try:
                    s3 = boto3.client("s3")
                    s3.delete_object(Bucket=bucket, Key=key)
                except Exception as e:
                    logger.warning(f"Failed to delete S3 object: {e}")
            
            # Delete from database
            cur.execute("DELETE FROM images WHERE id=%s", (image_id,))
            conn.commit()
            return {"id": image_id}
        except mysql.connector.Error as e:
            logger.error(f"Delete error: {e}")
            raise HTTPException(500, f"Database error: {e}")

@app.post("/mailbox/notifications", response_model=Dict[str, int])
def create_notification(p: NotificationPayload):
    rec = _insert(
        "INSERT INTO notifications(device_id,notification_type) VALUES (%s,%s)",
        (p.device_id, p.notification_type),
    )

    # 1) fetch the user's email from devices
    rows = _select(
        "SELECT email FROM devices WHERE id = %s",
        (p.device_id,),
    )
    to_addresses = [r["email"] for r in rows if r.get("email")]

    if to_addresses:
        ses = boto3.client("ses", region_name=os.getenv("AWS_REGION"))
        subject = f"📬 Mailbox: {p.notification_type}"
        body = f"Your mailbox {p.device_id} just had an event: {p.notification_type} at {datetime.utcnow().isoformat()}"

        ses.send_email(
            Source=os.getenv("SES_SOURCE_EMAIL"),
            Destination={"ToAddresses": to_addresses},
            Message={
                "Subject": {"Data": subject},
                "Body": {"Text": {"Data": body}}
            }
        )

    return rec

@app.get("/mailbox/notifications", response_model=List[Dict[str, Any]])
def list_notifications(device_id: int):
    return _select(
        "SELECT * FROM notifications WHERE device_id=%s ORDER BY sent_at DESC",
        (device_id,),
    )

@app.delete("/mailbox/notifications/{notification_id}", response_model=Dict[str, int])
def delete_notification(notification_id: int):
    with _pool() as conn:
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM notifications WHERE id=%s", (notification_id,))
            conn.commit()
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Notification not found")
            return {"id": notification_id}
        except mysql.connector.Error as e:
            logger.error(f"Delete error: {e}")
            raise HTTPException(500, f"Database error: {e}")

handler = Mangum(app)