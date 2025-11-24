from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
import paho.mqtt.client as mqtt
from config import Config
from datetime import datetime, timedelta, timezone

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

# Global instances
mongo_client = None
db = None
jwt = JWTManager()
bcrypt = Bcrypt()
mqtt_client = mqtt.Client()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    # CORS dengan konfigurasi yang lebih permisif untuk development
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False,
            "max_age": 3600
        }
    })
    
    # Handle OPTIONS requests explicitly for CORS preflight
    @app.before_request
    def handle_preflight():
        from flask import request
        if request.method == "OPTIONS":
            response = app.make_default_options_response()
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
            response.headers['Access-Control-Max-Age'] = '3600'
            return response
    
    # Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
        return response
    
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    # Initialize MongoDB
    global mongo_client, db
    try:
        mongo_client = MongoClient(app.config['MONGO_URI'])
        db = mongo_client.curtaincall
        print("✅ MongoDB Connected successfully")
    except Exception as e:
        print(f"❌ MongoDB Connection failed: {e}")
        db = create_dummy_db()
    
    # Initialize MQTT
    setup_mqtt(app)
    
    # Register blueprints - Import inside function to avoid circular imports
    register_blueprints(app)
    
    return app

def create_dummy_db():
    """Create dummy database for fallback"""
    class DummyDB:
        def get_collection(self, name):
            return DummyCollection()
    
    class DummyCollection:
        def find_one(self, *args, **kwargs): 
            return None
        def find(self, *args, **kwargs): 
            return []
        def update_one(self, *args, **kwargs): 
            return type('obj', (object,), {'modified_count': 0})()
        def insert_one(self, *args, **kwargs): 
            return type('obj', (object,), {'inserted_id': None})()
        def count_documents(self, *args, **kwargs): 
            return 0
        def update_many(self, *args, **kwargs):
            return type('obj', (object,), {'modified_count': 0})()
        def delete_many(self, *args, **kwargs):
            return type('obj', (object,), {'deleted_count': 0})()
    
    return DummyDB()

def setup_mqtt(app):
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("✅ MQTT Connected successfully")
            client.subscribe("/curtain/data")
            client.subscribe("/curtain/rules/request")
            client.subscribe("/curtain/auto_action")
            client.subscribe("/curtain/pir_action")
            client.subscribe("/curtain/status/request")
            client.subscribe("/curtain/pir/settings/request")
            client.subscribe("/curtain/sleep_mode/request")
            print("📬 Subscribed to /curtain/data")
            print("📬 Subscribed to /curtain/rules/request")
            print("📬 Subscribed to /curtain/auto_action")
            print("📬 Subscribed to /curtain/pir_action")
            print("📬 Subscribed to /curtain/status/request")
            print("📬 Subscribed to /curtain/pir/settings/request")
            print("📬 Subscribed to /curtain/sleep_mode/request")
        else:
            print(f"❌ MQTT Connection failed with code {rc}")
    
    def on_message(client, userdata, msg):
        print(f"📨 MQTT Message received on {msg.topic}: {msg.payload.decode()}")
        handle_mqtt_message(msg.topic, msg.payload.decode())
    
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    
    try:
        mqtt_client.connect(
            app.config['MQTT_BROKER_URL'],
            app.config['MQTT_BROKER_PORT'],
            app.config['MQTT_KEEPALIVE']
        )
        mqtt_client.loop_start()
    except Exception as e:
        print(f"❌ MQTT Connection error: {e}")

def handle_mqtt_message(topic, message):
    """Handle incoming MQTT messages from ESP32"""
    try:
        if topic == "/curtain/data":
            from app.models.sensor_model import process_sensor_data
            process_sensor_data(message)
        elif topic == "/curtain/rules/request":
            # ESP32 requesting auto mode rules
            handle_rules_request(message)
        elif topic == "/curtain/auto_action":
            # ESP32 reporting auto mode action
            handle_auto_action_message(message)
        elif topic == "/curtain/pir_action":
            # ESP32 reporting PIR motion detection action
            handle_pir_action_message(mqtt_client, None, message)
        elif topic == "/curtain/status/request":
            # ESP32 requesting current status
            handle_status_request(message)
        elif topic == "/curtain/pir/settings/request":
            # ESP32 requesting PIR settings
            handle_pir_settings_request(message)
        elif topic == "/curtain/sleep_mode/request":
            # ESP32 requesting sleep mode status
            handle_sleep_mode_request(message)
    except Exception as e:
        print(f"❌ Error handling MQTT message: {e}")

