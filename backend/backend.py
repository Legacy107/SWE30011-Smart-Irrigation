import json
import os

import mysql.connector
import paho.mqtt.client as paho
from dotenv import find_dotenv, load_dotenv
from paho import mqtt


load_dotenv(find_dotenv())

dbConfig = dict(
    host=os.environ.get('DB_HOST'),
    database=os.environ.get('DB_DATABASE'),
    user=os.environ.get('DB_USER'),
    password=os.environ.get('DB_PASSWORD')
)

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

    group, sensor = msg.topic.split('/')
    if group == 'sensor':
        reading = int(msg.payload)
        try:
            conn = mysql.connector.connect(**dbConfig)

            conn.autocommit = False
            cursor = conn.cursor()

            insert_query = f"""
                INSERT INTO {sensor}Log(reading)
                VALUES ({reading})
            """

            cursor.execute(insert_query)
            conn.commit()
        except mysql.connector.Error as error:
            print(f'Error: {error}')
            conn.rollback()
        finally:
            if conn.is_connected():
                cursor.close()
                conn.close()


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
    mqtt_client.loop_forever()


if __name__ == '__main__':
    print('Starting backend server...')
    setup_mqtt()
