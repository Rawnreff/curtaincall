"""
Cleanup old Indonesian field names from database
Removes: posisi, status_tirai from curtain_data collection
"""
from pymongo import MongoClient
from datetime import datetime

def cleanup_indonesian_fields():
    """Remove old Indonesian field names from database"""
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb://localhost:27017/')
        db = client.curtaincall
        
        print("="*60)
        print("Cleaning up old Indonesian field names")
        print("="*60)
        
        # Check current data
        print("\n📊 Current data in curtain_data:")
        current_data = db.curtain_data.find_one({'_id': 'current'})
        if current_data:
            print(f"Fields: {list(current_data.keys())}")
            if 'posisi' in current_data:
                print(f"  ⚠️  Found old field: posisi = {current_data['posisi']}")
            if 'status_tirai' in current_data:
                print(f"  ⚠️  Found old field: status_tirai = {current_data['status_tirai']}")
        
        # Remove old Indonesian fields
        print("\n🧹 Removing old Indonesian fields...")
        result = db.curtain_data.update_one(
            {'_id': 'current'},
            {
                '$unset': {
                    'posisi': '',
                    'status_tirai': ''
                }
            }
        )
        
        if result.modified_count > 0:
            print(f"✅ Removed old fields from {result.modified_count} document(s)")
        else:
            print("ℹ️  No old fields found to remove")
        
        # Verify cleanup
        print("\n✅ Verification - Current data after cleanup:")
        current_data = db.curtain_data.find_one({'_id': 'current'})
        if current_data:
            print(f"Fields: {list(current_data.keys())}")
            
            # Check if old fields still exist
            if 'posisi' in current_data or 'status_tirai' in current_data:
                print("❌ Old fields still exist!")
            else:
                print("✅ Old Indonesian fields successfully removed")
                
            # Show current English fields
            if 'position' in current_data:
                print(f"  position: {current_data['position']}")
            if 'curtain_status' in current_data:
                print(f"  curtain_status: {current_data['curtain_status']}")
        
        print("\n" + "="*60)
        print("Cleanup completed!")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    cleanup_indonesian_fields()
