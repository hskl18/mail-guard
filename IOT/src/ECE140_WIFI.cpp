#include "ECE140_WIFI.h"

ECE140_WIFI::ECE140_WIFI() { Serial.println("[ECE140_WIFI] Initialized"); }

void ECE140_WIFI::connectToWiFi(String ssid, String password) {
  Serial.println("[WiFi] Connecting to WiFi...");
  WiFi.begin(ssid.c_str(), password.c_str());
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Connected to WiFi.");
}

void ECE140_WIFI::connectToWPAEnterprise(String ssid, String username,
                                         String password) {
  Serial.println("[WiFi] Connecting to WPA Enterprise...");

  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);

  esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)username.c_str(),
                                     username.length());
  esp_wifi_sta_wpa2_ent_set_username((uint8_t *)username.c_str(),
                                     username.length());
  esp_wifi_sta_wpa2_ent_set_password((uint8_t *)password.c_str(),
                                     password.length());

  esp_wifi_sta_wpa2_ent_enable();

  WiFi.begin(ssid.c_str());

  Serial.print("Waiting for connection...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Connected to WPA Enterprise successfully!");

  ip_addr_t dnsserver;
  IP_ADDR4(&dnsserver, 8, 8, 8, 8);
  dns_setserver(0, &dnsserver);
}
