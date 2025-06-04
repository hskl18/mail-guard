#!/usr/bin/env python3
"""
test_api.py

CLI tests for Smart Mailbox Monitor Lambda API.
"""
import requests
import os
import sys
from rich.console import Console
from rich import print

console = Console()
BASE = "https://pp7vqzu57gptbbb3m5m3untjgm0iyylm.lambda-url.us-west-1.on.aws"

# Global holders for created resource IDs
device_id = None
event_id = None
image_id = None
notification_id = None


def ok(msg):
    console.print(f"[green]PASS[/green] {msg}")

def fail(msg):
    console.print(f"[red]FAIL[/red] {msg}")

def run_test(name, func):
    console.rule(f"Test: {name}")
    try:
        func()
    except Exception as e:
        fail(f"{name} → Exception: {e}")


def test_root():
    resp = requests.get(f"{BASE}/")
    if resp.status_code == 200 and "Swagger UI" in resp.text:
        ok("GET /")
    else:
        fail(f"GET / returned {resp.status_code}")


def test_create_device():
    global device_id
    payload = {
        "clerk_id": "test_user",
        "email": "18hskl@gmail.com",
        "name": "Test Device",
        "location": "Test Lab",
        "is_active": True,
        "mail_delivered_notify": True,
        "mailbox_opened_notify": True,
        "mail_removed_notify": True,
        "battery_low_notify": True,
        "push_notifications": True,
        "email_notifications": False,
        "check_interval": 15,
        "battery_threshold": 20,
        "capture_image_on_open": True,
        "capture_image_on_delivery": True
    }
    resp = requests.post(f"{BASE}/devices", json=payload)
    if resp.status_code == 200 and resp.json().get("id"):
        device_id = resp.json()["id"]
        ok(f"POST /devices → id={device_id}")
    else:
        fail(f"POST /devices returned {resp.status_code}: {resp.text}")


def test_list_devices():
    resp = requests.get(f"{BASE}/devices", params={"clerk_id": "test_user"})
    if resp.status_code == 200 and isinstance(resp.json(), list):
        ok("GET /devices")
    else:
        fail(f"GET /devices returned {resp.status_code}")


def test_create_event():
    global event_id
    if not device_id:
        fail("Skipping event test: no device_id")
        return
    payload = {"device_id": device_id, "event_type": "open"}
    resp = requests.post(f"{BASE}/mailbox/events", json=payload)
    if resp.status_code == 200 and resp.json().get("id"):
        event_id = resp.json()["id"]
        ok(f"POST /mailbox/events → id={event_id}")
    else:
        fail(f"POST /mailbox/events returned {resp.status_code}")


def test_list_events():
    if not device_id:
        fail("Skipping list events: no device_id")
        return
    resp = requests.get(f"{BASE}/mailbox/events", params={"device_id": device_id})
    if resp.status_code == 200 and isinstance(resp.json(), list):
        ok("GET /mailbox/events")
    else:
        fail(f"GET /mailbox/events returned {resp.status_code}")


def test_upload_image():
    global image_id
    if not device_id:
        fail("Skipping image upload: no device_id")
        return
    img_path = "../assets/iamges/db.png"
    if not os.path.exists(img_path):
        fail(f"Image file not found: {img_path}")
        return
    with open(img_path, "rb") as f:
        files = {"file": (os.path.basename(img_path), f, "image/png")}
        resp = requests.post(f"{BASE}/mailbox/images", files=files, params={"device_id": device_id})
    if resp.status_code == 200 and resp.json().get("id"):
        image_id = resp.json()["id"]
        ok(f"POST /mailbox/images → id={image_id}")
    else:
        fail(f"POST /mailbox/images returned {resp.status_code}")


def test_list_images():
    if not device_id:
        fail("Skipping list images: no device_id")
        return
    resp = requests.get(f"{BASE}/mailbox/images", params={"device_id": device_id})
    if resp.status_code == 200:
        content_type = resp.headers.get("content-type", "")
        # Expect binary image data
        if content_type.startswith("image/") and resp.content:
            ok("GET /mailbox/images stream binary image")
        else:
            fail(f"GET /mailbox/images returned invalid content-type {content_type}")
    else:
        fail(f"GET /mailbox/images returned {resp.status_code}")


