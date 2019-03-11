#include <xCore.h>
#include <xVersion.h>

#include "config.h"

//screen
#include "xOD01.h"
xOD01 OD01;

//cloud
#include <MQTT.h>
#include <CloudIoTCore.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

WiFiClientSecure *netClient;
MQTTClient *mqttClient;
CloudIoTCoreDevice *device;
unsigned long iss = 0;
String jwt;

void setup() {
  Wire.begin();
  OD01.begin();
  
  pinMode(BLUE_PIN, OUTPUT);
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);

  initWifi();
  syncTime();
  initCloudIoT();
}

void initWifi() {
  digitalWrite(RED_PIN, HIGH);
  OD01.println("Connecting to:");
  OD01.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED)
  {
    OD01.println("Retry in 5 secs");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(5000);
  }

  digitalWrite(RED_PIN, LOW);
  OD01.println("Connected to WiFi");
}

void syncTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  while (time(nullptr) < 1510644967) {
    delay(10);
  }
}

void initCloudIoT() {
  device = new CloudIoTCoreDevice(
      project_id, location, registry_id, device_id, 
      private_key_str);

  netClient = new WiFiClientSecure();
  mqttClient = new MQTTClient(512);
  mqttClient->begin("mqtt.googleapis.com", 8883, *netClient);
  mqttClient->onMessage(messageReceived);
  OD01.println("MQTT started");
}

void messageReceived(String &topic, String &payload) {
  OD01.println(".");
  OD01.println("Config update: " + payload);
}

void loop() {
  mqttClient->loop();
  delay(10);

  
  if (!mqttClient->connected()) {
    digitalWrite(RED_PIN, HIGH);
    if (WiFi.status() != WL_CONNECTED) {
      initWifi();
    }
    mqttConnect();
    digitalWrite(RED_PIN, LOW);
  }

  digitalWrite(GREEN_PIN, HIGH);
  OD01.print(".");
  digitalWrite(GREEN_PIN, LOW);  
  delay(5000);
}

void mqttConnect() {
  while (!mqttClient->connect(device->getClientId().c_str(), "unused", getJwt().c_str(), false)) {
    delay(1000);
  }
  OD01.println("Connected to MQTT");
  mqttClient->subscribe(device->getConfigTopic());
  mqttClient->subscribe(device->getCommandsTopic());
}

String getJwt() {
  //This checks if the JWT has expired and creates a new one if it has
  if (iss == 0 || time(nullptr) - iss > 3600) {
    iss = time(nullptr);
    jwt = device->createJWT(iss);
  }
  return jwt;
}