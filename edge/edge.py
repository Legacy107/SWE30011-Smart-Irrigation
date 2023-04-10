import json
import os

import paho.mqtt.client as paho
import serial
from dotenv import find_dotenv, load_dotenv
from paho import mqtt


load_dotenv(find_dotenv())

MQTT_CONFIG = dict(
    host=os.environ.get('MQTT_HOST'),
    port=int(os.environ.get('MQTT_PORT')),
    user=os.environ.get('MQTT_USER'),
    password=os.environ.get('MQTT_PASSWORD')
)
mqtt_client = paho.Client()


def on_connect(client, userdata, flags, rc, properties=None):
    print('CONNACK received with code %s.' % rc)


def on_publish(client, userdata, mid, properties=None):
    print('mid: ' + str(mid))


def on_subscribe(client, userdata, mid, granted_qos, properties=None):
    print('Subscribed: ' + str(mid) + ' ' + str(granted_qos))


def on_message(client, userdata, msg):
    print(msg.topic + ' ' + str(msg.qos) + ' ' + str(msg.payload))


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


if __name__ == '__main__':
    print('Starting edge device...')
    setup_mqtt()
    ser = serial.Serial('/dev/tty.usbmodem1101', 115200)

    while True:
        line = ser.readline().decode('utf-8').rstrip()
        try:
            data = json.loads(line)
            mqtt_client.publish('sensor/temperature', payload=data['temperature'], qos=1)
            mqtt_client.publish('sensor/humidity', payload=data['humidity'], qos=1)
            mqtt_client.publish('sensor/soilMoisture', payload=data['soilMoisture'], qos=1)
        except json.decoder.JSONDecodeError:
            print('Error: Invalid JSON')
            continue
