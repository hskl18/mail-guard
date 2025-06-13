# MailGuard IoT Hardware & Firmware

ESP32-based IoT device firmware for the MailGuard smart mailbox security system. This directory contains all the hardware code, configuration, and setup instructions for deploying secure IoT devices.

---

## 🏗️ Hardware Architecture

### **Supported Hardware Platforms**

#### **ESP32-CAM (Primary Platform)**

- **Microcontroller**: ESP32-S with integrated WiFi
- **Camera**: OV2640 2MP camera module
- **Memory**: 4MB Flash, 520KB SRAM
- **Connectivity**: 802.11 b/g/n WiFi
- **Power**: 3.3V operation with deep sleep modes

#### **Sensor Integration**

- **Reed Switch**: Magnetic door/mailbox open detection
- **HX711 + Load Cell**: Weight-based mail detection (optional)
- **Battery Monitor**: Real-time battery level monitoring
- **LED Indicators**: Status and debug feedback

### **Physical Connections**

```
ESP32-CAM Pinout:
├── VCC (3.3V) ────── Power Supply
├── GND ────────────── Ground
├── GPIO 12 ─────────── Reed Switch Input (Pull-up)
├── GPIO 13 ─────────── HX711 Data (if using weight sensor)
├── GPIO 15 ─────────── HX711 Clock (if using weight sensor)
├── GPIO 2 ──────────── Status LED (built-in)
├── GPIO 0 ──────────── Boot/Program Mode
└── Camera Module ──── OV2640 (integrated)
```

---

## 📁 Project Structure

```
IOT/
├── src/                          # Main source code
│   ├── main.cpp                  # Primary application logic
│   ├── camera.cpp                # Camera capture functions
│   ├── wifi_manager.cpp          # WiFi connection management
│   ├── api_client.cpp            # HTTPS API communication
│   ├── sensors.cpp               # Reed switch & weight sensor
│   └── power_management.cpp      # Battery & sleep management
├── include/                      # Header files
│   ├── config.h                  # Configuration constants
│   ├── camera.h                  # Camera function declarations
│   ├── wifi_manager.h            # WiFi management headers
│   ├── api_client.h              # API communication headers
│   ├── sensors.h                 # Sensor interface headers
│   └── power_management.h        # Power management headers
├── lib/                          # External libraries
│   ├── HX711/                    # Weight sensor library
│   └── ArduinoJson/              # JSON parsing library
├── platformio.ini                # PlatformIO configuration (46 lines)
├── pre_extra_script.py           # Environment variable loader (39 lines)
├── wifi_manager_main.ino         # Legacy Arduino IDE code (26 lines)
├── HX711.cpp                     # Weight sensor implementation (266 lines)
├── HX711.h                       # Weight sensor header (92 lines)
├── .gitignore                    # Git ignore patterns
├── .env.example                  # Environment template
└── README.md                     # This documentation
```

---

## 🔧 Firmware Features

### **Core Functionality**

#### **Mailbox Event Detection**

- **Reed Switch Monitoring**: Detects mailbox open/close events
- **Weight Sensor Integration**: Optional mail presence detection
- **Event Classification**: Automatic determination of event types
- **Debouncing**: Eliminates false triggers from sensor noise

#### **Photo Capture System**

- **Event-Triggered Photography**: Captures images on mailbox events
- **Configurable Quality**: Adjustable image resolution and compression
- **Storage Management**: Local buffering with S3 upload
- **Error Handling**: Retry logic for failed captures

#### **Secure Communication**

- **HTTPS API Integration**: Encrypted communication with backend
- **API Key Authentication**: Secure device authentication
- **JSON Payload Format**: Structured event data transmission
- **Error Recovery**: Automatic retry with exponential backoff

#### **Power Management**

- **Deep Sleep Modes**: Extends battery life significantly
- **Wake-on-Interrupt**: Sensor-triggered device awakening
- **Battery Monitoring**: Real-time battery level reporting
- **Low-Power WiFi**: Optimized connection management

#### **Device Management**

- **Automatic Registration**: Self-registration with API
- **Firmware Version Reporting**: Version tracking for updates
- **Health Monitoring**: Signal strength and connectivity reporting
- **Configuration Updates**: Remote configuration capability

---

## 🛡️ Security Implementation

