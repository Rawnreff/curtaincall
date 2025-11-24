"""
Test script to verify timezone handling
"""
from datetime import datetime, timedelta, timezone

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

# Test 1: Create WIB datetime
wib_time = datetime.now(WIB)
print(f"WIB Time: {wib_time}")
print(f"WIB ISO: {wib_time.isoformat()}")

# Test 2: What MongoDB will store
utc_time = wib_time.astimezone(timezone.utc)
print(f"\nUTC Time (what MongoDB stores): {utc_time}")
print(f"UTC ISO: {utc_time.isoformat()}")

# Test 3: Naive datetime (what's currently happening)
naive_utc = datetime.utcnow()
print(f"\nNaive UTC (old way): {naive_utc}")
print(f"Naive ISO: {naive_utc.isoformat()}")

# Test 4: Correct way - store as naive UTC but it represents WIB
# This is WRONG - we should store timezone-aware
print("\n" + "="*50)
print("SOLUTION: MongoDB stores datetime as UTC internally")
print("When we save datetime.now(WIB), MongoDB converts it to UTC")
print("When we read it back, we need to convert UTC to WIB for display")
print("="*50)

# Test 5: Verify the conversion
print(f"\nOriginal WIB: {wib_time}")
print(f"Stored as UTC: {utc_time}")
print(f"Read back and convert to WIB: {utc_time.astimezone(WIB)}")
print(f"Are they equal? {wib_time == utc_time.astimezone(WIB)}")
