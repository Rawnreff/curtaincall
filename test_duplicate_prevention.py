"""
Test that duplicate history entries are prevented
"""
from pymongo import MongoClient
import time

def test_duplicate_prevention():
    """Test that the duplicate prevention works"""
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client.curtaincall
        history_collection = db.curtain_history
        
        print("="*60)
        print("Testing Duplicate Prevention")
        print("="*60)
        
        # Get initial count
        initial_count = history_collection.count_documents({})
        print(f"\n📊 Initial history count: {initial_count}")
        
        # Simulate the save_to_history function being called multiple times
        # with the same data (simulating race condition)
        print("\n🧪 Simulating race condition...")
        print("   Calling save_to_history logic 3 times with same data...")
        
        from app.models.sensor_model import save_to_history
        from app import get_db
        
        # Call save_to_history multiple times in quick succession
        for i in range(3):
            print(f"   Attempt {i+1}...")
            save_to_history()
            time.sleep(0.1)  # Small delay to simulate near-simultaneous calls
        
        # Check final count
        final_count = history_collection.count_documents({})
        added = final_count - initial_count
        
        print(f"\n📊 Final history count: {final_count}")
        print(f"📊 Entries added: {added}")
        
        if added <= 1:
            print("\n✅ SUCCESS: Duplicate prevention working!")
            print(f"   Only {added} entry added despite 3 attempts")
        else:
            print(f"\n❌ FAILED: {added} entries added (expected 0 or 1)")
        
        print("\n" + "="*60)
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_duplicate_prevention()
