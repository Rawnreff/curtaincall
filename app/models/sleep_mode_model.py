"""
Sleep Mode Manager
Manages sleep mode state and transitions
"""
from datetime import datetime, timedelta, timezone
from app import get_db, get_mqtt_client
import json

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

def get_collection(collection_name):
    """Get MongoDB collection"""
    db = get_db()
    return db.get_collection(collection_name)

def get_sleep_mode_status():
    """
    Get current sleep mode status
    
    Returns:
        dict: {
            'active': bool,
            'activated_at': datetime (if active),
            'previous_pir_state': bool,
            'previous_auto_mode_state': bool
        }
    """
    try:
        collection = get_collection('sleep_mode_settings')
        settings = collection.find_one({'_id': 'global'})
        
        if not settings:
            # Return default settings if not found
            return {
                'active': False,
                'activated_at': None,
                'previous_pir_state': None,
                'previous_auto_mode_state': None
            }
        
        # Remove MongoDB _id field
        settings.pop('_id', None)
        settings.pop('created_at', None)
        settings.pop('updated_by', None)
        settings.pop('deactivated_at', None)
        settings.pop('last_updated', None)
        
        return settings
        
    except Exception as e:
        print(f"❌ Error getting sleep mode status: {e}")
        # Return default on error
        return {
            'active': False,
            'activated_at': None,
            'previous_pir_state': None,
            'previous_auto_mode_state': None
        }

def activate_sleep_mode(user_id=None):
    """
    Activate sleep mode:
    1. Save current PIR and auto mode states
    2. Close curtain if not closed
    3. Disable all automation
    4. Create notification
    
    Args:
        user_id (str, optional): User ID for audit trail
    
    Returns:
        dict: {
            'success': bool,
            'message': str,
            'curtain_closed': bool
        }
    """
    try:
        # Get current PIR and auto mode states
        from app.models.pir_settings_model import get_pir_settings
        from app.models.sensor_model import get_auto_mode_rules
        
        pir_settings = get_pir_settings()
        auto_mode_rules = get_auto_mode_rules()
        
        current_pir_state = pir_settings.get('enabled', True)
        current_auto_mode_state = auto_mode_rules.get('enabled', False)
        
        print(f"💾 Saving current states: PIR={current_pir_state}, Auto={current_auto_mode_state}")
        
        # Update sleep mode settings in database
        collection = get_collection('sleep_mode_settings')
        update_doc = {
            'active': True,
            'activated_at': datetime.now(WIB),
            'previous_pir_state': current_pir_state,
            'previous_auto_mode_state': current_auto_mode_state,
            'last_updated': datetime.now(WIB)
        }
        
        if user_id:
            update_doc['updated_by'] = user_id
        
        collection.update_one(
            {'_id': 'global'},
            {
                '$set': update_doc,
                '$setOnInsert': {'created_at': datetime.now(WIB)}
            },
            upsert=True
        )
        
        print("✅ Sleep mode activated in database")
        
        # Update sensor data to reflect sleep mode
        sensor_data_collection = get_collection('curtain_data')
        sensor_data_collection.update_one(
            {'_id': 'current'},
            {
                '$set': {
                    'sleep_mode': True,
                    'status_tirai': 'Manual',  # Disable auto mode
                    'posisi': 'Tertutup',  # Will be closed by ESP32
                    'timestamp': datetime.now(WIB)
                }
            }
        )
        print("✅ Sensor data updated with sleep mode")
        
        # Send close curtain command to ESP32
        curtain_closed = send_close_curtain_command()
        
        # Publish sleep mode state to ESP32
        publish_sleep_mode_to_esp32(True, {
            'pir_enabled': False,
            'auto_mode_enabled': False
        })
        
        # Create notification
        from app.models.sensor_model import create_notification
        create_notification(
            type='sleep_mode',
            title='Sleep Mode Activated',
            message='Sleep mode is now active. All automated functions are disabled and the curtain is closed.',
            priority='medium'
        )
        
        return {
            'success': True,
            'message': 'Sleep mode activated successfully',
            'curtain_closed': curtain_closed
        }
        
    except Exception as e:
        print(f"❌ Error activating sleep mode: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'message': f'Failed to activate sleep mode: {str(e)}',
            'curtain_closed': False
        }

