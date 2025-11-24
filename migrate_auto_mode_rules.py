"""
Migration script to update existing auto_mode_rules with new enhanced fields
"""

from pymongo import MongoClient
from datetime import datetime, timedelta, timezone

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

def migrate_auto_mode_rules():
    """Add new fields to existing auto_mode_rules documents"""
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client.curtaincall
        rules_collection = db.auto_mode_rules
        
        print("\n" + "="*60)
        print("MIGRATING AUTO MODE RULES TO ENHANCED SCHEMA")
        print("="*60)
        
        # Get all existing rules
        existing_rules = list(rules_collection.find())
        
        print(f"\nFound {len(existing_rules)} existing rule documents")
        
        if len(existing_rules) == 0:
            print("\n✅ No existing rules to migrate")
            return
        
        # Update each document
        updated_count = 0
        for rule in existing_rules:
            rule_id = rule['_id']
            user_id = rule.get('user_id', 'unknown')
            
            # Prepare update with new fields
            update_fields = {}
            
            # Add control flags if not present
            if 'temperature_control_enabled' not in rule:
                update_fields['temperature_control_enabled'] = True
                print(f"  Adding temperature_control_enabled for user {user_id}")
            
            if 'humidity_control_enabled' not in rule:
                update_fields['humidity_control_enabled'] = True
                print(f"  Adding humidity_control_enabled for user {user_id}")
            
            if 'light_control_enabled' not in rule:
                update_fields['light_control_enabled'] = True
                print(f"  Adding light_control_enabled for user {user_id}")
            
            # Add thresholds if not present
            if 'temperature_high_threshold' not in rule:
                # Use old temperature_threshold if exists, otherwise default
                old_temp = rule.get('temperature_threshold', 35.0)
                update_fields['temperature_high_threshold'] = old_temp
                print(f"  Adding temperature_high_threshold: {old_temp}°C for user {user_id}")
            
            if 'humidity_high_threshold' not in rule:
                update_fields['humidity_high_threshold'] = 80.0
                print(f"  Adding humidity_high_threshold: 80.0% for user {user_id}")
            
            # Ensure light thresholds exist
            if 'light_open_threshold' not in rule:
                update_fields['light_open_threshold'] = 250
                print(f"  Adding light_open_threshold: 250 lux for user {user_id}")
            
            if 'light_close_threshold' not in rule:
                update_fields['light_close_threshold'] = 500
                print(f"  Adding light_close_threshold: 500 lux for user {user_id}")
            
            # Update timestamp
            update_fields['updated_at'] = datetime.now(WIB)
            
            # Perform update if there are fields to add
            if update_fields:
                result = rules_collection.update_one(
                    {'_id': rule_id},
                    {'$set': update_fields}
                )
                
                if result.modified_count > 0:
                    updated_count += 1
                    print(f"✅ Updated rules for user {user_id}")
                else:
                    print(f"⚠️ No changes needed for user {user_id}")
            else:
                print(f"✅ Rules already up-to-date for user {user_id}")
            
            print()
        
        print("="*60)
        print(f"MIGRATION COMPLETE")
        print(f"Updated {updated_count} out of {len(existing_rules)} documents")
        print("="*60)
        
        # Show sample of updated rules
        print("\n📊 Sample of updated rules:")
        sample = rules_collection.find_one()
        if sample:
            print(f"\nUser ID: {sample.get('user_id')}")
            print(f"Temperature Control: {sample.get('temperature_control_enabled')} (threshold: {sample.get('temperature_high_threshold')}°C)")
            print(f"Humidity Control: {sample.get('humidity_control_enabled')} (threshold: {sample.get('humidity_high_threshold')}%)")
            print(f"Light Control: {sample.get('light_control_enabled')} (open: {sample.get('light_open_threshold')}, close: {sample.get('light_close_threshold')} lux)")
            print(f"Master Switch: {sample.get('enabled')}")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("\n╔════════════════════════════════════════════════════════════╗")
    print("║   AUTO MODE RULES MIGRATION TO ENHANCED SCHEMA            ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    print("\nThis script will:")
    print("1. Find all existing auto_mode_rules documents")
    print("2. Add new enhanced fields with default values")
    print("3. Preserve existing settings")
    print("\nMake sure:")
    print("- MongoDB is running")
    print("- Backend is stopped (to avoid conflicts)")
    
    input("\nPress Enter to start migration...")
    
    migrate_auto_mode_rules()
    
    print("\n✅ Migration complete!")
    print("\nNext steps:")
    print("1. Restart backend")
    print("2. Upload updated ESP32 code")
    print("3. Test enhanced auto mode features")
