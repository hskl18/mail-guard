/*
 * This code is adapted from a tutorial by Rui Santos, Random Nerd Tutorials
 * and has been repurposed for a specific API endpoint.
 * Original project details at:
 * https://RandomNerdTutorials.com/esp32-cam-http-post-php-arduino/
 */

// Required Libraries
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "esp_camera.h"
#include "ECE140_WIFI.h"
#include <HardwareSerial.h>

// --- START: YOUR CONFIGURATION ---

// Replace with your WiFi network credentials
const char* ssid = "UCSD-PROTECTED";
const char* username = "asanisetty";
const char* password = "#1Anfield>>>>";

// Your API and Device Details
const char* serverName = "mail-guard-ten.vercel.app";
const char* serverPath = "/api/iot/upload";
const char* SERIAL_NUMBER = "ESP32_001"; // Used for X-Device-ID header
const int serverPort = 443; // HTTPS port

// --- END: YOUR CONFIGURATION ---

// Pin definition for AI-THINKER Model (and ESP32-S)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Communication with ESP32 main
HardwareSerial MainSerial(1);

void sendPhoto(); // Forward declaration
ECE140_WIFI wifi_conn;
ECE140_WIFI wifi;

void setup() {
  // Disable brownout detector for stability
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); 
  
  Serial.begin(115200);
  
  // Initialize Serial2 for communication with ESP32 main
  //MainSerial.begin(115200, SERIAL_8N1, 16, 17);
  //Serial.println("ESP32-CAM: Serial2 communication with main ESP32 initialized.");
  MainSerial.begin(115200, SERIAL_8N1, 13, 12); 
  Serial.println("ESP32-CAM: Serial1 communication with main ESP32 initialized.");
  // Connect to Wi-Fi
  /*
  WiFi.mode(WIFI_STA);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);  
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  */
  wifi_conn.connectToWPAEnterprise(ssid, username, password);
 
  Serial.println();
  Serial.print("ESP32-CAM IP Address: ");
  Serial.println(WiFi.localIP());

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
  if(psramFound()){
    config.frame_size = FRAMESIZE_VGA; // 640x480
    config.jpeg_quality = 10;  // Good quality
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QVGA; // 320x240
    config.jpeg_quality = 12; // Lower quality for less memory
    config.fb_count = 1;
  }
  
  // Initialize the camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    delay(1000);
    ESP.restart();
  }
  Serial.println("Camera initialized successfully.");
  Serial.println("ESP32-CAM: Ready and waiting for photo trigger commands...");
}

void loop() {
  // Check for commands from ESP32 main
  if (MainSerial.available()) {
    char command = MainSerial.read();
    if (command == 'T') {
      Serial.println("ESP32-CAM: Received photo trigger command from ESP32 main!");
      sendPhoto();
    }
  }
  
  // Small delay to prevent overwhelming the serial buffer
  delay(10);
}

// Function to capture a photo and send it to the server with all required form fields
void sendPhoto() {
  Serial.println("ESP32-CAM: Starting photo capture and upload...");
  
  camera_fb_t * fb = NULL;
  fb = esp_camera_fb_get();
  if(!fb) {
    Serial.println("ESP32-CAM: Camera capture failed");
    // Send failure response to ESP32 main
    MainSerial.print('F');
    delay(1000);
    ESP.restart();
    return;
  }
  
  Serial.println("ESP32-CAM: Photo captured, preparing to upload...");

  WiFiClientSecure client;
  client.setInsecure(); // For testing, bypass SSL certificate validation

  if (client.connect(serverName, serverPort)) {
    Serial.println("ESP32-CAM: Server connection successful, uploading photo...");
    
    String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    
    // Construct the multipart form data payload
    String head = "--" + boundary + "\r\n" +
                  "Content-Disposition: form-data; name=\"serial_number\"\r\n\r\n" +
                  String(SERIAL_NUMBER) + "\r\n" +
                  "--" + boundary + "\r\n" +
                  "Content-Disposition: form-data; name=\"file\"; filename=\"esp32-cam.jpg\"\r\n" +
                  "Content-Type: image/jpeg\r\n" +
                  "\r\n";
                  
    String tail = "\r\n--" + boundary + "--\r\n";

    // Calculate the total length of the request body
    uint32_t totalLen = head.length() + fb->len + tail.length();

    // Send the main HTTP headers
    client.println("POST " + String(serverPath) + " HTTP/1.1");
    client.println("Host: " + String(serverName));
    client.println("Content-Length: " + String(totalLen));
    client.println("Content-Type: multipart/form-data; boundary=" + boundary);
    client.println();

    // Send the request body
    client.print(head);
    client.write(fb->buf, fb->len);
    client.print(tail);
    
    // Return the frame buffer to be reused
    esp_camera_fb_return(fb);
    
    // Wait for and check the server's response
    Serial.println("ESP32-CAM: Upload complete, waiting for server response...");
    long startTimer = millis();
    bool uploadSuccess = false;
    
    while (client.connected() && (millis() - startTimer < 10000)) { // 10-second timeout
      if (client.available()) {
        String line = client.readStringUntil('\n');
        Serial.println("ESP32-CAM: " + line);
        
        // Check for successful HTTP response
        if (line.indexOf("HTTP/1.1 200") >= 0 || line.indexOf("HTTP/1.1 201") >= 0) {
          uploadSuccess = true;
        }
      }
    }
    client.stop();
    
    if (uploadSuccess) {
      Serial.println("ESP32-CAM: Photo upload successful!");
      // Send success response to ESP32 main
      MainSerial.print('S');
    } else {
      Serial.println("ESP32-CAM: Photo upload failed - no success response from server");
      // Send failure response to ESP32 main
      MainSerial.print('F');
    }

  } else {
    Serial.println("ESP32-CAM: Failed to connect to server");
    esp_camera_fb_return(fb);
    // Send failure response to ESP32 main
    MainSerial.print('F');
  }
}

