"""
Test sleep mode deactivation
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models.sleep_mode_model import deactivate_sleep_mode, get_sleep_mode_status
from app.models.sensor_model import get_latest_sensor_data

app = create_app()

print("\n" + "="*60)
print("Testing Sleep Mode Deactivation")
print("="*60)

# Check initial state (should be active from previous test)
print("\n1. Checking initial state...")
status = get_sleep_mode_status()
print(f"   Sleep mode status: {status}")

sensor_data = get_latest_sensor_data()
if sensor_data:
    print(f"   Sensor data sleep_mode: {sensor_data.get('sleep_mode')}")
    print(f"   Sensor data status_tirai: {sensor_data.get('status_tirai')}")
    print(f"   Sensor data posisi: {sensor_data.get('posisi')}")

# Deactivate sleep mode
print("\n2. Deactivating sleep mode...")
result = deactivate_sleep_mode(user_id="test_user")
print(f"   Result: {result}")

# Check state after deactivation
print("\n3. Checking state after deactivation...")
status = get_sleep_mode_status()
print(f"   Sleep mode status: {status}")

sensor_data = get_latest_sensor_data()
if sensor_data:
    print(f"   Sensor data sleep_mode: {sensor_data.get('sleep_mode')}")
    print(f"   Sensor data status_tirai: {sensor_data.get('status_tirai')}")
    print(f"   Sensor data posisi: {sensor_data.get('posisi')}")

print("\n" + "="*60)
print("Test Complete")
print("="*60)
