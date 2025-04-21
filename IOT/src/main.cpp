#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_BMP085.h>
#include "ECE140_WIFI.h"  
#include "ECE140_MQTT.h"

Adafruit_BMP085 bmp;

// ------------------------
// Configuration Settings
// ------------------------
// #define WIFI_SSID        "Fratican Night Watch -2.4Ghz"
// #define WIFI_PASSWORD    "simpclub"

#define WIFI_SSID        "冰小六"
#define WIFI_PASSWORD    "sbqq2003"



#define MQTT_BROKER      "b109d8c65abb4f04b2afe8ccb4d6260c.s1.eu.hivemq.cloud"
#define MQTT_PORT        8883  // Use TLS port for HiveMQ Cloud
#define MQTT_USER        "hanbin"
#define MQTT_PASS        "Hanbin666"

// MQTT client settings
#define CLIENT_ID        "esp32-sensors"
#define TOPIC_PREFIX     "hanbin/ece140/sensors"

// Create an instance of the MQTT client with TLS settings.
ECE140_MQTT mqtt(CLIENT_ID, TOPIC_PREFIX, MQTT_BROKER, MQTT_PORT, MQTT_USER, MQTT_PASS);

void setup() {
    Serial.begin(115200);
    delay(1000);
    // Connect to WiFi (using your custom ECE140_WIFI library)
    ECE140_WIFI wifi;
    wifi.connectToWiFi(WIFI_SSID, WIFI_PASSWORD);

    // wifi.connectToWPAEnterprise(ssid, username, password);


    // Initialize the BMP sensor
    if (!bmp.begin()) {
        Serial.println("Could not find a valid BMP085/BMP180 sensor, check wiring!");
        while (1) {
            delay(100);
        }
    }

    // Connect to the MQTT broker
    Serial.println("Connecting to MQTT broker...");
    while (!mqtt.connectToBroker()) {
        Serial.println("Failed to connect to MQTT broker");
        delay(2000); // Retry delay
    }
    Serial.println("Connected to MQTT broker successfully!");

    // Publish an initial status message
    mqtt.publishMessage("status", "Sensor device connected!");
}

void loop() {
    // Maintain MQTT connection
    mqtt.loop();

    // Read temperature and pressure from the BMP sensor
    float temperature = bmp.readTemperature();  // in Celsius
    float pressure    = bmp.readPressure();       // in Pascals

    // Print sensor readings to the Serial Monitor
    Serial.println("\n=== BMP Sensor Readings ===");
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println(" C");
    Serial.print("Pressure: ");
    Serial.print(pressure);
    Serial.println(" Pa");
    Serial.println("===========================");

    // Create JSON payload
    String message = "{\"temperature\": " + String(temperature)
                   + ", \"pressure\": " + String(pressure) + "}";

    // Publish sensor data to <TOPIC_PREFIX>/readings
    mqtt.publishMessage("readings", message);

    delay(2000);
}