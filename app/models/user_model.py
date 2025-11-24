from app import get_db, bcrypt
from datetime import datetime, timedelta, timezone

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

def get_collection(collection_name):
    db = get_db()
    return db.get_collection(collection_name)

class User:
    @staticmethod
    def create_user(name, email, password):
        """Create new user with hashed password"""
        users_collection = get_collection('users')
        
        # Check if user already exists
        if users_collection.find_one({'email': email}):
            raise ValueError('User already exists')
        
        # Hash password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        # Create user document
        user = {
            'name': name,
            'email': email,
            'password': hashed_password,
            'created_at': datetime.now(WIB),
            'updated_at': datetime.now(WIB),
            'is_active': True
        }
        
        result = users_collection.insert_one(user)
        user['_id'] = str(result.inserted_id)
        
        return user
    
    @staticmethod
    def authenticate_user(email, password):
        """Authenticate user and return user data if valid"""
        users_collection = get_collection('users')
        user = users_collection.find_one({'email': email, 'is_active': True})
        
        if user and bcrypt.check_password_hash(user['password'], password):
            # Convert ObjectId to string for JSON serialization
            user['_id'] = str(user['_id'])
            return user
        
        return None
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        from bson import ObjectId
        users_collection = get_collection('users')
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        if user:
            user['_id'] = str(user['_id'])
            return user
        
        return None