### **Device Authentication**

- **Unique API Keys**: Each device has a unique IoT API key
- **Serial Number Verification**: Device identity validation
- **Encrypted Communication**: All data transmitted over HTTPS
- **Certificate Validation**: SSL/TLS certificate verification

### **Data Protection**

- **Local Data Encryption**: Sensitive data encrypted at rest
- **Secure Credential Storage**: WiFi credentials securely stored
- **Privacy Controls**: User-configurable data collection
- **Audit Trail**: Local logging of security events

---

## ⚙️ Configuration & Setup

### **Environment Variables**

Create `.env` file in the `IOT/` directory:

```env
# ====================================
# MailGuard IoT Device Configuration
# ====================================

# WiFi Configuration
WIFI_SSID=YourWiFiNetwork
WIFI_PASSWORD=your_wifi_password
WIFI_USER=                    # For enterprise networks only (leave empty for regular WiFi)

# API Configuration
API_BASE_URL=https://mail-guard-ten.vercel.app
IOT_API_KEY=iot_your_device_api_key_here    # Replace with actual IoT API key from admin
DEVICE_SERIAL=SN001234567                   # Unique device identifier

# Hardware Configuration
ENABLE_WEIGHT_SENSOR=true                   # Enable/disable weight sensor
WEIGHT_THRESHOLD=50                         # Weight change threshold (grams)
CAMERA_QUALITY=10                           # JPEG quality (0-63, lower = better)
SLEEP_DURATION=30                           # Deep sleep duration (seconds)

# Debug Configuration
DEBUG_MODE=false                            # Enable debug output
LED_INDICATORS=true                         # Enable status LEDs

# Battery Monitoring
BATTERY_LOW_THRESHOLD=20                    # Battery warning threshold (%)
BATTERY_VOLTAGE_MIN=3.2                     # Minimum battery voltage
BATTERY_VOLTAGE_MAX=4.2                     # Maximum battery voltage

# Timing Configuration
HEARTBEAT_INTERVAL=600                      # Heartbeat interval (seconds)
PHOTO_SEQUENCE_COUNT=3                      # Number of photos per sequence
PHOTO_INTERVAL=3                            # Seconds between photos

# Security Configuration
MAX_UPLOAD_SIZE=10                          # Maximum file size (MB)
HTTP_TIMEOUT=10                             # HTTP request timeout (seconds)

# Advanced Configuration (Usually don't need to change)
NTP_SERVER=pool.ntp.org
REED_CHECK_INTERVAL=2                       # Reed switch check interval (seconds)
WEIGHT_CHECK_INTERVAL=60                    # Weight sensor check interval (seconds)
SERIAL_BAUD=115200                          # Serial communication baud rate
```

### **WiFi Network Types**

#### **Standard WiFi Networks**

```env
WIFI_SSID=YourHomeWiFi
WIFI_PASSWORD=your_password
WIFI_USER=                    # Leave empty
```

#### **Enterprise Networks (WPA-Enterprise)**

```env
WIFI_SSID=UCSD-PROTECTED
WIFI_USER=your_email@ucsd.edu
WIFI_PASSWORD=your_password
```

#### **Open Networks**

```env
WIFI_SSID=OpenNetwork
WIFI_PASSWORD=                # Leave empty
WIFI_USER=                    # Leave empty
```

---

## 🔨 Development Setup

### **Prerequisites**

- **PlatformIO IDE** or **VS Code with PlatformIO extension**
- **ESP32 development board** with camera module
- **USB cable** for programming and power
- **Serial monitor** for debugging

### **Installation Steps**

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/mail-guard.git
cd mail-guard/IOT

# 2. Install PlatformIO (if not already installed)
pip install platformio

# 3. Create environment file
cp .env.example .env
# Edit .env with your configuration

# 4. Build and flash firmware
pio run --target upload

# 5. Monitor serial output
pio device monitor
```

### **PlatformIO Configuration** (`platformio.ini`)

```ini
[env:esp32cam]
platform = espressif32
board = esp32cam
framework = arduino

# Compilation flags
build_flags =
    -DCORE_DEBUG_LEVEL=1
    -DBOARD_HAS_PSRAM
    -DCAMERA_MODEL_AI_THINKER

