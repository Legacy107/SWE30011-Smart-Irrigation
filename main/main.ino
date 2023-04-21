#include <PWMServo.h>
#include <SimpleDHT.h>
#include <string.h>

int pinDHT11 = 3;
int pinSoilMoisture = A0;
int pinServo = SERVO_PIN_A;
SimpleDHT11 dht11(pinDHT11);
PWMServo servo;
int minAngle = 0;
int maxAngle = 115;
int angle = 0;
int startAngle = 0;
int desiredAngle = 0;
int command2angle[2] = {0, 115};

int MOVING_TIME = 2000; // moving time is 3 seconds
unsigned long moveStartTime;

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

    pinMode(pinDHT11, INPUT);
    servo.attach(pinServo);
    servo.write(0);
    Serial.begin(115200);
}

ISR(TIMER2_COMPA_vect)
{
    interruptCounter++;
    interruptCounter %= 2500;
    if (interruptCounter)
        haveSent = false;
}

void controlIrrigation()
{
    unsigned long progress = millis() - moveStartTime;
    if (progress <= MOVING_TIME) {
        angle = map(progress, 0, MOVING_TIME, startAngle, desiredAngle);
        servo.write(angle); 
    }
}

bool isIrrigationOn()
{
    return desiredAngle == maxAngle;
}

void readSensors()
{
    haveSent = true;
    byte temperature = 0;
    byte humidity = 0;
    int err = SimpleDHTErrSuccess;
    err = dht11.read(&temperature, &humidity, NULL);
    if (err != SimpleDHTErrSuccess) {
        Serial.print("Read DHT11 failed, err=");
        Serial.print(SimpleDHTErrCode(err));
        Serial.print(",");
        Serial.println(SimpleDHTErrDuration(err));
        return;
    }

    int soilMoisture = analogRead(pinSoilMoisture);

    Serial.println(
        "{\"soilMoisture\":" + String(soilMoisture) +
        ",\"temperature\":" + String(temperature) +
        ",\"humidity\":" + String(humidity) +
        ",\"irrigationStatus\":" + String(isIrrigationOn()) +"}"
    );
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
