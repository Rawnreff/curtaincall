"""
Test script for auto-marking notifications beyond top 40 as read
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000"

def login():
    """Login and get token"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    if response.status_code == 200:
        token = response.json()['access_token']
        print("✅ Login successful")
        return token
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def get_notifications(token):
    """Get all notifications"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/notifications", headers=headers)
    
    if response.status_code == 200:
        notifications = response.json()
        print(f"\n📋 Total notifications: {len(notifications)}")
        
        # Count unread
        unread = [n for n in notifications if not n.get('read', False)]
        print(f"📬 Unread notifications: {len(unread)}")
        
        # Show first 45 notifications status
        print("\n📊 First 45 notifications status:")
        for i, notif in enumerate(notifications[:45], 1):
            status = "✅ Read" if notif.get('read', False) else "📬 Unread"
            print(f"  {i}. {status} - {notif['title'][:50]}")
        
        return notifications
    else:
        print(f"❌ Failed to get notifications: {response.text}")
        return []

def create_test_notifications(token, count=50):
    """Create test notifications"""
    from app import create_app
    from app.models.notification_model import get_collection
    from datetime import datetime, timezone, timedelta
    
    app = create_app()
    with app.app_context():
        notifications_collection = get_collection('notifications')
        
        # Create notifications
        WIB = timezone(timedelta(hours=7))
        for i in range(count):
            notification = {
                'type': 'test',
                'title': f'Test Notification {i+1}',
                'message': f'This is test notification number {i+1}',
                'timestamp': datetime.now(WIB),
                'read': False
            }
            notifications_collection.insert_one(notification)
        
        print(f"✅ Created {count} test notifications")

def main():
    print("=" * 60)
    print("Testing Auto-Mark Notifications Beyond Top 40")
    print("=" * 60)
    
    # Login
    token = login()
    if not token:
        return
    
    # Get notifications before
    print("\n" + "=" * 60)
    print("BEFORE: Checking notification status")
    print("=" * 60)
    notifications_before = get_notifications(token)
    
    if len(notifications_before) < 45:
        print(f"\n⚠️  Only {len(notifications_before)} notifications found.")
        print("The auto-mark feature works when there are more than 40 notifications.")
        print("Notifications beyond the top 40 will be automatically marked as read.")
    else:
        print("\n" + "=" * 60)
        print("EXPECTED BEHAVIOR:")
        print("=" * 60)
        print("When the frontend loads notifications:")
        print("1. Top 40 notifications are displayed to user")
        print("2. Notifications beyond top 40 that are unread will be auto-marked as read")
        print("3. This prevents accumulation of unread notifications that user cannot see")
        
        # Count unread beyond 40
        beyond_40 = notifications_before[40:]
        unread_beyond = [n for n in beyond_40 if not n.get('read', False)]
        
        if unread_beyond:
            print(f"\n📬 Found {len(unread_beyond)} unread notifications beyond top 40")
            print("These will be auto-marked as read when frontend loads")
        else:
            print("\n✅ No unread notifications beyond top 40")

if __name__ == "__main__":
    main()
