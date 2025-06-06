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
     * @param ssid The SSID of the WiFi network.
     * @param password The password of the WiFi network.
     * @param timeout_ms The maximum time to wait for connection (default: 30 seconds).
     * @return true if connection is successful, false otherwise.
     */
    bool connectToWiFi(const char* ssid, const char* password, unsigned long timeout_ms = 30000);

    /**
     * @brief Connect to a WPA Enterprise network with a timeout.
     * @param ssid The SSID of the WiFi network.
     * @param username The username for WPA Enterprise.
     * @param password The password for WPA Enterprise.
     * @param timeout_ms The maximum time to wait for connection (default: 60 seconds).
     * @return true if connection is successful, false otherwise.
     */
    bool connectToWPAEnterprise(const char* ssid, const char* username, const char* password, unsigned long timeout_ms = 60000);
};

#endif