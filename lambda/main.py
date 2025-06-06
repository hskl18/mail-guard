import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import mysql.connector
from mysql.connector import pooling
from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
import boto3
from mangum import Mangum
import dotenv
import logging
import json
from mailersend import emails

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

# Global clients to reuse across invocations
s3_client = None
sns_client = None

# Simple in-memory cache for dashboard data
dashboard_cache = {}
settings_cache = {}  # Cache for device settings
CACHE_TTL_SECONDS = 30  # Cache expiry in seconds - keep this relatively short to ensure data freshness

def init_pool():
    global POOL
    if POOL is None:
        try:
            logger.info("Attempting to connect to database...")
            
            # Skip heavy schema validation for Lambda cold starts
            should_init_schema = os.getenv("INIT_SCHEMA", "true").lower() == "true"
            
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
            # Skip this for Lambda if we're not initializing schema
            try:
                if should_init_schema:
                    db_params = {k: v for k, v in DB.items() if k != "database"}
                    logger.info(f"Connecting to MySQL server at {DB['host']}:{DB['port']}")
                    with mysql.connector.connect(**db_params) as root:
                        logger.info("Successfully connected to database server")
                        try:
                            root.cursor().execute(f"CREATE DATABASE IF NOT EXISTS {DB['database']}")
                            logger.info(f"Ensured database {DB['database']} exists")
                        except mysql.connector.Error as e:
                            logger.error(f"Error creating database: {e}")
                            raise
                else:
                    logger.info("Skipping schema initialization for faster Lambda startup")
            except mysql.connector.Error as e:
                logger.error(f"Failed to connect to MySQL server: {e}")
                raise
            
            # Now create connection pool with database specified
            try:
                logger.info("Creating connection pool...")
                POOL = pooling.MySQLConnectionPool(
                    pool_name="mailbox_pool", 
                    pool_size=5,  # Reduced pool size for Lambda (which has limited connections)
                    pool_reset_session=True,  # Reset session for each connection to avoid stale connections
                    **DB
                )
                logger.info("Connection pool created successfully")
            except mysql.connector.Error as e:
                logger.error(f"Failed to create connection pool: {e}")
                raise
            
            # Skip table creation for Lambda cold starts unless explicitly requested
            if not should_init_schema:
                logger.info("Skipping table creation for faster Lambda startup")
                return
            
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
                    mail_delivered_notify BOOLEAN DEFAULT TRUE,
                    mailbox_opened_notify BOOLEAN DEFAULT TRUE,
                    mail_removed_notify BOOLEAN DEFAULT TRUE,
                    battery_low_notify BOOLEAN DEFAULT TRUE,
                    push_notifications BOOLEAN DEFAULT TRUE,
                    email_notifications BOOLEAN DEFAULT FALSE,
                    check_interval INT DEFAULT 15,
                    battery_threshold INT DEFAULT 20,
                    capture_image_on_open BOOLEAN DEFAULT TRUE,
                    capture_image_on_delivery BOOLEAN DEFAULT TRUE,
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
    mail_delivered_notify: Optional[bool] = True
    mailbox_opened_notify: Optional[bool] = True
    mail_removed_notify: Optional[bool] = True
    battery_low_notify: Optional[bool] = True
    push_notifications: Optional[bool] = True
    email_notifications: Optional[bool] = False
    check_interval: Optional[int] = 15
    battery_threshold: Optional[int] = 20
    capture_image_on_open: Optional[bool] = True
    capture_image_on_delivery: Optional[bool] = True

class DeviceBatchPayload(BaseModel):
    devices: List[DevicePayload]

class MailboxEventPayload(BaseModel):
    device_id: int
    event_type: str
    timestamp: Optional[datetime] = None

class DeviceStatusResponse(BaseModel):
    id: int
    is_active: bool
    last_seen: Optional[datetime] = None
    battery_level: Optional[int] = None

class DeviceHealthPayload(BaseModel):
    clerk_id: str
    battery_level: Optional[int] = None
    signal_strength: Optional[int] = None
    temperature: Optional[float] = None
    firmware_version: Optional[str] = None

