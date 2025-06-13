#ifndef CONFIG_H
#define CONFIG_H

// ===================================
// MailGuard IoT Device Configuration
// ===================================

// === DEVICE IDENTIFICATION ===
#define DEVICE_SERIAL "ESP32_001"
#define FIRMWARE_VERSION "1.2.0"
#define HARDWARE_REVISION "ESP32-CAM-v1"

// === API CONFIGURATION ===
#define API_BASE_URL "https://mail-guard-ten.vercel.app"
#define IOT_API_KEY "iot_your_device_api_key_here" // Replace with actual key
#define API_UPLOAD_PATH "/api/iot/upload"
#define API_EVENT_PATH "/api/iot/event"
#define API_REPORT_PATH "/api/iot/report"
#define API_ACTIVATE_PATH "/api/iot/activate"

// === NETWORK CONFIGURATION ===
#define HTTPS_PORT 443
#define HTTP_TIMEOUT 10000  // 10 seconds
#define WIFI_RETRY_DELAY 5000
#define WIFI_CONNECTION_TIMEOUT 30000

// === NTP TIME CONFIGURATION ===
#define NTP_SERVER "pool.ntp.org"
#define GMT_OFFSET_SEC 0
#define DAYLIGHT_OFFSET_SEC 0

// === SENSOR CONFIGURATION ===
// Reed Switch
#define REED_SW_PIN 2
#define REED_CHECK_INTERVAL 2000    // 2 seconds

// Weight Sensor (HX711)
#define LOADCELL_DOUT_PIN 16
#define LOADCELL_SCK_PIN 4
#define CALIBRATION_FACTOR -698.11f
#define WEIGHT_CHECK_INTERVAL 60000  // 60 seconds
#define WEIGHT_THRESHOLD 15.0f       // 15 grams

// === GPIO PINS ===
#define STATUS_LED_PIN 2
#define BATTERY_PIN A0

// === CAMERA CONFIGURATION ===
// Camera resolution settings
#define CAMERA_FRAME_SIZE_PSRAM FRAMESIZE_VGA    // 640x480 with PSRAM
#define CAMERA_FRAME_SIZE_NO_PSRAM FRAMESIZE_QQVGA // 160x120 without PSRAM
#define CAMERA_JPEG_QUALITY_HIGH 10
#define CAMERA_JPEG_QUALITY_LOW 20

// === COMMUNICATION ===
#define MAIN_SERIAL_BAUD 115200
#define CAM_SERIAL_BAUD 115200
#define CAM_SERIAL_RX 12
#define CAM_SERIAL_TX 13

// === TIMING CONFIGURATION ===
#define HTTP_COOLDOWN 5000          // 5 seconds between HTTP requests
#define BATTERY_CHECK_INTERVAL 300000 // 5 minutes
#define HEARTBEAT_INTERVAL 600000   // 10 minutes
#define PHOTO_INTERVAL 3000         // 3 seconds between photos
#define TOTAL_PHOTOS 3              // Number of photos per sequence

// === POWER MANAGEMENT ===
#define BATTERY_LOW_THRESHOLD 20    // 20% battery warning
#define BATTERY_VOLTAGE_MIN 3.2     // Minimum battery voltage
#define BATTERY_VOLTAGE_MAX 4.2     // Maximum battery voltage

// === SECURITY SETTINGS ===
#define MAX_UPLOAD_SIZE 10485760    // 10MB maximum file size
#define API_KEY_HEADER "Authorization"
#define USER_AGENT_PREFIX "MailGuard-IoT"

// === ESP32-CAM PIN DEFINITIONS (AI-THINKER) ===
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

// === DEBUGGING ===
#ifdef DEBUG_MODE
  #define DEBUG_PRINT(x) Serial.print(x)
  #define DEBUG_PRINTLN(x) Serial.println(x)
  #define DEBUG_PRINTF(x, ...) Serial.printf(x, __VA_ARGS__)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
  #define DEBUG_PRINTF(x, ...)
#endif

// === ERROR CODES ===
#define ERROR_WIFI_FAILED -1
#define ERROR_CAMERA_INIT -2
#define ERROR_API_AUTH -3
#define ERROR_UPLOAD_FAILED -4
#define ERROR_SENSOR_FAILED -5

// === EVENT TYPES ===
#define EVENT_OPEN "open"
#define EVENT_CLOSE "close"
#define EVENT_DELIVERY "delivery"
#define EVENT_REMOVAL "removal"
#define EVENT_LOW_BATTERY "low_battery"
#define EVENT_HEARTBEAT "heartbeat"

// === FILE TYPES ===
#define FILE_TYPE_IMAGE "image"
#define FILE_TYPE_LOG "log"
#define FILE_TYPE_DIAGNOSTIC "diagnostic"

#endif // CONFIG_H 