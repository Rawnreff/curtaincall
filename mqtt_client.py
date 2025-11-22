"""
MQTT client module for NLP Service
Handles MQTT connections and command sending to ESP32
"""

import paho.mqtt.client as mqtt
import json
import os
from datetime import datetime

# Global MQTT client instance
mqtt_client = None
mqtt_connected = False

def on_connect(client, userdata, flags, rc):
    """Callback when MQTT client connects"""
    global mqtt_connected
    if rc == 0:
        print("✅ NLP Service: MQTT Connected successfully")
        mqtt_connected = True
    else:
        print(f"❌ NLP Service: MQTT Connection failed with code {rc}")
        mqtt_connected = False

def on_disconnect(client, userdata, rc):
    """Callback when MQTT client disconnects"""
    global mqtt_connected
    mqtt_connected = False
    if rc != 0:
        print(f"⚠️ NLP Service: MQTT Unexpected disconnection")

def init_mqtt_client():
    """
    Initialize MQTT client connection
    
    Returns:
        mqtt.Client instance or None if connection fails
    """
    global mqtt_client, mqtt_connected
    
    try:
        # Get MQTT configuration from environment
        mqtt_broker_ip = os.getenv('MQTT_BROKER_IP', '127.0.0.1')
        mqtt_broker_port = int(os.getenv('MQTT_BROKER_PORT', 1883))
        
        # Create MQTT client
        mqtt_client = mqtt.Client()
        mqtt_client.on_connect = on_connect
        mqtt_client.on_disconnect = on_disconnect
        
        # Connect to broker
        mqtt_client.connect(mqtt_broker_ip, mqtt_broker_port, 60)
        mqtt_client.loop_start()
        
        print(f"✅ NLP Service: MQTT Client initialized (broker: {mqtt_broker_ip}:{mqtt_broker_port})")
        return mqtt_client
        
    except Exception as e:
        print(f"⚠️ NLP Service: MQTT Connection error: {e}")
        print("⚠️ NLP Service: Continuing without MQTT functionality")
        mqtt_client = None
        mqtt_connected = False
        return None

def is_mqtt_available():
    """
    Check if MQTT connection is available
    
    Returns:
        bool: True if MQTT is connected, False otherwise
    """
    return mqtt_client is not None and mqtt_connected


def send_voice_command(intent, transcript):
    """
    Send MQTT command based on voice intent
    
    Args:
        intent: "BUKA" or "TUTUP"
        transcript: Original transcribed text
        
    Returns:
        bool: True if command sent successfully, False otherwise
    """
    if not is_mqtt_available():
        print("❌ MQTT not available, cannot send command")
        return False
    
    try:
        # Map intent to action
        action = None
        if intent == "BUKA":
            action = "open"
        elif intent == "TUTUP":
            action = "close"
        else:
            print(f"⚠️ Invalid intent for MQTT: {intent}")
            return False
        
        # Build MQTT message
        mqtt_message = {
            'mode': 'manual',
            'action': action,
            'source': 'voice',
            'timestamp': datetime.utcnow().isoformat(),
            'transcript': transcript
        }
        
        # Publish to /curtain/control topic
        topic = "/curtain/control"
        message = json.dumps(mqtt_message)
        
        result = mqtt_client.publish(topic, message, qos=1)
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"✅ MQTT Command sent: {action} (from voice: '{transcript}')")
            return True
        else:
            print(f"❌ MQTT Publish failed with code: {result.rc}")
            return False
            
    except Exception as e:
        print(f"❌ Error sending MQTT command: {e}")
        import traceback
        traceback.print_exc()
        return False