class NotificationPayload(BaseModel):
    device_id: int
    notification_type: str

class NotificationPreferences(BaseModel):
    device_id: int
    email_notifications: bool = True
    push_notifications: bool = False
    notification_types: List[str] = ["open", "close"]

class DeviceStatusPayload(BaseModel):
    clerk_id: str
    is_active: bool

class HeartbeatPayload(BaseModel):
    clerk_id: str

class DeviceSettingsPayload(BaseModel):
    clerk_id: str
    mail_delivered_notify: Optional[bool] = None
    mailbox_opened_notify: Optional[bool] = None
    mail_removed_notify: Optional[bool] = None
    battery_low_notify: Optional[bool] = None
    push_notifications: Optional[bool] = None
    email_notifications: Optional[bool] = None
    check_interval: Optional[int] = None
    battery_threshold: Optional[int] = None
    capture_image_on_open: Optional[bool] = None
    capture_image_on_delivery: Optional[bool] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize boto3 clients for reuse across requests
    global s3_client, sns_client
    if s3_client is None:
        s3_client = boto3.client("s3")
    if sns_client is None:
        sns_client = boto3.client("sns")
        
    init_pool()
    try:
        yield
    finally:
        # mysql-connector pool objects don't have close(); just drop the reference
        global POOL
        POOL = None

app = FastAPI(title="Smart Mailbox Monitor API", version="1.0.0", lifespan=lifespan)

# Add CORS middleware to allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def landing_page():
    return "<html><body><h1>Smart Mailbox Monitor API</h1><ul><li><a href='/docs'>Swagger UI</a></li><li><a href='/redoc'>ReDoc</a></li></ul></body></html>"

