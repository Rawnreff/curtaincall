"""
Test sleep mode activation
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models.sleep_mode_model import activate_sleep_mode, get_sleep_mode_status
from app.models.sensor_model import get_latest_sensor_data
from app import get_db

app = create_app()

print("\n" + "="*60)
print("Testing Sleep Mode Activation")
print("="*60)

# Check initial state
print("\n1. Checking initial state...")
status = get_sleep_mode_status()
print(f"   Sleep mode status: {status}")

sensor_data = get_latest_sensor_data()
if sensor_data:
    print(f"   Sensor data sleep_mode: {sensor_data.get('sleep_mode', 'NOT FOUND')}")
    print(f"   Sensor data status_tirai: {sensor_data.get('status_tirai')}")
    print(f"   Sensor data posisi: {sensor_data.get('posisi')}")

# Activate sleep mode
print("\n2. Activating sleep mode...")
result = activate_sleep_mode(user_id="test_user")
print(f"   Result: {result}")

# Check state after activation
print("\n3. Checking state after activation...")
status = get_sleep_mode_status()
print(f"   Sleep mode status: {status}")

sensor_data = get_latest_sensor_data()
if sensor_data:
    print(f"   Sensor data sleep_mode: {sensor_data.get('sleep_mode', 'NOT FOUND')}")
    print(f"   Sensor data status_tirai: {sensor_data.get('status_tirai')}")
    print(f"   Sensor data posisi: {sensor_data.get('posisi')}")

# Check database directly
print("\n4. Checking database directly...")
db = get_db()
sleep_settings = db.get_collection('sleep_mode_settings').find_one({'_id': 'global'})
print(f"   Sleep mode settings in DB: {sleep_settings}")

curtain_data = db.get_collection('curtain_data').find_one({'_id': 'current'})
if curtain_data:
    print(f"   Curtain data sleep_mode: {curtain_data.get('sleep_mode', 'NOT FOUND')}")
    print(f"   Curtain data status_tirai: {curtain_data.get('status_tirai')}")
    print(f"   Curtain data posisi: {curtain_data.get('posisi')}")

print("\n" + "="*60)
print("Test Complete")
print("="*60)
