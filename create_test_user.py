"""Create test user for PIR testing"""
import requests

BASE_URL = "http://localhost:5000/api"

# Register new user
response = requests.post(f"{BASE_URL}/users/register", json={
    "name": "PIR Test User",
    "email": "pirtest@example.com",
    "password": "pirtest123"
})

if response.status_code == 201:
    print("✅ User created successfully")
    print(f"Email: pirtest@example.com")
    print(f"Password: pirtest123")
else:
    print(f"❌ Failed to create user: {response.text}")
