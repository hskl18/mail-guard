#include <Arduino.h>
#include <HardwareSerial.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "ECE140_WIFI.h"

const char* standard_ssid = "YOUR_STANDARD_WIFI_SSID";
const char* standard_password = "YOUR_STANDARD_WIFI_PASSWORD";

const char* enterprise_ssid = "UCSD-PROTECTED";
const char* enterprise_username = "";
const char* enterprise_password = "";

const char* SERIES_ID = "ESP32_001";
const char* apiUrl = "https://pp7vqzu57gptbbb3m5m3untjgm0iyylm.lambda-url.us-west-1.on.aws";

int deviceId = -1;
String clerkId = "";
bool isRegistered = false;

const int REED_SW_PIN = 2;
const int BATTERY_PIN = 34;
HardwareSerial CamSerial(2);

int previousUserReedState = 1;
unsigned long lastReedCheckTime = 0;
const unsigned long reedCheckInterval = 2000;
unsigned long lastHttpNotificationTime = 0;
const unsigned long httpNotificationCooldown = 5000;

void connectToWiFi();
bool getDeviceCredentials();
int getBatteryLevel();
void reportDeviceHealth();
void sendOpenNotificationToServer();
void sendCloseNotificationToServer();
void sendHeartbeat();
void checkReedSwitchAndTriggerCam();

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    delay(10);
  }
  Serial.println("Main ESP32 Reed Switch Controller Starting...");

  connectToWiFi();

  pinMode(REED_SW_PIN, INPUT_PULLUP);
  
  if (WiFi.status() == WL_CONNECTED) {
    if (getDeviceCredentials()) {
      Serial.println("Device registered successfully!");
    } else {
      Serial.println("Device registration failed. Will retry later.");
    }
  }

  CamSerial.begin(115200, SERIAL_8N1, 16, 17);
  Serial.println("Serial2 for CAM communication initialized.");

  int rawInitialState = digitalRead(REED_SW_PIN);
  previousUserReedState = (rawInitialState == HIGH) ? 0 : 1;
  Serial.print("Initial Reed State (0=open, 1=closed): ");
  Serial.println(previousUserReedState);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Attempting to reconnect...");
    connectToWiFi();
    delay(10000);
    return;
  }

  if (!isRegistered && (millis() % 60000 == 0)) {
    Serial.println("Attempting to register device...");
    getDeviceCredentials();
  }

  if (isRegistered) {
    if (millis() - lastReedCheckTime >= reedCheckInterval) {
      lastReedCheckTime = millis();
      checkReedSwitchAndTriggerCam();
    }
    
    static unsigned long lastHeartbeatTime = 0;
    if (millis() - lastHeartbeatTime >= 300000) {
      lastHeartbeatTime = millis();
      sendHeartbeat();
    }
    
    static unsigned long lastHealthReportTime = 0;
    if (millis() - lastHealthReportTime >= 3600000) {
      lastHealthReportTime = millis();
      reportDeviceHealth();
    }
  }
}

void connectToWiFi() {
  ECE140_WIFI wifi;
  bool connected = false;

  if (strlen(enterprise_username) > 0 && strlen(enterprise_password) > 0) {
    Serial.println("Attempting WPA2-Enterprise connection...");
    connected = wifi.connectToWPAEnterprise(enterprise_ssid, enterprise_username, enterprise_password);
  } else {
    Serial.println("Attempting standard Wi-Fi connection...");
    connected = wifi.connectToWiFi(standard_ssid, standard_password);
  }

  if (!connected) {
    Serial.println("FATAL: Could not connect to any Wi-Fi network. Restarting in 10 seconds...");
    delay(10000);
    ESP.restart();
  }
}

bool getDeviceCredentials() {
  if (WiFi.status() != WL_CONNECTED) return false;
  HTTPClient http;
  String url = String(apiUrl) + "/device/lookup?serial_id=" + String(SERIES_ID);
  http.begin(url);
  int httpResponseCode = http.GET();
  if (httpResponseCode == 200) {
    String response = http.getString();
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, response);
    if (!error && doc.containsKey("device_id") && doc.containsKey("clerk_id")) {
      deviceId = doc["device_id"];
      clerkId = doc["clerk_id"].as<String>();
      isRegistered = true;
      http.end();
      return true;
    }
  }
  http.end();
  return false;
}

int getBatteryLevel() {
  int rawValue = analogRead(BATTERY_PIN);
  float voltage = rawValue * (3.3 / 4095.0) * 2;
  int percentage = map(voltage * 100, 320, 420, 0, 100);
  return constrain(percentage, 0, 100);
}

void reportDeviceHealth() {
  if (!isRegistered || WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  String url = String(apiUrl) + "/devices/" + String(deviceId) + "/health";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int batteryLevel = getBatteryLevel();
  String jsonPayload = "{\"clerk_id\":\"" + clerkId + "\",\"battery_level\":" + String(batteryLevel) + "}";
  http.POST(jsonPayload);
  http.end();
}

void sendOpenNotificationToServer() {
  if (!isRegistered || WiFi.status() != WL_CONNECTED) return;
  if (millis() - lastHttpNotificationTime < httpNotificationCooldown) return;
  lastHttpNotificationTime = millis();
  HTTPClient http;
  String url = String(apiUrl) + "/iot/report?d=" + String(deviceId) + "&e=o";
  http.begin(url);
  http.GET();
  http.end();
  sendHeartbeat();
}

void sendCloseNotificationToServer() {
  if (!isRegistered || WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  String url = String(apiUrl) + "/iot/report?d=" + String(deviceId) + "&e=c";
  http.begin(url);
  http.GET();
  http.end();
}

void sendHeartbeat() {
  if (!isRegistered || WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  String url = String(apiUrl) + "/devices/" + String(deviceId) + "/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  String jsonPayload = "{\"clerk_id\":\"" + clerkId + "\"}";
  http.POST(jsonPayload);
  http.end();
}

void checkReedSwitchAndTriggerCam() {
  int rawPinValue = digitalRead(REED_SW_PIN);
  int currentUserReedState = (rawPinValue == HIGH) ? 0 : 1;

  if (currentUserReedState == 1 && previousUserReedState == 0) {
    Serial.println("EVENT: Mailbox JUST OPENED. Triggering camera and notification.");
    CamSerial.print('T');
    sendOpenNotificationToServer();
  } else if (currentUserReedState == 0 && previousUserReedState == 1) {
    Serial.println("EVENT: Mailbox JUST CLOSED.");
    sendCloseNotificationToServer();
  }
  previousUserReedState = currentUserReedState;
}