def handle_rules_request(message):
    """Handle auto mode rules request from ESP32"""
    try:
        import json
        from datetime import datetime
        
        # Get default rules from database or use system defaults
        db = get_db()
        rules_collection = db.get_collection('auto_mode_rules')
        
        # Get global rules (shared by all users)
        rules = rules_collection.find_one({'_id': 'global'})
        
        if not rules:
            # Use default rules
            rules = {
                'light_open_threshold': 250,
                'light_close_threshold': 500,
                'temperature_high_threshold': 35.0,
                'humidity_high_threshold': 80.0,
                'enabled': True
            }
        
        # Prepare MQTT message with all fields
        mqtt_message = {
            'rules': {
                # Control flags
                'temperature_control_enabled': rules.get('temperature_control_enabled', True),
                'humidity_control_enabled': rules.get('humidity_control_enabled', True),
                'light_control_enabled': rules.get('light_control_enabled', True),
                'pir_enabled': rules.get('pir_enabled', True),
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
        
        # Publish rules to ESP32
        topic = "/curtain/rules"
        message = json.dumps(mqtt_message)
        mqtt_client.publish(topic, message, qos=1)
        
        print(f"✅ Sent auto mode rules to ESP32: {mqtt_message['rules']}")
        
    except Exception as e:
        print(f"❌ Error handling rules request: {e}")
        import traceback
        traceback.print_exc()

def handle_auto_action_message(message):
    """Handle auto mode action message from ESP32"""
    try:
        import json
        from app.models.sensor_model import create_notification
        
        # Parse the message
        data = json.loads(message)
        
        action = data.get('action', 'unknown')
        reason = data.get('reason', 'light')  # temperature, humidity, or light
        temperature = data.get('temperature', 0)
        humidity = data.get('humidity', 0)
        light_level = data.get('light_level', 0)
        threshold = data.get('threshold', 0)
        
        # Determine action description
        action_text = "opening" if action == "open" else "closing"
        
        # Create notification message based on reason
        if reason == 'temperature':
            notification_message = (
                f"Curtain {action_text} automatically due to high temperature "
                f"({temperature}°C above threshold of {threshold}°C)"
            )
            title = 'Auto Mode Action (Temperature)'
        elif reason == 'humidity':
            notification_message = (
                f"Curtain {action_text} automatically due to high humidity "
                f"({humidity}% above threshold of {threshold}%)"
            )
            title = 'Auto Mode Action (Humidity)'
        else:  # light
            comparison = "below" if action == "open" else "above"
            notification_message = (
                f"Curtain {action_text} automatically due to light level "
                f"({light_level} lux {comparison} threshold of {threshold} lux)"
            )
            title = 'Auto Mode Action (Light)'
        
        # Create notification
        create_notification(
            type='auto_mode',
            title=title,
            message=notification_message,
            priority='low'
        )
        
        print(f"✅ Auto mode notification created: {action} (reason={reason}, temp={temperature}, humidity={humidity}, light={light_level})")
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in auto action message: {e}")
    except Exception as e:
        print(f"❌ Error handling auto action message: {e}")
        import traceback
        traceback.print_exc()

def handle_pir_action_message(client, userdata, message):
    """Handle PIR motion detection action messages from ESP32"""
    try:
        import json
        from app.models.sensor_model import create_notification
        
        # Handle both string and bytes message
        if isinstance(message, str):
            data = json.loads(message)
        else:
            data = json.loads(message.payload.decode())
        
        action = data.get('action', '')
        temperature = data.get('temperature', 0)
        humidity = data.get('humidity', 0)
        light_level = data.get('light_level', 0)
        
        print(f"👁️ PIR Action received: {action} (temp={temperature}, humidity={humidity}, light={light_level})")
        
        # Create notification message
        action_text = "opening" if action == "open" else "closing"
        notification_message = (
            f"Curtain {action_text} automatically due to motion detection. "
            f"Current conditions: {temperature}°C, {humidity}%, {light_level} lux"
        )
        
        # Create notification
        create_notification(
            type='pir_motion',
            title='Motion Detected',
            message=notification_message,
            priority='medium'
        )
        
        print(f"✅ PIR notification created: {action}")
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in PIR action message: {e}")
    except Exception as e:
        print(f"❌ Error handling PIR action message: {e}")
        import traceback
        traceback.print_exc()

def handle_status_request(message):
    """Handle status request from ESP32 - send current position from database"""
    try:
        import json
        from app.models.sensor_model import get_latest_sensor_data
        
        print("📤 ESP32 requesting current status")
        
        # Get latest sensor data from database
        latest_data = get_latest_sensor_data()
        
        if latest_data:
            # Send current status to ESP32
            status_response = {
                "posisi": latest_data.get('posisi', 'Tertutup'),
                "status_tirai": latest_data.get('status_tirai', 'Manual'),
                "timestamp": datetime.now(WIB).isoformat()
            }
            
            response_message = json.dumps(status_response)
            mqtt_client.publish("/curtain/status/response", response_message, qos=1)
            print(f"✅ Status response sent: {status_response}")
        else:
            # No data in database, send default
            status_response = {
                "posisi": "Tertutup",
                "status_tirai": "Manual",
                "timestamp": datetime.now(WIB).isoformat()
            }
            response_message = json.dumps(status_response)
            mqtt_client.publish("/curtain/status/response", response_message, qos=1)
            print(f"⚠️ No sensor data found, sent default: {status_response}")
        
    except Exception as e:
        print(f"❌ Error handling status request: {e}")
        import traceback
        traceback.print_exc()

def handle_pir_settings_request(message):
    """Handle PIR settings request from ESP32"""
    try:
        import json
        from app.models.pir_settings_model import get_pir_settings, publish_pir_settings_to_esp32
        
        print("📤 ESP32 requesting PIR settings")
        
        # Get PIR settings from database
        settings = get_pir_settings()
        
        # Publish to ESP32
        publish_pir_settings_to_esp32(settings)
        
    except Exception as e:
        print(f"❌ Error handling PIR settings request: {e}")
        import traceback
        traceback.print_exc()

def handle_sleep_mode_request(message):
    """Handle sleep mode status request from ESP32"""
    try:
        import json
        from app.models.sleep_mode_model import get_sleep_mode_status, publish_sleep_mode_to_esp32
        from app.models.pir_settings_model import get_pir_settings
        from app.models.sensor_model import get_auto_mode_rules
        
        print("📤 ESP32 requesting sleep mode status")
        
        # Get sleep mode status
        status = get_sleep_mode_status()
        
        if status.get('active'):
            # Sleep mode is active, send with disabled settings
            publish_sleep_mode_to_esp32(True, {
                'pir_enabled': False,
                'auto_mode_enabled': False
            })
        else:
            # Sleep mode is inactive, send current settings
            pir_settings = get_pir_settings()
            auto_mode_rules = get_auto_mode_rules()
            
            publish_sleep_mode_to_esp32(False, {
                'pir_enabled': pir_settings.get('enabled', True),
                'auto_mode_enabled': auto_mode_rules.get('enabled', False)
            })
        
    except Exception as e:
        print(f"❌ Error handling sleep mode request: {e}")
        import traceback
        traceback.print_exc()

def register_blueprints(app):
    """Register all blueprints"""
    from app.routes.sensors import sensors_bp
    from app.routes.control import control_bp
    from app.routes.users import users_bp
    from app.routes.notifications import notifications_bp
    from app.routes.auto_mode_rules import auto_mode_rules_bp
    from app.routes.pir_settings import pir_settings_bp
    from app.routes.sleep_mode import sleep_mode_bp
    
    app.register_blueprint(sensors_bp, url_prefix=f"{app.config['API_PREFIX']}/sensors")
    app.register_blueprint(control_bp, url_prefix=f"{app.config['API_PREFIX']}/control")
    app.register_blueprint(users_bp, url_prefix=f"{app.config['API_PREFIX']}/users")
    app.register_blueprint(notifications_bp, url_prefix=f"{app.config['API_PREFIX']}/notifications")
    app.register_blueprint(auto_mode_rules_bp, url_prefix=f"{app.config['API_PREFIX']}/auto-mode")
    app.register_blueprint(pir_settings_bp, url_prefix=f"{app.config['API_PREFIX']}/pir")
    app.register_blueprint(sleep_mode_bp, url_prefix=f"{app.config['API_PREFIX']}/sleep-mode")

def get_db():
    return db

def get_mqtt_client():
    return mqtt_client

# Export bcrypt untuk digunakan di modul lain
__all__ = ['bcrypt', 'get_db', 'get_mqtt_client']