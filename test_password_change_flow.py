"""
Complete test flow for password change
"""
import requests
import json

BASE_URL = "http://localhost:5000/api"

def main():
    print("="*60)
    print("Testing Password Change Flow")
    print("="*60)
    
    # Create a test user
    test_email = "testpassword@example.com"
    test_name = "Test Password User"
    test_password = "password123"
    
    print("\n📝 Step 1: Register test user...")
    register_data = {
        "name": test_name,
        "email": test_email,
        "password": test_password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users/register", json=register_data)
        
        if response.status_code == 201:
            print("✅ User registered successfully")
            token = response.json()['token']
        elif response.status_code == 400 and 'already exists' in response.json().get('error', ''):
            print("ℹ️  User already exists, logging in...")
            # Login instead
            login_data = {
                "email": test_email,
                "password": test_password
            }
            response = requests.post(f"{BASE_URL}/users/login", json=login_data)
            if response.status_code == 200:
                print("✅ Logged in successfully")
                token = response.json()['token']
            else:
                print(f"❌ Login failed: {response.json()}")
                return
        else:
            print(f"❌ Registration failed: {response.json()}")
            return
        
        # Test change password
        print("\n🔑 Step 2: Change password...")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        change_data = {
            "current_password": test_password,
            "new_password": "newpassword456"
        }
        
        print(f"   Sending: {json.dumps(change_data, indent=2)}")
        
        response = requests.put(
            f"{BASE_URL}/users/change-password",
            json=change_data,
            headers=headers
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Password changed successfully!")
            
            # Test login with new password
            print("\n🔐 Step 3: Test login with new password...")
            login_data = {
                "email": test_email,
                "password": "newpassword456"
            }
            
            response = requests.post(f"{BASE_URL}/users/login", json=login_data)
            
            if response.status_code == 200:
                print("✅ Login with new password successful!")
                
                # Change back
                print("\n🔄 Step 4: Change back to original password...")
                new_token = response.json()['token']
                headers['Authorization'] = f"Bearer {new_token}"
                
                restore_data = {
                    "current_password": "newpassword456",
                    "new_password": test_password
                }
                
                response = requests.put(
                    f"{BASE_URL}/users/change-password",
                    json=restore_data,
                    headers=headers
                )
                
                if response.status_code == 200:
                    print("✅ Password restored!")
                    print("\n" + "="*60)
                    print("✅ ALL TESTS PASSED!")
                    print("="*60)
                else:
                    print(f"❌ Failed to restore: {response.json()}")
            else:
                print(f"❌ Login with new password failed: {response.json()}")
        else:
            print(f"❌ Password change failed!")
            if response.status_code == 500:
                print("⚠️  Server error - check backend logs for details")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure Flask is running on port 5000")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
