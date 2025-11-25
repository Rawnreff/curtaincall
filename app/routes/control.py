from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.mqtt_handler import send_mqtt_command
from app import get_db
from datetime import datetime, timedelta, timezone
from app.models.sensor_model import create_notification, get_current_sensor_data
from bson import ObjectId

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

control_bp = Blueprint('control', __name__)

@control_bp.route('/tirai', methods=['POST'])
@jwt_required()
def control_curtain():
    """Send control command to curtain"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        mode = data.get('mode')
        action = data.get('action')
        
        if not mode or not action:
            return jsonify({'error': 'Missing mode or action'}), 400
        
        # Validate mode and action
        valid_modes = ['manual', 'auto']
        valid_actions = ['open', 'close', 'enable', 'disable']
        
        if mode not in valid_modes:
            return jsonify({'error': f'Invalid mode. Must be one of: {valid_modes}'}), 400
        
        if action not in valid_actions:
            return jsonify({'error': f'Invalid action. Must be one of: {valid_actions}'}), 400
        
        # Get user info for logging
        user_id = get_jwt_identity()
        db = get_db()
        users_collection = db.get_collection('users')
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        username = user.get('name', 'Unknown') if user else 'Unknown'
        
        # Send command via MQTT
        mqtt_message = {
            'mode': mode,
            'action': action,
            'timestamp': datetime.now(WIB).isoformat(),
            'source': 'web'
        }
        
        success = send_mqtt_command(mqtt_message)
        
        if success:
            # Log the control action
            log_control_action(user_id, username, mode, action, 'success')
            
            # Update curtain_data based on the command
            update_curtain_data_from_command(mode, action)
            
            # Create notification for manual actions
            if mode == 'manual':
                create_notification(
                    type='manual_control',
                    title='Manual Control Action',
                    message=f'User {username} sent command: {action}',
                    priority='medium'
                )
            
            # Create notification for auto mode enable/disable
            elif mode == 'auto':
                if action == 'enable':
                    create_notification(
                        type='auto_mode_control',
                        title='Auto Mode Enabled',
                        message=f'User {username} enabled auto mode',
                        priority='medium'
                    )
                elif action == 'disable':
                    create_notification(
                        type='auto_mode_control',
                        title='Auto Mode Disabled',
                        message=f'User {username} disabled auto mode',
                        priority='medium'
                    )
            
            return jsonify({
                'message': f'Command sent successfully: {mode} - {action}',
                'command': {'mode': mode, 'action': action}
            }), 200
        else:
            # Log failed attempt
            log_control_action(user_id, username, mode, action, 'failed')
            
            return jsonify({'error': 'Failed to send command to device'}), 500
            
    except Exception as e:
        print(f"❌ Control error: {e}")
        return jsonify({'error': str(e)}), 500

@control_bp.route('/status', methods=['GET'])
@jwt_required()
def get_control_status():
    """Get recent control commands and status"""
    try:
        db = get_db()
        control_logs_collection = db.get_collection('control_logs')
        
        # Get recent control logs
        recent_logs = list(control_logs_collection.find()
                          .sort('timestamp', -1)
                          .limit(20))
        
        # Convert to JSON serializable
        for log in recent_logs:
            log['_id'] = str(log['_id'])
            if 'timestamp' in log and log['timestamp']:
                # MongoDB stores as UTC, convert to WIB for display
                if log['timestamp'].tzinfo is None:
                    log['timestamp'] = log['timestamp'].replace(tzinfo=timezone.utc).astimezone(WIB).isoformat()
                else:
                    log['timestamp'] = log['timestamp'].astimezone(WIB).isoformat()
        
        return jsonify({
            'recent_commands': recent_logs,
            'mqtt_connected': True
        }), 200
        
    except Exception as e:
        print(f"❌ Get control status error: {e}")
        return jsonify({'error': str(e)}), 500

def log_control_action(user_id, username, mode, action, status):
    """Log control actions for audit trail"""
    db = get_db()
    control_logs_collection = db.get_collection('control_logs')
    
    log_entry = {
        'user_id': user_id,
        'username': username,
        'mode': mode,
        'action': action,
        'status': status,
        'timestamp': datetime.now(WIB),
        'ip_address': request.remote_addr
    }
    
    control_logs_collection.insert_one(log_entry)

def update_curtain_data_from_command(mode, action):
    """Update curtain_data collection based on control command"""
    try:
        db = get_db()
        curtain_data_collection = db.get_collection('curtain_data')
        
        # Get current data to preserve sensor readings
        current_data = curtain_data_collection.find_one({'_id': 'current'})
        
        print(f"🔄 Updating curtain_data: mode={mode}, action={action}")
        print(f"📊 Current data: {current_data}")
        
        # Prepare update data
        update_data = {
            'timestamp': datetime.now(WIB),
            'updated_at': datetime.now(WIB)
        }
        
        # Update position based on action (only for open/close)
        if action == 'open':
            update_data['position'] = 'Open'
        elif action == 'close':
            update_data['position'] = 'Close'
        else:
            # Preserve current position for enable/disable actions
            if current_data and 'position' in current_data:
                update_data['position'] = current_data['position']
            else:
                update_data['position'] = 'Unknown'
        
        # Update curtain_status based on mode and action
        if mode == 'auto' and action == 'enable':
            update_data['curtain_status'] = 'Auto'
            print(f"✅ Setting curtain_status to 'Auto'")
        elif mode == 'auto' and action == 'disable':
            update_data['curtain_status'] = 'Manual'
            print(f"✅ Setting curtain_status to 'Manual'")
        elif mode == 'manual':
            # For manual mode actions (open/close), keep current curtain_status
            if current_data and 'curtain_status' in current_data:
                update_data['curtain_status'] = current_data['curtain_status']
            else:
                update_data['curtain_status'] = 'Manual'
        
        # Preserve sensor data if exists
        if current_data:
            if 'temperature' in current_data:
                update_data['temperature'] = current_data['temperature']
            if 'humidity' in current_data:
                update_data['humidity'] = current_data['humidity']
            if 'light' in current_data:
                update_data['light'] = current_data['light']
        else:
            # Set default values if no current data exists
            update_data['temperature'] = 0.0
            update_data['humidity'] = 0.0
            update_data['light'] = 0
        
        # Upsert the data
        result = curtain_data_collection.update_one(
            {'_id': 'current'},
            {'$set': update_data},
            upsert=True
        )
        
        print(f"✅ Curtain data updated: {update_data}")
        print(f"📝 Update result - Matched: {result.matched_count}, Modified: {result.modified_count}, Upserted ID: {result.upserted_id}")
        
    except Exception as e:
        print(f"❌ Error updating curtain data: {e}")
        import traceback
        traceback.print_exc()
