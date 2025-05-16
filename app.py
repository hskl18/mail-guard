from flask import Flask, request, jsonify
import os
import json
from datetime import datetime
from notify_user import send_notification

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload():
    image_data = request.data
    weight = request.headers.get("weight", "unknown")
    filename = datetime.now().strftime("image_%Y%m%d_%H%M%S.jpg")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    with open(filepath, "wb") as f:
        f.write(image_data)
    with open("static/latest.jpg", "wb") as f:
        f.write(image_data)
    log_entry = {"time": str(datetime.now()), "weight": weight, "image": filename}
    if os.path.exists("weight_log.json"):
        with open("weight_log.json", "r") as f:
            log = json.load(f)
    else:
        log = []
    log.append(log_entry)
    with open("weight_log.json", "w") as f:
        json.dump(log, f, indent=2)
    send_notification(weight, filename)
    return jsonify({"message": "Upload complete"})
