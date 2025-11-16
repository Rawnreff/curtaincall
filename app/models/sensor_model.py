from datetime import datetime, timedelta
from app import get_db
from config import Config
import json

def get_collection(collection_name):
    db = get_db()
    return db.get_collection(collection_name)

def save_sensor_data(data):
    """
    Save sensor data from ESP32 to MongoDB
    Expected data format:
    {
        "suhu": 29.3,
        "kelembapan": 55.8,
        "cahaya": 420,
        "posisi": "Terbuka",
        "status_tirai": "Auto"
    }
    """
    try:
        sensor_data_collection = get_collection('curtain_data')
        sensor_history_collection = get_collection('curtain_history')
        notifications_collection = get_collection('notifications')
        
        # Add timestamp
        data['timestamp'] = datetime.utcnow()
        data['created_at'] = datetime.utcnow()
        
        # Validate required fields
        required_fields = ['suhu', 'kelembapan', 'cahaya', 'posisi', 'status_tirai']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")
        
        # Convert numeric fields
        data['suhu'] = float(data['suhu'])
        data['kelembapan'] = float(data['kelembapan'])
        data['cahaya'] = int(data['cahaya'])
        
        # Check thresholds and trigger alerts
        check_sensor_thresholds(data)
        
        # Auto mode logic
        if data['status_tirai'] == 'Auto':
            handle_auto_mode(data)
        
        # Upsert to current data collection
        result = sensor_data_collection.update_one(
            {'_id': 'current'},
            {'$set': data},
            upsert=True
        )
        
        # Check if we should save to history (every 1 minute)
        check_and_save_history()
        
        print(f"✅ Sensor data saved: {data}")
        return True
        
    except Exception as e:
        print(f"❌ Error saving sensor data: {e}")
        return False

def get_auto_mode_rules():
    """Get auto mode rules from database (use first available user's rules or default)"""
    try:
        rules_collection = get_collection('auto_mode_rules')
        # Get first available rules (or could use global rules)
        rules = rules_collection.find_one({'enabled': True})
        
        if not rules:
            # Return default rules
            return {
                'light_open_threshold': Config.LIGHT_OPEN_THRESHOLD,
                'light_close_threshold': Config.LIGHT_CLOSE_THRESHOLD,
                'temperature_threshold': Config.TEMPERATURE_THRESHOLD,
                'enabled': True
            }
        
        # Remove MongoDB-specific fields
        rules.pop('_id', None)
        rules.pop('user_id', None)
        rules.pop('created_at', None)
        rules.pop('updated_at', None)
        
        return rules
    except Exception as e:
        print(f"❌ Error getting auto mode rules: {e}")
        # Return default rules on error
        return {
            'light_open_threshold': Config.LIGHT_OPEN_THRESHOLD,
            'light_close_threshold': Config.LIGHT_CLOSE_THRESHOLD,
            'temperature_threshold': Config.TEMPERATURE_THRESHOLD,
            'enabled': True
        }

def check_sensor_thresholds(data):
    """Check sensor values against thresholds and trigger alerts"""
    
    # Get temperature threshold from auto mode rules
    rules = get_auto_mode_rules()
    temperature_threshold = rules.get('temperature_threshold', Config.TEMPERATURE_THRESHOLD)
    
    # Temperature alert
    if data['suhu'] > temperature_threshold:
        create_notification(
            type='temperature_high',
            title='High Temperature Alert',
            message=f'Temperature is {data["suhu"]}°C, exceeding safety threshold ({temperature_threshold}°C)',
            priority='high'
        )
        # Activate buzzer via MQTT
        send_mqtt_command({'alert': 'buzzer', 'reason': 'high_temperature'})

