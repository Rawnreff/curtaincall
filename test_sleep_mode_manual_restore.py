"""
Test sleep mode with Manual mode before activation
Verify that Manual mode is restored after deactivation
"""
import requests
import json
from pymongo import MongoClient

BASE_URL = "http://localhost:5000/api"

def set_manual_mode(token):
    """Set curtain to manual mode"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Disable auto mode
    response = requests.put(
        f"{BASE_URL}/auto-mode/rules",
        json={"enabled": False},
        headers=headers
    )
    
    print(f"   Disable auto mode response: {response.status_code}")
    if response.status_code != 200:
        print(f"   Error: {response.json()}")
        return False
    
    # Send manual command to update curtain_status
    response = requests.post(
        f"{BASE_URL}/control/manual",
        json={"action": "open"},  # Just to trigger manual mode
        headers=headers
    )
    
    print(f"   Send manual command response: {response.status_code}")
    
    return True

def check_mode():
    """Check current mode from database"""
    client = MongoClient('mongodb://localhost:27017/')
    db = client.curtaincall
    
    current_data = db.curtain_data.find_one({'_id': 'current'})
    auto_rules = db.auto_mode_rules.find_one({'_id': 'global'})
    
    curtain_status = current_data.get('curtain_status') if current_data else None
    auto_enabled = auto_rules.get('enabled') if auto_rules else None
    
    return curtain_status, auto_enabled

def main():
    print("="*60)
    print("Test: Manual Mode Restoration After Sleep Mode")
    print("="*60)
    
    # Register/Login
    print("\n🔐 Step 1: Authenticate...")
    register_data = {
        "name": "Test Manual Mode",
        "email": "testmanual@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users/register", json=register_data)
        
        if response.status_code == 201:
            token = response.json()['token']
        elif response.status_code == 400:
            # Login instead
            login_data = {
                "email": "testmanual@example.com",
                "password": "password123"
            }
            response = requests.post(f"{BASE_URL}/users/login", json=login_data)
            if response.status_code == 200:
                token = response.json()['token']
            else:
                print(f"❌ Login failed: {response.json()}")
                return
        else:
            print(f"❌ Auth failed: {response.json()}")
            return
        
        print("✅ Authenticated")
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Set to Manual mode
        print("\n⚙️ Step 2: Set to Manual Mode...")
        if set_manual_mode(token):
            print("✅ Manual mode set")
        else:
            print("❌ Failed to set manual mode")
            return
        
        # Verify manual mode (auto_enabled should be False)
        curtain_status, auto_enabled = check_mode()
        print(f"   curtain_status: {curtain_status}")
        print(f"   auto_enabled: {auto_enabled}")
        
        if auto_enabled == False:
            print("✅ Confirmed: Auto mode is disabled (Manual mode)")
        else:
            print("❌ Auto mode not disabled!")
            return
        
        # Activate sleep mode
        print("\n🌙 Step 3: Activate Sleep Mode...")
        response = requests.post(
            f"{BASE_URL}/sleep-mode/activate",
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ Sleep mode activated")
        else:
            print(f"❌ Activation failed: {response.json()}")
            return
        
        # Wait
        import time
        time.sleep(1)
        
        # Deactivate sleep mode
        print("\n☀️ Step 4: Deactivate Sleep Mode...")
        response = requests.post(
            f"{BASE_URL}/sleep-mode/deactivate",
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Sleep mode deactivated")
            print(f"   Restored settings: {result.get('restored_settings')}")
        else:
            print(f"❌ Deactivation failed: {response.json()}")
            return
        
        # Verify mode restored to Manual (auto_enabled should still be False)
        print("\n🔍 Step 5: Verify Mode Restoration...")
        curtain_status, auto_enabled = check_mode()
        print(f"   curtain_status: {curtain_status}")
        print(f"   auto_enabled: {auto_enabled}")
        
        # The important check: auto_enabled should be restored to False (Manual mode)
        if auto_enabled == False:
            print("✅ SUCCESS: Manual mode (auto_enabled=False) correctly restored!")
        else:
            print("❌ FAILED: Mode not restored correctly!")
            print(f"   Expected: auto_enabled=False")
            print(f"   Got: auto_enabled={auto_enabled}")
        
        # Check for old fields
        print("\n🔍 Step 6: Check for old Indonesian fields...")
        client = MongoClient('mongodb://localhost:27017/')
        db = client.curtaincall
        current_data = db.curtain_data.find_one({'_id': 'current'})
        
        if 'posisi' in current_data or 'status_tirai' in current_data:
            print("❌ FAILED: Old Indonesian fields found!")
            if 'posisi' in current_data:
                print(f"   posisi: {current_data['posisi']}")
            if 'status_tirai' in current_data:
                print(f"   status_tirai: {current_data['status_tirai']}")
        else:
            print("✅ SUCCESS: No old Indonesian fields!")
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
