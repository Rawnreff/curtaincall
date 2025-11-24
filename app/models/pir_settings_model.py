"""
PIR Settings Manager
Manages PIR motion detection settings independently from auto mode
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

def get_pir_settings():
    """
    Get current PIR settings from database
    
    Returns:
        dict: {
            'enabled': bool,
            'last_updated': datetime
        }
    """
    try:
        collection = get_collection('pir_settings')
        settings = collection.find_one({'_id': 'global'})
        
        if not settings:
            # Return default settings if not found
            return {
                'enabled': True,
                'last_updated': datetime.now(WIB)
            }
        
        # Remove MongoDB _id field
        settings.pop('_id', None)
        settings.pop('created_at', None)
        settings.pop('updated_by', None)
        
        return settings
        
    except Exception as e:
        print(f"❌ Error getting PIR settings: {e}")
        # Return default on error
        return {
            'enabled': True,
            'last_updated': datetime.now(WIB)
        }

def update_pir_settings(enabled, user_id=None):
    """
    Update PIR settings and publish to ESP32
    
    Args:
        enabled (bool): PIR enabled state
        user_id (str, optional): User ID for audit trail
    
    Returns:
        bool: Success status
    """
    try:
        collection = get_collection('pir_settings')
        
        # Validate input
        if not isinstance(enabled, bool):
            print(f"❌ Invalid PIR enabled value: {enabled}")
            return False
        
        # Prepare update document
        update_doc = {
            'enabled': enabled,
            'last_updated': datetime.now(WIB)
        }
        
        if user_id:
            update_doc['updated_by'] = user_id
        
        # Update database
        result = collection.update_one(
            {'_id': 'global'},
            {
                '$set': update_doc,
                '$setOnInsert': {'created_at': datetime.now(WIB)}
            },
            upsert=True
        )
        
        print(f"✅ PIR settings updated: enabled={enabled}")
        
        # Publish to ESP32
        publish_pir_settings_to_esp32({'enabled': enabled})
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating PIR settings: {e}")
        import traceback
        traceback.print_exc()
        return False

def publish_pir_settings_to_esp32(settings):
    """
    Publish PIR settings to ESP32 via MQTT
    
    Args:
        settings (dict): PIR settings to publish
    """
    try:
        mqtt_client = get_mqtt_client()
        if mqtt_client is None:
            print("⚠️ MQTT client not available, cannot publish PIR settings")
            return
        
        # Format MQTT message
        message = {
            'pir_enabled': settings.get('enabled', True),
            'timestamp': datetime.now(WIB).isoformat()
        }
        
        # Publish to ESP32
        topic = "/curtain/pir/settings"
        payload = json.dumps(message)
        mqtt_client.publish(topic, payload, qos=1)
        
        print(f"📤 Published PIR settings to ESP32: {message}")
        
    except Exception as e:
        print(f"❌ Error publishing PIR settings to ESP32: {e}")
        import traceback
        traceback.print_exc()
