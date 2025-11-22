"""
Test BUKA command
"""

import os
from dotenv import load_dotenv
from flask import Flask
from db_operations import init_mongodb, update_curtain_data, is_db_available
from mqtt_client import init_mqtt_client, send_voice_command, is_mqtt_available

load_dotenv()

app = Flask(__name__)
app.config["MONGO_URI"] = os.getenv("MONGO_URI")

print("Testing BUKA command...")
mongo = init_mongodb(app)
mqtt = init_mqtt_client()

intent = "BUKA"
transcript = "buka gorden"

print(f"\nIntent: {intent}")
print(f"Transcript: '{transcript}'")

# Update database
if is_db_available():
    success = update_curtain_data(intent, preserve_sensors=True)
    if success:
        print("✅ Database updated")
        
        # Verify
        from pymongo import MongoClient
        client = MongoClient(os.getenv("MONGO_URI"))
        db = client.curtaincall
        current_data = db.curtain_data.find_one({'_id': 'current'})
        print(f"Current position: {current_data.get('posisi')}")
        client.close()

# Send MQTT
if is_mqtt_available():
    success = send_voice_command(intent, transcript)
    if success:
        print("✅ MQTT command sent")

print("\nTest complete!")
