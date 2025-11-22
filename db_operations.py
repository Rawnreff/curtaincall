"""
Database operations module for NLP Service
Handles MongoDB connections and database operations for voice control
"""

from flask_pymongo import PyMongo
from datetime import datetime
from flask import request

# Global MongoDB instance
mongo = None

def init_mongodb(app):
    """
    Initialize MongoDB connection using PyMongo
    
    Args:
        app: Flask application instance
        
    Returns:
        PyMongo instance or None if connection fails
    """
    global mongo
    
    try:
        mongo = PyMongo(app)
        # Test connection
        mongo.db.command('ping')
        print("✅ NLP Service: MongoDB Connected successfully")
        return mongo
    except Exception as e:
        print(f"⚠️ NLP Service: MongoDB Connection failed: {e}")
        print("⚠️ NLP Service: Continuing without database functionality")
        mongo = None
        return None

def get_db():
    """
    Get database instance
    
    Returns:
        Database object or None if not connected
    """
    if mongo:
        return mongo.db
    return None

def is_db_available():
    """
    Check if database connection is available
    
    Returns:
        bool: True if database is connected, False otherwise
    """
    return mongo is not None and get_db() is not None


def update_curtain_data(intent, preserve_sensors=True):
    """
    Update curtain_data collection with new position based on voice intent
    
    Args:
        intent: "BUKA" or "TUTUP"
        preserve_sensors: Whether to keep existing sensor readings (default: True)
        
    Returns:
        bool: True if update successful, False otherwise
    """
    if not is_db_available():
        print("❌ Database not available, cannot update curtain_data")
        return False
    
    try:
        db = get_db()
        curtain_data_collection = db.get_collection('curtain_data')
        
        # Get current data to preserve sensor readings
        current_data = curtain_data_collection.find_one({'_id': 'current'})
        
        # Prepare update data
        update_data = {
            'timestamp': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Map intent to posisi field
        if intent == "BUKA":
            update_data['posisi'] = 'Terbuka'
        elif intent == "TUTUP":
            update_data['posisi'] = 'Tertutup'
        else:
            print(f"⚠️ Invalid intent: {intent}")
            return False
        
        # Preserve status_tirai field (don't change Auto/Manual mode)
        if current_data and 'status_tirai' in current_data:
            update_data['status_tirai'] = current_data['status_tirai']
        else:
            update_data['status_tirai'] = 'Manual'
        
        # Preserve sensor data if exists and preserve_sensors is True
        if preserve_sensors and current_data:
            if 'suhu' in current_data:
                update_data['suhu'] = current_data['suhu']
            if 'kelembapan' in current_data:
                update_data['kelembapan'] = current_data['kelembapan']
            if 'cahaya' in current_data:
                update_data['cahaya'] = current_data['cahaya']
        else:
            # Set default values if no current data exists
            update_data['suhu'] = 0.0
            update_data['kelembapan'] = 0.0
            update_data['cahaya'] = 0
        
        # Upsert the data
        result = curtain_data_collection.update_one(
            {'_id': 'current'},
            {'$set': update_data},
            upsert=True
        )
        
        print(f"✅ Curtain data updated: posisi={update_data['posisi']}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating curtain data: {e}")
        import traceback
        traceback.print_exc()
        return False


def log_voice_control(intent, transcript, status, ip_address, confidence):
    """
    Create entry in control_logs collection for voice command audit trail
    
    Args:
        intent: "BUKA", "TUTUP", or "UNKNOWN"
        transcript: Original transcribed text
        status: "success" or "failed"
        ip_address: Client IP address
        confidence: Model confidence score (0.0 to 1.0)
        
    Returns:
        bool: True if log created successfully, False otherwise
    """
    if not is_db_available():
        print("❌ Database not available, cannot log voice control")
        return False
    
    try:
        db = get_db()
        control_logs_collection = db.get_collection('control_logs')
        
        # Map intent to action
        action = None
        if intent == "BUKA":
            action = "open"
        elif intent == "TUTUP":
            action = "close"
        else:
            action = "unknown"
        
        # Create log entry
        log_entry = {
            'user_id': 'voice_control',
            'username': 'Voice Assistant',
            'mode': 'manual',
            'action': action,
            'status': status,
            'timestamp': datetime.utcnow(),
            'ip_address': ip_address,
            'transcript': transcript,
            'confidence': confidence
        }
        
        control_logs_collection.insert_one(log_entry)
        print(f"✅ Voice control logged: action={action}, status={status}")
        return True
        
    except Exception as e:
        print(f"❌ Error logging voice control: {e}")
        import traceback
        traceback.print_exc()
        return False


def create_voice_notification(intent, transcript, success):
    """
    Create notification entry for voice command
    
    Args:
        intent: Voice command intent ("BUKA", "TUTUP", or "UNKNOWN")
        transcript: Original transcribed text
        success: Whether command was successful
        
    Returns:
        bool: True if notification created successfully, False otherwise
    """
    if not is_db_available():
        print("❌ Database not available, cannot create notification")
        return False
    
    try:
        db = get_db()
        notifications_collection = db.get_collection('notifications')
        
        # Map intent to action for message
        action = "open" if intent == "BUKA" else "close" if intent == "TUTUP" else "unknown"
        
        if success:
            notification = {
                'type': 'voice_control',
                'title': 'Voice Command Executed',
                'message': f"Voice command executed: '{transcript}' → {action}",
                'priority': 'medium',
                'read': False,
                'timestamp': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
        else:
            notification = {
                'type': 'voice_control_error',
                'title': 'Voice Command Failed',
                'message': f"Voice command failed: '{transcript}' - Low confidence or invalid intent",
                'priority': 'high',
                'read': False,
                'timestamp': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
        
        notifications_collection.insert_one(notification)
        print(f"✅ Notification created: {notification['title']}")
        return True
        
    except Exception as e:
        print(f"❌ Error creating notification: {e}")
        import traceback
        traceback.print_exc()
        return False
