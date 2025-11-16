import os
from datetime import timedelta
from dotenv import load_dotenv
from network_config import NetworkConfig

load_dotenv()

class Config:
    # Basic Flask Config
    SECRET_KEY = os.getenv('SECRET_KEY', 'curtaincall-secret-key-2024')
    
    # MongoDB Config - menggunakan network_config
    MONGO_URI = NetworkConfig.get_mongo_uri()
    
    # JWT Config
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-2024')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_TOKEN_LOCATION = ['headers']
    
    # MQTT Config - menggunakan network_config
    MQTT_BROKER_URL = NetworkConfig.get_mqtt_broker_url()
    MQTT_BROKER_PORT = NetworkConfig.MQTT_BROKER_PORT
    MQTT_KEEPALIVE = NetworkConfig.MQTT_KEEPALIVE
    MQTT_TLS_ENABLED = NetworkConfig.MQTT_TLS_ENABLED
    
    # Sensor Thresholds
    TEMPERATURE_THRESHOLD = 35.0  # °C
    LIGHT_OPEN_THRESHOLD = 250   # lux
    LIGHT_CLOSE_THRESHOLD = 500  # lux
    
    # API Settings
    API_PREFIX = '/api'
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'