import paho.mqtt.client as mqtt
import json
from datetime import datetime
import time
import requests
import ssl
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger()

# MQTT Broker settings (HiveMQ Cloud)
BROKER = "b109d8c65abb4f04b2afe8ccb4d6260c.s1.eu.hivemq.cloud"  # HiveMQ Cloud broker address
PORT = 8883  # TLS port for secure connections

# Base topic must match your Arduino's topic prefix
BASE_TOPIC = "hanbin/ece140/sensors"
TOPIC = BASE_TOPIC + "/#"

# Credentials for HiveMQ Cloud
USERNAME = "hanbin"
PASSWORD = "Hanbin666"

last_post_time = 0

def on_connect(client, userdata, flags, rc):
    connection_codes = {
        0: "Successful connection",
        1: "Connection refused - incorrect protocol version",
        2: "Connection refused - invalid client identifier",
        3: "Connection refused - server unavailable",
        4: "Connection refused - bad username or password",
        5: "Connection refused - not authorized"
    }
    
    if rc == 0:
        logger.info(f"Successfully connected to MQTT broker: {connection_codes.get(rc)}")
        client.subscribe(TOPIC)
        logger.info(f"Subscribed to {TOPIC}")
    else:
        logger.error(f"Failed to connect: {connection_codes.get(rc, f'Unknown error code {rc}')}")

def on_disconnect(client, userdata, rc):
    if rc != 0:
        logger.warning(f"Unexpected disconnection. Code: {rc}")
    else:
        logger.info("Disconnected successfully")

def on_message(client, userdata, msg):
    global last_post_time
    logger.info(f"Received message on topic: {msg.topic}")
    
    try:
        payload = msg.payload.decode()
        logger.info(f"Raw payload: {payload}")
        payload_json = json.loads(payload)
        forced_time = datetime.now()

        if msg.topic.endswith("/readings"):
            logger.info(f"Received readings on {msg.topic}: {payload_json}")
            logger.info(f"Forced Time: {forced_time}")

            current_ts = time.time()
            # Rate-limit the POST requests to once every 5 seconds
            if current_ts - last_post_time >= 5:
                last_post_time = current_ts

                temperature = payload_json.get("temperature")
                if temperature is not None:
                    post_data = {
                        "value": temperature,   # Must be 'value' for the test
                        "unit": "C",
                        "timestamp": forced_time.strftime("%Y-%m-%d %H:%M:%S")
                    }
                    try:
                        # Update this URL as needed for your HTTP server
                        url = "https://hanbin.ece140.site/temperature"
                        
                        logger.info(f"Sending POST request to {url} with data: {post_data}")
                        response = requests.post(url, json=post_data)
                        logger.info(f"POST request sent. Response: {response.status_code} - {response.text}")
                    except Exception as e:
                        logger.error(f"Error sending POST request: {e}")
                else:
                    logger.warning("No 'temperature' in payload; skipping POST.")
            else:
                logger.info("POST request skipped (5-second rate limit).")
        elif msg.topic.endswith("/status"):
            logger.info(f"Received status message: {payload}")

    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        logger.warning(f"Received non-JSON message on {msg.topic}: {msg.payload.decode()}")
    except Exception as e:
        logger.error(f"Error processing message: {e}")

def on_subscribe(client, userdata, mid, granted_qos):
    logger.info(f"Subscribed with QoS: {granted_qos}")

def main():
    logger.info("Starting MQTT client")
    logger.info(f"Broker: {BROKER}:{PORT}")
    logger.info(f"Username: {USERNAME}")
    logger.info(f"Topic: {TOPIC}")

    client = mqtt.Client(client_id=f"python-mqtt-{int(time.time())}")
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_disconnect = on_disconnect
    client.on_subscribe = on_subscribe

    # Enable TLS for a secure connection
    logger.info("Setting up TLS connection...")
    client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
    client.tls_insecure_set(True)  # For testing only; disable in production
    
    # Set MQTT username and password
    client.username_pw_set(USERNAME, PASSWORD)

    try:
        logger.info(f"Connecting to broker {BROKER}:{PORT}...")
        client.connect(BROKER, PORT, 60)
        
        # Start the loop
        logger.info("Starting network loop...")
        client.loop_forever()
    except KeyboardInterrupt:
        logger.info("\nDisconnecting from broker...")
        client.loop_stop()
        client.disconnect()
        logger.info("Exited successfully")
    except Exception as e:
        logger.error(f"Error: {e}")
        # Try reconnecting
        logger.info("Attempting to reconnect in 5 seconds...")
        time.sleep(5)
        main()  # Recursive call to retry

if __name__ == "__main__":
    main()