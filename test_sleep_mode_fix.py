"""
Test sleep mode activation and deactivation to verify bug fixes
"""
import requests
import json
from pymongo import MongoClient

BASE_URL = "http://localhost:5000/api"

def check_database():
    """Check current database state"""
    client = MongoClient('mongodb://localhost:27017/')
    db = client.curtaincall
    
    print("\n📊 Current Database State:")
    print("="*60)
    
    # Check curtain_data
    current_data = db.curtain_data.find_one({'_id': 'current'})
    if current_data:
        print("curtain_data fields:")
        for key in ['position', 'curtain_status', 'sleep_mode', 'posisi', 'status_tirai']:
            if key in current_data:
                print(f"  {key}: {current_data[key]}")
    
    # Check sleep_mode_settings
    sleep_settings = db.sleep_mode_settings.find_one({'_id': 'global'})
    if sleep_settings:
        print("\nsleep_mode_settings:")
        print(f"  active: {sleep_settings.get('active')}")
        print(f"  previous_pir_state: {sleep_settings.get('previous_pir_state')}")
        print(f"  previous_auto_mode_state: {sleep_settings.get('previous_auto_mode_state')}")
    
    print("="*60)

def test_sleep_mode_flow():
    """Test complete sleep mode flow"""
    
    # Register/Login first
    print("\n🔐 Step 1: Register/Login...")
    
    # Try to register a test user
    register_data = {
        "name": "Test Sleep Mode",
        "email": "testsleep@example.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/users/register", json=register_data)
    
    if response.status_code == 201:
        print("✅ User registered")
        token = response.json()['token']
    elif response.status_code == 400 and 'already exists' in response.json().get('error', ''):
        print("ℹ️  User exists, logging in...")
        login_data = {
            "email": "testsleep@example.com",
            "password": "password123"
        }
    else:
        print(f"❌ Registration failed: {response.json()}")
        return
    
    try:
        print("✅ Authenticated successfully")
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Check initial state
        print("\n📊 Initial State:")
        check_database()
        
        # Activate sleep mode
        print("\n🌙 Step 2: Activate Sleep Mode...")
        response = requests.post(
            f"{BASE_URL}/sleep-mode/activate",
            headers=headers
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Sleep mode activated")
            
            # Check state after activation
            print("\n📊 State After Activation:")
            check_database()
            
            # Wait a moment
            import time
            time.sleep(2)
            
            # Deactivate sleep mode
            print("\n☀️ Step 3: Deactivate Sleep Mode...")
            response = requests.post(
                f"{BASE_URL}/sleep-mode/deactivate",
                headers=headers
            )
            
            print(f"Status: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            
            if response.status_code == 200:
                print("✅ Sleep mode deactivated")
                
                # Check final state
                print("\n📊 Final State After Deactivation:")
                check_database()
                
                # Verify no old fields exist
                client = MongoClient('mongodb://localhost:27017/')
                db = client.curtaincall
                current_data = db.curtain_data.find_one({'_id': 'current'})
                
                print("\n🔍 Verification:")
                if 'posisi' in current_data or 'status_tirai' in current_data:
                    print("❌ BUG: Old Indonesian fields still exist!")
                    if 'posisi' in current_data:
                        print(f"  Found: posisi = {current_data['posisi']}")
                    if 'status_tirai' in current_data:
                        print(f"  Found: status_tirai = {current_data['status_tirai']}")
                else:
                    print("✅ No old Indonesian fields found")
                
                # Check if mode was restored correctly
                restored_settings = response.json().get('restored_settings', {})
                expected_mode = 'Auto' if restored_settings.get('auto_mode_enabled') else 'Manual'
                actual_mode = current_data.get('curtain_status')
                
                print(f"\n🔍 Mode Restoration Check:")
                print(f"  Expected mode: {expected_mode}")
                print(f"  Actual mode: {actual_mode}")
                
                if expected_mode == actual_mode:
                    print("✅ Mode restored correctly")
                else:
                    print("❌ BUG: Mode not restored correctly!")
                
                print("\n" + "="*60)
                print("✅ TEST COMPLETED")
                print("="*60)
            else:
                print(f"❌ Deactivation failed: {response.json()}")
        else:
            print(f"❌ Activation failed: {response.json()}")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure Flask is running")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("="*60)
    print("Testing Sleep Mode Bug Fixes")
    print("="*60)
    test_sleep_mode_flow()
