/*
 * ESP32-CAM Main Code for Mail Guard System
 * This code is adapted from a tutorial by Rui Santos, Random Nerd Tutorials
 * and has been repurposed for the MailGuard API endpoint.
 * Original project details at:
 * https://RandomNerdTutorials.com/esp32-cam-http-post-php-arduino/
 */

// Required Libraries
#include "ECE140_WIFI.h"
#include "esp_camera.h"
#include "soc/rtc_cntl_reg.h"
#include "soc/soc.h"
#include <Arduino.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "time.h"

// === DEVICE CONFIGURATION ===
const char *API_BASE_URL = "https://mail-guard-ten.vercel.app";
const char *API_UPLOAD_PATH = "/api/iot/upload";
const char *IOT_API_KEY = "iot_your_device_api_key_here"; // Replace with actual API key
const char *DEVICE_SERIAL = "ESP32_001"; // Used for device identification
const char *FIRMWARE_VERSION = "1.2.0";
const int serverPort = 443; // HTTPS port

// === WiFi CONFIGURATION ===
const char *ssid = "冰小六";
const char *password = "";

// Pin definition for AI-THINKER Model (and ESP32-S)
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

// Communication with ESP32 main
HardwareSerial MainSerial(1);

// NTP Time configuration
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 0;

void sendPhoto(); // Forward declaration
ECE140_WIFI wifi_conn;

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

int getSignalStrength() {
  return WiFi.RSSI();
}

void setup() {
  // Disable brownout detector for stability
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  while (!Serial) {
    delay(10);
  }
  
  Serial.println("=================================");
  Serial.println("MailGuard ESP32-CAM Starting...");
  Serial.println("Firmware: " + String(FIRMWARE_VERSION));
  Serial.println("Device: " + String(DEVICE_SERIAL));
  Serial.println("=================================");

  // Initialize Serial1 for communication with ESP32 main
  MainSerial.begin(115200, SERIAL_8N1, 13, 12);
  Serial.println("[Serial] Communication with main ESP32 initialized");

  // Connect to Wi-Fi using ECE140_WIFI class
  Serial.println("[WiFi] Connecting to WiFi...");
  try {
    wifi_conn.connectToWiFi(ssid, password);

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("[WiFi] Connected successfully!");
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
      delay(5000);
      ESP.restart();
    }
  } catch (...) {
    Serial.println("[WiFi] Connection error occurred!");
    delay(5000);
    ESP.restart();
  }

  // Configure Camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // Check if PSRAM is available to determine frame size and quality
  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA; // 640x480
    config.jpeg_quality = 10;          // Good quality
    config.fb_count = 2;
    Serial.println("[Camera] PSRAM found, using VGA resolution");
  } else {
    config.frame_size = FRAMESIZE_QQVGA; // 160x120 - smallest resolution
    config.jpeg_quality = 20;            // Lower quality to reduce memory
    config.fb_count = 1;                 // Single frame buffer
    config.fb_location = CAMERA_FB_IN_DRAM; // Force to use DRAM
    Serial.println("[Camera] No PSRAM, using QQVGA resolution for low memory");
  }

  // Initialize the camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[Camera] Init failed with error 0x%x\n", err);
    delay(1000);
    ESP.restart();
  }
  Serial.println("[Camera] Initialized successfully");
  Serial.println("[Setup] Ready and waiting for photo trigger commands...");
}

void loop() {
  // Check WiFi connection status
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Disconnected! Attempting to reconnect...");
    wifi_conn.connectToWiFi(ssid, password);
    delay(5000);
  }

  // Check for commands from ESP32 main
  if (MainSerial.available()) {
    char command = MainSerial.read();
    if (command == 'T') {
      Serial.println("[Photo] Received trigger command from main ESP32!");
      sendPhoto();
    }
  }

  // Small delay to prevent overwhelming the serial buffer
  delay(10);
}

