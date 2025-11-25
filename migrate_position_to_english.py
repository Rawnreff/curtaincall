"""
Migration script to convert curtain position from Indonesian to English
Changes: Terbuka -> Open, Tertutup -> Close
"""
from pymongo import MongoClient
from datetime import datetime, timedelta, timezone

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "curtain_db"

def migrate_position_values():
    """Migrate position values from Indonesian to English"""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        
        print("🔄 Starting migration: Terbuka -> Open, Tertutup -> Close")
        print("=" * 60)
        
        # Collections to update
        collections = ['curtain_data', 'curtain_history']
        
        for collection_name in collections:
            collection = db[collection_name]
            
            print(f"\n📦 Processing collection: {collection_name}")
            
            # Update Terbuka -> Open
            result_open = collection.update_many(
                {'posisi': 'Terbuka'},
                {'$set': {'posisi': 'Open'}}
            )
            print(f"  ✅ Updated {result_open.modified_count} documents: Terbuka -> Open")
            
            # Update Tertutup -> Close
            result_close = collection.update_many(
                {'posisi': 'Tertutup'},
                {'$set': {'posisi': 'Close'}}
            )
            print(f"  ✅ Updated {result_close.modified_count} documents: Tertutup -> Close")
            
            # Verify migration
            count_open = collection.count_documents({'posisi': 'Open'})
            count_close = collection.count_documents({'posisi': 'Close'})
            count_old_open = collection.count_documents({'posisi': 'Terbuka'})
            count_old_close = collection.count_documents({'posisi': 'Tertutup'})
            
            print(f"\n  📊 Current state in {collection_name}:")
            print(f"     - Open: {count_open}")
            print(f"     - Close: {count_close}")
            print(f"     - Terbuka (old): {count_old_open}")
            print(f"     - Tertutup (old): {count_old_close}")
        
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("\n╔════════════════════════════════════════════════════════════╗")
    print("║     CURTAIN POSITION MIGRATION: Indonesian -> English      ║")
    print("╚════════════════════════════════════════════════════════════╝\n")
    
    migrate_position_values()
    
    print("\n✨ Done!\n")
