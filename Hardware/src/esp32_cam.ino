#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino.h>

const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;
 
const char* serverIpAddress = SERVER_IP; 
const int serverPort = SERVER_PORT;
String imageUploadUrl; 

unsigned long lastTriggerTime = 0;
const unsigned long triggerCooldown = 5000;

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  imageUploadUrl = "http://" + String(serverIpAddress) + ":" + String(serverPort) + "/upload";
  Serial.print("Server Image Upload URL configured to: ");
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
  http.begin(client, imageUploadUrl); 


  http.addHeader("Content-Type", "image/jpeg");
  
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