def test_get_device():
    if not device_id:
        fail("Skipping get device: no device_id")
        return
    resp = requests.get(f"{BASE}/devices/{device_id}", params={"clerk_id": "test_user"})
    if resp.status_code == 200 and isinstance(resp.json(), dict):
        ok("GET /devices/{id}")
    else:
        fail(f"GET /devices/{device_id} returned {resp.status_code}")


def test_update_device():
    if not device_id:
        fail("Skipping update device: no device_id")
        return
    payload = {
        "clerk_id": "test_user",
        "email": "18hskl@gmail.com", 
        "name": "Updated Device", 
        "location": "New Loc", 
        "is_active": True,
        "mail_delivered_notify": True,
        "mailbox_opened_notify": False,
        "mail_removed_notify": True,
        "battery_low_notify": True,
        "push_notifications": True,
        "email_notifications": True,
        "check_interval": 30,
        "battery_threshold": 15,
        "capture_image_on_open": True,
        "capture_image_on_delivery": False
    }
    resp = requests.put(f"{BASE}/devices/{device_id}", json=payload)
    if resp.status_code == 200:
        ok("PUT /devices/{id}")
    else:
        fail(f"PUT /devices/{device_id} returned {resp.status_code}")


def test_patch_status():
    if not device_id:
        fail("Skipping patch status: no device_id")
        return
    payload = {"clerk_id": "test_user", "is_active": False}
    resp = requests.patch(f"{BASE}/devices/{device_id}/status", json=payload)
    if resp.status_code == 200:
        ok("PATCH /devices/{id}/status")
    else:
        fail(f"PATCH /devices/{device_id}/status returned {resp.status_code}")


def test_heartbeat():
    if not device_id:
        fail("Skipping heartbeat: no device_id")
        return
    payload = {"clerk_id": "test_user"}
    resp = requests.post(f"{BASE}/devices/{device_id}/heartbeat", json=payload)
    if resp.status_code == 200:
        ok("POST /devices/{id}/heartbeat")
    else:
        fail(f"POST /devices/{device_id}/heartbeat returned {resp.status_code}")


def test_latest_image():
    if not device_id:
        fail("Skipping latest image: no device_id")
        return
    resp = requests.get(f"{BASE}/mailbox/images/latest", params={"device_id": device_id})
    if resp.status_code == 200:
        content_type = resp.headers.get("content-type", "")
        if content_type.startswith("image/") and resp.content:
            ok("GET /mailbox/images/latest stream binary image")
        else:
            fail(f"GET /mailbox/images/latest returned invalid content-type {content_type}")
    else:
        fail(f"GET /mailbox/images/latest returned {resp.status_code}")


def test_create_notification():
    global notification_id
    if not device_id:
        fail("Skipping notification test: no device_id")
        return
    payload = {"device_id": device_id, "notification_type": "open"}
    resp = requests.post(f"{BASE}/mailbox/notifications", json=payload)
    if resp.status_code == 200 and resp.json().get("id"):
        notification_id = resp.json()["id"]
        ok(f"POST /mailbox/notifications → id={notification_id}")
    else:
        fail(f"POST /mailbox/notifications returned {resp.status_code}")


def test_list_notifications():
    resp = requests.get(f"{BASE}/mailbox/notifications", params={"device_id": device_id})
    if resp.status_code == 200 and isinstance(resp.json(), list):
        ok("GET /mailbox/notifications")
    else:
        fail(f"GET /mailbox/notifications returned {resp.status_code}")


def test_delete_notification():
    if notification_id:
        resp = requests.delete(f"{BASE}/mailbox/notifications/{notification_id}")
        if resp.status_code == 200:
            ok("DELETE /mailbox/notifications/{id}")
        else:
            fail(f"DELETE /mailbox/notifications returned {resp.status_code}")


def test_update_health():
    if not device_id:
        fail("Skipping health update: no device_id")
        return
    payload = {"clerk_id": "test_user", "battery_level": 50, "signal_strength": 75, "temperature": 22.5, "firmware_version": "1.0.0"}
    resp = requests.post(f"{BASE}/devices/{device_id}/health", json=payload)
    if resp.status_code == 200:
        ok("POST /devices/{id}/health")
    else:
        fail(f"POST /devices/{device_id}/health returned {resp.status_code}")


