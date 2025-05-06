import os
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.database import (
    seed_db,
    add_mailbox_event_db,
    get_mailbox_events_db,
    add_mail_weight_db,
    get_mail_weight_db,
    add_image_record_db,
    get_images_db,
    add_notification_db,
    get_notifications_db,
)

# --- Pydantic models for request bodies ---
class MailboxEventPayload(BaseModel):
    email: str
    device_id: str
    event_type: str  # "open" or "close"
    timestamp: Optional[datetime] = None

class MailWeightPayload(BaseModel):
    email: str
    device_id: str
    weight: float
    unit: str
    timestamp: Optional[datetime] = None

class ImageRecordPayload(BaseModel):
    email: str
    device_id: str
    image_url: str     # full S3 URL
    timestamp: Optional[datetime] = None

class NotificationPayload(BaseModel):
    email: str
    device_id: str
    notification_type: str

# --- App setup ---
app = FastAPI(title="Smart Mailbox Monitor API")

@app.on_event("startup")
def on_startup():
    # ensure all tables exist
    seed_db()

# --- Endpoints ---
@app.post("/mailbox/events", response_model=Dict[str,int])
def create_mailbox_event(payload: MailboxEventPayload):
    ts = payload.timestamp or datetime.utcnow()
    return add_mailbox_event_db(payload.email, payload.device_id, payload.event_type, ts)

@app.get("/mailbox/events", response_model=List[Dict[str,Any]])
def read_mailbox_events(email: str, device_id: str):
    return get_mailbox_events_db(email, device_id)

@app.post("/mailbox/weight", response_model=Dict[str,int])
def create_mail_weight(payload: MailWeightPayload):
    ts = payload.timestamp or datetime.utcnow()
    return add_mail_weight_db(payload.email, payload.device_id, payload.weight, payload.unit, ts)

@app.get("/mailbox/weight", response_model=List[Dict[str,Any]])
def read_mail_weight(email: str, device_id: str):
    return get_mail_weight_db(email, device_id)

@app.post("/mailbox/images", response_model=Dict[str,int])
def create_image_record(payload: ImageRecordPayload):
    ts = payload.timestamp or datetime.utcnow()
    return add_image_record_db(payload.email, payload.device_id, payload.image_url, ts)

@app.get("/mailbox/images", response_model=List[Dict[str,Any]])
def read_images(email: str, device_id: str):
    return get_images_db(email, device_id)

@app.post("/mailbox/notifications", response_model=Dict[str,int])
def create_notification(payload: NotificationPayload):
    return add_notification_db(payload.email, payload.device_id, payload.notification_type)

@app.get("/mailbox/notifications", response_model=List[Dict[str,Any]])
def read_notifications(email: str):
    return get_notifications_db(email)
