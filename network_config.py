"""
Network Configuration untuk CurtainCall Backend
Semua konfigurasi IP address dan network settings ada di sini
"""

import os
from dotenv import load_dotenv

load_dotenv()

class NetworkConfig:
    """Konfigurasi network untuk backend"""
    
    # MQTT Broker Configuration
    MQTT_BROKER_IP = os.getenv('MQTT_BROKER_IP', '127.0.0.1')
    MQTT_BROKER_PORT = int(os.getenv('MQTT_BROKER_PORT', 1883))
    MQTT_KEEPALIVE = int(os.getenv('MQTT_KEEPALIVE', 60))
    MQTT_TLS_ENABLED = os.getenv('MQTT_TLS_ENABLED', 'False').lower() == 'true'
    
    # Flask Server Configuration
    FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    
    # MongoDB Configuration
    MONGO_HOST = os.getenv('MONGO_HOST', 'localhost')
    MONGO_PORT = int(os.getenv('MONGO_PORT', 27017))
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'curtaincall')
    
    @classmethod
    def get_mqtt_broker_url(cls):
        """Get full MQTT broker URL"""
        return cls.MQTT_BROKER_IP
    
    @classmethod
    def get_mongo_uri(cls):
        """Get MongoDB connection URI"""
        return f"mongodb://{cls.MONGO_HOST}:{cls.MONGO_PORT}/{cls.MONGO_DB_NAME}"
    
    @classmethod
    def print_config(cls):
        """Print current network configuration"""
        print("=" * 50)
        print("Network Configuration")
        print("=" * 50)
        print(f"MQTT Broker: {cls.MQTT_BROKER_IP}:{cls.MQTT_BROKER_PORT}")
        print(f"Flask Server: {cls.FLASK_HOST}:{cls.FLASK_PORT}")
        print(f"MongoDB: {cls.MONGO_HOST}:{cls.MONGO_PORT}/{cls.MONGO_DB_NAME}")
        print("=" * 50)

