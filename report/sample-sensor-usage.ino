#include <PWMServo.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

int pinDHT11 = 3;
int pinServo = SERVO_PIN_A;

DHT_Unified dht(pinDHT11, DHT11);
PWMServo servo;
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
    dht.begin();

    servo.attach(pinServo);

    lcd.begin();
	lcd.backlight();
}

void loop() {
    int temperature = 0, humidity = 0;

    sensors_event_t event;
    dht.temperature().getEvent(&event);
    if (isnan(event.temperature))
        Serial.println(F("Error reading temperature!"));
    else
        temperature = event.temperature;
    dht.humidity().getEvent(&event);
    if (isnan(event.relative_humidity))
        Serial.println(F("Error reading humidity!"));
    else
        humidity = event.relative_humidity;

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("T: " + String(temperature) + "C");

    servo.write(90);

    delay(1000);
}

