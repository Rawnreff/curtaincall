"""
Quick script to check existing users in database
"""

from pymongo import MongoClient

try:
    client = MongoClient('mongodb://localhost:27017/')
    db = client.curtaincall
    users = db.users
    
    print("\n📊 Users in database:")
    print("="*60)
    
    for user in users.find():
        print(f"\nUser ID: {user['_id']}")
        print(f"Name: {user.get('name', 'N/A')}")
        print(f"Email: {user.get('email', 'N/A')}")
        print(f"Created: {user.get('created_at', 'N/A')}")
    
    print("\n" + "="*60)
    print(f"Total users: {users.count_documents({})}")
    
except Exception as e:
    print(f"❌ Error: {e}")
