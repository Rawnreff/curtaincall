"""
Migration script to add PIR and Sleep Mode collections and fields
"""
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta
from config import Config

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

def run_migration():
    """Run migration to add PIR and Sleep Mode support"""
    try:
        # Connect to MongoDB
        client = MongoClient(Config.MONGO_URI)
        db = client.curtaincall
        
        print("🔄 Starting PIR and Sleep Mode migration...")
        
        # 1. Create PIR settings collection with default document
        pir_collection = db.get_collection('pir_settings')
        existing_pir = pir_collection.find_one({'_id': 'global'})
        
        if not existing_pir:
            pir_settings = {
                '_id': 'global',
                'enabled': True,  # Default: PIR enabled
                'last_updated': datetime.now(WIB),
                'created_at': datetime.now(WIB)
            }
            pir_collection.insert_one(pir_settings)
            print("✅ Created PIR settings collection with default document")
        else:
            print("ℹ️  PIR settings collection already exists")
        
        # 2. Create sleep mode settings collection with default document
        sleep_collection = db.get_collection('sleep_mode_settings')
        existing_sleep = sleep_collection.find_one({'_id': 'global'})
        
        if not existing_sleep:
            sleep_settings = {
                '_id': 'global',
                'active': False,  # Default: Sleep mode inactive
                'activated_at': None,
                'deactivated_at': datetime.now(WIB),
                'previous_pir_state': None,
                'previous_auto_mode_state': None,
                'last_updated': datetime.now(WIB),
                'created_at': datetime.now(WIB)
            }
            sleep_collection.insert_one(sleep_settings)
            print("✅ Created sleep mode settings collection with default document")
        else:
            print("ℹ️  Sleep mode settings collection already exists")
        
        # 3. Add sleep_mode field to existing sensor data documents
        curtain_data_collection = db.get_collection('curtain_data')
        
        # Update current data document
        current_data = curtain_data_collection.find_one({'_id': 'current'})
        if current_data and 'sleep_mode' not in current_data:
            curtain_data_collection.update_one(
                {'_id': 'current'},
                {'$set': {'sleep_mode': False}}
            )
            print("✅ Added sleep_mode field to current sensor data")
        else:
            print("ℹ️  Current sensor data already has sleep_mode field or doesn't exist")
        
        # Update history documents (add sleep_mode: false to all existing documents)
        history_collection = db.get_collection('curtain_history')
        result = history_collection.update_many(
            {'sleep_mode': {'$exists': False}},
            {'$set': {'sleep_mode': False}}
        )
        print(f"✅ Added sleep_mode field to {result.modified_count} history documents")
        
        print("\n🎉 Migration completed successfully!")
        print("\nCreated collections:")
        print("  - pir_settings (default: enabled=True)")
        print("  - sleep_mode_settings (default: active=False)")
        print("\nUpdated collections:")
        print("  - curtain_data (added sleep_mode field)")
        print("  - curtain_history (added sleep_mode field)")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_migration()
    exit(0 if success else 1)
