from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.notification_model import (
    get_unread_notifications, 
    get_all_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    get_notification_stats
)
from bson import ObjectId
from datetime import datetime, timedelta, timezone

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('', methods=['GET'])
@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications"""
    try:
        # Check if we should only get unread notifications
        unread_only = request.args.get('unread', 'false').lower() == 'true'
        
        if unread_only:
            notifications = get_unread_notifications()
        else:
            notifications = get_all_notifications()
        
        # Convert to JSON serializable
        for notification in notifications:
            notification_id = str(notification['_id'])
            notification['id'] = notification_id  # Add 'id' field for frontend compatibility
            notification['_id'] = notification_id  # Keep '_id' for backward compatibility
            
            # Convert timestamp from UTC to WIB
            if 'timestamp' in notification and notification['timestamp']:
                if notification['timestamp'].tzinfo is None:
                    notification['timestamp'] = notification['timestamp'].replace(tzinfo=timezone.utc).astimezone(WIB).isoformat()
                else:
                    notification['timestamp'] = notification['timestamp'].astimezone(WIB).isoformat()
            
            # Ensure 'read' field exists (default to False if not present)
            if 'read' not in notification:
                notification['read'] = False
            
            # Convert read_at timestamp from UTC to WIB
            if 'read_at' in notification and notification['read_at']:
                if notification['read_at'].tzinfo is None:
                    notification['read_at'] = notification['read_at'].replace(tzinfo=timezone.utc).astimezone(WIB).isoformat()
                else:
                    notification['read_at'] = notification['read_at'].astimezone(WIB).isoformat()
        
        return jsonify(notifications), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications"""
    try:
        stats = get_notification_stats()
        return jsonify({'count': stats['unread']}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/<notification_id>/read', methods=['PATCH'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read"""
    try:
        success = mark_notification_as_read(notification_id)
        
        if success:
            return jsonify({'message': 'Notification marked as read'}), 200
        else:
            return jsonify({'error': 'Notification not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/read-all', methods=['PATCH'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read"""
    try:
        count = mark_all_notifications_as_read()
        return jsonify({
            'message': f'Marked {count} notifications as read'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_notification_statistics():
    """Get notification statistics"""
    try:
        stats = get_notification_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500