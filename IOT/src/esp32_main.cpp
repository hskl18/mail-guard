#include <Arduino.h>
#include <HardwareSerial.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "ECE140_WIFI.h"

const char* ucsdUsername = WIFI_USER;
const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;
 
// Device identification
const char* SERIES_ID = "ESP32_001"; 
const char* apiUrl = "https://mail-guard-ten.vercel.app";



const int REED_SW_PIN = 2;
HardwareSerial CamSerial(2);

int previousUserReedState = 1; 
unsigned long lastReedCheckTime = 0;
const unsigned long reedCheckInterval = 2000;
unsigned long lastHttpNotificationTime = 0;
const unsigned long httpNotificationCooldown = 5000; 

void connectToWiFi() {
  // Create a local instance of the ECE140_WIFI class.
  ECE140_WIFI wifi;

  // Call the enterprise connection method using the local object.
  wifi.connectToWPAEnterprise(ssid, ucsdUsername, password);

  // Check the final status for logging purposes in the main file.
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[main] WiFi connection successful.");
    Serial.print("[main] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[main] WiFi connection failed. Please check credentials and network.");
  }
}

void sendEventToServer(String eventType) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot send event.");
    connectToWiFi(); 
    if (WiFi.status() != WL_CONNECTED) return;
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
    Serial.printf("HTTP error: %s\n", http.errorToString(httpResponseCode).c_str());
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
    Serial.println("Reed Switch: STATE 1 (defined as closed by you) - NOW TRIGGERING 'OPEN' ACTIONS."); 

    Serial.println("Reed Switch: (Now considering state 1 as OPEN for events). Requesting photo from ESP32-CAM...");
    CamSerial.print('T');
    if (previousUserReedState == 0) { 
        Serial.println("EVENT: Mailbox State CHANGED from 0 to 1. (If 1 is now 'OPEN' for events, this is effectively 'JUST OPENED')");
        sendEventToServer("open");
    }

  } else { 
    if (previousUserReedState == 1 && currentUserReedState == 0) {
        Serial.println("INFO: Mailbox State CHANGED from 1 to 0. (If 0 is now 'CLOSED' for events, this is 'JUST CLOSED')");
        sendEventToServer("close");
    }
  }
  previousUserReedState = currentUserReedState;
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

  CamSerial.begin(115200, SERIAL_8N1, 16, 17); 
  Serial.println("Serial2 for CAM communication initialized.");

  int rawInitialState = digitalRead(REED_SW_PIN);
  if (rawInitialState == HIGH) { 
    previousUserReedState = 0; 
  } else { 
    previousUserReedState = 1; 
  }
  Serial.print("Initial Reed State (0=open, 1=closed): ");
  Serial.println(previousUserReedState);
}

void loop() {
  if (millis() - lastReedCheckTime >= reedCheckInterval) {
    lastReedCheckTime = millis();
    checkReedSwitchAndTriggerCam();
  }
  
  if (WiFi.status() != WL_CONNECTED && millis() % 30000 == 0) { 
    Serial.println("WiFi disconnected. Attempting to reconnect...");
    connectToWiFi();
  }
}