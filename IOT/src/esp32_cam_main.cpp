/*
 * ESP32-CAM Main Code for Mail Guard System
 * This code is adapted from a tutorial by Rui Santos, Random Nerd Tutorials
 * and has been repurposed for a specific API endpoint.
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

// --- START: YOUR CONFIGURATION ---

// Replace with your WiFi network credentials
// const char *ssid = WIFI_SSID;
// const char *username = WIFI_USER;
// const char *password = WIFI_PASSWORD;

const char *ssid = "冰小六";
const char *password = "";

// Your API and Device Details
const char *serverName = "mail-guard-ten.vercel.app";
const char *serverPath = "/api/iot/upload";
const char *SERIAL_NUMBER = "ESP32_001"; // Used for X-Device-ID header
const int serverPort = 443;              // HTTPS port

// --- END: YOUR CONFIGURATION ---

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

void sendPhoto(); // Forward declaration
ECE140_WIFI wifi_conn;

void setup() {
  // Disable brownout detector for stability
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  while (!Serial) {
    delay(10);
  }
  Serial.println("ESP32-CAM starting up...");

  // Initialize Serial1 for communication with ESP32 main
  MainSerial.begin(115200, SERIAL_8N1, 13, 12);
  Serial.println(
      "ESP32-CAM: Serial1 communication with main ESP32 initialized.");

  // Connect to Wi-Fi using ECE140_WIFI class
  Serial.println("ESP32-CAM: Connecting to WiFi...");
  try {
    wifi_conn.connectToWiFi(ssid, password);

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("ESP32-CAM: WiFi connected successfully!");
      Serial.print("ESP32-CAM IP Address: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("ESP32-CAM: WiFi connection failed!");
      // Try to restart and reconnect
      delay(5000);
      ESP.restart();
    }
  } catch (...) {
    Serial.println("ESP32-CAM: WiFi connection error occurred!");
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
    Serial.println("ESP32-CAM: PSRAM found, using VGA resolution");
  } else {
    config.frame_size = FRAMESIZE_QQVGA; // 160x120 - smallest resolution
    config.jpeg_quality = 20;            // Lower quality to reduce memory
    config.fb_count = 1;                 // Single frame buffer
    config.fb_location = CAMERA_FB_IN_DRAM; // Force to use DRAM
    Serial.println("ESP32-CAM: No PSRAM, using QQVGA resolution for low memory");
  }

  // Initialize the camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("ESP32-CAM: Camera init failed with error 0x%x\n", err);
    delay(1000);
    ESP.restart();
  }
  Serial.println("ESP32-CAM: Camera initialized successfully.");
  Serial.println("ESP32-CAM: Ready and waiting for photo trigger commands...");
}

void loop() {
  // Check WiFi connection status
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("ESP32-CAM: WiFi disconnected! Attempting to reconnect...");
    wifi_conn.connectToWiFi(ssid, password);
    delay(5000);
  }

  // Check for commands from ESP32 main
  if (MainSerial.available()) {
    char command = MainSerial.read();
    if (command == 'T') {
      Serial.println(
          "ESP32-CAM: Received photo trigger command from ESP32 main!");
      sendPhoto();
    }
  }

  // Small delay to prevent overwhelming the serial buffer
  delay(10);
}

// Function to capture a photo and send it to the server with all required form
// fields
void sendPhoto() {
  Serial.println("ESP32-CAM: Starting photo capture and upload...");

  // Check WiFi before attempting to send
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("ESP32-CAM: WiFi not connected, cannot send photo");
    MainSerial.print('F'); // Send failure response
    return;
  }

  camera_fb_t *fb = NULL;
  fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("ESP32-CAM: Camera capture failed");
    MainSerial.print('F'); // Send failure response to ESP32 main
    return;
  }

  Serial.printf("ESP32-CAM: Photo captured, size: %d bytes\n", fb->len);
  Serial.println("ESP32-CAM: Preparing to upload...");

  WiFiClientSecure client;
  client.setInsecure(); // For testing, bypass SSL certificate validation

  Serial.printf("ESP32-CAM: Connecting to %s:%d\n", serverName, serverPort);

  if (client.connect(serverName, serverPort)) {
    Serial.println(
        "ESP32-CAM: Server connection successful, uploading photo...");

    String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";

    // Construct the multipart form data payload
    String head =
        "--" + boundary + "\r\n" +
        "Content-Disposition: form-data; name=\"serial_number\"\r\n\r\n" +
        String(SERIAL_NUMBER) + "\r\n" + "--" + boundary + "\r\n" +
        "Content-Disposition: form-data; name=\"file\"; "
        "filename=\"esp32-cam.jpg\"\r\n" +
        "Content-Type: image/jpeg\r\n" + "\r\n";

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
    Serial.println(
        "ESP32-CAM: Upload complete, waiting for server response...");
    long startTimer = millis();
    bool uploadSuccess = false;

    while (client.connected() &&
           (millis() - startTimer < 10000)) { // 10-second timeout
      if (client.available()) {
        String line = client.readStringUntil('\n');
        Serial.println("ESP32-CAM: " + line);

        // Check for successful HTTP response
        if (line.indexOf("HTTP/1.1 200") >= 0 ||
            line.indexOf("HTTP/1.1 201") >= 0) {
          uploadSuccess = true;
        }
      }
    }
    client.stop();

    if (uploadSuccess) {
      Serial.println("ESP32-CAM: Photo upload successful!");
      MainSerial.print('S'); // Send success response to ESP32 main
    } else {
      Serial.println(
          "ESP32-CAM: Photo upload failed - no success response from server");
      MainSerial.print('F'); // Send failure response to ESP32 main
    }

  } else {
    Serial.println("ESP32-CAM: Failed to connect to server");
    esp_camera_fb_return(fb);
    MainSerial.print('F'); // Send failure response to ESP32 main
  }
}