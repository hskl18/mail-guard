from flask import Flask, request, jsonify, send_from_directory, url_for
import os
import json
from datetime import datetime

app = Flask(__name__)



UPLOAD_FOLDER = "uploads"
STATIC_FOLDER = "static"
EVENT_LOG_FILE = "event_log.json"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STATIC_FOLDER, exist_ok=True)


def log_event(event_data):
    log_entries = []
    if os.path.exists(EVENT_LOG_FILE):
        try:
            with open(EVENT_LOG_FILE, "r") as f:
                log_entries = json.load(f)
        except json.JSONDecodeError:
            log_entries = [] 
    
    if not isinstance(log_entries, list): 
        log_entries = []

    log_entries.append(event_data)
    
    try:
        with open(EVENT_LOG_FILE, "w") as f:
            json.dump(log_entries, f, indent=2)
    except IOError as e:
        print(f"Error writing to event log: {e}")


@app.route("/")
def index():
    dashboard_link = url_for('dashboard')
    return jsonify({
        "message": "Welcome to the MailGuard Server!",
        "status": "running",
        "dashboard_url": dashboard_link,
        "available_endpoints": {
            "/upload": "POST image data here.",
            "/event": "POST event data here.",
            "/latest-image": "GET the latest uploaded image.",
            "/uploads/<filename>": "GET a specific uploaded image by filename."
        }
    })

