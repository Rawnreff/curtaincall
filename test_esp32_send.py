import requests
import json
import time
import random

# Simulate ESP32 sending sensor data
def simulate_esp32_data():
    """Simulate ESP32 sending sensor data"""
    
    base_url = "http://localhost:5000/api/sensors"
    
    while True:
        # Generate realistic sensor data
        sensor_data = {
            "suhu": round(25 + random.uniform(0, 10), 1),  # 25-35°C
            "kelembapan": round(40 + random.uniform(0, 30), 1),  # 40-70%
            "cahaya": random.randint(100, 800),  # 100-800 lux
            "posisi": random.choice(["Terbuka", "Tertutup"]),
            "status_tirai": random.choice(["Auto", "Manual"])
        }
        
        try:
            response = requests.post(f"{base_url}/save", json=sensor_data, timeout=5)
            if response.status_code == 200:
                print(f"✅ ESP32 Data Sent: {sensor_data}")
            else:
                print(f"❌ ESP32 Send Failed: {response.status_code}")
        except Exception as e:
            print(f"❌ ESP32 Connection Error: {e}")
        
        # Wait 1 second before next transmission
        time.sleep(1)

if __name__ == "__main__":
    print("🤖 Starting ESP32 Simulator...")
    simulate_esp32_data()