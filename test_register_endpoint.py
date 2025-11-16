"""
Test script untuk memverifikasi endpoint register berfungsi
Jalankan dengan: python test_register_endpoint.py
"""

import requests
import json

BASE_URL = 'http://localhost:5000/api/users'

def test_register():
    """Test register endpoint"""
    url = f'{BASE_URL}/register'
    
    test_data = {
        'name': 'Test User',
        'email': 'test@example.com',
        'password': 'test123'
    }
    
    print(f'Testing register endpoint: {url}')
    print(f'Data: {json.dumps(test_data, indent=2)}')
    
    try:
        response = requests.post(url, json=test_data, timeout=10)
        print(f'\nStatus Code: {response.status_code}')
        print(f'Response: {json.dumps(response.json(), indent=2)}')
        
        if response.status_code == 201:
            print('\n✅ Register endpoint working correctly!')
            return True
        else:
            print('\n❌ Register endpoint returned error')
            return False
            
    except requests.exceptions.ConnectionError:
        print('\n❌ Cannot connect to server. Make sure backend is running.')
        print('   Run: python run.py')
        return False
    except Exception as e:
        print(f'\n❌ Error: {e}')
        return False

def test_login():
    """Test login endpoint"""
    url = f'{BASE_URL}/login'
    
    test_data = {
        'email': 'test@example.com',
        'password': 'test123'
    }
    
    print(f'\nTesting login endpoint: {url}')
    print(f'Data: {json.dumps(test_data, indent=2)}')
    
    try:
        response = requests.post(url, json=test_data, timeout=10)
        print(f'\nStatus Code: {response.status_code}')
        print(f'Response: {json.dumps(response.json(), indent=2)}')
        
        if response.status_code == 200:
            print('\n✅ Login endpoint working correctly!')
            return True
        else:
            print('\n❌ Login endpoint returned error')
            return False
            
    except requests.exceptions.ConnectionError:
        print('\n❌ Cannot connect to server. Make sure backend is running.')
        return False
    except Exception as e:
        print(f'\n❌ Error: {e}')
        return False

if __name__ == '__main__':
    print('=' * 50)
    print('Testing Register and Login Endpoints')
    print('=' * 50)
    
    # Test register
    register_ok = test_register()
    
    # Test login (only if register was successful)
    if register_ok:
        test_login()
    
    print('\n' + '=' * 50)

