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
const char* SERIES_ID = "ESP32_001"; // Update this with your device's unique serial ID
const char* apiUrl = "https://pp7vqzu57gptbbb3m5m3untjgm0iyylm.lambda-url.us-west-1.on.aws";

// These will be populated after device registration/authentication
int deviceId = -1;
String clerkId = "";
bool isRegistered = false;

// Legacy variables - can be removed if not needed elsewhere
const char* serverIpAddress = SERVER_IP; 
const char* serverPortChar = SERVER_PORT;
const int serverPort = atoi(serverPortChar);

const int REED_SW_PIN = 2;
const int BATTERY_PIN = 34; // Analog pin to read battery voltage (if available)
HardwareSerial CamSerial(2);

int previousUserReedState = 1; 
unsigned long lastReedCheckTime = 0;
const unsigned long reedCheckInterval = 2000;
unsigned long lastHttpNotificationTime = 0;
const unsigned long httpNotificationCooldown = 5000; 

void sendHeartbeat();

// Function to get clerk_id and device_id from the backend using SERIES_ID
bool getDeviceCredentials() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot get device credentials.");
    return false;
  }

  HTTPClient http;
  
  // Call the endpoint that gets device info from Series ID
  String url = String(apiUrl) + "/device/lookup?serial_id=" + String(SERIES_ID);
  Serial.print("Getting device credentials from: ");
  Serial.println(url);
  
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Credentials received:");
    Serial.println(response);
    
    // Parse JSON response
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error) {
      if (doc.containsKey("device_id") && doc.containsKey("clerk_id")) {
        deviceId = doc["device_id"];
        clerkId = doc["clerk_id"].as<String>();
        
        Serial.print("Device ID: ");
        Serial.println(deviceId);
        Serial.print("Clerk ID: ");
        Serial.println(clerkId);
        
        isRegistered = true;
        return true;
      } else {
        Serial.println("Missing device_id or clerk_id in response");
      }
    } else {
      Serial.print("JSON parsing error: ");
      Serial.println(error.c_str());
    }
  } else {
    Serial.print("Error getting credentials: ");
    Serial.println(httpResponseCode);
    if (httpResponseCode == 404) {
      Serial.println("Device not registered in the system");
    }
  }
  
  http.end();
  return false;
}

// Function to read battery level (simulate or implement based on your hardware)
int getBatteryLevel() {
  // If you have a voltage divider connected to an analog pin:
  int rawValue = analogRead(BATTERY_PIN);
  
  // Convert to percentage based on your battery specifications
  // This is just an example - adjust based on your actual voltage divider and battery
  float voltage = rawValue * (3.3 / 4095.0) * 2; // Assuming a 1:1 voltage divider
  int percentage = map(voltage * 100, 320, 420, 0, 100); // Map 3.2V-4.2V to 0-100%
  
  // Constrain to valid range
  percentage = constrain(percentage, 0, 100);
  
  return percentage;
  
  // If you don't have battery monitoring, you can return a fixed value or remove this
  // return 100; // Simulated 100% battery
}

