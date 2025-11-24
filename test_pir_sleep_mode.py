"""
Test script for PIR and Sleep Mode features
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Initialize Flask app
from app import create_app
app = create_app()

def test_pir_settings():
    """Test PIR settings manager"""
    print("\n" + "="*60)
    print("Testing PIR Settings Manager")
    print("="*60)
    
    from app.models.pir_settings_model import get_pir_settings, update_pir_settings
    
    # Test get_pir_settings
    print("\n1. Testing get_pir_settings()...")
    settings = get_pir_settings()
    print(f"   ✅ Current PIR settings: {settings}")
    
    # Test update_pir_settings
    print("\n2. Testing update_pir_settings(False)...")
    success = update_pir_settings(False, user_id="test_user")
    print(f"   {'✅' if success else '❌'} Update result: {success}")
    
    # Verify update
    print("\n3. Verifying update...")
    settings = get_pir_settings()
    print(f"   ✅ Updated PIR settings: {settings}")
    assert settings['enabled'] == False, "PIR should be disabled"
    
    # Test update back to True
    print("\n4. Testing update_pir_settings(True)...")
    success = update_pir_settings(True, user_id="test_user")
    print(f"   {'✅' if success else '❌'} Update result: {success}")
    
    settings = get_pir_settings()
    print(f"   ✅ Final PIR settings: {settings}")
    assert settings['enabled'] == True, "PIR should be enabled"
    
    print("\n✅ All PIR settings tests passed!")

def test_sleep_mode():
    """Test sleep mode manager"""
    print("\n" + "="*60)
    print("Testing Sleep Mode Manager")
    print("="*60)
    
    from app.models.sleep_mode_model import (
        get_sleep_mode_status,
        activate_sleep_mode,
        deactivate_sleep_mode
    )
    
    # Test get_sleep_mode_status
    print("\n1. Testing get_sleep_mode_status()...")
    status = get_sleep_mode_status()
    print(f"   ✅ Current sleep mode status: {status}")
    
    # Test activate_sleep_mode
    print("\n2. Testing activate_sleep_mode()...")
    result = activate_sleep_mode(user_id="test_user")
    print(f"   {'✅' if result['success'] else '❌'} Activation result: {result}")
    
    # Verify activation
    print("\n3. Verifying activation...")
    status = get_sleep_mode_status()
    print(f"   ✅ Sleep mode status after activation: {status}")
    assert status['active'] == True, "Sleep mode should be active"
    assert status['previous_pir_state'] is not None, "Previous PIR state should be saved"
    assert status['previous_auto_mode_state'] is not None, "Previous auto mode state should be saved"
    
    # Test deactivate_sleep_mode
    print("\n4. Testing deactivate_sleep_mode()...")
    result = deactivate_sleep_mode(user_id="test_user")
    print(f"   {'✅' if result['success'] else '❌'} Deactivation result: {result}")
    
    # Verify deactivation
    print("\n5. Verifying deactivation...")
    status = get_sleep_mode_status()
    print(f"   ✅ Sleep mode status after deactivation: {status}")
    assert status['active'] == False, "Sleep mode should be inactive"
    
    print("\n✅ All sleep mode tests passed!")

def test_database_migration():
    """Test database migration"""
    print("\n" + "="*60)
    print("Testing Database Migration")
    print("="*60)
    
    from app import get_db
    
    db = get_db()
    
    # Check PIR settings collection
    print("\n1. Checking PIR settings collection...")
    pir_collection = db.get_collection('pir_settings')
    pir_doc = pir_collection.find_one({'_id': 'global'})
    if pir_doc:
        print(f"   ✅ PIR settings collection exists: {pir_doc}")
    else:
        print("   ⚠️  PIR settings collection not found, will be created on first use")
    
    # Check sleep mode settings collection
    print("\n2. Checking sleep mode settings collection...")
    sleep_collection = db.get_collection('sleep_mode_settings')
    sleep_doc = sleep_collection.find_one({'_id': 'global'})
    if sleep_doc:
        print(f"   ✅ Sleep mode settings collection exists: {sleep_doc}")
    else:
        print("   ⚠️  Sleep mode settings collection not found, will be created on first use")
    
    # Check sensor data has sleep_mode field
    print("\n3. Checking sensor data for sleep_mode field...")
    curtain_data = db.get_collection('curtain_data')
    current_data = curtain_data.find_one({'_id': 'current'})
    if current_data:
        if 'sleep_mode' in current_data:
            print(f"   ✅ Sensor data has sleep_mode field: {current_data.get('sleep_mode')}")
        else:
            print("   ⚠️  Sensor data missing sleep_mode field, migration needed")
    else:
        print("   ⚠️  No current sensor data found")
    
    print("\n✅ Database migration check complete!")

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 PIR and Sleep Mode Backend Tests")
    print("="*60)
    
    try:
        # Test database migration
        test_database_migration()
        
        # Test PIR settings
        test_pir_settings()
        
        # Test sleep mode
        test_sleep_mode()
        
        print("\n" + "="*60)
        print("🎉 All tests passed successfully!")
        print("="*60)
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
