#include <Arduino.h>
#include <HardwareSerial.h>
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;
 
const char* serverIpAddress = SERVER_IP; 
const int serverPort = SERVER_PORT;
String notificationUrl;

const int REED_SW_PIN = 2;
HardwareSerial CamSerial(2);

int previousUserReedState = 1; 
unsigned long lastReedCheckTime = 0;
const unsigned long reedCheckInterval = 2000;
unsigned long lastHttpNotificationTime = 0;
const unsigned long httpNotificationCooldown = 5000; 

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

void sendOpenNotificationToServer() {
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
  WiFiClient client; 

  if (notificationUrl == "") { 
    Serial.println("Notification URL is not set. Skipping notification.");
    return;
  }

  Serial.print("Sending open notification to: ");
  Serial.println(notificationUrl);
  http.begin(client, notificationUrl); 

  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{\"event\":\"mailbox_opened\", \"deviceId\":\"main_esp32_controller\"}";
  
  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.println(response);
  } else {
    Serial.print("Error sending POST notification: ");
    Serial.println(httpResponseCode);
    Serial.printf("HTTP error: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

void sendCloseNotificationToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot send close notification.");
    return;
  }


  HTTPClient http;
  WiFiClient client; 

  if (notificationUrl == "") { 
      Serial.println("Notification URL is not set. Skipping close notification.");
      return;
  }

  Serial.print("Sending close notification to: ");
  Serial.println(notificationUrl);
  http.begin(client, notificationUrl); 

  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{\"event\":\"mailbox_closed\", \"deviceId\":\"main_esp32_controller\"}"; 

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code (close event): ");
    Serial.println(httpResponseCode);
    Serial.println(response);
  } else {
    Serial.print("Error sending POST notification (close event): ");
    Serial.println(httpResponseCode);
    Serial.printf("HTTP error: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}


void setup() {
  Serial.begin(115200);
  while (!Serial) {
    delay(10);
  }
  Serial.println("Main ESP32 Reed Switch Controller Starting...");

  pinMode(REED_SW_PIN, INPUT_PULLUP);
  
  connectToWiFi();

  notificationUrl = "http://" + String(serverIpAddress) + ":" + String(serverPort) + "/event";
  Serial.print("Server Notification URL configured to: ");
  Serial.println(notificationUrl);


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
