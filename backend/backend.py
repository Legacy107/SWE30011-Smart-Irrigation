from datetime import datetime
import json
import os

import mysql.connector
import paho.mqtt.client as paho
from dotenv import find_dotenv, load_dotenv
from paho import mqtt

load_dotenv(find_dotenv())

dbConfig = dict(
    host=os.environ.get('DB_HOST'),
    port=os.environ.get('DB_PORT'),
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


def execute_query(query):
    try:
        conn = mysql.connector.connect(**dbConfig)
        conn.autocommit = False
        cursor = conn.cursor()
        cursor.execute(query)
        conn.commit()
    except mysql.connector.Error as error:
        print(f'Error: {error}')
        conn.rollback()
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()


def on_connect(client, userdata, flags, rc, properties=None):
    print(f'CONNACK received with code {rc}.')


def on_publish(client, userdata, mid, properties=None):
    print(f'mid: {str(mid)}')


def on_subscribe(client, userdata, mid, granted_qos, properties=None):
    print(f'Subscribed: {str(mid)} {str(granted_qos)}')


def on_message(client, userdata, msg):
    print(msg.topic, str(msg.qos), str(msg.payload), sep=' ')

    group, item = msg.topic.split('/')
    if group not in ('sensor', 'status'):
        return

    # parse payload into dict json
    payload = json.loads(msg.payload)
    readingTime = (
        payload.get('readingTime') or
        datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    )

    insert_query = ''
    if group == 'sensor':
        reading = int(payload.get('reading'))
        insert_query = f"""
            INSERT INTO {item}Log(reading, readingTime)
            VALUES ({reading}, '{readingTime}')
        """
    elif group == 'status':
        status = 1 if str(payload.get('status')) == 'True' else 0
        insert_query = f"""
            INSERT INTO statusLog(status, readingTime)
            VALUES ({status}, '{readingTime}')
        """

    execute_query(insert_query)


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
    mqtt_client.subscribe('status/reading', qos=1)
    mqtt_client.loop_forever()


if __name__ == '__main__':
    print('Starting backend server...')
    setup_mqtt()
