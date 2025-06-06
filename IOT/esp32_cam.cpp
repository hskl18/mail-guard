#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino.h>

#include "ECE140_WIFI.h"

const char* ssid = WIFI_SSID;
const char* user = WIFI_USER;
const char* password = WIFI_PASSWORD;
 
// Use the same API URL as in the main ESP32 code
const char* apiUrl = "https://pp7vqzu57gptbbb3m5m3untjgm0iyylm.lambda-url.us-west-1.on.aws";

// Device identification - this should match the one in main ESP32
const char* SERIES_ID = "ESP32_001";
int deviceId = -1; // Will be populated after device registration

// Legacy variables kept for backward compatibility
const char* serverIpAddress = SERVER_IP; 
const char* serverPortChar = SERVER_PORT;
const int serverPort = atoi(serverPortChar);
String imageUploadUrl; 

unsigned long lastTriggerTime = 0;
const unsigned long triggerCooldown = 5000;

// Function to get device ID from the backend using SERIES_ID
bool getDeviceId() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot get device ID.");
    return false;
  }

  HTTPClient http;
  
  // Call the endpoint that gets device info from Series ID
  String url = String(apiUrl) + "/device/lookup?serial_id=" + String(SERIES_ID);
  Serial.print("Getting device ID from: ");
  Serial.println(url);
  
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Response received:");
    Serial.println(response);
    
    // Basic parsing for device_id (simplified compared to main ESP32)
    int startIdx = response.indexOf("\"device_id\":");
    if (startIdx > 0) {
      startIdx += 11; // Length of "device_id":
      int endIdx = response.indexOf(",", startIdx);
      if (endIdx < 0) endIdx = response.indexOf("}", startIdx);
      
      if (endIdx > startIdx) {
        String deviceIdStr = response.substring(startIdx, endIdx);
        deviceIdStr.trim();
        deviceId = deviceIdStr.toInt();
        
        Serial.print("Device ID: ");
        Serial.println(deviceId);
        return true;
      }
    }
    Serial.println("Failed to parse device_id from response");
  } else {
    Serial.print("Error getting device ID: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
  return false;
}

void setup() {
  Serial.begin(115200);

  /*
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  */

  Serial.println("[esp32_cam] Attempting to connect to Enterprise WiFi...");

  // Create a local instance of the ECE140_WIFI class
  ECE140_WIFI wifi; 

  // Connect using the connectToWPAEnterprise method
  // It uses the global 'ssid', 'user', and 'password' variables defined at the top of this file.
  wifi.connectToWPAEnterprise(ssid, user, password);

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[esp32_cam] WiFi connected successfully!");
    Serial.print("[esp32_cam] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[esp32_cam] WiFi connection failed. Please check credentials and network setup.");
  }


  // Try to get device ID
  if (!getDeviceId()) {
    Serial.println("Failed to get device ID. Will use legacy upload URL.");
    // Fall back to legacy URL format if device ID cannot be obtained
    imageUploadUrl = "http://" + String(serverIpAddress) + ":" + String(serverPort) + "/upload";
  } else {
    // Use the correct API endpoint without query parameters
    imageUploadUrl = String(apiUrl) + "/mailbox/images";
  }
  
  Serial.print("Image Upload URL configured to: ");
  Serial.println(imageUploadUrl);

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = 5;
  config.pin_d1 = 18;
  config.pin_d2 = 19;
  config.pin_d3 = 21;
  config.pin_d4 = 36;
  config.pin_d5 = 39;
  config.pin_d6 = 34;
  config.pin_d7 = 35;
  config.pin_xclk = 0;
  config.pin_pclk = 22;
  config.pin_vsync = 25;
  config.pin_href = 23;
  config.pin_sccb_sda = 26;
  config.pin_sccb_scl = 27;
  config.pin_pwdn = 32;
  config.pin_reset = -1;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_QVGA; 
  config.jpeg_quality = 12;
  config.fb_count = 1;
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return;
  }
  Serial.println("Camera initialized");
}

void captureAndSendPhotoToServer();

void loop() {
  if (Serial.available() > 0) {
    char triggerCommand = Serial.read();
    if (triggerCommand == 'T') {
      if (millis() - lastTriggerTime > triggerCooldown) {
        lastTriggerTime = millis();
        Serial.println("Trigger received. Taking photo and sending to server...");
        captureAndSendPhotoToServer();
      } else {
        Serial.println("Trigger received too soon. Ignoring.");
      }
    }
  }
}


void captureAndSendPhotoToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot send photo.");
    return;
  }

  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  HTTPClient http;
  WiFiClient client;

  if (imageUploadUrl == "") {
    Serial.println("Image Upload URL is not set. Skipping send.");
    if (fb) esp_camera_fb_return(fb);
    return;
  }

  Serial.print("Sending image to: ");
  Serial.println(imageUploadUrl);

  http.begin(client, imageUploadUrl);

  // --- Start of Fix ---

  // 1. Define the boundary and Content-Type header
  String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  String contentType = "multipart/form-data; boundary=" + boundary;
  http.addHeader("Content-Type", contentType);

  // 2. Manually construct the multipart form data body
  String head = "--" + boundary + "\r\nContent-Disposition: form-data; name=\"device_id\"\r\n\r\n" +
                String(deviceId) + "\r\n" +
                "--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"esp32cam.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
  String tail = "\r\n--" + boundary + "--\r\n";

  // 3. Create a single buffer for the entire payload
  size_t totalLen = head.length() + fb->len + tail.length();
  uint8_t *payload = new uint8_t[totalLen];
  if (!payload) {
    Serial.println("Failed to allocate memory for payload");
    esp_camera_fb_return(fb);
    http.end();
    return;
  }

  // 4. Copy all parts (head, image, tail) into the buffer
  char* payload_ptr = (char*)payload;
  memcpy(payload_ptr, head.c_str(), head.length());
  payload_ptr += head.length();
  memcpy(payload_ptr, fb->buf, fb->len);
  payload_ptr += fb->len;
  memcpy(payload_ptr, tail.c_str(), tail.length());


  // 5. Send the entire payload with http.POST()
  int httpResponseCode = http.POST(payload, totalLen);
  
  // 6. Clean up the allocated memory
  delete[] payload;

  // --- End of Fix ---

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.println(response);
  } else {
    Serial.print("Error on sending POST: ");
    Serial.println(httpResponseCode);
    Serial.printf("HTTP error: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
  esp_camera_fb_return(fb);
}


/*
void captureAndSendPhotoToServer() {
  if(WiFi.status() != WL_CONNECTED){
    Serial.println("WiFi not connected. Cannot send photo.");
    return;
  }

  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  HTTPClient http;
  WiFiClient client; 

  if (imageUploadUrl == "") { 
    Serial.println("Image Upload URL is not set. Skipping send.");
    if (fb) esp_camera_fb_return(fb);
    return;
  }

  Serial.print("Sending image to: ");
  Serial.println(imageUploadUrl);
  
  // For HTTPS URLs, we need to use a secure client instead
  if (imageUploadUrl.startsWith("https://")) {
    Serial.println("HTTPS URL detected, but ESP32-CAM doesn't support HTTPS without additional libraries.");
    Serial.println("Will use HTTP instead. Make sure your API supports HTTP uploads.");
    // In a real-world scenario, you'd want to use WiFiClientSecure with certificates
  }
  
  http.begin(client, imageUploadUrl); 
  
  // The API expects multipart form data with fields for 'device_id' and 'file'
  String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  String contentType = "multipart/form-data; boundary=" + boundary;
  http.addHeader("Content-Type", contentType);
  
  // Create the multipart form data manually with device_id field first
  String head = "--" + boundary + "\r\nContent-Disposition: form-data; name=\"device_id\"\r\n\r\n" + 
                String(deviceId) + "\r\n" +
                "--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"esp32cam.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
  String tail = "\r\n--" + boundary + "--\r\n";
  
  // Calculate the total size for Content-Length header
  uint32_t imageLen = fb->len;
  uint32_t totalLen = head.length() + imageLen + tail.length();
  http.addHeader("Content-Length", String(totalLen));
  
  // Use beginRequest/write instead of POST for more control
  http.beginRequest();
  http.write((uint8_t*)head.c_str(), head.length());
  http.write(fb->buf, fb->len);
  http.write((uint8_t*)tail.c_str(), tail.length());
  
  // Get the response
  int httpResponseCode = http.endRequest();

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.println(response);
  } else {
    Serial.print("Error on sending POST: ");
    Serial.println(httpResponseCode);
    Serial.printf("HTTP error: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
  esp_camera_fb_return(fb);
}
*/