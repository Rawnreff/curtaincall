"""
Test script for handling transcription errors
Tests that commands with transcription errors are still accepted
"""
import requests

NLP_BASE_URL = "http://localhost:5001"

def test_command(command, expected_status, expected_intent=None):
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
            
            # Check status
            status_match = status == expected_status
            
            # Check intent if specified
            intent_match = True
            if expected_intent:
                intent_match = prediction == expected_intent
            
            result = "✅ PASS" if (status_match and intent_match) else "❌ FAIL"
            
            print(f"\n🎤 \"{command}\"")
            print(f"   Expected: {expected_status} ({expected_intent or 'any'}) | Got: {status} ({prediction}) | {result}")
            print(f"   Confidence: {confidence:.2%} | DB Updated: {db_updated}")
            print(f"   Message: {data.get('pesan')}")
            
            return status_match and intent_match
        else:
            print(f"\n❌ HTTP Error {response.status_code}: {command}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error testing '{command}': {e}")
        return False

def main():
    print("=" * 70)
    print("Testing Transcription Error Tolerance")
    print("=" * 70)
    print("\nThis test verifies that commands with transcription errors")
    print("are still accepted when the action word (buka/tutup) is correct.")
    print("=" * 70)
    
    test_cases = [
        # Correct transcriptions - should work
        ("buka gorden", "success", "BUKA"),
        ("tutup tirai", "success", "TUTUP"),
        ("buka", "success", "BUKA"),
        ("tutup", "success", "TUTUP"),
        
        # Transcription errors - should still work (2 words with buka/tutup)
        ("tutup tilai", "success", "TUTUP"),  # "tirai" → "tilai"
        ("buka gulai", "success", "BUKA"),    # "gorden" → "gulai"
        ("tutup korden", "success", "TUTUP"), # "gorden" → "korden" (typo)
        ("buka gordyn", "success", "BUKA"),   # "gorden" → "gordyn" (typo)
        ("tutup tiren", "success", "TUTUP"),  # "tirai" → "tiren"
        ("buka goren", "success", "BUKA"),    # "gorden" → "goren"
        ("tutup tiri", "success", "TUTUP"),   # "tirai" → "tiri"
        ("buka goreng", "success", "BUKA"),   # "gorden" → "goreng"
        
        # With extra words but still 2-word pattern at start
        ("bukain gordennya", "success", "BUKA"),
        ("tutupin tirainya", "success", "TUTUP"),
        
        # Should still reject - blacklisted objects
        ("buka pintu", "error", "UNKNOWN"),
        ("tutup mulut", "error", "UNKNOWN"),
        
        # Should still reject - no action word
        ("kucing hitam", "error", "UNKNOWN"),
        ("hello world", "error", "UNKNOWN"),
        
        # Should still reject - 3+ words without clear pattern
        ("saya mau buka", "error", "UNKNOWN"),
        ("tolong tutup sekarang", "error", "UNKNOWN"),
    ]
    
    passed = 0
    failed = 0
    
    print("\n" + "=" * 70)
    print("Running Tests")
    print("=" * 70)
    
    for command, expected_status, expected_intent in test_cases:
        if test_command(command, expected_status, expected_intent):
            passed += 1
        else:
            failed += 1
    
    print("\n" + "=" * 70)
    print(f"Test Results: {passed} passed, {failed} failed out of {len(test_cases)} tests")
    print("=" * 70)
    
    if failed == 0:
        print("✅ All tests passed!")
        print("\n📝 Summary:")
        print("   - Correct transcriptions work ✅")
        print("   - Transcription errors are tolerated ✅")
        print("   - Blacklisted objects still rejected ✅")
        print("   - Random words still rejected ✅")
    else:
        print(f"⚠️  {failed} test(s) failed")

if __name__ == "__main__":
    main()
