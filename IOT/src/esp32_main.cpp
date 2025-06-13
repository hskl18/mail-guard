#include "ECE140_WIFI.h"
#include <Arduino.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>
#include <WiFi.h>
#include "time.h"

// ADD THIS AT THE TOP OF YOUR FILE

#include "HX711.h" // Library for the load cell amplifier

// === DEVICE CONFIGURATION ===
const char* DEVICE_SERIAL = "ESP32_001";
const char* API_BASE_URL = "https://mail-guard-ten.vercel.app";
const char* IOT_API_KEY = "iot_your_device_api_key_here"; // Replace with actual API key
const char* FIRMWARE_VERSION = "1.2.0";
const char* HARDWARE_REVISION = "ESP32-CAM-v1";

// === WEIGHT SENSOR CONFIGURATION ===
const int LOADCELL_DOUT_PIN = 16;
const int LOADCELL_SCK_PIN = 4;
#define CALIBRATION_FACTOR -698.11f // The factor you calculated

HX711 scale;
float last_measurement = 0.0f; // Initialize last measurement to 0
unsigned long lastWeightCheckTime = 0;
const unsigned long weightCheckInterval = 60000; // 60 seconds
const float weightChangeThreshold = 15.0f;       // 15 grams
// ===================================

// === GPIO CONFIGURATION ===
const int REED_SW_PIN = 2;
const int STATUS_LED_PIN = 2;
const int BATTERY_PIN = A0;

// === COMMUNICATION ===
HardwareSerial CamSerial(2);

// === STATE VARIABLES ===
int previousUserReedState = 1;
unsigned long lastReedCheckTime = 0;
const unsigned long reedCheckInterval = 2000;
unsigned long lastHttpNotificationTime = 0;
const unsigned long httpNotificationCooldown = 5000;

// Photo sequence variables
bool photoSequenceActive = false;
unsigned long photoSequenceStartTime = 0;
int photosRequested = 0;
const int totalPhotosToTake = 3;
const unsigned long photoInterval = 3000; // 3 seconds between photos

// Battery monitoring
int batteryLevel = 100;
unsigned long lastBatteryCheck = 0;
const unsigned long batteryCheckInterval = 300000; // 5 minutes

// NTP Time configuration
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 0;

// === WiFi CONFIGURATION ===
const char* ucsdUsername = WIFI_USER;
const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;

void connectToWiFi() {
  ECE140_WIFI wifi;
  
  Serial.println("[WiFi] Connecting to WiFi...");
  
  if (strlen(ucsdUsername) > 0) {
    // Use enterprise WiFi
    wifi.connectToWPAEnterprise(ssid, ucsdUsername, password);
  } else {
    // Use regular WiFi
    wifi.connectToWiFi(ssid, password);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] Connection successful!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    
    // Initialize time
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    Serial.println("[NTP] Time synchronization started");
  } else {
    Serial.println("[WiFi] Connection failed!");
  }
}

String getCurrentISOTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    // Fallback to millis if time sync failed
    return String(millis());
  }
  
  char timeString[30];
  strftime(timeString, sizeof(timeString), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(timeString);
}

int getBatteryLevel() {
  // Read battery voltage and convert to percentage
  int analogValue = analogRead(BATTERY_PIN);
  float voltage = (analogValue / 4095.0) * 3.3 * 2; // Assuming voltage divider
  
  // Convert voltage to percentage (adjust based on your battery)
  int percentage = map(voltage * 100, 320, 420, 0, 100); // 3.2V-4.2V range
  return constrain(percentage, 0, 100);
}

int getSignalStrength() {
  return WiFi.RSSI();
}

void blinkStatusLED(int times, int delayMs = 200) {
  for (int i = 0; i < times; i++) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(STATUS_LED_PIN, LOW);
    delay(delayMs);
  }
}

