#include <SimpleDHT.h>
#include <string.h>

int pinDHT11 = 3;
int pinSoilMoisture = A0;
SimpleDHT11 dht11(pinDHT11);

volatile int interruptCounter = 0; // counter for the number of interrupts
volatile bool haveSent = false;

void setup() {
    cli();
    TCCR1A = 0;
    TCCR1B = 0;
    TCNT1  = 0;
    OCR1A = 6249;
    TCCR1B |= (1 << WGM12);
    TCCR1B |= (1 << CS12) | (0 << CS11) | (0 << CS10);
    TIMSK1 |= (1 << OCIE1A);
    sei();

    pinMode(pinDHT11, INPUT);
}

ISR(TIMER1_COMPA_vect)
{
    interruptCounter++;
    interruptCounter %= 50;
    if (interruptCounter)
        haveSent = false;
}

void loop() {
    if (interruptCounter == 0 && !haveSent)
    {
        haveSent = true;
        Serial.begin(115200);
        byte temperature = 0;
        byte humidity = 0;
        int err = dht11.read(&temperature, &humidity, NULL);
        if (err != SimpleDHTErrSuccess) {
            Serial.print("Read DHT11 failed, err=");
            Serial.print(SimpleDHTErrCode(err));
            Serial.print(",");
            Serial.println(SimpleDHTErrDuration(err));
            return;
        }
        int soilMoisture = analogRead(pinSoilMoisture);

        Serial.println(
            "{\"temperature\":" + String(temperature) +
            ",\"humidity\":" + String(humidity) +
            ",\"soilMoisture\":" + String(soilMoisture) + "}"
        );
        Serial.end();
    }
}