# Library dependencies
lib_deps =
    bblanchon/ArduinoJson@^6.21.3
    bogde/HX711@^0.7.5
    WiFi
    HTTPClient
    esp32-camera

# Upload configuration
upload_speed = 921600
monitor_speed = 115200
monitor_filters = esp32_exception_decoder

# Partition scheme for camera applications
board_build.partitions = huge_app.csv
```

---

## 📡 API Integration

### **Event Reporting Endpoint**

**URL**: `POST /api/iot/event`
**Authentication**: `Authorization: Bearer iot_your_api_key_here`

```cpp
// Example event payload (enhanced with security)
{
  "serial_number": "SN001234567",
  "event_data": {
    "reed_sensor": true,
    "event_type": "open",
    "mailbox_status": "opened",
    "weight_sensor": true,
    "weight_value": 125.5,
    "weight_threshold": 50
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "firmware_version": "1.2.0",
  "battery_level": 85,
  "signal_strength": -45
}
```

### **Device Health Reporting**

**URL**: `POST /api/iot/report`
**Authentication**: `Authorization: Bearer iot_your_api_key_here`

```cpp
// Health report payload
{
  "serial_number": "SN001234567",
  "firmware_version": "1.2.0",
  "battery_level": 75,
  "signal_strength": -55,
  "temperature_celsius": 25
}
```

### **Image Upload Endpoint**

**URL**: `POST /api/iot/upload`
**Authentication**: `Authorization: Bearer iot_your_api_key_here`
**Content Type**: `multipart/form-data`

```cpp
// Form data fields (enhanced with security)
file: [JPEG image data]
serial_number: "SN001234567"
file_type: "image"
timestamp: "2024-01-15T10:30:00Z"
```

### **Device Validation**

**URL**: `GET /api/iot/activate?serial_number=SN001234567`
**Authentication**: Not required for validation

```cpp
// Response payload
{
  "serial_number": "SN001234567",
  "is_valid": true,
  "is_claimed": false,
  "device_model": "ESP32-CAM",
  "dashboard_linked": false,
  "status": {
    "is_online": true,
    "last_seen": "2024-01-15T10:30:00Z",
    "firmware_version": "1.2.0",
    "battery_level": 85,
    "signal_strength": -45,
    "weight_value": 125.5
  }
}
```

---

## 🔋 Power Management

### **Sleep Modes**

- **Deep Sleep**: CPU and most peripherals powered down
- **Light Sleep**: CPU halted, peripherals remain active
- **Active Mode**: Full operation for event processing

### **Wake Sources**

- **Reed Switch Interrupt**: Mailbox open/close detection
- **Timer Wake**: Periodic health check and battery reporting
- **Manual Wake**: Programming and debugging mode

### **Battery Optimization**

- **Connection Optimization**: Quick WiFi connection/disconnection
- **Reduced Transmission**: Batch multiple events when possible
- **Camera Power Control**: Camera powered only when needed
- **LED Management**: Status LEDs disabled in production mode

### **Expected Battery Life**

- **Standard Usage**: 6-12 months (depending on events/day)
- **Heavy Usage**: 3-6 months (with frequent events)
- **Standby Mode**: 12+ months (minimal activity)

---

## 📊 Monitoring & Diagnostics

### **Serial Output Debug**

```cpp
// Enable debug mode in .env
DEBUG_MODE=true

// Serial monitor commands
pio device monitor --baud 115200
```

### **Status Indicators**

- **Blue LED**: WiFi connection status
- **Red LED**: Error conditions
- **Flash LED**: Camera activity indicator

### **Health Reporting**

- **Battery Level**: Reported with each event
- **Signal Strength**: WiFi signal quality (dBm)
- **Firmware Version**: Automatic version reporting
- **Uptime**: Device operational time tracking

### **Error Handling**

- **Connection Failures**: Automatic retry with exponential backoff
- **Camera Errors**: Graceful degradation without camera
- **Sensor Failures**: Continue operation with available sensors
- **Memory Issues**: Automatic recovery and restart

---

## 🧪 Testing & Validation

### **Unit Testing**

```bash
# Run PlatformIO unit tests
pio test

# Test specific modules
pio test --filter test_sensors
pio test --filter test_camera
pio test --filter test_wifi
```

### **Hardware Testing**

- **Reed Switch**: Manual trigger testing
- **Camera**: Image capture verification
- **WiFi**: Connection reliability testing
- **Battery**: Power consumption measurement

### **API Testing**

- **Authentication**: Valid API key verification
- **Event Submission**: Complete event flow testing
- **Image Upload**: Photo upload verification
- **Error Scenarios**: Network failure testing

---

## 🔧 Hardware Assembly

### **Required Components**

| Component         | Quantity | Purpose                   | Est. Cost |
| ----------------- | -------- | ------------------------- | --------- |
| ESP32-CAM         | 1        | Main controller + camera  | $12       |
| Reed Switch       | 1        | Door open/close detection | $2        |
| HX711 + Load Cell | 1        | Weight sensing (optional) | $8        |
| Resistors (10kΩ)  | 2        | Pull-up resistors         | $1        |
| Breadboard/PCB    | 1        | Prototyping/mounting      | $3        |
| Battery Pack      | 1        | Power supply              | $10       |
| Enclosure         | 1        | Weather protection        | $5        |

### **Assembly Instructions**

1. **Mount ESP32-CAM** in weatherproof enclosure
2. **Connect Reed Switch** to GPIO 12 with 10kΩ pull-up
3. **Install Load Cell** (optional) with HX711 amplifier
4. **Wire Power Supply** with battery monitoring circuit
5. **Secure Camera** for optimal mailbox interior view
6. **Test All Connections** before final installation

### **Installation Guidelines**

- **Placement**: Mount inside mailbox for protection
- **Camera Angle**: Position for clear interior view
- **Reed Switch**: Align with door for reliable detection
- **Power Access**: Ensure battery can be replaced/recharged
- **Weather Sealing**: Protect all electronics from moisture

---

## 🔄 Firmware Updates

### **Over-the-Air (OTA) Updates** (Planned)

- **Secure Update Channel**: Encrypted firmware distribution
- **Version Management**: Automatic update checking
- **Rollback Capability**: Revert to previous version if needed
- **Staging Updates**: Test updates on subset of devices

### **Manual Updates** (Current)

```bash
# Connect device via USB
# Update .env with new configuration if needed
# Build and flash new firmware
pio run --target upload

# Verify update
pio device monitor
```

---

## 🚨 Troubleshooting

### **Common Issues**

#### **WiFi Connection Problems**

```
Symptoms: Device can't connect to WiFi
Solutions:
- Verify SSID and password in .env
- Check WiFi signal strength
- For enterprise networks, verify username
- Reset WiFi credentials and re-flash
```

#### **Camera Failures**

```
Symptoms: No images uploaded or poor quality
Solutions:
- Check camera module connections
- Verify camera power supply (3.3V)
- Adjust CAMERA_QUALITY setting
- Clean camera lens
```

#### **Reed Switch Not Triggering**

```
Symptoms: No events detected on mailbox open/close
Solutions:
- Check reed switch and magnet alignment
- Verify GPIO 12 connection and pull-up resistor
- Test with multimeter for continuity
- Adjust magnet distance/positioning
```

#### **API Communication Errors**

```
Symptoms: Events not appearing in dashboard
Solutions:
- Verify API_BASE_URL in .env
- Check IOT_API_KEY validity
- Confirm internet connectivity
- Monitor serial output for HTTP errors
```

### **Debug Mode**

```cpp
// Enable in .env
DEBUG_MODE=true

// Serial output includes:
// - WiFi connection details
// - API request/response data
// - Sensor readings
// - Error messages
```

---

## 📞 Support & Resources

### **Documentation**

- **Hardware Schematics**: Available in `docs/hardware/`
- **API Documentation**: See main repository README
- **PlatformIO Guide**: [Platform IO ESP32 Guide](https://docs.platformio.org/en/latest/platforms/espressif32.html)

### **Community Support**

- **GitHub Issues**: Report bugs and feature requests
- **Discord/Forum**: Community troubleshooting
- **Developer Documentation**: Technical implementation details

### **Professional Support**

- **Hardware Setup**: Installation assistance available
- **Custom Firmware**: Custom feature development
- **Bulk Deployment**: Enterprise deployment support

---

**Built for reliable, secure, and long-lasting IoT deployment in real-world mailbox environments. 📮⚡**
