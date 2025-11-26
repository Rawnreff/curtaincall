"""
Cleanup duplicate entries in curtain_history collection
"""
from pymongo import MongoClient
from datetime import datetime

def cleanup_duplicates():
    """Remove duplicate history entries"""
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client.curtaincall
        history_collection = db.curtain_history
        
        print("="*60)
        print("Cleaning up duplicate history entries")
        print("="*60)
        
        # Count total before cleanup
        total_before = history_collection.count_documents({})
        print(f"\n📊 Total history entries before cleanup: {total_before}")
        
        # Find duplicates based on timestamp and sensor values
        print("\n🔍 Finding duplicates...")
        
        pipeline = [
            {
                '$group': {
                    '_id': {
                        'timestamp': '$timestamp',
                        'temperature': '$temperature',
                        'humidity': '$humidity',
                        'light': '$light',
                        'position': '$position'
                    },
                    'ids': {'$push': '$_id'},
                    'count': {'$sum': 1}
                }
            },
            {
                '$match': {
                    'count': {'$gt': 1}
                }
            }
        ]
        
        duplicates = list(history_collection.aggregate(pipeline))
        
        if not duplicates:
            print("✅ No duplicates found!")
            return
        
        print(f"⚠️  Found {len(duplicates)} groups of duplicates")
        
        # Remove duplicates (keep first, remove rest)
        removed_count = 0
        for dup in duplicates:
            ids_to_remove = dup['ids'][1:]  # Keep first, remove rest
            if ids_to_remove:
                result = history_collection.delete_many({
                    '_id': {'$in': ids_to_remove}
                })
                removed_count += result.deleted_count
                print(f"  Removed {result.deleted_count} duplicate(s) for timestamp {dup['_id']['timestamp']}")
        
        # Count total after cleanup
        total_after = history_collection.count_documents({})
        
        print(f"\n📊 Summary:")
        print(f"  Before: {total_before} entries")
        print(f"  Removed: {removed_count} duplicates")
        print(f"  After: {total_after} entries")
        
        print("\n" + "="*60)
        print("✅ Cleanup completed!")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    cleanup_duplicates()
