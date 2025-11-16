from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import get_db
from datetime import datetime

auto_mode_rules_bp = Blueprint('auto_mode_rules', __name__)

@auto_mode_rules_bp.route('/rules', methods=['GET'])
@jwt_required()
def get_auto_mode_rules():
    """Get auto mode rules for the current user"""
    try:
        user_id = get_jwt_identity()
        db = get_db()
        rules_collection = db.get_collection('auto_mode_rules')
        
        # Get user-specific rules or default rules
        rules = rules_collection.find_one({'user_id': user_id})
        
        if not rules:
            # Return default rules if user doesn't have custom rules
            default_rules = {
                'light_open_threshold': 250,
                'light_close_threshold': 500,
                'temperature_threshold': 35.0,
                'enabled': True
            }
            return jsonify({
                'success': True,
                'rules': default_rules,
                'is_default': True
            }), 200
        
        # Remove MongoDB _id and user_id from response
        rules.pop('_id', None)
        rules.pop('user_id', None)
        
        return jsonify({
            'success': True,
            'rules': rules,
            'is_default': False
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting auto mode rules: {e}")
        return jsonify({'error': 'Failed to get auto mode rules'}), 500

@auto_mode_rules_bp.route('/rules', methods=['PUT'])
@jwt_required()
def update_auto_mode_rules():
    """Update auto mode rules for the current user"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['light_open_threshold', 'light_close_threshold']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate values
        light_open = float(data.get('light_open_threshold', 250))
        light_close = float(data.get('light_close_threshold', 500))
        temperature = float(data.get('temperature_threshold', 35.0))
        enabled = data.get('enabled', True)
        
        if light_open >= light_close:
            return jsonify({'error': 'Light open threshold must be less than light close threshold'}), 400
        
        if light_open < 0 or light_close < 0:
            return jsonify({'error': 'Light thresholds must be positive'}), 400
        
        if temperature < 0 or temperature > 100:
            return jsonify({'error': 'Temperature threshold must be between 0 and 100'}), 400
        
        db = get_db()
        rules_collection = db.get_collection('auto_mode_rules')
        
        # Prepare update data
        update_data = {
            'light_open_threshold': light_open,
            'light_close_threshold': light_close,
            'temperature_threshold': temperature,
            'enabled': enabled,
            'updated_at': datetime.utcnow()
        }
        
        # Upsert user-specific rules
        result = rules_collection.update_one(
            {'user_id': user_id},
            {
                '$set': update_data,
                '$setOnInsert': {
                    'user_id': user_id,
                    'created_at': datetime.utcnow()
                }
            },
            upsert=True
        )
        
        print(f"✅ Auto mode rules updated for user {user_id}: {update_data}")
        
        return jsonify({
            'success': True,
            'message': 'Auto mode rules updated successfully',
            'rules': update_data
        }), 200
        
    except ValueError as e:
        return jsonify({'error': f'Invalid value: {str(e)}'}), 400
    except Exception as e:
        print(f"❌ Error updating auto mode rules: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to update auto mode rules'}), 500


