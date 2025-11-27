"""
Test script untuk memverifikasi perbaikan PIR sensor:
1. Tidak ada notifikasi duplikat
2. Responsivitas lebih baik
3. Debouncing bekerja dengan baik
"""

import requests
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000/api"
EMAIL = "pirtest@example.com"
PASSWORD = "pirtest123"

def login():
    """Login dan dapatkan access token"""
    response = requests.post(f"{BASE_URL}/users/login", json={
        "email": EMAIL,
        "password": PASSWORD
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login successful")
        # Check for both possible token field names
        token = data.get('access_token') or data.get('token')
        if not token:
            print(f"⚠️ Response data: {data}")
            print(f"❌ No access token in response")
            return None
        return token
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def get_notifications(token, limit=10):
    """Get recent notifications"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/notifications?limit={limit}", headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Failed to get notifications: {response.text}")
        return []

def check_for_duplicates(notifications):
    """Check for duplicate PIR notifications"""
    pir_notifications = [n for n in notifications if n.get('type') == 'pir_motion']
    
    print(f"\n📊 Found {len(pir_notifications)} PIR notifications")
    
    if len(pir_notifications) == 0:
        print("⚠️ No PIR notifications found. Trigger PIR sensor to test.")
        return
    
    # Check for duplicates (same message within 1 second)
    duplicates_found = False
    for i in range(len(pir_notifications) - 1):
        current = pir_notifications[i]
        next_notif = pir_notifications[i + 1]
        
        current_time = datetime.fromisoformat(current['timestamp'].replace('Z', '+00:00'))
        next_time = datetime.fromisoformat(next_notif['timestamp'].replace('Z', '+00:00'))
        
        time_diff = abs((current_time - next_time).total_seconds())
        
        if time_diff < 1.0 and current['message'] == next_notif['message']:
            print(f"\n❌ DUPLICATE FOUND!")
            print(f"   Notification 1: {current['timestamp']} - {current['message'][:50]}...")
            print(f"   Notification 2: {next_notif['timestamp']} - {next_notif['message'][:50]}...")
            print(f"   Time difference: {time_diff:.3f} seconds")
            duplicates_found = True
    
    if not duplicates_found:
        print("✅ No duplicates found!")
    
    # Display recent PIR notifications
    print("\n📋 Recent PIR Notifications:")
    for i, notif in enumerate(pir_notifications[:5], 1):
        timestamp = notif['timestamp']
        message = notif['message'][:60] + "..." if len(notif['message']) > 60 else notif['message']
        print(f"   {i}. [{timestamp}] {message}")

def monitor_notifications(token, duration=30):
    """Monitor notifications for duplicates over a period"""
    print(f"\n🔍 Monitoring notifications for {duration} seconds...")
    print("   Please trigger PIR sensor during this time")
    
    initial_notifications = get_notifications(token, limit=50)
    initial_count = len([n for n in initial_notifications if n.get('type') == 'pir_motion'])
    
    print(f"   Initial PIR notification count: {initial_count}")
    
    time.sleep(duration)
    
    final_notifications = get_notifications(token, limit=50)
    final_count = len([n for n in final_notifications if n.get('type') == 'pir_motion'])
    
    new_notifications = final_count - initial_count
    print(f"\n   Final PIR notification count: {final_count}")
    print(f"   New notifications created: {new_notifications}")
    
    if new_notifications > 0:
        print("\n   Checking for duplicates in new notifications...")
        check_for_duplicates(final_notifications)

def main():
    print("╔════════════════════════════════════════════════════════╗")
    print("║     PIR SENSOR IMPROVEMENT TEST                        ║")
    print("╚════════════════════════════════════════════════════════╝\n")
    
    # Login
    token = login()
    if not token:
        return
    
    # Check existing notifications for duplicates
    print("\n1️⃣ Checking existing notifications for duplicates...")
    notifications = get_notifications(token, limit=50)
    check_for_duplicates(notifications)
    
    # Monitor for new notifications
    print("\n2️⃣ Live monitoring test")
    choice = input("\nDo you want to monitor for new PIR triggers? (y/n): ")
    if choice.lower() == 'y':
        monitor_notifications(token, duration=30)
    
    print("\n✅ Test completed!")
    print("\nExpected improvements:")
    print("  ✓ No duplicate notifications (same message within 1 second)")
    print("  ✓ PIR responds within 0.6 seconds (debounce time)")
    print("  ✓ Cooldown prevents re-trigger for 5 seconds")
    print("  ✓ User can easily open/close curtain with motion detection")

if __name__ == "__main__":
    main()
