from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.user_model import User
from app import get_db
from bson import ObjectId
from datetime import datetime, timedelta, timezone
import re

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

users_bp = Blueprint('users', __name__)

@users_bp.route('/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        # Validation
        if not name or not email or not password:
            return jsonify({'error': 'Name, email, and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        if not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Create user
        user = User.create_user(name, email, password)
        
        # Create access token (user['_id'] sudah string dari create_user)
        access_token = create_access_token(identity=user['_id'])
        
        # Return user data without password (user['_id'] sudah string)
        user_response = {
            'id': user['_id'],
            'name': user['name'],
            'email': user['email']
        }
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user_response,
            'token': access_token
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        import traceback
        print(f"[ERROR] Registration error: {e}")
        traceback.print_exc()
        error_msg = str(e) if 'User already exists' in str(e) else 'Registration failed'
        return jsonify({'error': error_msg}), 500

@users_bp.route('/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Authenticate user
        user = User.authenticate_user(email, password)
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create access token (user['_id'] sudah string dari authenticate_user)
        access_token = create_access_token(identity=user['_id'])
        
        # Return user data without password (user['_id'] sudah string)
        user_response = {
            'id': user['_id'],
            'name': user['name'],
            'email': user['email']
        }
        
        return jsonify({
            'message': 'Login successful',
            'user': user_response,
            'token': access_token
        }), 200
        
    except Exception as e:
        import traceback
        print(f"[ERROR] Login error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Login failed'}), 500

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Remove sensitive data
        user.pop('password', None)
        user.pop('_id', None)
        
        return jsonify({'user': user}), 200
        
    except Exception as e:
        print(f"❌ Get profile error: {e}")
        return jsonify({'error': str(e)}), 500

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Only allow updating name for now
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        
        if update_data:
            users_collection = get_db().get_collection('users')
            update_data['updated_at'] = datetime.now(WIB)
            users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )
        
        # Get updated user
        user = User.get_user_by_id(user_id)
        if user:
            user.pop('password', None)
            user.pop('_id', None)
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user
        }), 200
        
    except Exception as e:
        print(f"❌ Update profile error: {e}")
        return jsonify({'error': str(e)}), 500