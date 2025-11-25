"""
Check current curtain position values in database
"""
from pymongo import MongoClient

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "curtain_db"

def check_position_values():
    """Check current position values in database"""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        
        print("🔍 Checking curtain position values in database")
        print("=" * 60)
        
        # Check curtain_data
        curtain_data = db['curtain_data']
        current_data = curtain_data.find_one({'_id': 'current'})
        
        if current_data:
            print(f"\n📦 curtain_data (current):")
            print(f"   posisi: {current_data.get('posisi', 'N/A')}")
            print(f"   status_tirai: {current_data.get('status_tirai', 'N/A')}")
        else:
            print(f"\n📦 curtain_data: No current data found")
        
        # Check curtain_history (last 5 entries)
        curtain_history = db['curtain_history']
        history_count = curtain_history.count_documents({})
        print(f"\n📦 curtain_history: {history_count} total documents")
        
        if history_count > 0:
            print(f"\n   Last 5 entries:")
            for doc in curtain_history.find().sort('history_timestamp', -1).limit(5):
                print(f"   - posisi: {doc.get('posisi', 'N/A')}, timestamp: {doc.get('history_timestamp', 'N/A')}")
        
        # Count by position value
        print(f"\n📊 Position value counts:")
        for collection_name in ['curtain_data', 'curtain_history']:
            collection = db[collection_name]
            
            count_open = collection.count_documents({'posisi': 'Open'})
            count_close = collection.count_documents({'posisi': 'Close'})
            count_terbuka = collection.count_documents({'posisi': 'Terbuka'})
            count_tertutup = collection.count_documents({'posisi': 'Tertutup'})
            count_unknown = collection.count_documents({'posisi': 'Unknown'})
            
            print(f"\n   {collection_name}:")
            print(f"     - Open: {count_open}")
            print(f"     - Close: {count_close}")
            print(f"     - Terbuka: {count_terbuka}")
            print(f"     - Tertutup: {count_tertutup}")
            print(f"     - Unknown: {count_unknown}")
        
        print("\n" + "=" * 60)
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_position_values()
