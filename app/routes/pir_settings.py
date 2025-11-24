"""
PIR Settings API Routes
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.pir_settings_model import get_pir_settings, update_pir_settings

pir_settings_bp = Blueprint('pir_settings', __name__)

@pir_settings_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_pir_settings_route():
    """
    Get current PIR settings
    
    Returns:
        JSON: {
            "enabled": bool,
            "last_updated": "ISO8601 timestamp"
        }
    """
    try:
        settings = get_pir_settings()
        
        # Convert datetime to ISO format
        if 'last_updated' in settings and settings['last_updated']:
            settings['last_updated'] = settings['last_updated'].isoformat()
        
        return jsonify(settings), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to get PIR settings',
            'message': str(e)
        }), 500

@pir_settings_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_pir_settings_route():
    """
    Update PIR settings
    
    Request Body:
        {
            "enabled": bool
        }
    
    Returns:
        JSON: {
            "success": bool,
            "message": str,
            "settings": {
                "enabled": bool,
                "last_updated": "ISO8601 timestamp"
            }
        }
    """
    try:
        data = request.get_json()
        
        # Validate request
        if 'enabled' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: enabled'
            }), 400
        
        enabled = data['enabled']
        
        # Validate enabled is boolean
        if not isinstance(enabled, bool):
            return jsonify({
                'success': False,
                'error': 'Field "enabled" must be a boolean'
            }), 400
        
        # Get user ID from JWT
        user_id = get_jwt_identity()
        
        # Update settings
        success = update_pir_settings(enabled, user_id)
        
        if not success:
            return jsonify({
                'success': False,
                'message': 'Failed to update PIR settings'
            }), 500
        
        # Create notification for PIR settings update
        from app.models.sensor_model import create_notification
        from app import get_db
        from bson import ObjectId
        
        # Get username for notification
        db = get_db()
        users_collection = db.get_collection('users')
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        username = user.get('name', 'User') if user else 'User'
        
        # Create PIR-specific notification
        status_text = "enabled" if enabled else "disabled"
        create_notification(
            type='pir_settings',
            title='PIR Motion Detection Updated',
            message=f'{username} {status_text} PIR motion detection',
            priority='low'
        )
        
        # Get updated settings
        settings = get_pir_settings()
        
        # Convert datetime to ISO format
        if 'last_updated' in settings and settings['last_updated']:
            settings['last_updated'] = settings['last_updated'].isoformat()
        
        return jsonify({
            'success': True,
            'message': 'PIR settings updated successfully',
            'settings': settings
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to update PIR settings',
            'message': str(e)
        }), 500
