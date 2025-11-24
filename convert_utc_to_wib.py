"""
Convert UTC timestamp from database to WIB
"""
from datetime import datetime, timedelta, timezone

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

# Timestamp dari database Anda
db_timestamps = [
    "2025-11-24T01:56:47.013+00:00",
    "2025-11-24T01:22:38.435+00:00",
    "2025-11-24T01:56:15.145+00:00"
]

print("="*70)
print("UTC to WIB Conversion - Verifikasi Database Timestamps")
print("="*70)

for utc_str in db_timestamps:
    # Parse UTC timestamp
    utc_time = datetime.fromisoformat(utc_str.replace('+00:00', '+00:00'))
    
    # Convert to WIB
    wib_time = utc_time.astimezone(WIB)
    
    print(f"\n📅 Database (UTC): {utc_str}")
    print(f"🇮🇩 WIB Time:      {wib_time.isoformat()}")
    print(f"   Display:       {wib_time.strftime('%d %B %Y, %H:%M:%S WIB')}")
    print("-" * 70)

print("\n✅ Kesimpulan:")
print("   Database menyimpan UTC (01:56) - INI BENAR!")
print("   Waktu sebenarnya WIB (08:56) - Sesuai jam Indonesia!")
print("   API backend akan convert UTC → WIB saat response")
print("="*70)
