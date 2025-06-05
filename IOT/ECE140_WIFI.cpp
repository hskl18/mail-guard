#include "ECE140_WIFI.h"

ECE140_WIFI::ECE140_WIFI() {
    Serial.println("[ECE140_WIFI] Initialized");
}

bool ECE140_WIFI::connectToWiFi(String ssid, String password, unsigned long timeout_ms) { // 
  Serial.println("[WiFi] Connecting to WiFi...");
  WiFi.begin(ssid.c_str(), password.c_str());

  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startTime > timeout_ms) {
      Serial.println("\n[WiFi] Connection timed out.");
      WiFi.disconnect();
      return false;
    }
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[WiFi] Connected to WiFi.");
  return true;
}

bool ECE140_WIFI::connectToWPAEnterprise(String ssid, String username, String password, unsigned long timeout_ms) { // 
  Serial.println("[WiFi] Connecting to WPA Enterprise...");

  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);

  esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)username.c_str(), username.length());
  esp_wifi_sta_wpa2_ent_set_username((uint8_t *)username.c_str(), username.length());
  esp_wifi_sta_wpa2_ent_set_password((uint8_t *)password.c_str(), password.length());

  esp_wifi_sta_wpa2_ent_enable();

  WiFi.begin(ssid.c_str());

  unsigned long startTime = millis();
  Serial.print("Waiting for connection...");
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startTime > timeout_ms) {
      Serial.println("\n[WiFi] Enterprise Connection timed out.");
      WiFi.disconnect();
      return false;
    }
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Connected to WPA Enterprise successfully!");

  ip_addr_t dnsserver;
  IP_ADDR4(&dnsserver, 8, 8, 8, 8);
  dns_setserver(0, &dnsserver);

  return true;
}