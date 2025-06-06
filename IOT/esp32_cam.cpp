#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino.h>
#include <WiFiManager.h> 
const char* apiUrl = "https://pp7vqzu57gptbbb3m5m3untjgm0iyylm.lambda-url.us-west-1.on.aws";
const char* SERIES_ID = "ESP32_001";
int deviceId = -1;
String imageUploadUrl;

unsigned long lastTriggerTime = 0;
const unsigned long triggerCooldown = 5000;

bool getDeviceId() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot get device ID.");
    return false;
  }
  HTTPClient http;
  String url = String(apiUrl) + "/device/lookup?serial_id=" + String(SERIES_ID);
  Serial.print("Getting device ID from: ");
  Serial.println(url);
  
  http.begin(url);
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Response received:");
    Serial.println(response);
    
    int startIdx = response.indexOf("\"device_id\":");
    if (startIdx > 0) {
      startIdx += 11;
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
  Serial.println("\n[esp32_cam] Initializing...");
  WiFiManager wm;
  wm.setConfigPortalTimeout(180);
  if (!wm.autoConnect("MailGuard-CAM-Setup")) {
    Serial.println("Failed to connect and hit timeout. Restarting...");
    delay(3000);
    ESP.restart();
  }
  Serial.println("\n[esp32_cam] WiFi connected successfully via WiFiManager!");
  Serial.print("[esp32_cam] IP Address: ");
  Serial.println(WiFi.localIP());
  if (!getDeviceId()) {
    Serial.println("Failed to get device ID. Image uploads may not be linked correctly.");
    imageUploadUrl = String(apiUrl) + "/mailbox/images"; 
  } else {
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

void captureAndSendPhotoToServer(); // Forward declaration

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

// This function remains unchanged
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
  
  if (imageUploadUrl == "") { 
    Serial.println("Image Upload URL is not set. Skipping send.");
    if (fb) esp_camera_fb_return(fb);
    return;
  }

  Serial.print("Sending image to: ");
  Serial.println(imageUploadUrl);
  
  http.begin(imageUploadUrl); 
  
  String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
  
  String head = "--" + boundary + "\r\nContent-Disposition: form-data; name=\"device_id\"\r\n\r\n" + 
                String(deviceId) + "\r\n" +
                "--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"esp32cam.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
  String tail = "\r\n--" + boundary + "--\r\n";
  
  uint32_t totalLen = head.length() + fb->len + tail.length();
  
  // Send the request with the multipart body
  int httpResponseCode = http.sendRequest("POST", (uint8_t*)head.c_str(), head.length());
  if(httpResponseCode == 0) http.write(fb->buf, fb->len);
  if(httpResponseCode == 0) http.write((uint8_t*)tail.c_str(), tail.length());
  if(httpResponseCode == 0) httpResponseCode = http.endRequest();


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