// Function to capture a photo and send it to the server using HTTPClient
void sendPhoto() {
  Serial.println("[Photo] Starting capture and upload...");

  // Check WiFi before attempting to send
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Photo] WiFi not connected, cannot send photo");
    MainSerial.print('F'); // Send failure response
    return;
  }

  camera_fb_t *fb = NULL;
  fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("[Photo] Camera capture failed");
    MainSerial.print('F'); // Send failure response to ESP32 main
    return;
  }

  Serial.printf("[Photo] Captured, size: %d bytes\n", fb->len);
  
  // Validate image size (max 10MB as per API docs)
  if (fb->len > 10 * 1024 * 1024) {
    Serial.println("[Photo] Image too large, rejecting");
    esp_camera_fb_return(fb);
    MainSerial.print('F');
    return;
  }

  HTTPClient http;
  String url = String(API_BASE_URL) + String(API_UPLOAD_PATH);
  
  Serial.println("[Photo] Uploading to: " + url);

  http.begin(url);
  
  // Add authentication and headers
  http.addHeader("Authorization", "Bearer " + String(IOT_API_KEY));
  http.addHeader("User-Agent", "MailGuard-ESP32CAM/" + String(FIRMWARE_VERSION));

  // Create multipart form data
  String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  String contentType = "multipart/form-data; boundary=" + boundary;
  
  // Build form data
  String formStart = "--" + boundary + "\r\n";
  
  // Add serial number field
  formStart += "Content-Disposition: form-data; name=\"serial_number\"\r\n\r\n";
  formStart += String(DEVICE_SERIAL) + "\r\n";
  formStart += "--" + boundary + "\r\n";
  
  // Add file type field
  formStart += "Content-Disposition: form-data; name=\"file_type\"\r\n\r\n";
  formStart += "image\r\n";
  formStart += "--" + boundary + "\r\n";
  
  // Add timestamp field
  formStart += "Content-Disposition: form-data; name=\"timestamp\"\r\n\r\n";
  formStart += getCurrentISOTimestamp() + "\r\n";
  formStart += "--" + boundary + "\r\n";
  
  // Add file field header
  formStart += "Content-Disposition: form-data; name=\"file\"; filename=\"mailbox_";
  formStart += getCurrentISOTimestamp() + ".jpg\"\r\n";
  formStart += "Content-Type: image/jpeg\r\n\r\n";

  String formEnd = "\r\n--" + boundary + "--\r\n";

  // Calculate total content length
  size_t totalLength = formStart.length() + fb->len + formEnd.length();
  
  // Create complete payload
  uint8_t* payload = (uint8_t*)malloc(totalLength);
  if (!payload) {
    Serial.println("[Photo] Failed to allocate memory for upload");
    esp_camera_fb_return(fb);
    MainSerial.print('F');
    return;
  }
  
  // Copy form data
  size_t offset = 0;
  memcpy(payload + offset, formStart.c_str(), formStart.length());
  offset += formStart.length();
  
  memcpy(payload + offset, fb->buf, fb->len);
  offset += fb->len;
  
  memcpy(payload + offset, formEnd.c_str(), formEnd.length());
  
  // Set content type and length
  http.addHeader("Content-Type", contentType);
  http.addHeader("Content-Length", String(totalLength));

  Serial.println("[Photo] Sending HTTP POST...");
  int httpResponseCode = http.POST(payload, totalLength);
  
  // Clean up
  free(payload);
  esp_camera_fb_return(fb);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("[Photo] Response code: %d\n", httpResponseCode);
    Serial.println("[Photo] Response: " + response);

    if (httpResponseCode >= 200 && httpResponseCode < 300) {
      Serial.println("[Photo] Upload successful!");
      MainSerial.print('S'); // Send success response to ESP32 main
    } else {
      Serial.println("[Photo] Upload failed - server error");
      MainSerial.print('F'); // Send failure response to ESP32 main
    }
  } else {
    Serial.printf("[Photo] HTTP error: %s\n", http.errorToString(httpResponseCode).c_str());
    MainSerial.print('F'); // Send failure response to ESP32 main
  }

  http.end();
}