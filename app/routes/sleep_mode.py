"""
Sleep Mode API Routes
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.sleep_mode_model import (
    get_sleep_mode_status,
    activate_sleep_mode,
    deactivate_sleep_mode
)

sleep_mode_bp = Blueprint('sleep_mode', __name__)

@sleep_mode_bp.route('', methods=['GET'])
@jwt_required()
def get_sleep_mode_route():
    """
    Get current sleep mode status
    
    Returns:
        JSON: {
            "active": bool,
            "activated_at": "ISO8601 timestamp" (if active),
            "previous_settings": {
                "pir_enabled": bool,
                "auto_mode_enabled": bool
            } (if active)
        }
    """
    try:
        status = get_sleep_mode_status()
        
        # Convert datetime to ISO format
        if 'activated_at' in status and status['activated_at']:
            status['activated_at'] = status['activated_at'].isoformat()
        
        # Format response
        response = {
            'active': status.get('active', False)
        }
        
        if status.get('active'):
            response['activated_at'] = status.get('activated_at')
            response['previous_settings'] = {
                'pir_enabled': status.get('previous_pir_state'),
                'auto_mode_enabled': status.get('previous_auto_mode_state')
            }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to get sleep mode status',
            'message': str(e)
        }), 500

@sleep_mode_bp.route('/activate', methods=['POST'])
@jwt_required()
def activate_sleep_mode_route():
    """
    Activate sleep mode
    
    Returns:
        JSON: {
            "success": bool,
            "message": str,
            "curtain_closed": bool,
            "activated_at": "ISO8601 timestamp"
        }
    """
    try:
        # Get user ID from JWT
        user_id = get_jwt_identity()
        
        # Activate sleep mode
        result = activate_sleep_mode(user_id)
        
        if not result['success']:
            return jsonify(result), 500
        
        # Add timestamp
        from datetime import datetime, timedelta, timezone
        WIB = timezone(timedelta(hours=7))
        result['activated_at'] = datetime.now(WIB).isoformat()
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to activate sleep mode',
            'message': str(e)
        }), 500

@sleep_mode_bp.route('/deactivate', methods=['POST'])
@jwt_required()
def deactivate_sleep_mode_route():
    """
    Deactivate sleep mode
    
    Returns:
        JSON: {
            "success": bool,
            "message": str,
            "restored_settings": {
                "pir_enabled": bool,
                "auto_mode_enabled": bool
            }
        }
    """
    try:
        # Get user ID from JWT
        user_id = get_jwt_identity()
        
        # Deactivate sleep mode
        result = deactivate_sleep_mode(user_id)
        
        if not result['success']:
            return jsonify(result), 400 if 'not active' in result['message'] else 500
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to deactivate sleep mode',
            'message': str(e)
        }), 500
