"""
Simple integration test for NLP backend integration
Tests database and MQTT connectivity
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 60)
print("Testing NLP Backend Integration")
print("=" * 60)

# Test 1: Check environment variables
print("\n1. Checking environment variables...")
mongo_uri = os.getenv('MONGO_URI')
mqtt_broker = os.getenv('MQTT_BROKER_IP')
mqtt_port = os.getenv('MQTT_BROKER_PORT')

print(f"   MONGO_URI: {mongo_uri}")
print(f"   MQTT_BROKER_IP: {mqtt_broker}")
print(f"   MQTT_BROKER_PORT: {mqtt_port}")

if mongo_uri and mqtt_broker and mqtt_port:
    print("   ✅ Environment variables configured")
else:
    print("   ⚠️ Some environment variables missing")

# Test 2: Test MongoDB connection
print("\n2. Testing MongoDB connection...")
try:
    from pymongo import MongoClient
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    client.server_info()  # Force connection
    print("   ✅ MongoDB connection successful")
    
    # Check collections
    db = client.curtaincall
    collections = db.list_collection_names()
    print(f"   Collections found: {collections}")
    
    # Check curtain_data
    curtain_data = db.curtain_data.find_one({'_id': 'current'})
    if curtain_data:
        print(f"   Current curtain status: {curtain_data.get('posisi', 'Unknown')}")
    else:
        print("   No current curtain data found")
    
    client.close()
except Exception as e:
    print(f"   ❌ MongoDB connection failed: {e}")

# Test 3: Test MQTT connection
print("\n3. Testing MQTT connection...")
try:
    import paho.mqtt.client as mqtt
    import time
    
    mqtt_status = {'connected': False}
    
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            mqtt_status['connected'] = True
            print("   ✅ MQTT connection successful")
        else:
            print(f"   ❌ MQTT connection failed with code {rc}")
    
    client = mqtt.Client()
    client.on_connect = on_connect
    client.connect(mqtt_broker, int(mqtt_port), 60)
    client.loop_start()
    
    time.sleep(2)  # Wait for connection
    
    if not mqtt_status['connected']:
        print("   ⚠️ MQTT connection timeout")
    
    client.loop_stop()
    client.disconnect()
    
except Exception as e:
    print(f"   ❌ MQTT connection failed: {e}")

# Test 4: Test imports
print("\n4. Testing module imports...")
try:
    from db_operations import init_mongodb, update_curtain_data, log_voice_control
    print("   ✅ db_operations module imported successfully")
except Exception as e:
    print(f"   ❌ Failed to import db_operations: {e}")

try:
    from mqtt_client import init_mqtt_client, send_voice_command
    print("   ✅ mqtt_client module imported successfully")
except Exception as e:
    print(f"   ❌ Failed to import mqtt_client: {e}")

print("\n" + "=" * 60)
print("Integration test complete!")
print("=" * 60)
