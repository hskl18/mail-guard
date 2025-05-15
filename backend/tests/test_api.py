import uuid
from datetime import datetime


def _device():
    return f"dev-{uuid.uuid4().hex[:6]}"


# ------------------------------------------------------------------ #
# 1. devices
# ------------------------------------------------------------------ #
def test_devices_roundtrip(client, test_user):
    device_id = _device()
    device_name = "Test Mailbox"
    location = "Front Door"
    firmware = "1.0.0"

    # create device
    resp = client.post(
        "/devices",
        json={
            "email": test_user,
            "device_name": device_name,
            "device_id": device_id,
            "location": location,
            "firmware_version": firmware,
        },
    )
    assert resp.status_code == 200
    new_id = resp.json()["id"]

    # list devices
    resp = client.get("/devices", params={"email": test_user})
    assert resp.status_code == 200
    data = resp.json()
    assert any(row["id"] == new_id for row in data)
    device = next(row for row in data if row["id"] == new_id)
    assert device["device_name"] == device_name
    assert device["device_id"] == device_id
    assert device["location"] == location
    assert device["firmware_version"] == firmware

    # update device
    new_name = "Updated Mailbox"
    new_location = "Back Door"
    new_firmware = "1.0.1"
    resp = client.put(
        f"/devices/{device_id}",
        json={
            "email": test_user,
            "device_name": new_name,
            "device_id": device_id,
            "location": new_location,
            "firmware_version": new_firmware,
        },
    )
    assert resp.status_code == 200

    # verify update
    resp = client.get("/devices", params={"email": test_user})
    assert resp.status_code == 200
    data = resp.json()
    device = next(row for row in data if row["id"] == new_id)
    assert device["device_name"] == new_name
    assert device["location"] == new_location
    assert device["firmware_version"] == new_firmware


# ------------------------------------------------------------------ #
# 2. mailbox_events
# ------------------------------------------------------------------ #
def test_mailbox_events_roundtrip(client, test_user):
    device = _device()

    # create event
    resp = client.post(
        "/mailbox/events",
        json={
            "email": test_user,
            "device_id": device,
            "event_type": "open",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )
    assert resp.status_code == 200
    new_id = resp.json()["id"]

    # fetch events
    resp = client.get(
        "/mailbox/events", params={"email": test_user, "device_id": device}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert any(row["id"] == new_id for row in data)


# ------------------------------------------------------------------ #
# 3. images
# ------------------------------------------------------------------ #
def test_images_roundtrip(client, test_user):
    device = _device()
    url = "https://example-bucket.s3.amazonaws.com/demo.jpg"

    resp = client.post(
        "/mailbox/images",
        json={
            "email": test_user,
            "device_id": device,
            "image_url": url,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )
    assert resp.status_code == 200
    new_id = resp.json()["id"]

    resp = client.get("/mailbox/images", params={"email": test_user, "device_id": device})
    assert resp.status_code == 200
    assert any(row["id"] == new_id and row["image_url"] == url for row in resp.json())


# ------------------------------------------------------------------ #
# 4. notifications
# ------------------------------------------------------------------ #
def test_notifications_roundtrip(client, test_user):
    device = _device()

    resp = client.post(
        "/mailbox/notifications",
        json={
            "email": test_user,
            "device_id": device,
            "notification_type": "mail_arrived",
        },
    )
    assert resp.status_code == 200
    new_id = resp.json()["id"]

    resp = client.get("/mailbox/notifications", params={"email": test_user})
    assert resp.status_code == 200
    assert any(row["id"] == new_id for row in resp.json())


# ------------------------------------------------------------------ #
# 5. make sure weight endpoints were removed
# ------------------------------------------------------------------ #
def test_weight_endpoints_gone(client):
    assert client.get("/mailbox/weight").status_code == 404
    assert client.post("/mailbox/weight", json={}).status_code == 404