@app.post("/devices")
def create_device(p: DevicePayload):
    result = _insert(
        """
        INSERT INTO devices(
            clerk_id,
            email,
            name,
            location,
            is_active,
            mail_delivered_notify,
            mailbox_opened_notify,
            mail_removed_notify,
            battery_low_notify,
            push_notifications,
            email_notifications,
            check_interval,
            battery_threshold,
            capture_image_on_open,
            capture_image_on_delivery
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            p.clerk_id, 
            p.email, 
            p.name, 
            p.location, 
            p.is_active,
            p.mail_delivered_notify,
            p.mailbox_opened_notify,
            p.mail_removed_notify,
            p.battery_low_notify,
            p.push_notifications,
            p.email_notifications,
            p.check_interval,
            p.battery_threshold,
            p.capture_image_on_open,
            p.capture_image_on_delivery
        ),
    )
    
    # Invalidate dashboard cache for this user to reflect the new device
    invalidate_caches(clerk_id=p.clerk_id)
    
    return result

@app.get("/devices", response_model=List[Dict[str, Any]])
def list_devices(name: str):
    return _select(
        "SELECT * FROM devices WHERE name=%s ORDER BY created_at DESC",
        (name,),
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
    result = _insert(
        """
        UPDATE devices SET 
            name=%s,
            location=%s,
            is_active=%s,
            mail_delivered_notify=%s,
            mailbox_opened_notify=%s,
            mail_removed_notify=%s,
            battery_low_notify=%s,
            push_notifications=%s,
            email_notifications=%s,
            check_interval=%s,
            battery_threshold=%s,
            capture_image_on_open=%s,
            capture_image_on_delivery=%s,
            last_seen=NOW() 
        WHERE id=%s AND clerk_id=%s
        """,
        (
            p.name, 
            p.location, 
            p.is_active, 
            p.mail_delivered_notify,
            p.mailbox_opened_notify,
            p.mail_removed_notify,
            p.battery_low_notify,
            p.push_notifications,
            p.email_notifications,
            p.check_interval,
            p.battery_threshold,
            p.capture_image_on_open,
            p.capture_image_on_delivery,
            device_id, 
            p.clerk_id
        ),
    )
    
    # Invalidate relevant caches to ensure data consistency
    invalidate_caches(device_id=device_id, clerk_id=p.clerk_id)
    
    return result

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
    """Update just the status of a device"""
    return _insert(
        "UPDATE devices SET is_active=%s WHERE id=%s AND clerk_id=%s",
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
    try:
        # Use global client or create a new one with explicit region
        global s3_client
        if s3_client is None:
            # Get AWS region from environment or use default
            aws_region = os.getenv("AWS_REGION", "us-west-1")
            logger.info(f"Initializing S3 client with region: {aws_region}")
            s3_client = boto3.client("s3", region_name=aws_region)
        
        # Get bucket name and log for debugging
        bucket = os.getenv("S3_BUCKET")
        if not bucket:
            logger.error("S3_BUCKET environment variable not set")
            raise HTTPException(status_code=500, detail="S3 bucket not configured")
            
        logger.info(f"Using S3 bucket: {bucket}")
        
        # Generate unique key for the file
        timestamp = int(datetime.utcnow().timestamp())
        safe_filename = ''.join(c for c in file.filename if c.isalnum() or c in '._-')
        key = f"{device_id}/{timestamp}_{safe_filename}"
        logger.info(f"Uploading file to S3 with key: {key}")
        
        # Read file content into memory for better error handling
        file_content = await file.read()
        if not file_content:
            logger.error("Empty file content")
            raise HTTPException(status_code=400, detail="Empty file")
            
        # Upload to S3 with proper content type
        from io import BytesIO
        content_type = file.content_type or "application/octet-stream"
        logger.info(f"Uploading file with content type: {content_type}")
        s3_client.upload_fileobj(
            BytesIO(file_content), 
            bucket, 
            key, 
            ExtraArgs={"ContentType": content_type}
        )
        
        # Construct URL and save to database
        url = f"https://{bucket}.s3.amazonaws.com/{key}"
        logger.info(f"File uploaded successfully, URL: {url}")
        ts = datetime.utcnow()
        
        # Insert into database
        try:
            result = _insert(
                "INSERT INTO images(device_id,image_url,captured_at) VALUES (%s,%s,%s)",
                (device_id, url, ts),
            )
            logger.info(f"Image record created with ID: {result.get('id')}")
            return result
        except Exception as db_error:
            logger.error(f"Database error after successful upload: {db_error}")
            # The file is already uploaded, so we should return something useful
            return {"id": 0, "image_url": url, "error": "Database error, but file uploaded"}
            
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

@app.get("/mailbox/images", response_class=StreamingResponse)
async def list_images(device_id: int):
    """Return the latest image for a device as raw binary"""
    try:
        global s3_client
        if s3_client is None:
            aws_region = os.getenv("AWS_REGION", "us-west-1")
            logger.info(f"Initializing S3 client with region: {aws_region}")
            s3_client = boto3.client("s3", region_name=aws_region)
        bucket_name = os.getenv("S3_BUCKET")
        if not bucket_name:
            logger.error("S3_BUCKET environment variable not set")
            raise HTTPException(status_code=500, detail="S3 bucket not configured")

        prefix = f"{device_id}/"
        listing = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        contents = listing.get("Contents", [])
        if not contents:
            raise HTTPException(status_code=404, detail="No images found for this device")

        # Sort by LastModified descending and pick the most recent
        contents.sort(key=lambda obj: obj.get("LastModified"), reverse=True)
        key = contents[0]["Key"]
        logger.info(f"Streaming image from S3 key: {key}")
        s3_obj = s3_client.get_object(Bucket=bucket_name, Key=key)
        stream = s3_obj["Body"]
        content_type = s3_obj.get("ContentType", "application/octet-stream")
        return StreamingResponse(stream, media_type=content_type)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming image for device {device_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error streaming image: {e}")

@app.get("/mailbox/images/latest", response_class=StreamingResponse)
async def get_latest_image(device_id: int):
    """Stream the latest image for a device as raw binary"""
    return await list_images(device_id)

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
                    global s3_client
                    if s3_client is None:
                        s3_client = boto3.client("s3")
                    s3_client.delete_object(Bucket=bucket, Key=key)
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
    # Insert notification record
    rec = _insert(
        "INSERT INTO notifications(device_id,notification_type) VALUES (%s,%s)",
        (p.device_id, p.notification_type),
    )
    # Publish notification event to SNS for async processing
    global sns_client
    if sns_client is None:
        sns_client = boto3.client("sns")  # Only create if it doesn't exist
    topic_arn = os.getenv("NOTIFICATION_TOPIC_ARN")
    message = json.dumps({
        "notification_id": rec["id"],
        "device_id": p.device_id,
        "notification_type": p.notification_type,
    })
    sns_client.publish(TopicArn=topic_arn, Message=message)
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

@app.post("/devices/{device_id}/health", response_model=Dict[str, str])
def update_device_health(device_id: int, p: DeviceHealthPayload):
    """Endpoint for IoT devices to report their health metrics"""
    # First check if this device exists and belongs to the clerk
    results = _select(
        "SELECT id FROM devices WHERE id=%s AND clerk_id=%s",
        (device_id, p.clerk_id),
    )
    if not results:
        raise HTTPException(status_code=404, detail="Device not found")
        
    # For now just store basic info, but in future could store health metrics in a separate table
    _insert(
        "UPDATE devices SET last_seen=NOW() WHERE id=%s",
        (device_id,),
    )
    
    return {"status": "updated"}

@app.post("/devices/{device_id}/notification-preferences", response_model=Dict[str, str])
def set_notification_preferences(device_id: int, p: NotificationPreferences):
    """Set notification preferences for a device"""
    # This would require a new table in the database, for now just return success
    # In a real implementation, you would store these preferences
    return {"status": "updated"}

@app.get("/devices/{device_id}/summary", response_model=Dict[str, Any])
def get_device_summary(device_id: int, clerk_id: str):
    """Get a comprehensive summary of device status, events, and notifications for frontend dashboards"""
    # First check if this device exists and belongs to the clerk
    device = _select(
        "SELECT * FROM devices WHERE id=%s AND clerk_id=%s",
        (device_id, clerk_id),
    )
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Get latest event
    latest_event = _select(
        "SELECT * FROM mailbox_events WHERE device_id=%s ORDER BY occurred_at DESC LIMIT 1",
        (device_id,),
    )
    
    # Get latest image
    latest_image = _select(
        "SELECT * FROM images WHERE device_id=%s ORDER BY captured_at DESC LIMIT 1",
        (device_id,),
    )
    
    # Get notification count
    notification_count = _select(
        "SELECT COUNT(*) as count FROM notifications WHERE device_id=%s",
        (device_id,),
    )
    
    # Combine all data
    return {
        "device": device[0] if device else None,
        "latest_event": latest_event[0] if latest_event else None,
        "latest_image": latest_image[0] if latest_image else None,
        "notification_count": notification_count[0]["count"] if notification_count else 0,
    }

@app.post("/iot/report", response_model=Dict[str, str])
def iot_report_status(request: Request):
    """
    Simplified endpoint for IoT devices to report status with minimal payload.
    This reduces battery usage and bandwidth for IoT devices.
    """
    try:
        body = request.query_params
        device_id = body.get("d")
        event = body.get("e")
        
        if not device_id or not event:
            raise HTTPException(status_code=400, detail="Missing required parameters")
            
        # Convert abbreviated parameters to proper format
        device_id = int(device_id)
        event_type = "open" if event == "o" else "close" if event == "c" else event
        
        # Insert event
        _insert(
            "INSERT INTO mailbox_events(device_id,event_type,occurred_at) VALUES (%s,%s,NOW())",
            (device_id, event_type),
        )
        
        # Update device last_seen
        _insert(
            "UPDATE devices SET last_seen=NOW() WHERE id=%s",
            (device_id,),
        )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error in IoT report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/dashboard/{clerk_id}", response_model=Dict[str, Any])
def get_user_dashboard(clerk_id: str, response: Response):
    """
    Comprehensive dashboard endpoint that combines multiple data sources
    into a single API call for frontend efficiency.
    Uses caching to improve performance for repeated requests.
    """
    # Check if we have a valid cached response
    cache_key = f"dashboard_{clerk_id}"
    cached_data = dashboard_cache.get(cache_key)
    
    if cached_data:
        # Check if the cache is still valid
        if datetime.utcnow() < cached_data['expires_at']:
            logger.info(f"Cache hit for dashboard {clerk_id}")
            # Add cache-related headers
            response.headers["X-Cache"] = "HIT"
            response.headers["X-Cache-Expires"] = cached_data['expires_at'].isoformat()
            return cached_data['data']
        else:
            # Cache expired
            logger.info(f"Cache expired for dashboard {clerk_id}")
            dashboard_cache.pop(cache_key, None)
    
    # Cache miss or expired, generate fresh data
    response.headers["X-Cache"] = "MISS"
    
    # Get all user devices
    devices = _select(
        "SELECT * FROM devices WHERE clerk_id=%s ORDER BY last_seen DESC",
        (clerk_id,),
    )
    
    if not devices:
        result = {
            "devices": [],
            "recent_events": [],
            "recent_images": [],
            "notification_count": 0
        }
        # Cache the empty result too
        dashboard_cache[cache_key] = {
            'data': result,
            'expires_at': datetime.utcnow() + timedelta(seconds=CACHE_TTL_SECONDS)
        }
        return result
    
    # Get device IDs
    device_ids = [d["id"] for d in devices]
    device_ids_str = ','.join(['%s'] * len(device_ids))
    
    # Get recent events (last 5 per device)
    recent_events_query = f"""
        SELECT e.* FROM (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY occurred_at DESC) as rn
            FROM mailbox_events
            WHERE device_id IN ({device_ids_str})
        ) e WHERE e.rn <= 5
        ORDER BY occurred_at DESC
    """
    recent_events = _select(recent_events_query, tuple(device_ids))
    
    # Get recent images (last image per device)
    recent_images_query = f"""
        SELECT i.* FROM (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY captured_at DESC) as rn
            FROM images
            WHERE device_id IN ({device_ids_str})
        ) i WHERE i.rn = 1
    """
    recent_images = _select(recent_images_query, tuple(device_ids))
    
    # Get notification counts
    notification_count = _select(
        f"SELECT COUNT(*) as count FROM notifications WHERE device_id IN ({device_ids_str})",
        tuple(device_ids),
    )
    
    result = {
        "devices": devices,
        "recent_events": recent_events,
        "recent_images": recent_images,
        "notification_count": notification_count[0]["count"] if notification_count else 0
    }
    
    # Store in cache with expiration time
    expiry_time = datetime.utcnow() + timedelta(seconds=CACHE_TTL_SECONDS)
    dashboard_cache[cache_key] = {
        'data': result,
        'expires_at': expiry_time
    }
    
    # Add expiry info to response headers
    response.headers["X-Cache-Expires"] = expiry_time.isoformat()
    
    logger.info(f"Generated fresh dashboard data for {clerk_id}")
    return result

@app.get("/devices/{device_id}/settings", response_model=Dict[str, Any])
def get_device_settings(device_id: int, clerk_id: str, response: Response):
    """Get notification and device settings for a specific device"""
    # Check if we have a valid cached response
    cache_key = f"settings_{device_id}_{clerk_id}"
    cached_data = settings_cache.get(cache_key)
    
    if cached_data:
        # Check if the cache is still valid
        if datetime.utcnow() < cached_data['expires_at']:
            logger.info(f"Cache hit for device settings {device_id}")
            # Add cache-related headers
            response.headers["X-Cache"] = "HIT"
            response.headers["X-Cache-Expires"] = cached_data['expires_at'].isoformat()
            return cached_data['data']
        else:
            # Cache expired
            logger.info(f"Cache expired for device settings {device_id}")
            settings_cache.pop(cache_key, None)
    
    # Cache miss or expired, generate fresh data
    response.headers["X-Cache"] = "MISS"
    
    results = _select(
        """
        SELECT 
            mail_delivered_notify,
            mailbox_opened_notify,
            mail_removed_notify,
            battery_low_notify,
            push_notifications,
            email_notifications,
            check_interval,
            battery_threshold,
            capture_image_on_open,
            capture_image_on_delivery
        FROM devices 
        WHERE id=%s AND clerk_id=%s
        """,
        (device_id, clerk_id),
    )
    if not results:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Store in cache with expiration time
    expiry_time = datetime.utcnow() + timedelta(seconds=CACHE_TTL_SECONDS)
    settings_cache[cache_key] = {
        'data': results[0],
        'expires_at': expiry_time
    }
    
    # Add expiry info to response headers
    response.headers["X-Cache-Expires"] = expiry_time.isoformat()
    logger.info(f"Generated fresh settings data for device {device_id}")
    
    return results[0]

@app.put("/devices/{device_id}/settings", response_model=Dict[str, str])
def update_device_settings(device_id: int, p: DeviceSettingsPayload):
    """Update device settings without changing other device properties"""
    # Build the update query dynamically based on what was provided
    set_parts = []
    params = []
    
    if p.mail_delivered_notify is not None:
        set_parts.append("mail_delivered_notify=%s")
        params.append(p.mail_delivered_notify)
        
    if p.mailbox_opened_notify is not None:
        set_parts.append("mailbox_opened_notify=%s")
        params.append(p.mailbox_opened_notify)
        
    if p.mail_removed_notify is not None:
        set_parts.append("mail_removed_notify=%s")
        params.append(p.mail_removed_notify)
        
    if p.battery_low_notify is not None:
        set_parts.append("battery_low_notify=%s")
        params.append(p.battery_low_notify)
        
    if p.push_notifications is not None:
        set_parts.append("push_notifications=%s")
        params.append(p.push_notifications)
        
    if p.email_notifications is not None:
        set_parts.append("email_notifications=%s")
        params.append(p.email_notifications)
        
    if p.check_interval is not None:
        set_parts.append("check_interval=%s")
        params.append(p.check_interval)
        
    if p.battery_threshold is not None:
        set_parts.append("battery_threshold=%s")
        params.append(p.battery_threshold)
        
    if p.capture_image_on_open is not None:
        set_parts.append("capture_image_on_open=%s")
        params.append(p.capture_image_on_open)
        
    if p.capture_image_on_delivery is not None:
        set_parts.append("capture_image_on_delivery=%s")
        params.append(p.capture_image_on_delivery)
    
    # If nothing to update, return early
    if not set_parts:
        return {"status": "no changes"}
    
    # Add the WHERE clause parameters
    params.extend([device_id, p.clerk_id])
    
    # Build and execute the query
    query = f"UPDATE devices SET {', '.join(set_parts)} WHERE id=%s AND clerk_id=%s"
    _insert(query, tuple(params))
    
    # Invalidate relevant caches to ensure data consistency
    invalidate_caches(device_id=device_id, clerk_id=p.clerk_id)
    
    return {"status": "updated"}

@app.get("/device/lookup", response_model=Dict[str, Any])
def lookup_device_by_serial(serial_id: str):
    """Lookup device by Series ID and return device_id and clerk_id"""
    try:
        # Search for the device with this serial ID in the devices table
        # Assuming serial_id is stored in the 'name' field for now
        # You might want to add a dedicated serial_id column to the devices table
        results = _select(
            "SELECT id, clerk_id FROM devices WHERE name LIKE %s",
            (f"%{serial_id}%",),
        )
        
        if not results:
            raise HTTPException(status_code=404, detail="Device not found")
        
        # Return the first matching device
        return {
            "device_id": results[0]["id"],
            "clerk_id": results[0]["clerk_id"]
        }
    except Exception as e:
        logger.error(f"Error looking up device by serial ID: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

handler = Mangum(app)

def process_notification(event, context):
    # Process SNS notification events and send emails
    # Initialize boto3 clients if needed
    global s3_client
    if s3_client is None:
        s3_client = boto3.client("s3")
        
    # Initialize the database pool if needed
    if POOL is None:
        init_pool()
        
    for record in event.get("Records", []):
        try:
            payload = json.loads(record["Sns"]["Message"])
            device_id = payload.get("device_id")
            notification_type = payload.get("notification_type")
            
            # Fetch user's email from devices table
            rows = _select(
                "SELECT email FROM devices WHERE id = %s",
                (device_id,),
            )
            to_addresses = [r["email"] for r in rows if r.get("email")]
            
            if to_addresses:
                # Get the MailerSend credentials
                api_key = os.getenv("mail_api")
                from_email = os.getenv("mail_username")
                from_name = os.getenv("mail_from_name", "Mail Guard")
                
                # Log API key information (partial, for debugging)
                logger.info(f"Using MailerSend API key: {api_key[:5]}...{api_key[-4:]}")
                
                # Initialize the mailer client
                try:
                    mailer = emails.NewEmail(api_key)
                    mail_body = {}
                    
                    # Set sender
                    mailer.set_mail_from({
                        "email": from_email,
                        "name": from_name
                    }, mail_body)
                    
                    # Set recipients
                    recipients = [{"email": addr} for addr in to_addresses]
                    mailer.set_mail_to(recipients, mail_body)
                    
                    # Set subject and content with better formatting
                    timestamp = datetime.utcnow()
                    formatted_time = timestamp.strftime("%Y-%m-%d %H:%M:%S")
                    subject = f"📬 Mailbox Alert: {notification_type}"
                    
                    # Create HTML content with better formatting
                    html_content = f"""
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2 style="color: #3366cc;">Mailbox Notification</h2>
                        <p>Your mailbox (ID: {device_id}) has detected an event:</p>
                        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #3366cc; margin: 10px 0;">
                            <strong>Event Type:</strong> {notification_type}<br/>
                            <strong>Time:</strong> {formatted_time}<br/>
                        </div>
                        <p>Check your Mail Guard app for more details.</p>
                    </body>
                    </html>
                    """
                    
                    # Plain text version
                    text_content = f"""
                    Mailbox Notification
                    
                    Your mailbox (ID: {device_id}) has detected an event:
                    Event Type: {notification_type}
                    Time: {formatted_time}
                    
                    Check your Mail Guard app for more details.
                    """
                    
                    mailer.set_subject(subject, mail_body)
                    mailer.set_html_content(html_content, mail_body)
                    mailer.set_plaintext_content(text_content, mail_body)
                    
                    # Send the email
                    response = mailer.send(mail_body)
                    logger.info(f"Email sent to {len(to_addresses)} recipients for device {device_id}. Response: {response}")
                except Exception as email_error:
                    logger.error(f"Error sending email: {email_error}")
                    # Continue to next record
                    continue
        except Exception as e:
            logger.error(f"Error processing notification: {e}")
            # Continue processing other records even if one fails
            continue

def invalidate_caches(device_id=None, clerk_id=None):
    """Helper function to invalidate related caches when data changes"""
    invalidated = []
    
    if device_id and clerk_id:
        # Invalidate device-specific settings
        settings_cache_key = f"settings_{device_id}_{clerk_id}"
        if settings_cache.get(settings_cache_key):
            logger.info(f"Invalidating settings cache for device {device_id}")
            settings_cache.pop(settings_cache_key, None)
            invalidated.append(settings_cache_key)
    
    if clerk_id:
        # Invalidate user dashboard data
        dashboard_cache_key = f"dashboard_{clerk_id}"
        if dashboard_cache.get(dashboard_cache_key):
            logger.info(f"Invalidating dashboard cache for user {clerk_id}")
            dashboard_cache.pop(dashboard_cache_key, None)
            invalidated.append(dashboard_cache_key)
    
    return invalidated