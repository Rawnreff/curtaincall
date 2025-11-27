"""
Test script untuk memverifikasi akurasi voice command recognition
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:5001"

# Test cases dengan berbagai variasi
test_cases = [
    # Perintah singkat (harus diterima)
    {"text": "buka", "expected": "BUKA", "description": "Perintah singkat: buka"},
    {"text": "tutup", "expected": "TUTUP", "description": "Perintah singkat: tutup"},
    {"text": "bukain", "expected": "BUKA", "description": "Perintah singkat: bukain"},
    {"text": "tutupin", "expected": "TUTUP", "description": "Perintah singkat: tutupin"},
    
    # Perintah standar (harus diterima)
    {"text": "buka gorden", "expected": "BUKA", "description": "Perintah standar: buka gorden"},
    {"text": "tutup gorden", "expected": "TUTUP", "description": "Perintah standar: tutup gorden"},
    {"text": "buka tirai", "expected": "BUKA", "description": "Perintah standar: buka tirai"},
    {"text": "tutup tirai", "expected": "TUTUP", "description": "Perintah standar: tutup tirai"},
    
    # Kesalahan transkripsi umum (harus diterima dengan toleransi)
    {"text": "tutup tilai", "expected": "TUTUP", "description": "Kesalahan transkripsi: tutup tilai"},
    {"text": "tutup lilin", "expected": "TUTUP", "description": "Kesalahan transkripsi: tutup lilin"},
    {"text": "buka gulai", "expected": "BUKA", "description": "Kesalahan transkripsi: buka gulai"},
    {"text": "tutup lirai", "expected": "TUTUP", "description": "Kesalahan transkripsi: tutup lirai"},
    {"text": "buka golden", "expected": "BUKA", "description": "Kesalahan transkripsi: buka golden"},
    
    # Perintah dengan konteks (harus diterima)
    {"text": "tolong buka", "expected": "BUKA", "description": "Dengan konteks: tolong buka"},
    {"text": "silau", "expected": "TUTUP", "description": "Konteks implisit: silau"},
    {"text": "gelap", "expected": "BUKA", "description": "Konteks implisit: gelap"},
    
    # Konteks situasional BUKA (NEW!)
    {"text": "bangun", "expected": "BUKA", "description": "Konteks situasional: bangun"},
    {"text": "pagi", "expected": "BUKA", "description": "Konteks situasional: pagi"},
    {"text": "gelap banget", "expected": "BUKA", "description": "Konteks situasional: gelap banget"},
    {"text": "pengap", "expected": "BUKA", "description": "Konteks situasional: pengap"},
    {"text": "butuh cahaya", "expected": "BUKA", "description": "Konteks situasional: butuh cahaya"},
    {"text": "ruangan gelap", "expected": "BUKA", "description": "Konteks situasional: ruangan gelap"},
    
    # Konteks situasional TUTUP (NEW!)
    {"text": "tidur", "expected": "TUTUP", "description": "Konteks situasional: tidur"},
    {"text": "ngantuk", "expected": "TUTUP", "description": "Konteks situasional: ngantuk"},
    {"text": "malam", "expected": "TUTUP", "description": "Konteks situasional: malam"},
    {"text": "privasi", "expected": "TUTUP", "description": "Konteks situasional: privasi"},
    {"text": "kepanasan", "expected": "TUTUP", "description": "Konteks situasional: kepanasan"},
    {"text": "orang lewat", "expected": "TUTUP", "description": "Konteks situasional: orang lewat"},
    
    # Kalimat panjang dengan konteks BUKA (harus diterima)
    {"text": "aku baru bangun nih", "expected": "BUKA", "description": "Kalimat panjang: aku baru bangun nih"},
    {"text": "ruangan gelap banget", "expected": "BUKA", "description": "Kalimat panjang: ruangan gelap banget"},
    {"text": "pengap banget ruanganku", "expected": "BUKA", "description": "Kalimat panjang: pengap banget ruanganku"},
    
    # Kalimat panjang dengan konteks TUTUP (harus diterima)
    {"text": "aku mau tidur nih", "expected": "TUTUP", "description": "Kalimat panjang: aku mau tidur nih"},
    {"text": "panas banget ruanganku", "expected": "TUTUP", "description": "Kalimat panjang: panas banget ruanganku"},
    {"text": "aku ngantuk nih", "expected": "TUTUP", "description": "Kalimat panjang: aku ngantuk nih"},
    
    # Perintah yang TIDAK boleh diterima
    {"text": "tutup pintu", "expected": "UNKNOWN", "description": "Objek salah: tutup pintu"},
    {"text": "buka jendela", "expected": "UNKNOWN", "description": "Objek salah: buka jendela"},
    {"text": "hello world", "expected": "UNKNOWN", "description": "Tidak relevan: hello world"},
]

def test_voice_command(text, expected, description):
    """Test single voice command"""
    try:
        response = requests.post(
            f"{BASE_URL}/proses_suara",
            json={"teks": text},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            predicted = data.get('prediksi', 'UNKNOWN')
            status = data.get('status', 'error')
            confidence = data.get('probabilitas', 0.0)
            
            # Check if prediction matches expected
            if predicted == expected:
                result = "✅ PASS"
                color = "\033[92m"  # Green
            else:
                result = "❌ FAIL"
                color = "\033[91m"  # Red
            
            reset = "\033[0m"
            
            print(f"{color}{result}{reset} | {description}")
            print(f"     Input: '{text}'")
            print(f"     Expected: {expected}, Got: {predicted}")
            print(f"     Status: {status}, Confidence: {confidence:.2f}")
            print()
            
            return predicted == expected
        else:
            print(f"❌ ERROR | {description}")
            print(f"     HTTP {response.status_code}: {response.text}")
            print()
            return False
            
    except Exception as e:
        print(f"❌ ERROR | {description}")
        print(f"     Exception: {e}")
        print()
        return False

def main():
    print("╔════════════════════════════════════════════════════════╗")
    print("║     VOICE COMMAND ACCURACY TEST                        ║")
    print("╚════════════════════════════════════════════════════════╝\n")
    
    # Check if NLP service is running
    try:
        response = requests.get(f"{BASE_URL}/", timeout=2)
        print("✅ NLP service is running\n")
    except:
        print("❌ NLP service is not running!")
        print("   Please start it with: cd nlp && python run.py\n")
        return
    
    # Run tests
    passed = 0
    failed = 0
    
    print("Running tests...\n")
    print("=" * 60)
    print()
    
    for test in test_cases:
        if test_voice_command(test["text"], test["expected"], test["description"]):
            passed += 1
        else:
            failed += 1
    
    # Summary
    total = passed + failed
    success_rate = (passed / total * 100) if total > 0 else 0
    
    print("=" * 60)
    print("\n📊 TEST SUMMARY:")
    print(f"   Total tests: {total}")
    print(f"   Passed: {passed} ✅")
    print(f"   Failed: {failed} ❌")
    print(f"   Success rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("\n✅ EXCELLENT! Voice command accuracy is very good!")
    elif success_rate >= 75:
        print("\n✅ GOOD! Voice command accuracy is acceptable.")
    elif success_rate >= 60:
        print("\n⚠️ FAIR. Voice command accuracy needs improvement.")
    else:
        print("\n❌ POOR. Voice command accuracy is too low.")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