def handle_auto_mode(data):
    """Handle automatic curtain control based on light sensor using user-defined rules"""
    light_level = data['cahaya']
    current_position = data['posisi']
    
    # Get auto mode rules from database (use global rules or first user's rules)
    rules = get_auto_mode_rules()
    
    if not rules or not rules.get('enabled', True):
        return  # Auto mode is disabled
    
    light_open_threshold = rules.get('light_open_threshold', Config.LIGHT_OPEN_THRESHOLD)
    light_close_threshold = rules.get('light_close_threshold', Config.LIGHT_CLOSE_THRESHOLD)
    
    if light_level > light_close_threshold and current_position != 'Tertutup':
        # Too bright, close curtain
        send_mqtt_command({'mode': 'auto', 'action': 'close'})
        create_notification(
            type='auto_mode',
            title='Auto Mode Action',
            message=f'Curtain closing automatically due to high light level ({light_level} lux > {light_close_threshold} lux)',
            priority='low'
        )
        
    elif light_level < light_open_threshold and current_position != 'Terbuka':
        # Too dark, open curtain
        send_mqtt_command({'mode': 'auto', 'action': 'open'})
        create_notification(
            type='auto_mode',
            title='Auto Mode Action',
            message=f'Curtain opening automatically due to low light level ({light_level} lux < {light_open_threshold} lux)',
            priority='low'
        )

def check_and_save_history():
    """Check if 1 minute has passed since last history save and save if needed"""
    sensor_data_collection = get_collection('curtain_data')
    history_tracker = sensor_data_collection.find_one({'_id': 'history_tracker'})
    
    current_time = datetime.utcnow()
    
    if not history_tracker:
        # Initialize tracker
        sensor_data_collection.insert_one({
            '_id': 'history_tracker',
            'last_save_time': current_time
        })
        # Save immediately on first run
        save_to_history()
    else:
        # Check if 1 minute (60 seconds) has passed since last save
        last_save_time = history_tracker['last_save_time']
        time_diff = current_time - last_save_time
        
        if time_diff >= timedelta(minutes=1):
            save_to_history()
            # Update last save time
            sensor_data_collection.update_one(
                {'_id': 'history_tracker'},
                {'$set': {'last_save_time': current_time}}
            )

def save_to_history():
    """Copy current data to history collection"""
    try:
        sensor_data_collection = get_collection('curtain_data')
        sensor_history_collection = get_collection('curtain_history')
        
        current_data = sensor_data_collection.find_one({'_id': 'current'})
        if current_data:
            # Remove _id and create new document for history
            history_data = current_data.copy()
            history_data.pop('_id', None)
            history_data['history_timestamp'] = datetime.utcnow()
            
            sensor_history_collection.insert_one(history_data)
            print("✅ Data saved to history")
            
    except Exception as e:
        print(f"❌ Error saving to history: {e}")

def get_current_sensor_data():
    """Get latest sensor data"""
    sensor_data_collection = get_collection('curtain_data')
    return sensor_data_collection.find_one({'_id': 'current'})

def get_sensor_history(hours=24):
    """Get sensor history for specified time range"""
    sensor_history_collection = get_collection('curtain_history')
    time_threshold = datetime.utcnow() - timedelta(hours=hours)
    
    return list(sensor_history_collection.find({
        'history_timestamp': {'$gte': time_threshold}
    }).sort('history_timestamp', -1).limit(1000))

def create_notification(type, title, message, priority='medium'):
    """Create notification entry"""
    notifications_collection = get_collection('notifications')
    
    notification = {
        'type': type,
        'title': title,
        'message': message,
        'priority': priority,
        'read': False,
        'timestamp': datetime.utcnow(),
        'created_at': datetime.utcnow()
    }
    
    notifications_collection.insert_one(notification)
    print(f"✅ Notification created: {title}")

def process_sensor_data(mqtt_message):
    """Process sensor data received via MQTT"""
    try:
        data = json.loads(mqtt_message)
        save_sensor_data(data)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in MQTT message: {e}")

# Import mqtt_handler here to avoid circular imports
def send_mqtt_command(command_data):
    from app.mqtt_handler import send_mqtt_command as send_command
    return send_command(command_data)