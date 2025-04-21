import paho.mqtt.client as mqtt
import json
from datetime import datetime
import time
import requests

# MQTT Broker settings (HiveMQ Cloud)
BROKER = "b109d8c65abb4f04b2afe8ccb4d6260c.s1.eu.hivemq.cloud"  # HiveMQ Cloud broker address
PORT = 8883  # TLS port for secure connections

# Base topic must match your Arduino's topic prefix
BASE_TOPIC = "hanbin/ece140/sensors"
TOPIC = BASE_TOPIC + "/#"

# Credentials for HiveMQ Cloud (if required)
USERNAME = "hanbin"
PASSWORD = "Hanbin666"

last_post_time = 0

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Successfully connected to MQTT broker")
        client.subscribe(TOPIC)
        print(f"Subscribed to {TOPIC}")
    else:
        print(f"Failed to connect with result code {rc}")

def on_message(client, userdata, msg):
    global last_post_time
    try:
        payload = json.loads(msg.payload.decode())
        forced_time = datetime.now()

        if msg.topic.endswith("/readings"):
            print(f"\nReceived readings on {msg.topic}: {payload}")
            print(f"Forced Time: {forced_time}")

            current_ts = time.time()
            # Rate-limit the POST requests to once every 5 seconds
            if current_ts - last_post_time >= 5:
                last_post_time = current_ts

                temperature = payload.get("temperature")
                if temperature is not None:
                    post_data = {
                        "username": "girishk",      # Hard-coded username
                        "device_id": "test",     # Hard-coded device ID
                        "value": temperature,    # Sensor value (temperature)
                        "unit": "C",
                        "timestamp": forced_time.strftime("%Y-%m-%d %H:%M:%S")
                    }
                    try:
                        # Update this URL as needed for your HTTP server's ESP32 endpoint.
                        url = "https://hanbin.ece140.site/api/esp32"
                        response = requests.post(url, json=post_data)
                        print(f"POST request sent. Response: {response.status_code} - {response.text}")
                    except Exception as e:
                        print(f"Error sending POST request: {e}")
                else:
                    print("No 'temperature' in payload; skipping POST.")
            else:
                print("POST request skipped (5-second rate limit).")

    except json.JSONDecodeError:
        print(f"\nReceived non-JSON message on {msg.topic}: {msg.payload.decode()}")

def main():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    # Enable TLS for a secure connection
    client.tls_set()  # Use default CA certificates; specify a CA file for production
    client.tls_insecure_set(True)  # For testing only; disable certificate validation

    # Set MQTT username and password
    client.username_pw_set(USERNAME, PASSWORD)

    try:
        client.connect(BROKER, PORT, 60)
        print("Connecting to broker...")
        client.loop_forever()
    except KeyboardInterrupt:
        print("\nDisconnecting from broker...")
        client.loop_stop()
        client.disconnect()
        print("Exited successfully")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()