def test_set_notification_preferences():
    if not device_id:
        fail("Skipping set notification preferences: no device_id")
        return
    payload = {"device_id": device_id, "email_notifications": True, "push_notifications": False, "notification_types": ["open", "close"]}
    resp = requests.post(f"{BASE}/devices/{device_id}/notification-preferences", json=payload)
    if resp.status_code == 200:
        ok("POST /devices/{id}/notification-preferences")
    else:
        fail(f"POST /devices/{device_id}/notification-preferences returned {resp.status_code}")


def test_get_summary():
    if not device_id:
        fail("Skipping get summary: no device_id")
        return
    resp = requests.get(f"{BASE}/devices/{device_id}/summary", params={"clerk_id": "test_user"})
    if resp.status_code == 200 and isinstance(resp.json(), dict):
        ok("GET /devices/{id}/summary")
    else:
        fail(f"GET /devices/{device_id}/summary returned {resp.status_code}")


def test_iot_report():
    if not device_id:
        fail("Skipping IoT report: no device_id")
        return
    resp = requests.post(f"{BASE}/iot/report?d={device_id}&e=o")
    if resp.status_code == 200 and resp.json().get("status") == "ok":
        ok("POST /iot/report")
    else:
        fail(f"POST /iot/report returned {resp.status_code}")


def test_get_dashboard():
    resp = requests.get(f"{BASE}/dashboard/test_user")
    if resp.status_code == 200 and isinstance(resp.json(), dict):
        ok("GET /dashboard/{clerk_id}")
    else:
        fail(f"GET /dashboard/test_user returned {resp.status_code}")


def test_get_device_settings():
    if not device_id:
        fail("Skipping get device settings: no device_id")
        return
    resp = requests.get(f"{BASE}/devices/{device_id}/settings", params={"clerk_id": "test_user"})
    if resp.status_code == 200 and isinstance(resp.json(), dict):
        settings = resp.json()
        # Check if settings has the expected keys
        expected_keys = [
            "mail_delivered_notify",
            "mailbox_opened_notify",
            "mail_removed_notify",
            "battery_low_notify",
            "push_notifications",
            "email_notifications",
            "check_interval",
            "battery_threshold",
            "capture_image_on_open",
            "capture_image_on_delivery"
        ]
        if all(key in settings for key in expected_keys):
            ok("GET /devices/{id}/settings")
        else:
            fail(f"GET /devices/{device_id}/settings missing expected keys: {[key for key in expected_keys if key not in settings]}")
    else:
        fail(f"GET /devices/{device_id}/settings returned {resp.status_code}")


def test_update_device_settings():
    if not device_id:
        fail("Skipping update device settings: no device_id")
        return
    payload = {
        "clerk_id": "test_user",
        "mail_delivered_notify": False,
        "mailbox_opened_notify": True,
        "battery_threshold": 25
    }
    resp = requests.put(f"{BASE}/devices/{device_id}/settings", json=payload)
    if resp.status_code == 200 and resp.json().get("status") == "updated":
        ok("PUT /devices/{id}/settings")
    else:
        fail(f"PUT /devices/{device_id}/settings returned {resp.status_code}: {resp.text}")


def test_cleanup():
    # delete image
    if image_id:
        resp = requests.delete(f"{BASE}/mailbox/images/{image_id}")
        if resp.status_code == 200:
            ok("DELETE /mailbox/images/{id}")
        else:
            fail(f"DELETE image returned {resp.status_code}")
    # delete event
    if event_id:
        resp = requests.delete(f"{BASE}/mailbox/events/{event_id}")
        if resp.status_code == 200:
            ok("DELETE /mailbox/events/{id}")
        else:
            fail(f"DELETE event returned {resp.status_code}")
    # delete device
    if device_id:
        resp = requests.delete(f"{BASE}/devices/{device_id}", params={"clerk_id": "test_user"})
        if resp.status_code == 200:
            ok("DELETE /devices/{id}")
        else:
            fail(f"DELETE device returned {resp.status_code}")




if __name__ == "__main__":
    tests = [
        test_root,
        test_create_device,
        test_list_devices,

        test_get_device,
        test_update_device,
        test_get_device_settings,
        test_update_device_settings,
        test_patch_status,
        test_heartbeat,
        test_create_event,
        test_list_events,
        test_upload_image,
        test_list_images,
        test_latest_image,
        test_create_notification,
        test_list_notifications,
        test_delete_notification,
        test_update_health,
        test_set_notification_preferences,
        test_get_summary,
        test_iot_report,
        test_get_dashboard,
        test_cleanup,
    ]
    for t in tests:
        run_test(t.__name__, t) 