bool sendEventToServer(String eventType, float weightValue = -1, bool isWeightEvent = false) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi not connected. Cannot send event.");
    blinkStatusLED(3, 100); // Error indication
    return false;
  }

  if (millis() - lastHttpNotificationTime < httpNotificationCooldown) {
    Serial.println("[HTTP] Event cooldown active. Skipping event.");
    return false;
  }
  
  lastHttpNotificationTime = millis();

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/event";
  
  Serial.print("[HTTP] Sending ");
  Serial.print(eventType);
  Serial.print(" event to: ");
  Serial.println(url);

  http.begin(url);
  
  // Add authentication header
  http.addHeader("Authorization", "Bearer " + String(IOT_API_KEY));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "MailGuard-IoT/" + String(FIRMWARE_VERSION));

  // Create JSON payload matching API documentation
  DynamicJsonDocument doc(1024);
  
  doc["serial_number"] = DEVICE_SERIAL;
  doc["timestamp"] = getCurrentISOTimestamp();
  doc["firmware_version"] = FIRMWARE_VERSION;
  doc["battery_level"] = getBatteryLevel();
  doc["signal_strength"] = getSignalStrength();

  // Event data object
  JsonObject eventData = doc.createNestedObject("event_data");
  eventData["event_type"] = eventType;
  
  if (isWeightEvent) {
    eventData["reed_sensor"] = digitalRead(REED_SW_PIN) == LOW;
    eventData["weight_sensor"] = true;
    eventData["weight_value"] = weightValue;
    eventData["weight_threshold"] = weightChangeThreshold;
  } else {
    eventData["reed_sensor"] = (eventType == "open");
    eventData["mailbox_status"] = (eventType == "open") ? "opened" : "closed";
    eventData["weight_sensor"] = true;
    
    // Include current weight if available
    if (scale.is_ready()) {
      eventData["weight_value"] = scale.get_units(3);
    }
  }

  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("[HTTP] Payload: " + jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);
  String response = http.getString();

  Serial.print("[HTTP] Response code: ");
  Serial.println(httpResponseCode);
  Serial.println("[HTTP] Response: " + response);

  http.end();

  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    Serial.println("[HTTP] Event sent successfully!");
    blinkStatusLED(1, 100); // Success indication
    return true;
  } else {
    Serial.println("[HTTP] Failed to send event!");
    blinkStatusLED(5, 100); // Error indication
    return false;
  }
}

void sendWeightEventToServer(String eventType, float weight) {
  Serial.print("[Weight] Detected: ");
  Serial.print(eventType);
  Serial.print(" - Weight: ");
  Serial.print(weight, 2);
  Serial.println("g");
  
  sendEventToServer(eventType, weight, true);
}

void checkWeightSensor() {
  Serial.println("[Weight] Checking weight sensor...");

  if (scale.is_ready()) {
    float current_weight = scale.get_units(10);

    Serial.print("[Weight] Current: ");
    Serial.print(current_weight, 2);
    Serial.print("g, Last: ");
    Serial.print(last_measurement, 2);
    Serial.println("g");

    float weightDifference = abs(current_weight - last_measurement);
    
    if (weightDifference >= weightChangeThreshold) {
      if (current_weight > last_measurement) {
        Serial.println("[Weight] MAIL DETECTED: Weight increased significantly.");
        sendWeightEventToServer("delivery", current_weight);
      } else {
        Serial.println("[Weight] MAIL REMOVED: Weight decreased significantly.");
        sendWeightEventToServer("removal", current_weight);
      }
      last_measurement = current_weight;
    }
  } else {
    Serial.println("[Weight] HX711 not ready.");
  }
}

void checkReedSwitchAndTriggerCam() {
  int rawPinValue = digitalRead(REED_SW_PIN);
  int currentUserReedState = (rawPinValue == HIGH) ? 0 : 1;

  if (currentUserReedState == 1 && previousUserReedState == 0) {
    Serial.println("[Reed] Mailbox OPENED - Starting photo sequence");
    
    // Start photo sequence
    photoSequenceActive = true;
    photoSequenceStartTime = millis();
    photosRequested = 0;

    // Take first photo immediately
    Serial.println("[Photo] Taking photo 1/3");
    CamSerial.print('T');
    photosRequested = 1;

    sendEventToServer("open");
    
  } else if (currentUserReedState == 0 && previousUserReedState == 1) {
    Serial.println("[Reed] Mailbox CLOSED");
    sendEventToServer("close");
    
    // Reset photo sequence
    photoSequenceActive = false;
    photosRequested = 0;
  }
  
  previousUserReedState = currentUserReedState;
}

void handlePhotoSequence() {
  if (!photoSequenceActive || photosRequested >= totalPhotosToTake) {
    return;
  }

  unsigned long currentTime = millis();
  unsigned long timeSinceStart = currentTime - photoSequenceStartTime;

  if (photosRequested == 1 && timeSinceStart >= photoInterval) {
    Serial.println("[Photo] Taking photo 2/3 (3 seconds after opening)");
    CamSerial.print('T');
    photosRequested = 2;
  } else if (photosRequested == 2 && timeSinceStart >= (photoInterval * 2)) {
    Serial.println("[Photo] Taking photo 3/3 (6 seconds after opening)");
    CamSerial.print('T');
    photosRequested = 3;
    photoSequenceActive = false;
    Serial.println("[Photo] Photo sequence complete");
  }
}

