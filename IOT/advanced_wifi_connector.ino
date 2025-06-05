#include <WiFi.h>
#include <WiFiManager.h> 

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    delay(10);
  }

  //an instance of WiFiManager
  WiFiManager wm;
  wm.setConfigPortalTimeout(180);
  Serial.println("Attempting to connect to saved WiFi network...");
  if (!wm.autoConnect("MailGuard-Setup")) {
    Serial.println("Failed to connect and hit timeout. Restarting...");
    delay(3000);
    ESP.restart(); 
  }
  Serial.println("\n---------------------------");
  Serial.println("WiFi Connection Successful!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.println("---------------------------");
}

void loop() {
  delay(10000);
}