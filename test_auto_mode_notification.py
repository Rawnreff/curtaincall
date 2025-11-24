"""
Test script for auto mode notification functionality
Simulates ESP32 sending auto action messages via MQTT
"""

import paho.mqtt.client as mqtt
import json
import time
from datetime import datetime

# MQTT Configuration
MQTT_BROKER = "10.218.19.178"
MQTT_PORT = 1883
TOPIC_AUTO_ACTION = "/curtain/auto_action"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Test client connected to MQTT broker")
    else:
        print(f"❌ Connection failed with code {rc}")

def on_publish(client, userdata, mid):
    print(f"✅ Message published (mid: {mid})")

def test_auto_action_open():
    """Test auto mode open action notification"""
    print("\n" + "="*60)
    print("TEST 1: Auto Mode OPEN Action")
    print("="*60)
    
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_publish = on_publish
    
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        
        time.sleep(1)  # Wait for connection
        
        # Simulate auto mode opening curtain (light too dark)
        message = {
            "action": "open",
            "light_level": 200,  # Below threshold
            "threshold": 250,
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"\n📤 Publishing auto action message:")
        print(f"   Topic: {TOPIC_AUTO_ACTION}")
        print(f"   Message: {json.dumps(message, indent=2)}")
        
        result = client.publish(TOPIC_AUTO_ACTION, json.dumps(message), qos=1)
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print("✅ Message sent successfully")
        else:
            print(f"❌ Failed to send message: {result.rc}")
        
        time.sleep(2)  # Wait for processing
        
        client.loop_stop()
        client.disconnect()
        
        print("\n✅ Test 1 completed")
        print("   Check database for notification with:")
        print("   - type: 'auto_mode'")
        print("   - title: 'Auto Mode Action'")
        print("   - message containing: 'opening', '200 lux', '250 lux'")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

def test_auto_action_close():
    """Test auto mode close action notification"""
    print("\n" + "="*60)
    print("TEST 2: Auto Mode CLOSE Action")
    print("="*60)
    
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_publish = on_publish
    
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        
        time.sleep(1)  # Wait for connection
        
        # Simulate auto mode closing curtain (light too bright)
        message = {
            "action": "close",
            "light_level": 600,  # Above threshold
            "threshold": 500,
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"\n📤 Publishing auto action message:")
        print(f"   Topic: {TOPIC_AUTO_ACTION}")
        print(f"   Message: {json.dumps(message, indent=2)}")
        
        result = client.publish(TOPIC_AUTO_ACTION, json.dumps(message), qos=1)
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print("✅ Message sent successfully")
        else:
            print(f"❌ Failed to send message: {result.rc}")
        
        time.sleep(2)  # Wait for processing
        
        client.loop_stop()
        client.disconnect()
        
        print("\n✅ Test 2 completed")
        print("   Check database for notification with:")
        print("   - type: 'auto_mode'")
        print("   - title: 'Auto Mode Action'")
        print("   - message containing: 'closing', '600 lux', '500 lux'")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

def verify_notifications():
    """Verify notifications in database"""
    print("\n" + "="*60)
    print("VERIFICATION: Check Database Notifications")
    print("="*60)
    
    try:
        from pymongo import MongoClient
        
        # Connect to MongoDB
        client = MongoClient('mongodb://localhost:27017/')
        db = client.curtaincall
        notifications = db.notifications
        
        # Get recent auto_mode notifications
        recent_notifications = list(notifications.find(
            {'type': 'auto_mode'}
        ).sort('timestamp', -1).limit(5))
        
        print(f"\n📊 Found {len(recent_notifications)} auto_mode notifications:")
        
        for i, notif in enumerate(recent_notifications, 1):
            print(f"\n{i}. Notification:")
            print(f"   ID: {notif['_id']}")
            print(f"   Title: {notif['title']}")
            print(f"   Message: {notif['message']}")
            print(f"   Priority: {notif['priority']}")
            print(f"   Read: {notif['read']}")
            print(f"   Timestamp: {notif['timestamp']}")
        
        if len(recent_notifications) > 0:
            print("\n✅ Auto mode notifications are being created!")
        else:
            print("\n⚠️ No auto_mode notifications found in database")
        
    except Exception as e:
        print(f"❌ Database verification failed: {e}")
        print("   Make sure MongoDB is running and accessible")

if __name__ == "__main__":
    print("\n╔════════════════════════════════════════════════════════════╗")
    print("║     AUTO MODE NOTIFICATION TEST SUITE                      ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    print("\nThis script will:")
    print("1. Send test auto action messages via MQTT")
    print("2. Verify notifications are created in database")
    print("\nMake sure:")
    print("- Backend is running")
    print("- MQTT broker is running")
    print("- MongoDB is accessible")
    
    input("\nPress Enter to start tests...")
    
    # Run tests
    test_auto_action_open()
    time.sleep(2)
    
    test_auto_action_close()
    time.sleep(2)
    
    # Verify in database
    verify_notifications()
    
    print("\n" + "="*60)
    print("ALL TESTS COMPLETED")
    print("="*60)
    print("\nNext steps:")
    print("1. Upload updated code to ESP32")
    print("2. Enable auto mode on ESP32")
    print("3. Change light conditions to trigger auto actions")
    print("4. Check notifications in the app")
