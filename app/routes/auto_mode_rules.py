from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import get_db
from datetime import datetime, timedelta, timezone

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

auto_mode_rules_bp = Blueprint('auto_mode_rules', __name__)

@auto_mode_rules_bp.route('/rules', methods=['GET'])
@jwt_required()
def get_auto_mode_rules():
    """Get global auto mode rules (shared by all users)"""
    try:
        db = get_db()
        rules_collection = db.get_collection('auto_mode_rules')
        
        # Get global rules (shared by all users)
        rules = rules_collection.find_one({'_id': 'global'})
        
        if not rules:
            # Return default rules if global rules don't exist yet
            from config import Config
            default_rules = {
                # Control flags
                'temperature_control_enabled': Config.TEMPERATURE_CONTROL_ENABLED,
                'humidity_control_enabled': Config.HUMIDITY_CONTROL_ENABLED,
                'light_control_enabled': Config.LIGHT_CONTROL_ENABLED,
                'pir_enabled': True,  # PIR enabled by default
                # Thresholds
                'temperature_high_threshold': Config.TEMPERATURE_HIGH_THRESHOLD,
                'humidity_high_threshold': Config.HUMIDITY_HIGH_THRESHOLD,
                'light_open_threshold': Config.LIGHT_OPEN_THRESHOLD,
                'light_close_threshold': Config.LIGHT_CLOSE_THRESHOLD,
                # Master switch
                'enabled': True
            }
            return jsonify({
                'success': True,
                'rules': default_rules,
                'is_default': True
            }), 200
        
        # Remove MongoDB _id from response
        rules.pop('_id', None)
        
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
    """Update global auto mode rules (shared by all users)"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract and validate control flags
        temp_control_enabled = data.get('temperature_control_enabled', True)
        humidity_control_enabled = data.get('humidity_control_enabled', True)
        light_control_enabled = data.get('light_control_enabled', True)
        pir_enabled = data.get('pir_enabled', True)
        enabled = data.get('enabled', True)
        
        # Extract and validate thresholds
        temp_high = float(data.get('temperature_high_threshold', 35.0))
        humidity_high = float(data.get('humidity_high_threshold', 80.0))
        light_open = float(data.get('light_open_threshold', 250))
        light_close = float(data.get('light_close_threshold', 500))
        
        # Validate threshold values
        if light_open >= light_close:
            return jsonify({'error': 'Light open threshold must be less than light close threshold'}), 400
        
        if light_open < 0 or light_close < 0:
            return jsonify({'error': 'Light thresholds must be positive'}), 400
        
        if temp_high < 0 or temp_high > 100:
            return jsonify({'error': 'Temperature threshold must be between 0 and 100'}), 400
        
        if humidity_high < 0 or humidity_high > 100:
            return jsonify({'error': 'Humidity threshold must be between 0 and 100'}), 400
        
        db = get_db()
        rules_collection = db.get_collection('auto_mode_rules')
        
        # Prepare update data
        update_data = {
            # Control flags
            'temperature_control_enabled': temp_control_enabled,
            'humidity_control_enabled': humidity_control_enabled,
            'light_control_enabled': light_control_enabled,
            'pir_enabled': pir_enabled,
            # Thresholds
            'temperature_high_threshold': temp_high,
            'humidity_high_threshold': humidity_high,
            'light_open_threshold': light_open,
            'light_close_threshold': light_close,
            # Master switch
            'enabled': enabled,
            'updated_at': datetime.now(WIB),
            'updated_by': user_id  # Track who made the last update
        }
        
        # Get old rules to check what changed
        old_rules = rules_collection.find_one({'_id': 'global'})
        
        # Upsert global rules (shared by all users)
        result = rules_collection.update_one(
            {'_id': 'global'},
            {
                '$set': update_data,
                '$setOnInsert': {
                    'created_at': datetime.now(WIB)
                }
            },
            upsert=True
        )
        
        print(f"✅ Global auto mode rules updated by user {user_id}: {update_data}")
        
        # Publish updated rules to MQTT for ESP32
        publish_rules_to_mqtt(update_data)
        
        # Check if only PIR changed (to avoid duplicate notifications)
        only_pir_changed = False
        if old_rules:
            # Check if only pir_enabled changed
            non_pir_fields_changed = (
                old_rules.get('temperature_control_enabled') != temp_control_enabled or
                old_rules.get('humidity_control_enabled') != humidity_control_enabled or
                old_rules.get('light_control_enabled') != light_control_enabled or
                old_rules.get('temperature_high_threshold') != temp_high or
                old_rules.get('humidity_high_threshold') != humidity_high or
                old_rules.get('light_open_threshold') != light_open or
                old_rules.get('light_close_threshold') != light_close or
                old_rules.get('enabled') != enabled
            )
            
            pir_changed = old_rules.get('pir_enabled') != pir_enabled
            
            # Only PIR changed if PIR changed but no other fields changed
            only_pir_changed = pir_changed and not non_pir_fields_changed
        
        # Create notification only if non-PIR settings changed
        # (PIR has its own notification from pir_settings route)
        if not only_pir_changed:
            from app.models.sensor_model import create_notification
            from bson import ObjectId
            
            # Get username for notification
            users_collection = db.get_collection('users')
            user = users_collection.find_one({'_id': ObjectId(user_id)})
            username = user.get('name', 'User') if user else 'User'
            
            # Build notification message with enabled features (excluding PIR as it has its own notification)
            features = []
            if temp_control_enabled:
                features.append(f"Temperature: {temp_high}°C")
            if humidity_control_enabled:
                features.append(f"Humidity: {humidity_high}%")
            if light_control_enabled:
                features.append(f"Light: {light_open}-{light_close} lux")
            
            features_text = ", ".join(features) if features else "All features disabled"
            
            create_notification(
                type='auto_mode_settings',
                title='Auto Mode Settings Updated',
                message=f'{username} updated auto mode settings: {features_text}',
                priority='low'
            )
        
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

def publish_rules_to_mqtt(rules):
    """Publish auto mode rules to MQTT for ESP32"""
    try:
        from app import get_mqtt_client
        import json
        
        mqtt_client = get_mqtt_client()
        
        # Prepare MQTT message with all new fields
        mqtt_message = {
            'rules': {
                # Control flags
                'temperature_control_enabled': rules.get('temperature_control_enabled', True),
                'humidity_control_enabled': rules.get('humidity_control_enabled', True),
                'light_control_enabled': rules.get('light_control_enabled', True),
                # Thresholds
                'temperature_high_threshold': rules.get('temperature_high_threshold', 35.0),
                'humidity_high_threshold': rules.get('humidity_high_threshold', 80.0),
                'light_open_threshold': rules.get('light_open_threshold', 250),
                'light_close_threshold': rules.get('light_close_threshold', 500),
                # Master switch
                'enabled': rules.get('enabled', True)
            },
            'timestamp': datetime.now(WIB).isoformat()
        }
        
        # Publish to /curtain/rules topic
        topic = "/curtain/rules"
        message = json.dumps(mqtt_message)
        
        result = mqtt_client.publish(topic, message, qos=1)
        
        if result.rc == 0:
            print(f"✅ Published auto mode rules to MQTT: {topic}")
        else:
            print(f"❌ Failed to publish rules to MQTT: {result.rc}")
            
    except Exception as e:
        print(f"❌ Error publishing rules to MQTT: {e}")
        import traceback
        traceback.print_exc()


