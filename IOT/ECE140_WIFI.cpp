#include "ECE140_WIFI.h"
#include <lwip/dns.h>

ECE140_WIFI::ECE140_WIFI() {
  Serial.println("[ECE140_WIFI] Initialized");
}

bool ECE140_WIFI::connectToWiFi(const char* ssid, const char* password, unsigned long timeout_ms) {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startTime > timeout_ms) {
      Serial.println("\n[Error] Connection timed out.");
      WiFi.disconnect();
      return false;
    }
    Serial.print(".");
    delay(500);
  }

  Serial.println("\nSuccessfully connected to WiFi.");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  return true;
}

bool ECE140_WIFI::connectToWPAEnterprise(const char* ssid, const char* username, const char* password, unsigned long timeout_ms) {
  Serial.print("Connecting to WPA2-Enterprise...");
  
  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);
  esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)username, strlen(username));
  esp_wifi_sta_wpa2_ent_set_username((uint8_t *)username, strlen(username));
  esp_wifi_sta_wpa2_ent_set_password((uint8_t *)password, strlen(password));
  
  // For some enterprise networks, an anonymous identity is required.
  // If connection fails, you might need to uncomment the line below.
  // esp_wifi_sta_wpa2_ent_set_anonymous_identity((uint8_t *)"anonymous", 9);

  esp_wpa2_config_t config = WPA2_CONFIG_INIT_DEFAULT();
  esp_wifi_sta_wpa2_ent_enable(&config);

  WiFi.begin(ssid);

  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startTime > timeout_ms) {
      Serial.println("\n[Error] Enterprise Connection timed out.");
      WiFi.disconnect();
      return false;
    }
    Serial.print(".");
    delay(500);
  }

  Serial.println("\nSuccessfully connected to WPA2-Enterprise.");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  return true;
}