@app.route("/dashboard")
def dashboard():
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MailGuard Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; color: #333; }
            .container { max-width: 1200px; margin: auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            h1, h2 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .section { margin-bottom: 30px; }
            .event-log { list-style-type: none; padding: 0; }
            .event-log li { background-color: #fff; border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .event-log li strong { color: #555; }
            .event-log .event-time { font-size: 0.9em; color: #777; display: block; margin-bottom: 5px; }
            .image-gallery { display: flex; flex-wrap: wrap; gap: 15px; }
            .image-gallery .img-container { border: 1px solid #ddd; padding: 5px; border-radius: 5px; background-color: #fff; text-align: center; }
            .image-gallery img { max-width: 200px; max-height: 200px; height: auto; display: block; margin-bottom: 5px; border-radius: 4px;}
            .image-gallery p { font-size: 0.9em; color: #555; margin: 0; }
            .no-data { color: #777; font-style: italic; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>MailGuard Dashboard</h1>
    """

    html_content += "<div class='section'><h2>Notifications Log</h2>"
    if os.path.exists(EVENT_LOG_FILE):
        try:
            with open(EVENT_LOG_FILE, "r") as f:
                events = json.load(f)
            if isinstance(events, list) and events:
                html_content += "<ul class='event-log'>"
                for event in reversed(events):
                    html_content += "<li>"

                    raw_time_str = event.get('time', 'N/A')
                    formatted_time_str = raw_time_str 
                    if raw_time_str != 'N/A':
                        try:
                            dt_object = datetime.fromisoformat(raw_time_str)

                            day = dt_object.day
                            if 4 <= day <= 20 or 24 <= day <= 30:
                                suffix = "th"
                            else:
                                suffix = ["st", "nd", "rd"][day % 10 - 1]

                            formatted_time_str = dt_object.strftime(f"%I:%M %p (%b {day}{suffix}, %Y)")
                            if formatted_time_str.startswith('0'):
                                formatted_time_str = formatted_time_str[1:]
                        except ValueError:
                            print(f"Warning: Could not parse timestamp '{raw_time_str}'")
                            pass 

                    html_content += f"<span class='event-time'>Time: {formatted_time_str}</span>"


                    html_content += f"<strong>Type:</strong> {event.get('type', 'N/A')}<br>"
                    if 'source_device' in event:
                        html_content += f"<strong>Source:</strong> {event.get('source_device', 'N/A')}<br>"
                    if 'event_details' in event: 
                         html_content += f"<strong>Details:</strong> {event.get('event_details', 'N/A')}<br>"
                    if 'image_file' in event: 
                         html_content += f"<strong>Image File:</strong> {event.get('image_file', 'N/A')}<br>"
                    html_content += f"<strong>Message:</strong> {event.get('message', 'N/A')}"
                    html_content += "</li>"
                html_content += "</ul>"
            else:
                html_content += "<p class='no-data'>No events logged yet.</p>"
        except (json.JSONDecodeError, IOError) as e:
            html_content += f"<p class='no-data'>Error loading event log: {e}</p>"
    else:
        html_content += "<p class='no-data'>Event log file not found.</p>"
    html_content += "</div>"

    html_content += "<div class='section'><h2>Uploaded Images</h2>"
    html_content += "<div class='image-gallery'>"
    if os.path.exists(UPLOAD_FOLDER):
        try:
            image_files = sorted(
                [f for f in os.listdir(UPLOAD_FOLDER) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))],
                reverse=True 
            )
            if image_files:
                for image_filename in image_files:
                    image_url = url_for('serve_uploaded_image', filename=image_filename)
                    html_content += f"<div class='img-container'><img src='{image_url}' alt='{image_filename}'><p>{image_filename}</p></div>"
            else:
                html_content += "<p class='no-data'>No images uploaded yet.</p>"
        except OSError as e:
            html_content += f"<p class='no-data'>Error listing images: {e}</p>"

    else:
        html_content += "<p class='no-data'>Uploads folder not found.</p>"
    html_content += "</div></div>"

    html_content += """
        </div>
    </body>
    </html>
    """
    return html_content


@app.route("/upload", methods=["POST"])
def upload_image():
    if 'file' not in request.files:
        if request.data: 
            image_data = request.data
        else:
            return jsonify({"error": "No image data found"}), 400
    else: 
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        if file:
            image_data = file.read()
        else: 
            return jsonify({"error": "File object exists but could not be read"}), 400

    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
    filename = f"image_{timestamp_str}.jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    try:
        with open(filepath, "wb") as f:
            f.write(image_data)
        
        latest_image_path = os.path.join(STATIC_FOLDER, "latest.jpg")
        with open(latest_image_path, "wb") as f:
            f.write(image_data)
    except IOError as e:
        print(f"Error saving image: {e}")
        return jsonify({"error": f"Failed to save image: {e}"}), 500

    log_entry = {
        "type": "image_received",
        "time": datetime.now().isoformat(),
        "source_device": request.headers.get("X-Device-ID", "esp32-cam"), 
        "image_file": filename,
        "message": "Image captured and uploaded."
    }
    log_event(log_entry)

    
    return jsonify({"message": "Image upload complete", "filename": filename}), 200

@app.route("/event", methods=["POST"])
def handle_event():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data received"}), 400
    except Exception as e:
        return jsonify({"error": f"Invalid JSON: {e}"}), 400

    event_type = data.get("event")
    device_id = data.get("deviceId", "unknown_main_esp32") 
    event_time = data.get("timestamp", datetime.now().isoformat())

    if not event_type:
        return jsonify({"error": "Missing 'event' in JSON payload"}), 400

    log_entry = {
        "type": "device_event",
        "time": event_time,
        "source_device": device_id,
        "event_details": event_type,
        "message": f"Event '{event_type}' received from {device_id}."
    }
    log_event(log_entry)
    
    print(f"Received event: {log_entry}")


    return jsonify({"message": f"Event '{event_type}' received and logged"}), 200

@app.route('/uploads/<path:filename>')
def serve_uploaded_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/latest-image')
def serve_latest_image():
    latest_image_filepath = os.path.join(STATIC_FOLDER, 'latest.jpg')
    if not os.path.exists(latest_image_filepath):
        return jsonify({"error": "Latest image not found. No images uploaded yet?"}), 404
    return send_from_directory(STATIC_FOLDER, 'latest.jpg', as_attachment=False)


if __name__ == "__main__":
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    if not os.path.exists(STATIC_FOLDER):
        os.makedirs(STATIC_FOLDER)

    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False) 
