"""
Test edge cases for voice command validation
"""
import requests

NLP_BASE_URL = "http://localhost:5001"

def test_command(command, expected_status):
    """Test a single command"""
    try:
        response = requests.post(
            f"{NLP_BASE_URL}/proses_suara",
            json={"teks": command},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            status = data.get('status')
            prediction = data.get('prediksi')
            confidence = data.get('probabilitas', 0)
            db_updated = data.get('database_updated', False)
            
            result = "✅ PASS" if status == expected_status else "❌ FAIL"
            
            print(f"\n🎤 \"{command}\"")
            print(f"   Expected: {expected_status} | Got: {status} | {result}")
            print(f"   Prediction: {prediction} | Confidence: {confidence:.2%}")
            print(f"   DB Updated: {db_updated}")
            print(f"   Message: {data.get('pesan')}")
            
            return status == expected_status
        else:
            print(f"\n❌ HTTP Error {response.status_code}: {command}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error testing '{command}': {e}")
        return False

def main():
    print("=" * 70)
    print("Testing Edge Cases for Voice Command Validation")
    print("=" * 70)
    
    test_cases = [
        # Valid commands - should be accepted
        ("buka gorden", "success"),
        ("tutup tirai", "success"),
        ("buka", "success"),
        ("tutup", "success"),
        ("tolong buka gordennya", "success"),
        ("silau tutup gorden", "success"),  # Harus ada "gorden/tirai"
        ("saya mau tidur tutup tirai", "success"),  # Harus ada "gorden/tirai"
        ("biar terang buka gorden", "success"),  # Harus ada "gorden/tirai"
        
        # Invalid commands - should be rejected
        ("kucing hitam", "error"),
        ("saya lapar", "error"),
        ("hello world", "error"),
        ("testing", "error"),
        ("hari ini cerah", "error"),
        ("makan siang", "error"),
        
        # Edge cases - commands with partial keywords (should be rejected)
        ("buka pintu", "error"),  # "buka" ada tapi bukan untuk gorden
        ("tutup mulut", "error"),  # "tutup" ada tapi bukan untuk gorden
        ("saya buka mata", "error"),  # "buka" ada tapi konteks salah
        ("tutup buku", "error"),  # "tutup" ada tapi konteks salah
        ("silau banget", "error"),  # Tidak ada "gorden/tirai"
        ("saya mau tidur", "error"),  # Tidak ada "gorden/tirai"
        ("biar terang", "error"),  # Tidak ada "gorden/tirai"
        ("selamat pagi", "error"),  # Tidak ada kata kunci yang jelas
        ("selamat malam", "error"),  # Tidak ada kata kunci yang jelas
        
        # Variations that should work
        ("bukain gordennya dong", "success"),
        ("tutupin tirainya", "success"),
        ("gorden buka", "success"),
        ("tirai tutup", "success"),
    ]
    
    passed = 0
    failed = 0
    
    for command, expected in test_cases:
        if test_command(command, expected):
            passed += 1
        else:
            failed += 1
    
    print("\n" + "=" * 70)
    print(f"Test Results: {passed} passed, {failed} failed out of {len(test_cases)} tests")
    print("=" * 70)
    
    if failed == 0:
        print("✅ All tests passed!")
    else:
        print(f"⚠️  {failed} test(s) failed")

if __name__ == "__main__":
    main()