void checkCamResponse() {
  if (CamSerial.available()) {
    char response = CamSerial.read();
    if (response == 'S') {
      Serial.println("[Photo] ESP32-CAM upload successful!");
    } else if (response == 'F') {
      Serial.println("[Photo] ESP32-CAM upload failed!");
    }
  }
}

void checkBatteryLevel() {
  batteryLevel = getBatteryLevel();
  Serial.print("[Battery] Level: ");
  Serial.print(batteryLevel);
  Serial.println("%");
  
  if (batteryLevel <= 20) {
    Serial.println("[Battery] LOW BATTERY WARNING!");
    // Send low battery event
    sendEventToServer("low_battery");
  }
}

void sendHeartbeat() {
  Serial.println("[Heartbeat] Sending device status report");
  
  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/iot/report";
  
  http.begin(url);
  http.addHeader("Authorization", "Bearer " + String(IOT_API_KEY));
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["serial_number"] = DEVICE_SERIAL;
  doc["firmware_version"] = FIRMWARE_VERSION;
  doc["battery_level"] = batteryLevel;
  doc["signal_strength"] = getSignalStrength();
  doc["temperature_celsius"] = 25; // Add temperature sensor if available
  
  String payload;
  serializeJson(doc, payload);
  
  int responseCode = http.POST(payload);
  Serial.print("[Heartbeat] Response: ");
  Serial.println(responseCode);
  
  http.end();
}

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    delay(10);
  }
  
  Serial.println("=================================");
  Serial.println("MailGuard IoT Device Starting...");
  Serial.println("Firmware: " + String(FIRMWARE_VERSION));
  Serial.println("Hardware: " + String(HARDWARE_REVISION));
  Serial.println("Serial: " + String(DEVICE_SERIAL));
  Serial.println("=================================");

  // Initialize GPIO
  pinMode(REED_SW_PIN, INPUT_PULLUP);
  pinMode(STATUS_LED_PIN, OUTPUT);
  pinMode(BATTERY_PIN, INPUT);
  
  // Status indication
  blinkStatusLED(3, 500);

  // Connect to WiFi
  connectToWiFi();

  // Initialize camera serial communication
  CamSerial.begin(115200, SERIAL_8N1, 12, 13);
  Serial.println("[Serial] Camera communication initialized");

  // Initialize weight sensor
  Serial.println("[Weight] Initializing weight sensor...");
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare();
  Serial.println("[Weight] Weight sensor initialized and tared");

  // Set initial reed switch state
  int rawInitialState = digitalRead(REED_SW_PIN);
  previousUserReedState = (rawInitialState == HIGH) ? 0 : 1;
  Serial.print("[Reed] Initial state: ");
  Serial.println(previousUserReedState == 1 ? "CLOSED" : "OPEN");

  // Initial battery check
  checkBatteryLevel();
  
  // Send device activation
  Serial.println("[Setup] Device setup complete, sending activation...");
  sendHeartbeat();
  
  Serial.println("[Setup] Ready for operation!");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Check reed switch every 2 seconds
  if (currentTime - lastReedCheckTime >= reedCheckInterval) {
    lastReedCheckTime = currentTime;
    checkReedSwitchAndTriggerCam();
  }

  // Check weight sensor every 60 seconds
  if (currentTime - lastWeightCheckTime >= weightCheckInterval) {
    lastWeightCheckTime = currentTime;
    checkWeightSensor();
  }

  // Check battery every 5 minutes
  if (currentTime - lastBatteryCheck >= batteryCheckInterval) {
    lastBatteryCheck = currentTime;
    checkBatteryLevel();
  }

  // Handle photo sequence timing
  handlePhotoSequence();

  // Check camera responses
  checkCamResponse();

  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED && currentTime % 30000 == 0) {
    Serial.println("[WiFi] Disconnected! Attempting to reconnect...");
    connectToWiFi();
  }

  // Send heartbeat every 10 minutes
  if (currentTime % 600000 == 0) {
    sendHeartbeat();
  }

  // Small delay to prevent overwhelming the system
  delay(100);
}