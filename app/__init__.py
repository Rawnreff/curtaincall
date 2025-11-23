from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
import paho.mqtt.client as mqtt
from config import Config

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
            print("📬 Subscribed to /curtain/data")
            print("📬 Subscribed to /curtain/rules/request")
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
        
        # Get the most recent rules (could be user-specific or default)
        rules = rules_collection.find_one(sort=[('updated_at', -1)])
        
        if not rules:
            # Use default rules
            rules = {
                'light_open_threshold': 250,
                'light_close_threshold': 500,
                'temperature_threshold': 35.0,
                'enabled': True
            }
        
        # Prepare MQTT message
        mqtt_message = {
            'rules': {
                'light_open_threshold': rules.get('light_open_threshold', 250),
                'light_close_threshold': rules.get('light_close_threshold', 500),
                'temperature_threshold': rules.get('temperature_threshold', 35.0),
                'enabled': rules.get('enabled', True)
            },
            'timestamp': datetime.utcnow().isoformat()
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

def register_blueprints(app):
    """Register all blueprints"""
    from app.routes.sensors import sensors_bp
    from app.routes.control import control_bp
    from app.routes.users import users_bp
    from app.routes.notifications import notifications_bp
    from app.routes.auto_mode_rules import auto_mode_rules_bp
    
    app.register_blueprint(sensors_bp, url_prefix=f"{app.config['API_PREFIX']}/sensors")
    app.register_blueprint(control_bp, url_prefix=f"{app.config['API_PREFIX']}/control")
    app.register_blueprint(users_bp, url_prefix=f"{app.config['API_PREFIX']}/users")
    app.register_blueprint(notifications_bp, url_prefix=f"{app.config['API_PREFIX']}/notifications")
    app.register_blueprint(auto_mode_rules_bp, url_prefix=f"{app.config['API_PREFIX']}/auto-mode")

def get_db():
    return db

def get_mqtt_client():
    return mqtt_client

# Export bcrypt untuk digunakan di modul lain
__all__ = ['bcrypt', 'get_db', 'get_mqtt_client']