def deactivate_sleep_mode(user_id=None):
    """
    Deactivate sleep mode:
    1. Restore previous PIR and auto mode states
    2. Re-enable automation based on saved states
    3. Create notification
    
    Args:
        user_id (str, optional): User ID for audit trail
    
    Returns:
        dict: {
            'success': bool,
            'message': str,
            'restored_settings': dict
        }
    """
    try:
        # Get current sleep mode settings to retrieve saved states
        collection = get_collection('sleep_mode_settings')
        settings = collection.find_one({'_id': 'global'})
        
        if not settings or not settings.get('active', False):
            return {
                'success': False,
                'message': 'Sleep mode is not active',
                'restored_settings': {}
            }
        
        # Get saved states
        previous_pir_state = settings.get('previous_pir_state', True)
        previous_auto_mode_state = settings.get('previous_auto_mode_state', False)
        
        print(f"🔄 Restoring previous states: PIR={previous_pir_state}, Auto={previous_auto_mode_state}")
        
        # Update sleep mode settings in database
        update_doc = {
            'active': False,
            'deactivated_at': datetime.now(WIB),
            'activated_at': None,
            'previous_pir_state': None,
            'previous_auto_mode_state': None,
            'last_updated': datetime.now(WIB)
        }
        
        if user_id:
            update_doc['updated_by'] = user_id
        
        collection.update_one(
            {'_id': 'global'},
            {'$set': update_doc}
        )
        
        print("✅ Sleep mode deactivated in database")
        
        # Update sensor data to reflect sleep mode deactivation
        sensor_data_collection = get_collection('curtain_data')
        sensor_data_collection.update_one(
            {'_id': 'current'},
            {
                '$set': {
                    'sleep_mode': False,
                    'status_tirai': 'Auto' if previous_auto_mode_state else 'Manual',
                    'timestamp': datetime.now(WIB)
                }
            }
        )
        print("✅ Sensor data updated - sleep mode deactivated")
        
        # Restore PIR settings
        from app.models.pir_settings_model import update_pir_settings
        update_pir_settings(previous_pir_state)
        
        # Restore auto mode settings
        from app.models.sensor_model import get_auto_mode_rules
        auto_rules_collection = get_collection('auto_mode_rules')
        auto_rules_collection.update_one(
            {'_id': 'global'},
            {'$set': {'enabled': previous_auto_mode_state}}
        )
        
        # Publish sleep mode state to ESP32
        publish_sleep_mode_to_esp32(False, {
            'pir_enabled': previous_pir_state,
            'auto_mode_enabled': previous_auto_mode_state
        })
        
        # Create notification
        from app.models.sensor_model import create_notification
        create_notification(
            type='sleep_mode',
            title='Sleep Mode Deactivated',
            message=f'Sleep mode is now inactive. Previous settings restored: PIR {"enabled" if previous_pir_state else "disabled"}, Auto mode {"enabled" if previous_auto_mode_state else "disabled"}.',
            priority='medium'
        )
        
        return {
            'success': True,
            'message': 'Sleep mode deactivated successfully',
            'restored_settings': {
                'pir_enabled': previous_pir_state,
                'auto_mode_enabled': previous_auto_mode_state
            }
        }
        
    except Exception as e:
        print(f"❌ Error deactivating sleep mode: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'message': f'Failed to deactivate sleep mode: {str(e)}',
            'restored_settings': {}
        }

def send_close_curtain_command():
    """
    Send close curtain command to ESP32
    
    Returns:
        bool: True if command sent successfully
    """
    try:
        mqtt_client = get_mqtt_client()
        if mqtt_client is None:
            print("⚠️ MQTT client not available, cannot send close curtain command")
            return False
        
        # Send close command
        message = {
            'mode': 'sleep',
            'action': 'close',
            'timestamp': datetime.now(WIB).isoformat()
        }
        
        topic = "/curtain/control"
        payload = json.dumps(message)
        mqtt_client.publish(topic, payload, qos=1)
        
        print("📤 Sent close curtain command for sleep mode")
        return True
        
    except Exception as e:
        print(f"❌ Error sending close curtain command: {e}")
        return False

def publish_sleep_mode_to_esp32(active, settings):
    """
    Publish sleep mode state to ESP32 via MQTT
    
    Args:
        active (bool): Sleep mode active state
        settings (dict): Settings to restore (pir_enabled, auto_mode_enabled)
    """
    try:
        mqtt_client = get_mqtt_client()
        if mqtt_client is None:
            print("⚠️ MQTT client not available, cannot publish sleep mode")
            return
        
        # Format MQTT message
        message = {
            'active': active,
            'pir_enabled': settings.get('pir_enabled', True),
            'auto_mode_enabled': settings.get('auto_mode_enabled', False),
            'timestamp': datetime.now(WIB).isoformat()
        }
        
        # Publish to ESP32
        topic = "/curtain/sleep_mode"
        payload = json.dumps(message)
        mqtt_client.publish(topic, payload, qos=1)
        
        print(f"📤 Published sleep mode to ESP32: {message}")
        
    except Exception as e:
        print(f"❌ Error publishing sleep mode to ESP32: {e}")
        import traceback
        traceback.print_exc()
