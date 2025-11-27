#!/usr/bin/env python3
"""
Debug script untuk test kata 'tidur'
"""

import requests
import json

def test_tidur():
    url = "http://localhost:5001/proses_suara"
    
    test_words = ["tidur", "ngantuk", "malam", "privasi", "silau", "kepanasan"]
    
    print("=" * 60)
    print("DEBUG TEST: Kata Kunci TUTUP")
    print("=" * 60)
    
    for word in test_words:
        try:
            response = requests.post(url, json={"teks": word})
            result = response.json()
            
            print(f"\n🔍 Testing: '{word}'")
            print(f"   Prediksi: {result.get('prediksi')}")
            print(f"   Status: {result.get('status')}")
            print(f"   Confidence: {result.get('probabilitas', 0):.2f}")
            print(f"   Pesan: {result.get('pesan')}")
            
            if result.get('prediksi') == 'TUTUP' and result.get('status') == 'success':
                print("   ✅ PASS")
            else:
                print("   ❌ FAIL")
                
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_tidur()
