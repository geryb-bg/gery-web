#include <xCore.h>
#include <xVersion.h>

#define RED_PIN 25
#define GREEN_PIN 26
#define BLUE_PIN 27

#include "xOD01.h"
xOD01 OD01;

#include "ClosedCube_BME680.h"
ClosedCube_BME680 bme680;

void setup() {
  Wire.begin();
  OD01.begin();
  initSensor();
  pinMode(BLUE_PIN, OUTPUT);
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
}

void initSensor()
{
  bme680.init(0x76);
  bme680.reset();
  bme680.setOversampling(BME680_OVERSAMPLING_X1, BME680_OVERSAMPLING_X2, BME680_OVERSAMPLING_X16);
  bme680.setIIRFilter(BME680_FILTER_3);
  OD01.println("Connected to sensor");
  digitalWrite(GREEN_PIN, HIGH);
}

void loop() {
  bme680.setForcedMode();
  double temperature = bme680.readTemperature();
  OD01.print("Temperature: ");
  OD01.print(temperature);
  OD01.println(" C");
  double pressure = bme680.readPressure();
  OD01.print("Pressure: ");
  OD01.print(pressure);
  OD01.println(" hPa");
  double humidity = bme680.readHumidity();
  OD01.print("Humidity: ");
  OD01.print(humidity);
  OD01.println(" %");
  uint32_t gas = bme680.readGasResistance();
  OD01.print("Gas: ");
  OD01.print(gas);
  OD01.println(" Ohms");
  delay(10000);
}