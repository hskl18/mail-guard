#ifndef ECE140_WIFI_h
#define ECE140_WIFI_h

#include <Arduino.h>
#include <WiFi.h>
#include "esp_wpa2.h"

class ECE140_WIFI {
public:
    ECE140_WIFI();

    /**
     * @brief Connect to a regular WiFi network with a timeout.
     * @return true if connection is successful, false otherwise.
     */
    bool connectToWiFi(const char* ssid, const char* password, unsigned long timeout_ms = 30000);

    /**
     * @brief Connect to a WPA Enterprise network with a timeout.
     * @return true if connection is successful, false otherwise.
     */
    bool connectToWPAEnterprise(const char* ssid, const char* username, const char* password, unsigned long timeout_ms = 60000);
};

#endif