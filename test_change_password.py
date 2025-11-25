import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_change_password():
    """Test change password endpoint"""
    
    # Step 1: Login to get token
    print("🔐 Step 1: Login...")
    login_data = {
        "email": "test@example.com",  # Ganti dengan email user yang ada
        "password": "password123"      # Ganti dengan password yang benar
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users/login", json=login_data)
        print(f"Login Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Login failed: {response.json()}")
            return
        
        data = response.json()
        token = data['token']
        print(f"✅ Login successful! Token: {token[:20]}...")
        
        # Step 2: Change password
        print("\n🔑 Step 2: Change password...")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        change_password_data = {
            "current_password": "password123",  # Password lama
            "new_password": "newpassword123"    # Password baru
        }
        
        response = requests.put(
            f"{BASE_URL}/users/change-password",
            json=change_password_data,
            headers=headers
        )
        
        print(f"Change Password Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Password changed successfully!")
            
            # Step 3: Test login with new password
            print("\n🔐 Step 3: Test login with new password...")
            login_data['password'] = "newpassword123"
            response = requests.post(f"{BASE_URL}/users/login", json=login_data)
            
            if response.status_code == 200:
                print("✅ Login with new password successful!")
                
                # Step 4: Change back to original password
                print("\n🔄 Step 4: Change back to original password...")
                new_token = response.json()['token']
                headers['Authorization'] = f"Bearer {new_token}"
                
                change_back_data = {
                    "current_password": "newpassword123",
                    "new_password": "password123"
                }
                
                response = requests.put(
                    f"{BASE_URL}/users/change-password",
                    json=change_back_data,
                    headers=headers
                )
                
                if response.status_code == 200:
                    print("✅ Password changed back successfully!")
                else:
                    print(f"❌ Failed to change back: {response.json()}")
            else:
                print(f"❌ Login with new password failed: {response.json()}")
        else:
            print(f"❌ Password change failed: {response.json()}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure Flask is running on port 5000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Change Password Endpoint")
    print("=" * 60)
    test_change_password()
