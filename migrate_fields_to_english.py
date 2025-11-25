"""
Migration script to convert Indonesian field names to English in MongoDB
Converts:
- posisi → position
- status_tirai → curtain_status
- kelembapan → humidity
- cahaya → light
- suhu → temperature
"""

from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'curtain_db')

def migrate_collection(collection, field_mapping):
    """
    Migrate field names in a collection
    
    Args:
        collection: MongoDB collection object
        field_mapping: Dict mapping old field names to new field names
    """
    print(f"\n📦 Migrating collection: {collection.name}")
    
    # Get all documents
    documents = list(collection.find())
    
    if not documents:
        print("  ⚠️ No documents found")
        return
    
    print(f"  Found {len(documents)} documents")
    
    # Migrate each document
    migrated_count = 0
    for doc in documents:
        update_fields = {}
        unset_fields = {}
        
        # Check each field mapping
        for old_field, new_field in field_mapping.items():
            if old_field in doc:
                # Copy value to new field
                update_fields[new_field] = doc[old_field]
                # Mark old field for removal
                unset_fields[old_field] = ""
        
        # Apply updates if there are any changes
        if update_fields:
            # Update with new fields
            collection.update_one(
                {'_id': doc['_id']},
                {
                    '$set': update_fields,
                    '$unset': unset_fields
                }
            )
            migrated_count += 1
    
    print(f"  ✅ Migrated {migrated_count} documents")
    
    # Verify migration
    sample = collection.find_one()
    if sample:
        print(f"  📊 Sample document fields: {list(sample.keys())}")

def main():
    """Main migration function"""
    print("\n╔════════════════════════════════════════════════════════════╗")
    print("║   MIGRATION: Indonesian → English Field Names             ║")
    print("╚════════════════════════════════════════════════════════════╝\n")
    
    # Connect to MongoDB
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        print(f"✅ Connected to MongoDB: {DB_NAME}")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return
    
    # Field mapping
    field_mapping = {
        'posisi': 'position',
        'status_tirai': 'curtain_status',
        'kelembapan': 'humidity',
        'cahaya': 'light',
        'suhu': 'temperature'
    }
    
    print(f"\n📝 Field mapping:")
    for old, new in field_mapping.items():
        print(f"  {old} → {new}")
    
    # Collections to migrate
    collections_to_migrate = [
        'curtain_data',
        'curtain_history',
        'sensor_data'
    ]
    
    # Migrate each collection
    for collection_name in collections_to_migrate:
        try:
            collection = db[collection_name]
            migrate_collection(collection, field_mapping)
        except Exception as e:
            print(f"  ❌ Error migrating {collection_name}: {e}")
    
    # Close connection
    client.close()
    
    print("\n╔════════════════════════════════════════════════════════════╗")
    print("║   ✅ MIGRATION COMPLETED                                   ║")
    print("╚════════════════════════════════════════════════════════════╝\n")
    
    print("⚠️ IMPORTANT: Please restart the following services:")
    print("  1. Backend (backend/run.py)")
    print("  2. ESP32 (upload new esp32_curtain_mqtt.py)")
    print("  3. NLP Service (nlp/run.py)")
    print("  4. Frontend (npm start)")

if __name__ == "__main__":
    main()
