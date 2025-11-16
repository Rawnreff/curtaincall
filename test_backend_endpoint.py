import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

def test_sensor_endpoints():
    """Test sensor-related endpoints"""
    print("🧪 Testing Sensor Endpoints...")
    
    # Test saving sensor data (from ESP32)
    sensor_data = {
        "suhu": 29.3,
        "kelembapan": 55.8,
        "cahaya": 420,
        "posisi": "Terbuka",
        "status_tirai": "Auto"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/sensors/save", json=sensor_data)
        print(f"✅ Save Sensor Data: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Save Sensor Data Failed: {e}")
    
    # Test getting sensor data (needs auth - will fail without token)
    try:
        response = requests.get(f"{BASE_URL}/sensors/data")
        print(f"📊 Get Sensor Data: {response.status_code}")
    except Exception as e:
        print(f"❌ Get Sensor Data Failed: {e}")

def test_auth_endpoints():
    """Test authentication endpoints"""
    print("\n🧪 Testing Auth Endpoints...")
    
    # Test registration
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users/register", json=user_data)
        print(f"👤 Register: {response.status_code} - {response.json().get('message', '')}")
    except Exception as e:
        print(f"❌ Register Failed: {e}")
    
    # Test login
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users/login", json=login_data)
        if response.status_code == 200:
            token = response.json().get('token')
            print(f"🔑 Login: {response.status_code} - Token received")
            return token
        else:
            print(f"❌ Login: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Login Failed: {e}")
    
    return None

def test_control_endpoints(token):
    """Test control endpoints with authentication"""
    if not token:
        print("❌ No token available for control tests")
        return
    
    print("\n🧪 Testing Control Endpoints...")
    
    headers = {'Authorization': f'Bearer {token}'}
    control_data = {
        "mode": "manual",
        "action": "open"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/control/tirai", json=control_data, headers=headers)
        print(f"🎛️ Control Command: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Control Command Failed: {e}")

if __name__ == "__main__":
    print("🚀 Starting Backend Tests...")
    
    # Wait for server to start
    time.sleep(2)
    
    test_sensor_endpoints()
    token = test_auth_endpoints()
    test_control_endpoints(token)
    
    print("\n✅ All tests completed!")