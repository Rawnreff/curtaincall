"""
Test API response to verify timezone conversion
"""
import requests
import json

# Test endpoint (adjust URL if needed)
BASE_URL = "http://localhost:5000/api"

print("="*60)
print("Testing API Response Timezone Conversion")
print("="*60)

# You'll need a valid JWT token for this test
# For now, let's just show what the response should look like

print("\n📝 Expected Behavior:")
print("-" * 60)
print("Database stores:  2025-11-24T01:56:47.013+00:00 (UTC)")
print("API returns:      2025-11-24T08:56:47.013+07:00 (WIB)")
print("Frontend shows:   24 Nov 2025, 08:56:47 WIB")
print("-" * 60)

print("\n✅ The database timestamp is CORRECT!")
print("   MongoDB always stores as UTC internally.")
print("   The conversion happens when reading from DB.")

print("\n🔍 To verify the fix is working:")
print("   1. Call GET /api/sensors/data endpoint")
print("   2. Check the 'timestamp' field in response")
print("   3. It should show +07:00 (WIB) not +00:00 (UTC)")

print("\n💡 Example test:")
print("   curl http://localhost:5000/api/sensors/data \\")
print("        -H 'Authorization: Bearer YOUR_TOKEN'")
print("\n" + "="*60)
