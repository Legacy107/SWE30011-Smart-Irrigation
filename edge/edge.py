import json
import os

import paho.mqtt.client as paho
import serial
from dotenv import find_dotenv, load_dotenv
from paho import mqtt
import pickle


load_dotenv(find_dotenv())

sensors = ['soilMoisture', 'temperature', 'humidity']

model = pickle.load(open(os.environ.get('MODEL_FILE'), 'rb'))

MQTT_CONFIG = dict(
    host=os.environ.get('MQTT_HOST'),
    port=int(os.environ.get('MQTT_PORT')),
    user=os.environ.get('MQTT_USER'),
    password=os.environ.get('MQTT_PASSWORD')
)
mqtt_client = paho.Client()


def on_connect(client, userdata, flags, rc, properties=None):
    print(f'CONNACK received with code {rc}.')


def on_publish(client, userdata, mid, properties=None):
    print(f'mid: {str(mid)}')


def on_subscribe(client, userdata, mid, granted_qos, properties=None):
    print(f'Subscribed: {str(mid)} {str(granted_qos)}')


def on_message(client, userdata, msg):
    print(msg.topic, str(msg.qos), str(msg.payload), sep=' ')


def setup_mqtt():
    global mqtt_client
    mqtt_client = paho.Client(client_id='', userdata=None, protocol=paho.MQTTv5)
    mqtt_client.on_connect = on_connect
    mqtt_client.tls_set(tls_version=mqtt.client.ssl.PROTOCOL_TLS)
    mqtt_client.username_pw_set(MQTT_CONFIG['user'], MQTT_CONFIG['password'])
    mqtt_client.connect(MQTT_CONFIG['host'], MQTT_CONFIG['port'])
    mqtt_client.on_subscribe = on_subscribe
    mqtt_client.on_message = on_message
    mqtt_client.on_publish = on_publish
    mqtt_client.subscribe('sensor/#', qos=1)
    mqtt_client.loop_start()


def controlIrrigation(sensorData):
    prediction = model.predict([sensorData])
    if prediction[0]:
        ser.write(b'1')
    else:
        ser.write(b'0')


if __name__ == '__main__':
    print('Starting edge device...')
    setup_mqtt()
    ser = serial.Serial('/dev/tty.usbmodem1101', 115200)

    while True:
        line = ser.readline().decode('utf-8').rstrip()
        if not line:
            continue

        try:
            data = json.loads(line)
            for sensor in sensors:
                mqtt_client.publish(
                    f'sensor/{sensor}',
                    payload=data[sensor],
                    qos=1
                )
            controlIrrigation([data[sensor] for sensor in sensors])
        except json.decoder.JSONDecodeError:
            print('Error: Invalid JSON')
            continue
