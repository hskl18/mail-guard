#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include "HX711.h"

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";
const char* serverUrl = "http://YOUR_PC_IP:5000/upload";

#define DOUT 13
#define CLK 12

HX711 scale;
float lastWeight = 0.0;
float weightThreshold = 5.0;
bool boxOpen = false;
unsigned long lastTrigger = 0;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);

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
  config.pin_sscb_sda = 26;
  config.pin_sscb_scl = 27;
  config.pin_pwdn = 32;
  config.pin_reset = -1;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_QVGA;
  config.jpeg_quality = 10;
  config.fb_count = 1;

  esp_camera_init(&config);

  scale.begin(DOUT, CLK);
  scale.set_scale();
  scale.tare();
}

void loop() {
  float weight = scale.get_units();
  if (abs(weight - lastWeight) > weightThreshold) {
    if (millis() - lastTrigger > 5000) {
      lastTrigger = millis();
      sendPhoto(weight);
      lastWeight = weight;
    }
  }
}

void sendPhoto(float weight) {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) return;

  WiFiClient client;
  HTTPClient http;
  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("weight", String(weight));

  http.POST(fb->buf, fb->len);
  http.end();
  esp_camera_fb_return(fb);
}