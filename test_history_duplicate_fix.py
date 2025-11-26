"""
Test history duplicate prevention by monitoring database
"""
from pymongo import MongoClient
import time

def monitor_history():
    """Monitor history collection for duplicates"""
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client.curtaincall
        history_collection = db.curtain_history
        
        print("="*60)
        print("Monitoring History for Duplicates")
        print("="*60)
        print("\nWatching for new history entries...")
        print("Send some sensor data from ESP32 and observe...")
        print("Press Ctrl+C to stop\n")
        
        # Get initial state
        last_count = history_collection.count_documents({})
        last_entries = list(history_collection.find().sort('history_timestamp', -1).limit(5))
        
        print(f"📊 Current count: {last_count}")
        print("\n📋 Last 5 entries:")
        for entry in last_entries:
            print(f"  {entry.get('history_timestamp')} - "
                  f"Temp: {entry.get('temperature')}°C, "
                  f"Pos: {entry.get('position')}")
        
        print("\n" + "-"*60)
        
        # Monitor for changes
        while True:
            time.sleep(2)  # Check every 2 seconds
            
            current_count = history_collection.count_documents({})
            
            if current_count != last_count:
                added = current_count - last_count
                print(f"\n🔔 Change detected! {added} new entry(ies) added")
                
                # Get new entries
                new_entries = list(history_collection.find().sort('history_timestamp', -1).limit(added + 2))
                
                # Check for duplicates in recent entries
                recent_timestamps = {}
                duplicates_found = False
                
                for entry in new_entries[:5]:  # Check last 5 entries
                    key = (
                        entry.get('timestamp'),
                        entry.get('temperature'),
                        entry.get('humidity'),
                        entry.get('light'),
                        entry.get('position')
                    )
                    
                    if key in recent_timestamps:
                        print(f"❌ DUPLICATE DETECTED!")
                        print(f"   Timestamp: {entry.get('history_timestamp')}")
                        print(f"   Data: Temp={entry.get('temperature')}°C, "
                              f"Hum={entry.get('humidity')}%, "
                              f"Light={entry.get('light')}, "
                              f"Pos={entry.get('position')}")
                        duplicates_found = True
                    else:
                        recent_timestamps[key] = entry
                        print(f"✅ New entry: {entry.get('history_timestamp')} - "
                              f"Temp: {entry.get('temperature')}°C, "
                              f"Pos: {entry.get('position')}")
                
                if not duplicates_found:
                    print("✅ No duplicates detected in recent entries")
                
                last_count = current_count
                print("-"*60)
        
    except KeyboardInterrupt:
        print("\n\n👋 Monitoring stopped")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    monitor_history()
