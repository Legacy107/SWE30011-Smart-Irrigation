from datetime import datetime
import json
import os

import mysql.connector
import paho.mqtt.client as paho
from dotenv import find_dotenv, load_dotenv
from paho import mqtt

load_dotenv(find_dotenv())

DB_CONFIG = dict(
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
    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        conn.autocommit = False
        cursor = conn.cursor()
        cursor.execute(query)
        conn.commit()
    except mysql.connector.Error as error:
        print(f'Error: {error}')
        if conn is not None:
            conn.rollback()
    finally:
        if conn is not None and conn.is_connected():
            cursor.close()
            conn.close()


def on_connect(client, userdata, flags, rc, properties=None):
    print(f'Connected with result code {rc}.')


def on_subscribe(client, userdata, mid, granted_qos, properties=None):
    print(f'Subscribed: {str(mid)} {str(granted_qos)}')


def on_message(client, userdata, msg):
    print(msg.topic, str(msg.qos), str(msg.payload), sep=' ')

    group, item = msg.topic.split('/')
    if group not in ('sensor', 'status', 'logic'):
        return

    payload = json.loads(msg.payload)
    readingTime = (
        payload.get('readingTime') or
        datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    )

    sql_query = ''
    if group == 'sensor':
        reading = int(payload.get('reading'))
        sql_query = f"""
            INSERT INTO {item}Log(reading, readingTime)
            VALUES ({reading}, '{readingTime}')
        """
    elif group == 'status':
        status = int(payload.get('status'))
        sql_query = f"""
            INSERT INTO statusLog(status, readingTime)
            VALUES ({status}, '{readingTime}')
        """
    elif group == 'logic':
        useModel = payload.get('useModel')
        simple = payload.get('simple')
        rules = payload.get('rules')
        sql_query = f"""
            UPDATE logicConfig
            SET useModel = {useModel}, rules = '{rules}', simple = {simple}
        """

    execute_query(sql_query)


def setup_mqtt():
    global mqtt_client
    mqtt_client = paho.Client(client_id='', userdata=None, protocol=paho.MQTTv5)
    mqtt_client.on_connect = on_connect
    mqtt_client.tls_set(tls_version=mqtt.client.ssl.PROTOCOL_TLS)
    mqtt_client.username_pw_set(MQTT_CONFIG['user'], MQTT_CONFIG['password'])
    mqtt_client.connect(MQTT_CONFIG['host'], MQTT_CONFIG['port'])
    mqtt_client.on_subscribe = on_subscribe
    mqtt_client.on_message = on_message
    mqtt_client.subscribe('sensor/#', qos=1)
    mqtt_client.subscribe('status/reading', qos=1)
    mqtt_client.subscribe('logic/config', qos=1)
    mqtt_client.loop_forever()


if __name__ == '__main__':
    print('Starting backend server...')
    setup_mqtt()
