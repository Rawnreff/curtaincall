"""
Test script for auto mode control and settings notifications
Tests enable/disable auto mode and rules update notifications
"""

import requests
import json
from pymongo import MongoClient

# Configuration
BASE_URL = "http://localhost:5000/api"
TEST_USER = {
    "email": "test@example.com",
    "password": "test123"
}

def login():
    """Login and get JWT token"""
    print("\n" + "="*60)
    print("LOGIN")
    print("="*60)
    
    response = requests.post(
        f"{BASE_URL}/users/login",
        json=TEST_USER
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('access_token')
        print(f"✅ Login successful")
        print(f"   Token: {token[:20]}...")
        return token
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def test_enable_auto_mode(token):
    """Test enabling auto mode"""
    print("\n" + "="*60)
    print("TEST 1: Enable Auto Mode")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/control/tirai",
        headers=headers,
        json={
            "mode": "auto",
            "action": "enable"
        }
    )
    
    if response.status_code == 200:
        print("✅ Auto mode enabled successfully")
        print(f"   Response: {response.json()}")
    else:
        print(f"❌ Failed to enable auto mode: {response.status_code}")
        print(f"   Response: {response.text}")

def test_disable_auto_mode(token):
    """Test disabling auto mode"""
    print("\n" + "="*60)
    print("TEST 2: Disable Auto Mode")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/control/tirai",
        headers=headers,
        json={
            "mode": "auto",
            "action": "disable"
        }
    )
    
    if response.status_code == 200:
        print("✅ Auto mode disabled successfully")
        print(f"   Response: {response.json()}")
    else:
        print(f"❌ Failed to disable auto mode: {response.status_code}")
        print(f"   Response: {response.text}")

def test_update_rules(token):
    """Test updating auto mode rules"""
    print("\n" + "="*60)
    print("TEST 3: Update Auto Mode Rules")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.put(
        f"{BASE_URL}/auto-mode/rules",
        headers=headers,
        json={
            "light_open_threshold": 200,
            "light_close_threshold": 3000,
            "temperature_threshold": 33,
            "enabled": True
        }
    )
    
    if response.status_code == 200:
        print("✅ Auto mode rules updated successfully")
        print(f"   Response: {response.json()}")
    else:
        print(f"❌ Failed to update rules: {response.status_code}")
        print(f"   Response: {response.text}")

def verify_notifications():
    """Verify notifications in database"""
    print("\n" + "="*60)
    print("VERIFICATION: Check Database Notifications")
    print("="*60)
    
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client.curtaincall
        notifications = db.notifications
        
        # Get recent auto mode control notifications
        auto_control_notifs = list(notifications.find(
            {'type': 'auto_mode_control'}
        ).sort('timestamp', -1).limit(5))
        
        print(f"\n📊 Auto Mode Control Notifications ({len(auto_control_notifs)}):")
        for i, notif in enumerate(auto_control_notifs, 1):
            print(f"\n{i}. {notif['title']}")
            print(f"   Message: {notif['message']}")
            print(f"   Priority: {notif['priority']}")
            print(f"   Timestamp: {notif['timestamp']}")
        
        # Get recent auto mode settings notifications
        settings_notifs = list(notifications.find(
            {'type': 'auto_mode_settings'}
        ).sort('timestamp', -1).limit(5))
        
        print(f"\n📊 Auto Mode Settings Notifications ({len(settings_notifs)}):")
        for i, notif in enumerate(settings_notifs, 1):
            print(f"\n{i}. {notif['title']}")
            print(f"   Message: {notif['message']}")
            print(f"   Priority: {notif['priority']}")
            print(f"   Timestamp: {notif['timestamp']}")
        
        if len(auto_control_notifs) > 0 or len(settings_notifs) > 0:
            print("\n✅ Notifications are being created!")
        else:
            print("\n⚠️ No notifications found")
        
    except Exception as e:
        print(f"❌ Database verification failed: {e}")

if __name__ == "__main__":
    print("\n╔════════════════════════════════════════════════════════════╗")
    print("║   AUTO MODE CONTROL & SETTINGS NOTIFICATION TEST           ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    print("\nThis script will:")
    print("1. Login as test user")
    print("2. Enable auto mode (should create notification)")
    print("3. Disable auto mode (should create notification)")
    print("4. Update auto mode rules (should create notification)")
    print("5. Verify notifications in database")
    
    print("\nMake sure:")
    print("- Backend is running on http://localhost:5000")
    print("- Test user exists in database")
    print("- MongoDB is accessible")
    
    input("\nPress Enter to start tests...")
    
    # Login
    token = login()
    if not token:
        print("\n❌ Cannot proceed without authentication")
        exit(1)
    
    # Run tests
    import time
    
    test_enable_auto_mode(token)
    time.sleep(1)
    
    test_disable_auto_mode(token)
    time.sleep(1)
    
    test_update_rules(token)
    time.sleep(1)
    
    # Verify
    verify_notifications()
    
    print("\n" + "="*60)
    print("ALL TESTS COMPLETED")
    print("="*60)
    print("\nCheck the notifications in your app!")
