"""
Test script to check notifications in database
"""
from pymongo import MongoClient
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

# Connect to MongoDB
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/curtaincall')
client = MongoClient(MONGO_URI)
db = client.curtaincall

print("="*70)
print("Checking Notifications in Database")
print("="*70)

# Get all notifications
notifications = list(db.notifications.find().sort('timestamp', -1).limit(10))

print(f"\n📊 Total notifications found: {len(notifications)}")
print("-" * 70)

if len(notifications) == 0:
    print("\n⚠️ No notifications found in database!")
    print("\nPossible reasons:")
    print("1. Auto mode is disabled (status_tirai != 'Auto')")
    print("2. Light level is within threshold range (no action needed)")
    print("3. Curtain position already matches desired state")
    print("4. Error in create_notification function")
else:
    for i, notif in enumerate(notifications, 1):
        print(f"\n{i}. Notification:")
        print(f"   Type: {notif.get('type', 'N/A')}")
        print(f"   Title: {notif.get('title', 'N/A')}")
        print(f"   Message: {notif.get('message', 'N/A')}")
        print(f"   Priority: {notif.get('priority', 'N/A')}")
        print(f"   Read: {notif.get('read', False)}")
        
        # Convert timestamp to WIB
        if 'timestamp' in notif and notif['timestamp']:
            ts = notif['timestamp']
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc).astimezone(WIB)
            else:
                ts = ts.astimezone(WIB)
            print(f"   Timestamp: {ts.strftime('%d %B %Y, %H:%M:%S WIB')}")
        print("-" * 70)

# Check current sensor data
print("\n📊 Current Sensor Data:")
print("-" * 70)
current = db.curtain_data.find_one({'_id': 'current'})
if current:
    print(f"   Cahaya: {current.get('cahaya', 'N/A')} lux")
    print(f"   Posisi: {current.get('posisi', 'N/A')}")
    print(f"   Status Tirai: {current.get('status_tirai', 'N/A')}")
    print(f"   Suhu: {current.get('suhu', 'N/A')}°C")
    print(f"   Kelembapan: {current.get('kelembapan', 'N/A')}%")
else:
    print("   No current data found")

# Check auto mode rules
print("\n📊 Auto Mode Rules:")
print("-" * 70)
rules = db.auto_mode_rules.find_one()
if rules:
    print(f"   Light Open Threshold: < {rules.get('light_open_threshold', 'N/A')} lux")
    print(f"   Light Close Threshold: > {rules.get('light_close_threshold', 'N/A')} lux")
    print(f"   Temperature Threshold: {rules.get('temperature_threshold', 'N/A')}°C")
    print(f"   Enabled: {rules.get('enabled', 'N/A')}")
else:
    print("   No rules found (using defaults)")

print("\n" + "="*70)
print("✅ Check complete!")
print("="*70)

client.close()