/*
void sendPhoto() {
  camera_fb_t * fb = NULL;
  fb = esp_camera_fb_get();
  if(!fb) {
    Serial.println("Camera capture failed");
    delay(1000);
    ESP.restart();
    return;
  }
  
  Serial.println("Preparing to send photo...");

  WiFiClientSecure client;
  HTTPClient http;

  // For testing, we'll bypass SSL certificate validation
  client.setInsecure();

  // Begin the HTTPS request
  http.begin(client, serverName, serverPort, serverPath);

  // Set headers required by your API
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Device-ID", SERIAL_NUMBER);

  // POST the image data
  int httpResponseCode = http.POST(fb->buf, fb->len);

  // Check the response
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.println("Server response: " + response);
  } else {
    Serial.print("Error on sending POST: ");
    Serial.println(httpResponseCode);
    Serial.printf("HTTP error: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  // Clean up
  http.end();
  esp_camera_fb_return(fb); // Return the frame buffer to be reused
}

*/

/*
#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Arduino.h>

#include "ECE140_WIFI.h"

HardwareSerial CamSerial(2);


const char* ucsdUsername = WIFI_USER;
const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;



//const char* user = "asanisetty";
//const char* ssid = "UCSD-PROTECTED";
//const char* password = "#1Anfield>>>>";

// Production Mail Guard API URL
const char* apiUrl = "https://mail-guard-ten.vercel.app";

// Device identification - matches the Python test script approach
const char* SERIAL_NUMBER = "ESP32_001";

unsigned long lastTriggerTime = 0;
const unsigned long triggerCooldown = 5000;

void setup() {
  Serial.begin(115200);
  CamSerial.begin(115200, SERIAL_8N1, 16, 17);


  // Now, connect to WiFi
  Serial.println("[esp32_cam] Attempting to connect to WiFi...");

  // Create a local instance of the ECE140_WIFI class
  ECE140_WIFI wifi; 

  // Connect using the connectToWiFi method
  wifi.connectToWiFi(ssid, password);

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[esp32_cam] WiFi connected successfully!");
    Serial.print("[esp32_cam] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[esp32_cam] WiFi connection failed. Please check credentials and network setup.");
  }


  Serial.println("Waiting a moment before starting camera...");
  delay(1000);

  // Initialize Camera First
  Serial.println("Initializing Camera...");
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
  config.xclk_freq_hz = 10000000;
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
  Serial.println("Camera initialized successfully.");

  

  Serial.println("ESP32 Camera ready for image uploads to Mail Guard API");
}

void captureAndSendPhotoToServer();

void loop() {
  if (CamSerial.available() > 0) {
    char triggerCommand = CamSerial.read();
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

  WiFiClientSecure client;
  client.setInsecure(); // Bypass certificate validation for this project
  HTTPClient http;

  String imageUploadUrl = String(apiUrl) + "/api/iot/upload";
  Serial.print("Sending image to: ");
  Serial.println(imageUploadUrl);

  http.begin(client, imageUploadUrl);

  // Add headers. The server uses X-Device-ID to identify the device.
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Device-ID", SERIAL_NUMBER); // Use the serial number as the device ID

  // POST the image data directly. This is memory-efficient.
  int httpResponseCode = http.POST(fb->buf, fb->len);

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

//SEPERATOR

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
}*/
