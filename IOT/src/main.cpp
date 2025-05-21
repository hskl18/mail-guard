#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>
#include "ECE140_WIFI.h"  
#include "ECE140_MQTT.h"
#include "esp_camera.h"
#include "esp_timer.h"
#include "img_converters.h"
#include "driver/gpio.h"

// Camera pins for ESP32-CAM AI-Thinker
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

// Reed switch pin
#define REED_SWITCH_PIN   13

// LED pin for status indication
#define STATUS_LED_PIN    33

// ------------------------
// Configuration Settings
// ------------------------
#define WIFI_SSID        "Fratican Night Watch -2.4Ghz"
#define WIFI_PASSWORD    "simpclub"

#define MQTT_BROKER      "b109d8c65abb4f04b2afe8ccb4d6260c.s1.eu.hivemq.cloud"
#define MQTT_PORT        8883
#define MQTT_USER        "hanbin"
#define MQTT_PASS        "Hanbin666"

// MQTT client settings
#define CLIENT_ID        "esp32-mailbox"
#define TOPIC_PREFIX     "hanbin/ece140/mailbox"

// Create an instance of the MQTT client with TLS settings
ECE140_MQTT mqtt(CLIENT_ID, TOPIC_PREFIX, MQTT_BROKER, MQTT_PORT, MQTT_USER, MQTT_PASS);

// Variables for reed switch state
bool lastReedState = false;
bool currentReedState = false;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;  // Debounce time in milliseconds

// Camera configuration
camera_config_t config;

void blinkLED(int times) {
    for(int i = 0; i < times; i++) {
        digitalWrite(STATUS_LED_PIN, HIGH);
        delay(100);
        digitalWrite(STATUS_LED_PIN, LOW);
        delay(100);
    }
}

bool setupCamera() {
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
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;

    // Initialize the camera
    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("Camera init failed with error 0x%x", err);
        return false;
    }
    return true;
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    // Initialize status LED
    pinMode(STATUS_LED_PIN, OUTPUT);
    digitalWrite(STATUS_LED_PIN, LOW);
    
    // Initialize reed switch pin
    pinMode(REED_SWITCH_PIN, INPUT_PULLUP);
    
    // Connect to WiFi
    ECE140_WIFI wifi;
    if (!wifi.connectToWiFi(WIFI_SSID, WIFI_PASSWORD)) {
        Serial.println("Failed to connect to WiFi");
        blinkLED(3);  // Blink 3 times for WiFi error
        ESP.restart();
    }
    blinkLED(1);  // Blink once for WiFi success
    
    // Initialize camera
    if (!setupCamera()) {
        Serial.println("Failed to initialize camera");
        blinkLED(4);  // Blink 4 times for camera error
        ESP.restart();
    }
    blinkLED(2);  // Blink twice for camera success
    
    // Connect to MQTT broker
    Serial.println("Connecting to MQTT broker...");
    int mqttRetries = 0;
    while (!mqtt.connectToBroker() && mqttRetries < 5) {
        Serial.println("Failed to connect to MQTT broker");
        delay(2000);
        mqttRetries++;
    }
    
    if (mqttRetries >= 5) {
        Serial.println("Failed to connect to MQTT broker after 5 attempts");
        blinkLED(6);  // Blink 6 times for MQTT error
        ESP.restart();
    }
    
    Serial.println("Connected to MQTT broker successfully!");
    blinkLED(1);  // Blink once for MQTT success
    
    // Publish device information
    String deviceInfo = "{\"device_id\": \"" + String(CLIENT_ID) + "\", \"ssid\": \"" + String(WIFI_SSID) + "\"}";
    mqtt.publishMessage("device_info", deviceInfo);
}

void captureAndSendImage() {
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
        Serial.println("Camera capture failed");
        return;
    }

    // Convert image to base64
    String base64Image = base64::encode(fb->buf, fb->len);
    
    // Create JSON payload with image
    String message = "{\"image\": \"" + base64Image + "\"}";
    
    // Publish image data
    mqtt.publishMessage("image", message);
    
    // Return the frame buffer
    esp_camera_fb_return(fb);
}

void loop() {
    // Maintain MQTT connection
    mqtt.loop();

    // Read reed switch state with debouncing
    bool reading = digitalRead(REED_SWITCH_PIN);
    
    if (reading != lastReedState) {
        lastDebounceTime = millis();
    }
    
    if ((millis() - lastDebounceTime) > debounceDelay) {
        if (reading != currentReedState) {
            currentReedState = reading;
            
            // Only process state change if it's different from last state
            if (currentReedState != lastReedState) {
                String stateMessage = "{\"mailbox_state\": \"" + String(currentReedState ? "open" : "closed") + "\"}";
                mqtt.publishMessage("mailbox_state", stateMessage);
                
                // If mailbox was opened, capture and send image
                if (currentReedState) {
                    captureAndSendImage();
                }
                
                lastReedState = currentReedState;
            }
        }
    }

    delay(100); // Small delay to prevent CPU hogging
}