// Function to report device health including battery level
void reportDeviceHealth() {
  if (!isRegistered) {
    Serial.println("Device not registered. Cannot send health report.");
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot send health report.");
    return;
  }

  HTTPClient http;
  
  String url = String(apiUrl) + "/devices/" + String(deviceId) + "/health";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Get battery level
  int batteryLevel = getBatteryLevel();
  
  // Create JSON payload with battery level and other device info
  String jsonPayload = "{";
  jsonPayload += "\"clerk_id\":\"" + clerkId + "\",";
  jsonPayload += "\"battery_level\":" + String(batteryLevel) + ",";
  jsonPayload += "\"signal_strength\":" + String(WiFi.RSSI()) + ",";
  jsonPayload += "\"firmware_version\":\"1.0.0\"";
  jsonPayload += "}";
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    Serial.print("Health report sent, response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Battery level reported: ");
    Serial.println(batteryLevel);
  } else {
    Serial.print("Error sending health report: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}

/*
void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect to WiFi. Will retry later.");
  }
}
*/

void connectToWiFi() {
  // Create a local instance of the ECE140_WIFI class.
  ECE140_WIFI wifi;

  // Call the enterprise connection method using the local object.
  // The ECE140_WIFI class will handle the connection logic and serial output.
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

void sendOpenNotificationToServer() {
  if (!isRegistered) {
    Serial.println("Device not registered. Cannot send notification.");
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot send notification.");
    connectToWiFi(); 
    if (WiFi.status() != WL_CONNECTED) return;
  }

  if (millis() - lastHttpNotificationTime < httpNotificationCooldown) {
    Serial.println("Notification cooldown active. Skipping sending notification.");
    return;
  }
  lastHttpNotificationTime = millis();

  HTTPClient http;

  String url = String(apiUrl) + "/iot/report?d=" + String(deviceId) + "&e=o";
  Serial.print("Sending mailbox open notification to: ");
  Serial.println(url);
  
  http.begin(url);
  int httpResponseCode = http.GET();

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.println(response);
  } else {
    Serial.print("Error sending notification: ");
    Serial.println(httpResponseCode);
    Serial.printf("HTTP error: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  http.end();
  
  // Update device heartbeat
  sendHeartbeat();
}

void sendCloseNotificationToServer() {
  if (!isRegistered) {
    Serial.println("Device not registered. Cannot send close notification.");
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot send close notification.");
    return;
  }

  HTTPClient http;

  String url = String(apiUrl) + "/iot/report?d=" + String(deviceId) + "&e=c";
  Serial.print("Sending mailbox close notification to: ");
  Serial.println(url);
  
  http.begin(url);
  int httpResponseCode = http.GET();

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code (close event): ");
    Serial.println(httpResponseCode);
    Serial.println(response);
  } else {
    Serial.print("Error sending notification (close event): ");
    Serial.println(httpResponseCode);
    Serial.printf("HTTP error: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

// Function to send periodic heartbeat to the server
void sendHeartbeat() {
  if (!isRegistered) {
    Serial.println("Device not registered. Cannot send heartbeat.");
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot send heartbeat.");
    return;
  }

  HTTPClient http;
  
  // Using POST for heartbeat as specified in the API
  String url = String(apiUrl) + "/devices/" + String(deviceId) + "/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  String jsonPayload = "{\"clerk_id\":\"" + clerkId + "\"}";
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    Serial.print("Heartbeat sent, response code: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Error sending heartbeat: ");
    Serial.println(httpResponseCode);
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
        sendOpenNotificationToServer();
    }

  } else { 
    if (previousUserReedState == 1 && currentUserReedState == 0) {
        Serial.println("INFO: Mailbox State CHANGED from 1 to 0. (If 0 is now 'CLOSED' for events, this is 'JUST CLOSED')");
        sendCloseNotificationToServer();
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

  // Get device credentials from backend
  if (getDeviceCredentials()) {
    Serial.println("Device registered successfully!");
  } else {
    Serial.println("Device registration failed. Will retry later.");
  }

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
  // Try to register if not registered yet
  if (!isRegistered && WiFi.status() == WL_CONNECTED && millis() % 60000 == 0) {
    Serial.println("Attempting to register device...");
    getDeviceCredentials();
  }

  if (isRegistered) {
    if (millis() - lastReedCheckTime >= reedCheckInterval) {
      lastReedCheckTime = millis();
      checkReedSwitchAndTriggerCam();
    }
    
    // Send heartbeat every 5 minutes
    static unsigned long lastHeartbeatTime = 0;
    if (millis() - lastHeartbeatTime >= 300000) { // 5 minutes = 300,000 ms
      lastHeartbeatTime = millis();
      sendHeartbeat();
    }
    
    // Send health report every hour
    static unsigned long lastHealthReportTime = 0;
    if (millis() - lastHealthReportTime >= 3600000) { // 1 hour = 3,600,000 ms
      lastHealthReportTime = millis();
      reportDeviceHealth();
    }
  }
  
  if (WiFi.status() != WL_CONNECTED && millis() % 30000 == 0) { 
    Serial.println("WiFi disconnected. Attempting to reconnect...");
    connectToWiFi();
  }
}
