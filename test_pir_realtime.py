"""
Real-time PIR duplicate detection test
Monitors database for duplicate notifications as they are created
"""

import pymongo
import time
from datetime import datetime, timedelta, timezone
from collections import defaultdict

# MongoDB connection
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client.curtaincall
notifications = db.notifications

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

def monitor_duplicates(duration=60):
    """Monitor for duplicate PIR notifications in real-time"""
    print("╔════════════════════════════════════════════════════════╗")
    print("║     REAL-TIME PIR DUPLICATE MONITOR                    ║")
    print("╚════════════════════════════════════════════════════════╝\n")
    
    print(f"🔍 Monitoring for {duration} seconds...")
    print("   Trigger PIR sensor now to test\n")
    
    # Track notifications by message content
    seen_notifications = defaultdict(list)
    
    start_time = time.time()
    last_count = 0
    
    while time.time() - start_time < duration:
        # Get recent PIR notifications (last 10 seconds)
        time_threshold = datetime.now(WIB) - timedelta(seconds=10)
        
        recent_pir = list(notifications.find({
            'type': 'pir_motion',
            'timestamp': {'$gte': time_threshold}
        }).sort('timestamp', -1))
        
        current_count = len(recent_pir)
        
        # Check if new notifications arrived
        if current_count > last_count:
            new_count = current_count - last_count
            print(f"\n📨 {new_count} new PIR notification(s) detected!")
            
            # Check for duplicates
            for notif in recent_pir[:new_count]:
                msg = notif['message']
                timestamp = notif['timestamp']
                
                # Check if we've seen this message recently
                if msg in seen_notifications:
                    # Check time difference
                    for prev_time in seen_notifications[msg]:
                        time_diff = abs((timestamp - prev_time).total_seconds())
                        if time_diff < 5:  # Within 5 seconds
                            print(f"\n❌ DUPLICATE DETECTED!")
                            print(f"   Message: {msg[:60]}...")
                            print(f"   Time 1: {prev_time}")
                            print(f"   Time 2: {timestamp}")
                            print(f"   Difference: {time_diff:.3f} seconds")
                            print(f"   Status: FAILED - Duplicates still occurring!\n")
                            return False
                
                seen_notifications[msg].append(timestamp)
                print(f"   ✅ Unique notification at {timestamp}")
            
            last_count = current_count
        
        time.sleep(0.5)  # Check every 500ms
    
    print(f"\n✅ Monitoring complete!")
    print(f"   Total PIR notifications: {current_count}")
    print(f"   No duplicates detected within 5 seconds")
    print(f"   Status: PASSED - Duplicate prevention working!\n")
    return True

def check_existing_duplicates():
    """Check for existing duplicates in database"""
    print("\n📊 Checking existing notifications for duplicates...\n")
    
    # Get all PIR notifications from last hour
    time_threshold = datetime.now(WIB) - timedelta(hours=1)
    
    pir_notifs = list(notifications.find({
        'type': 'pir_motion',
        'timestamp': {'$gte': time_threshold}
    }).sort('timestamp', -1))
    
    print(f"   Found {len(pir_notifs)} PIR notifications in last hour")
    
    # Check for duplicates
    duplicates_found = False
    for i in range(len(pir_notifs) - 1):
        current = pir_notifs[i]
        next_notif = pir_notifs[i + 1]
        
        if current['message'] == next_notif['message']:
            time_diff = abs((current['timestamp'] - next_notif['timestamp']).total_seconds())
            
            if time_diff < 5:
                print(f"\n   ❌ Duplicate found:")
                print(f"      Time 1: {current['timestamp']}")
                print(f"      Time 2: {next_notif['timestamp']}")
                print(f"      Difference: {time_diff:.3f} seconds")
                duplicates_found = True
    
    if not duplicates_found:
        print(f"   ✅ No duplicates found in existing notifications\n")
    
    return not duplicates_found

if __name__ == "__main__":
    # Check existing duplicates first
    existing_ok = check_existing_duplicates()
    
    # Ask user if they want to do real-time monitoring
    choice = input("Do you want to do real-time monitoring? (y/n): ")
    
    if choice.lower() == 'y':
        success = monitor_duplicates(duration=30)
        
        if success:
            print("╔════════════════════════════════════════════════════════╗")
            print("║     ✅ ALL TESTS PASSED                                ║")
            print("║     PIR duplicate prevention is working correctly!     ║")
            print("╚════════════════════════════════════════════════════════╝")
        else:
            print("╔════════════════════════════════════════════════════════╗")
            print("║     ❌ TEST FAILED                                     ║")
            print("║     Duplicates are still being created                 ║")
            print("╚════════════════════════════════════════════════════════╝")
    else:
        print("\n✅ Test completed!")
