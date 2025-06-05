#include <WiFi.h>
#include <WiFiManager.h> // https://github.com/tzapu/WiFiManager
WiFiManager wm;
void onWifiConnect() {
  Serial.println("");
  Serial.println("------------------------------------");
  Serial.println("Wi-Fi Connected Successfully!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.println("------------------------------------");
}

void setup() {
  Serial.begin(115200);
  wm.setConfigPortalTimeout(180);
  if (!wm.autoConnect("MailGuard-Setup")) {
    Serial.println("Failed to connect and hit timeout. Restarting...");
    delay(3000);
    ESP.restart(); 
  }
  onWifiConnect();
}

void loop() {
  delay(1000); 
}