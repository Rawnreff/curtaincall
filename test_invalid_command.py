"""
Test script for invalid voice commands
Tests that invalid commands (like "kucing hitam") are properly rejected
"""
import requests
import json

NLP_BASE_URL = "http://localhost:5001"

def test_invalid_command():
    """Test that invalid commands are rejected"""
    print("=" * 60)
    print("Testing Invalid Voice Command Handling")
    print("=" * 60)
    
    # Test cases: invalid commands that should be rejected
    invalid_commands = [
        "kucing hitam",
        "saya lapar",
        "hari ini cerah",
        "makan siang",
        "hello world",
        "testing testing",
    ]
    
    print("\n📋 Testing invalid commands:")
    print("-" * 60)
    
    for command in invalid_commands:
        print(f"\n🎤 Testing command: \"{command}\"")
        
        try:
            response = requests.post(
                f"{NLP_BASE_URL}/proses_suara",
                json={"teks": command},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                print(f"   Status: {data.get('status')}")
                print(f"   Message: {data.get('pesan')}")
                print(f"   Prediction: {data.get('prediksi')}")
                print(f"   Confidence: {data.get('probabilitas', 0):.2%}")
                print(f"   Database Updated: {data.get('database_updated', False)}")
                print(f"   MQTT Sent: {data.get('mqtt_sent', False)}")
                
                # Verify that invalid commands are rejected
                if data.get('status') == 'error':
                    print("   ✅ PASS: Command correctly rejected")
                elif data.get('status') == 'success':
                    print("   ❌ FAIL: Invalid command was accepted!")
                else:
                    print(f"   ⚠️  UNKNOWN: Unexpected status '{data.get('status')}'")
                    
                # Verify database was NOT updated
                if not data.get('database_updated', False):
                    print("   ✅ PASS: Database not updated (correct)")
                else:
                    print("   ❌ FAIL: Database was updated for invalid command!")
                    
            else:
                print(f"   ❌ HTTP Error: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")
    
    print("\n" + "=" * 60)
    print("Testing Valid Commands (for comparison)")
    print("=" * 60)
    
    # Test valid commands for comparison
    valid_commands = [
        ("buka gorden", "BUKA"),
        ("tutup tirai", "TUTUP"),
    ]
    
    for command, expected_intent in valid_commands:
        print(f"\n🎤 Testing command: \"{command}\"")
        
        try:
            response = requests.post(
                f"{NLP_BASE_URL}/proses_suara",
                json={"teks": command},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                print(f"   Status: {data.get('status')}")
                print(f"   Message: {data.get('pesan')}")
                print(f"   Prediction: {data.get('prediksi')}")
                print(f"   Confidence: {data.get('probabilitas', 0):.2%}")
                print(f"   Database Updated: {data.get('database_updated', False)}")
                
                # Verify valid commands are accepted
                if data.get('status') == 'success' and data.get('prediksi') == expected_intent:
                    print("   ✅ PASS: Valid command correctly accepted")
                else:
                    print("   ❌ FAIL: Valid command was rejected!")
                    
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print("✅ Invalid commands should be rejected (status: error)")
    print("✅ Database should NOT be updated for invalid commands")
    print("✅ Valid commands should be accepted (status: success)")
    print("✅ Frontend should display error message for invalid commands")

if __name__ == "__main__":
    test_invalid_command()
