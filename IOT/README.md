# IOT Mail Guard Setup

This directory contains the firmware for the ESP32-based Mail Guard IoT devices.

## Environment Setup

To protect sensitive information, WiFi credentials are now stored in environment variables instead of being hardcoded.

### Creating the .env file

1. Create a file named `.env` in this directory (IOT/)
2. Add your WiFi credentials in the following format:

```
WIFI_SSID=YourWiFiNetworkName
WIFI_USER=your_username
WIFI_PASSWORD=your_password
```

### Examples

**For WPA Enterprise networks (like UCSD-PROTECTED):**

```
WIFI_SSID=UCSD-PROTECTED
WIFI_USER=your_ucsd_email@ucsd.edu
WIFI_PASSWORD=your_password
```

**For regular WiFi networks:**

```
WIFI_SSID=YourHomeWiFi
WIFI_USER=
WIFI_PASSWORD=your_wifi_password
```

### Important Notes

- The `.env` file is automatically ignored by git to prevent accidentally committing secrets
- The `pre_extra_script.py` file automatically loads these environment variables during compilation
- Never commit actual credentials to the repository

## Building and Flashing

Use PlatformIO to build and flash the firmware:

```bash
# For main ESP32 controller
pio run -e main_esp32_env --target upload

# For ESP32-CAM
pio run -e esp32_cam_env --target upload
```
