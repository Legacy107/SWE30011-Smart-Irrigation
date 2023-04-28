#include <PWMServo.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>
#include <string.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>


int pinDHT11 = 3;
int pinSoilMoisture = A0;
int pinServo = SERVO_PIN_A;

DHT_Unified dht(pinDHT11, DHT11);

PWMServo servo;
int minAngle = 0;
int maxAngle = 115;
int angle = 0;
int startAngle = 0;
int desiredAngle = 0;
int command2angle[2] = {0, 115};
int MOVING_TIME = 2000; // moving time is 2 seconds
unsigned long moveStartTime;

// Set the LCD address to 0x27 for a 16 chars and 2 line display
LiquidCrystal_I2C lcd(0x27, 16, 2);

// cached data
int soilMoisture = 0;
int temperature = 0;
int humidity = 0;

volatile int interruptCounter = 0; // counter for the number of interrupts
volatile bool haveSent = false;

void setup() {
    // Use TIMER 2 because PWMServo uses TIMER 1
    // TIMER 2 for interrupt frequency 1000 Hz:
    cli(); // stop interrupts
    TCCR2A = 0; // set entire TCCR2A register to 0
    TCCR2B = 0; // same for TCCR2B
    TCNT2  = 0; // initialize counter value to 0
    // set compare match register for 1000 Hz increments
    OCR2A = 249; // = 16000000 / (64 * 1000) - 1 (must be <256)
    // turn on CTC mode
    TCCR2A |= (1 << WGM21);
    // Set CS22, CS21 and CS20 bits for 64 prescaler
    TCCR2B |= (1 << CS22) | (0 << CS21) | (0 << CS20);
    // enable timer compare interrupt
    TIMSK2 |= (1 << OCIE2A);
    sei(); // allow interrupts

    dht.begin();

    servo.attach(pinServo);
    servo.write(0);
    Serial.begin(115200);

    lcd.begin();
	lcd.backlight();
	lcd.print("Awaiting data...");
}

ISR(TIMER2_COMPA_vect) {
    interruptCounter++;
    interruptCounter %= 2000;
    if (interruptCounter)
        haveSent = false;
}

void controlIrrigation() {
    unsigned long progress = millis() - moveStartTime;
    if (progress <= MOVING_TIME) {
        angle = map(progress, 0, MOVING_TIME, startAngle, desiredAngle);
        servo.write(angle); 
    }
}

bool isIrrigationOn() {
    return desiredAngle == maxAngle;
}

void readSensors() {
    haveSent = true;
   
    sensors_event_t event;
    dht.temperature().getEvent(&event);
    if (isnan(event.temperature)) {
        Serial.println(F("Error reading temperature!"));
    }
    else {
        temperature = event.temperature;
    }
    dht.humidity().getEvent(&event);
    if (isnan(event.relative_humidity)) {
        Serial.println(F("Error reading humidity!"));
    }
    else {
        humidity = event.relative_humidity;
    }

    soilMoisture = analogRead(pinSoilMoisture);

    display(
        isIrrigationOn() ? "ON" : "OFF",
        "S: " + String(soilMoisture),
        "T: " + String(temperature) + "C",
        "H: " + String(humidity) + "%"
    );

    Serial.println(
        "{\"soilMoisture\":" + String(soilMoisture) +
        ",\"temperature\":" + String(temperature) +
        ",\"humidity\":" + String(humidity) +
        ",\"irrigationStatus\":" + String(isIrrigationOn()) +"}"
    );
}

void display(String line1, String line2, String line3, String line4) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(line1);
    lcd.setCursor(8, 0);
    lcd.print(line2);
    lcd.setCursor(0, 1);
    lcd.print(line3);
    lcd.setCursor(8, 1);
    lcd.print(line4);
}

void loop() {
    if (Serial.available() > 0) {
        int command = Serial.read() - '0';
        command = constrain(command, 0, 1);
        desiredAngle = command2angle[command];
        startAngle = servo.read();
        moveStartTime = millis();
    }

    if (angle != desiredAngle)
        controlIrrigation();

    if (interruptCounter == 0 && !haveSent)
        readSensors();
}
