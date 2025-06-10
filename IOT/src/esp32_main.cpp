#include "ECE140_WIFI.h"
#include <Arduino.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>
#include <WiFi.h>

// ADD THIS AT THE TOP OF YOUR FILE

#include "HX711.h" // Library for the load cell amplifier

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

/*
const char* ucsdUsername = WIFI_USER;
const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;
*/

const char *ucsdUsername = "asanisetty";
const char *ssid = "UCSD-PROTECTED";
const char *password = "#1Anfield>>>>";

// Device identification
const char *SERIES_ID = "ESP32_001";
const char *apiUrl = "https://mail-guard-ten.vercel.app";

// Legacy variables - can be removed if not needed elsewhere
const char *serverIpAddress = SERVER_IP;
const char *serverPortChar = SERVER_PORT;
const int serverPort = atoi(serverPortChar);

const int REED_SW_PIN = 2;
HardwareSerial CamSerial(2);

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

void connectToWiFi() {
  // Create a local instance of the ECE140_WIFI class.
  ECE140_WIFI wifi;

  // Call the enterprise connection method using the local object.
  wifi.connectToWPAEnterprise(ssid, ucsdUsername, password);
  // wifi.connectToWiFi(ssid, password);

  // Check the final status for logging purposes in the main file.
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[main] WiFi connection successful.");
    Serial.print("[main] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[main] WiFi connection failed. Please check credentials "
                   "and network.");
  }
}

