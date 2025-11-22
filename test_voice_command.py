"""
Test voice command processing with database integration
Simulates a voice command without actual audio file
"""

import os
from dotenv import load_dotenv
from flask import Flask
from db_operations import init_mongodb, update_curtain_data, log_voice_control, create_voice_notification, is_db_available
from mqtt_client import init_mqtt_client, send_voice_command, is_mqtt_available

# Load environment
load_dotenv()

# Create Flask app for testing
app = Flask(__name__)
app.config["MONGO_URI"] = os.getenv("MONGO_URI")

print("=" * 60)
print("Testing Voice Command Processing")
print("=" * 60)

# Initialize connections
print("\n1. Initializing connections...")
mongo = init_mongodb(app)
mqtt = init_mqtt_client()

print(f"   Database available: {is_db_available()}")
print(f"   MQTT available: {is_mqtt_available()}")

# Test voice command: TUTUP
print("\n2. Testing voice command: TUTUP")
intent = "TUTUP"
transcript = "tutup gorden"
confidence = 0.95

print(f"   Intent: {intent}")
print(f"   Transcript: '{transcript}'")
print(f"   Confidence: {confidence}")

# Update curtain_data
print("\n3. Updating curtain_data...")
if is_db_available():
    success = update_curtain_data(intent, preserve_sensors=True)
    if success:
        print("   ✅ Curtain data updated successfully")
        
        # Verify update
        from pymongo import MongoClient
        client = MongoClient(os.getenv("MONGO_URI"))
        db = client.curtaincall
        current_data = db.curtain_data.find_one({'_id': 'current'})
        if current_data:
            print(f"   Current position: {current_data.get('posisi')}")
            print(f"   Status tirai: {current_data.get('status_tirai')}")
            print(f"   Sensor data preserved: suhu={current_data.get('suhu')}, kelembapan={current_data.get('kelembapan')}, cahaya={current_data.get('cahaya')}")
        client.close()
    else:
        print("   ❌ Failed to update curtain data")
else:
    print("   ⚠️ Database not available")

# Log control action
print("\n4. Logging control action...")
if is_db_available():
    success = log_voice_control(
        intent=intent,
        transcript=transcript,
        status='success',
        ip_address='127.0.0.1',
        confidence=confidence
    )
    if success:
        print("   ✅ Control action logged successfully")
        
        # Verify log
        from pymongo import MongoClient
        client = MongoClient(os.getenv("MONGO_URI"))
        db = client.curtaincall
        latest_log = db.control_logs.find_one(sort=[('timestamp', -1)])
        if latest_log:
            print(f"   Latest log: user={latest_log.get('username')}, action={latest_log.get('action')}, status={latest_log.get('status')}")
        client.close()
    else:
        print("   ❌ Failed to log control action")
else:
    print("   ⚠️ Database not available")

# Send MQTT command
print("\n5. Sending MQTT command...")
if is_mqtt_available():
    success = send_voice_command(intent, transcript)
    if success:
        print("   ✅ MQTT command sent successfully")
    else:
        print("   ❌ Failed to send MQTT command")
else:
    print("   ⚠️ MQTT not available")

# Create notification
print("\n6. Creating notification...")
if is_db_available():
    success = create_voice_notification(
        intent=intent,
        transcript=transcript,
        success=True
    )
    if success:
        print("   ✅ Notification created successfully")
        
        # Verify notification
        from pymongo import MongoClient
        client = MongoClient(os.getenv("MONGO_URI"))
        db = client.curtaincall
        latest_notif = db.notifications.find_one(sort=[('timestamp', -1)])
        if latest_notif:
            print(f"   Latest notification: {latest_notif.get('title')} - {latest_notif.get('message')}")
        client.close()
    else:
        print("   ❌ Failed to create notification")
else:
    print("   ⚠️ Database not available")

print("\n" + "=" * 60)
print("Voice command test complete!")
print("=" * 60)
