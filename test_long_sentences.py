#!/usr/bin/env python3
"""
Test script untuk kalimat panjang dengan kata kunci kontekstual
"""

import requests
import json

def test_long_sentences():
    url = "http://localhost:5001/proses_suara"
    
    test_cases = [
        # Kasus dari user
        {"text": "Aku mau tidur nih", "expected": "TUTUP", "reason": "ada kata 'tidur'"},
        {"text": "panas banget ruanganku", "expected": "TUTUP", "reason": "ada kata 'panas'"},
        
        # Variasi lain BUKA
        {"text": "wah gelap banget di sini", "expected": "BUKA", "reason": "ada kata 'gelap'"},
        {"text": "ruanganku pengap nih", "expected": "BUKA", "reason": "ada kata 'pengap'"},
        {"text": "aku baru bangun dari tidur", "expected": "BUKA", "reason": "ada kata 'bangun'"},
        {"text": "pagi hari yang cerah", "expected": "BUKA", "reason": "ada kata 'pagi'"},
        {"text": "butuh cahaya dong di sini", "expected": "BUKA", "reason": "ada kata 'butuh cahaya'"},
        
        # Variasi lain TUTUP
        {"text": "aku ngantuk banget nih", "expected": "TUTUP", "reason": "ada kata 'ngantuk'"},
        {"text": "sudah malam nih", "expected": "TUTUP", "reason": "ada kata 'malam'"},
        {"text": "silau banget mataku", "expected": "TUTUP", "reason": "ada kata 'silau'"},
        {"text": "kepanasan aku di sini", "expected": "TUTUP", "reason": "ada kata 'kepanasan'"},
        {"text": "mau privasi dong", "expected": "TUTUP", "reason": "ada kata 'privasi'"},
        {"text": "ada orang lewat di luar", "expected": "TUTUP", "reason": "ada kata 'orang lewat'"},
    ]
    
    print("=" * 70)
    print("TEST: Deteksi Kata Kunci di Kalimat Panjang")
    print("=" * 70)
    
    passed = 0
    failed = 0
    
    for test in test_cases:
        try:
            response = requests.post(url, json={"teks": test["text"]})
            result = response.json()
            
            prediksi = result.get('prediksi')
            status = result.get('status')
            confidence = result.get('probabilitas', 0)
            
            is_pass = (prediksi == test["expected"] and status == 'success')
            
            if is_pass:
                print(f"\n✅ PASS | {test['text']}")
                print(f"   Reason: {test['reason']}")
                print(f"   Expected: {test['expected']}, Got: {prediksi}")
                print(f"   Confidence: {confidence:.2f}")
                passed += 1
            else:
                print(f"\n❌ FAIL | {test['text']}")
                print(f"   Reason: {test['reason']}")
                print(f"   Expected: {test['expected']}, Got: {prediksi}")
                print(f"   Status: {status}")
                print(f"   Confidence: {confidence:.2f}")
                failed += 1
                
        except Exception as e:
            print(f"\n❌ ERROR | {test['text']}")
            print(f"   Error: {e}")
            failed += 1
    
    print("\n" + "=" * 70)
    print(f"📊 TEST SUMMARY:")
    print(f"   Total tests: {len(test_cases)}")
    print(f"   Passed: {passed} ✅")
    print(f"   Failed: {failed} ❌")
    print(f"   Success rate: {(passed/len(test_cases)*100):.1f}%")
    print("=" * 70)
    
    if passed == len(test_cases):
        print("\n✅ EXCELLENT! Semua kalimat panjang berhasil dideteksi!")
    elif passed >= len(test_cases) * 0.8:
        print("\n✅ GOOD! Sebagian besar kalimat panjang berhasil dideteksi.")
    else:
        print("\n❌ POOR. Perlu perbaikan untuk deteksi kalimat panjang.")

if __name__ == "__main__":
    test_long_sentences()