// New functions for weight sensor
void sendWeightEventToServer(String eventType, float weight) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot send weight event.");
    // Don't try to reconnect here to avoid blocking, the main loop handles it.
    return;
  }

  HTTPClient http;

  String url = String(apiUrl) + "/api/iot/event";
  Serial.print("Sending weight event (" + eventType + ") to: ");
  Serial.println(url);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Create a JSON payload specifically for weight events
  String jsonPayload = "{";
  jsonPayload += "\"serial_number\":\"" + String(SERIES_ID) + "\",";
  jsonPayload += "\"reed_sensor\":true,";
  jsonPayload += "\"event_data\":{";
  jsonPayload += "\"event_type\":\"" + eventType + "\",";
  jsonPayload +=
      "\"weight_grams\":" + String(weight, 2); // Include the measured weight
  jsonPayload += "},";
  jsonPayload += "\"firmware_version\":\"1.0.0\",";
  jsonPayload += "\"timestamp\":\"" + String(millis()) + "\"";
  jsonPayload += "}";

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.println(response);
  } else {
    Serial.print("Error sending weight event: ");
    Serial.println(httpResponseCode);
    Serial.printf("HTTP error: %s\n",
                  http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

void checkWeightSensor() {
  Serial.println("Checking weight sensor...");

  // Check if the scale is ready
  if (scale.is_ready()) {
    // Get a stable reading by averaging 10 samples
    float current_weight = scale.get_units(10);

    Serial.print("Current Weight: ");
    Serial.print(current_weight, 2);
    Serial.print(" g, Last Measurement: ");
    Serial.print(last_measurement, 2);
    Serial.println(" g");

    // Check for a significant increase in weight
    if (current_weight >= last_measurement + weightChangeThreshold) {
      Serial.println("MAIL DETECTED: Weight increased significantly.");
      sendWeightEventToServer("mail_added", current_weight);
      last_measurement = current_weight; // Update the last measurement
    }
    // Check for a significant decrease in weight
    else if (current_weight <= last_measurement - weightChangeThreshold) {
      Serial.println("MAIL REMOVED: Weight decreased significantly.");
      sendWeightEventToServer("mail_removed", current_weight);
      last_measurement = current_weight; // Update the last measurement
    }
  } else {
    Serial.println("HX711 not found.");
  }
}

void sendEventToServer(String eventType) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot send event.");
    connectToWiFi();
    if (WiFi.status() != WL_CONNECTED)
      return;
  }

  if (millis() - lastHttpNotificationTime < httpNotificationCooldown) {
    Serial.println("Event cooldown active. Skipping sending event.");
    return;
  }
  lastHttpNotificationTime = millis();

  HTTPClient http;

  String url = String(apiUrl) + "/api/iot/event";
  Serial.print("Sending " + eventType + " event to: ");
  Serial.println(url);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Create event data matching the API format
  String reedSensorValue = (eventType == "open") ? "true" : "false";
  String mailboxStatus = (eventType == "open") ? "opened" : "closed";

  String jsonPayload = "{";
  jsonPayload += "\"serial_number\":\"" + String(SERIES_ID) + "\",";
  jsonPayload += "\"event_data\":{";
  jsonPayload += "\"reed_sensor\":" + reedSensorValue + ",";
  jsonPayload += "\"event_type\":\"" + eventType + "\",";
  jsonPayload += "\"mailbox_status\":\"" + mailboxStatus + "\"";
  jsonPayload += "},";
  jsonPayload += "\"firmware_version\":\"1.0.0\",";
  jsonPayload += "\"timestamp\":\"" + String(millis()) + "\"";
  jsonPayload += "}";

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.println(response);
  } else {
    Serial.print("Error sending event: ");
    Serial.println(httpResponseCode);
    Serial.printf("HTTP error: %s\n",
                  http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

void checkReedSwitchAndTriggerCam() {
  int rawPinValue = digitalRead(REED_SW_PIN);
  int currentUserReedState;

  if (rawPinValue == HIGH) {
    currentUserReedState = 0;
  } else {
    currentUserReedState = 1;
  }

  if (currentUserReedState == 1) {
    Serial.println("Reed Switch: STATE 1 (defined as closed by you) - NOW "
                   "TRIGGERING 'OPEN' ACTIONS.");

    // Check if this is a state change from closed to open (first detection of
    // opening)
    if (previousUserReedState == 0 && !photoSequenceActive) {
      Serial.println("EVENT: Mailbox State CHANGED from 0 to 1. (If 1 is now "
                     "'OPEN' for events, this is effectively 'JUST OPENED')");

      // Start photo sequence
      photoSequenceActive = true;
      photoSequenceStartTime = millis();
      photosRequested = 0;

      // Take first photo immediately
      Serial.println(
          "ESP32-MAIN: Starting 3-photo sequence - Taking photo 1/3");
      Serial.println(
          "ESP32-MAIN: Sending photo trigger command 'T' to ESP32-CAM");
      CamSerial.print('T');
      photosRequested = 1;

      sendEventToServer("open");
    }

  } else {
    if (previousUserReedState == 1 && currentUserReedState == 0) {
      Serial.println("INFO: Mailbox State CHANGED from 1 to 0. (If 0 is now "
                     "'CLOSED' for events, this is 'JUST CLOSED')");
      sendEventToServer("close");

      // Reset photo sequence when door closes
      photoSequenceActive = false;
      photosRequested = 0;
      Serial.println("ESP32-MAIN: Mailbox closed - resetting photo sequence");
    }
  }
  previousUserReedState = currentUserReedState;
}

void handlePhotoSequence() {
  if (!photoSequenceActive || photosRequested >= totalPhotosToTake) {
    return;
  }

  unsigned long currentTime = millis();
  unsigned long timeSinceStart = currentTime - photoSequenceStartTime;

  // Check if it's time for the next photo
  if (photosRequested == 1 && timeSinceStart >= photoInterval) {
    // Take second photo (3 seconds after first)
    Serial.println("ESP32-MAIN: Taking photo 2/3 (3 seconds after opening)");
    Serial.println(
        "ESP32-MAIN: Sending photo trigger command 'T' to ESP32-CAM");
    CamSerial.print('T');
    photosRequested = 2;
  } else if (photosRequested == 2 && timeSinceStart >= (photoInterval * 2)) {
    // Take third photo (6 seconds after first)
    Serial.println("ESP32-MAIN: Taking photo 3/3 (6 seconds after opening)");
    Serial.println(
        "ESP32-MAIN: Sending photo trigger command 'T' to ESP32-CAM");
    CamSerial.print('T');
    photosRequested = 3;

    // Mark sequence as complete
    Serial.println("ESP32-MAIN: 3-photo sequence complete");
    photoSequenceActive = false;
  }
}

// New function added for testing
void checkCamResponse() {
  if (CamSerial.available()) {
    char response = CamSerial.read();
    if (response == 'S') {
      Serial.println(
          "ESP32-MAIN: ESP32-CAM successfully uploaded the picture!");
    } else if (response == 'F') {
      Serial.println("ESP32-MAIN: ESP32-CAM failed to upload the picture!");
    }
  }
}

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    delay(10);
  }
  Serial.println("Main ESP32 Reed Switch Controller Starting...");

  pinMode(REED_SW_PIN, INPUT_PULLUP);

  connectToWiFi();

  Serial.print("API URL configured to: ");
  Serial.println(apiUrl);
  Serial.print("Series ID configured to: ");
  Serial.println(SERIES_ID);

  // CamSerial.begin(115200, SERIAL_8N1, 16, 17);
  CamSerial.begin(115200, SERIAL_8N1, 12, 13);
  Serial.println("Serial2 for CAM communication initialized.");

  int rawInitialState = digitalRead(REED_SW_PIN);
  if (rawInitialState == HIGH) {
    previousUserReedState = 0;
  } else {
    previousUserReedState = 1;
  }
  Serial.print("Initial Reed State (0=open, 1=closed): ");
  Serial.println(previousUserReedState);

  // ADD THESE LINES AT THE END OF setup()
  Serial.println("Initializing weight sensor...");
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare(); // Zero the scale
  Serial.println("Weight sensor initialized and tared.");
}

void loop() {
  if (millis() - lastReedCheckTime >= reedCheckInterval) {
    lastReedCheckTime = millis();
    checkReedSwitchAndTriggerCam();
  }

  // ADD THIS BLOCK TO YOUR loop()
  if (millis() - lastWeightCheckTime >= weightCheckInterval) {
    lastWeightCheckTime = millis(); // Reset the timer
    checkWeightSensor();            // Call the weight check function
  }

  // Handle the photo sequence timing
  handlePhotoSequence();

  if (WiFi.status() != WL_CONNECTED && millis() % 30000 == 0) {
    Serial.println("WiFi disconnected. Attempting to reconnect...");
    connectToWiFi();
  }

  // Check for responses from ESP32-CAM
  checkCamResponse();
}