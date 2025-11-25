"""
Test script to verify new English field names work correctly
"""

import requests
import json
from datetime import datetime

# Backend URL
BASE_URL = "http://localhost:5000"

def test_save_sensor_data():
    """Test saving sensor data with new English field names"""
    print("\n" + "="*60)
    print("Testing: Save Sensor Data (English Field Names)")
    print("="*60)
    
    # Test data with English field names
    test_data = {
        "temperature": 28.5,
        "humidity": 65.2,
        "light": 425,
        "position": "Open",
        "curtain_status": "Auto",
        "pir": 0,
        "sleep_mode": False
    }
    
    print(f"\n📤 Sending data to {BASE_URL}/sensors/save")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/sensors/save",
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Data saved with English field names!")
            return True
        else:
            print("❌ FAILED: Could not save data")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_get_sensor_data():
    """Test getting sensor data"""
    print("\n" + "="*60)
    print("Testing: Get Sensor Data")
    print("="*60)
    
    # First, login to get token
    print("\n🔐 Logging in to get JWT token...")
    try:
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "username": "admin",
                "password": "admin123"
            }
        )
        
        if login_response.status_code != 200:
            print("❌ Login failed. Please ensure admin user exists.")
            return False
        
        token = login_response.json()['access_token']
        print("✅ Login successful")
        
        # Get sensor data
        print(f"\n📤 Getting data from {BASE_URL}/sensors/data")
        response = requests.get(
            f"{BASE_URL}/sensors/data",
            headers={'Authorization': f'Bearer {token}'}
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Check if data has English field names
        if 'position' in data and 'curtain_status' in data:
            print("✅ SUCCESS: Data returned with English field names!")
            print(f"   - position: {data.get('position')}")
            print(f"   - curtain_status: {data.get('curtain_status')}")
            print(f"   - temperature: {data.get('temperature')}")
            print(f"   - humidity: {data.get('humidity')}")
            print(f"   - light: {data.get('light')}")
            return True
        else:
            print("⚠️ WARNING: Data might still have old field names")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def main():
    print("\n╔════════════════════════════════════════════════════════════╗")
    print("║   Testing New English Field Names                         ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    # Test 1: Save data
    save_success = test_save_sensor_data()
    
    # Test 2: Get data
    get_success = test_get_sensor_data()
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Save Data Test: {'✅ PASSED' if save_success else '❌ FAILED'}")
    print(f"Get Data Test:  {'✅ PASSED' if get_success else '❌ FAILED'}")
    
    if save_success and get_success:
        print("\n🎉 All tests passed! Backend is ready for English field names.")
    else:
        print("\n⚠️ Some tests failed. Please check backend configuration.")
    
    print("\n📝 Next steps:")
    print("  1. Upload updated esp32_curtain_mqtt.py to ESP32")
    print("  2. Restart ESP32")
    print("  3. Check ESP32 serial output for MQTT messages")
    print("  4. Verify frontend displays data correctly")

if __name__ == "__main__":
    main()
