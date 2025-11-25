"""
Script to test change password functionality
"""
import requests
import json
import sys

BASE_URL = "http://localhost:5000/api"

def test_with_user(email, old_password):
    """Test change password with specific user"""
    
    print(f"\n{'='*60}")
    print(f"Testing with user: {email}")
    print(f"{'='*60}")
    
    # Step 1: Login
    print("\n🔐 Step 1: Login...")
    login_data = {
        "email": email,
        "password": old_password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users/login", json=login_data)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Login failed: {response.json()}")
            return False
        
        data = response.json()
        token = data['token']
        user = data['user']
        print(f"✅ Login successful!")
        print(f"   User: {user['name']} ({user['email']})")
        
        # Step 2: Try to change password
        print("\n🔑 Step 2: Testing change password...")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Test with wrong current password first
        print("\n   Test 2a: Wrong current password...")
        wrong_data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword123"
        }
        
        response = requests.put(
            f"{BASE_URL}/users/change-password",
            json=wrong_data,
            headers=headers
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 401:
            print("   ✅ Correctly rejected wrong password")
        else:
            print("   ❌ Should have rejected wrong password")
        
        # Test with correct current password
        print("\n   Test 2b: Correct current password...")
        correct_data = {
            "current_password": old_password,
            "new_password": "testpassword456"
        }
        
        response = requests.put(
            f"{BASE_URL}/users/change-password",
            json=correct_data,
            headers=headers
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 200:
            print("   ✅ Password changed successfully!")
            
            # Step 3: Test login with new password
            print("\n🔐 Step 3: Test login with new password...")
            login_data['password'] = "testpassword456"
            response = requests.post(f"{BASE_URL}/users/login", json=login_data)
            
            if response.status_code == 200:
                print("   ✅ Login with new password successful!")
                
                # Step 4: Change back to original
                print("\n🔄 Step 4: Change back to original password...")
                new_token = response.json()['token']
                headers['Authorization'] = f"Bearer {new_token}"
                
                restore_data = {
                    "current_password": "testpassword456",
                    "new_password": old_password
                }
                
                response = requests.put(
                    f"{BASE_URL}/users/change-password",
                    json=restore_data,
                    headers=headers
                )
                
                if response.status_code == 200:
                    print("   ✅ Password restored successfully!")
                    return True
                else:
                    print(f"   ❌ Failed to restore: {response.json()}")
                    return False
            else:
                print(f"   ❌ Login with new password failed: {response.json()}")
                return False
        else:
            print(f"   ❌ Password change failed")
            if response.status_code == 500:
                print("   ⚠️  Server error - check backend logs")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure Flask is running on port 5000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # You can pass email and password as arguments
    if len(sys.argv) >= 3:
        email = sys.argv[1]
        password = sys.argv[2]
    else:
        # Default test user - change this to match your database
        email = input("Enter email: ")
        password = input("Enter password: ")
    
    success = test_with_user(email, password)
    
    if success:
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED!")
        print("="*60)
    else:
        print("\n" + "="*60)
        print("❌ TESTS FAILED")
        print("="*60)
