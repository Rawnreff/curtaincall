import json
import paho.mqtt.client as mqtt
from app import mqtt_client

def send_mqtt_command(command_data):
    """
    Send command to ESP32 via MQTT
    command_data format:
    {
        "mode": "manual|auto",
        "action": "open|close|enable|disable"
    }
    """
    try:
        topic = "/curtain/control"
        message = json.dumps(command_data)
        
        result = mqtt_client.publish(topic, message, qos=1)
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"✅ MQTT Command sent: {command_data}")
            return True
        else:
            print(f"❌ MQTT Publish failed with code: {result.rc}")
            return False
            
    except Exception as e:
        print(f"❌ Error sending MQTT command: {e}")
        return False

def send_emergency_stop():
    """Send emergency stop command"""
    command = {
        "mode": "emergency",
        "action": "stop",
        "timestamp": "now"
    }
    return send_mqtt_command(command)

def send_buzzer_alert(reason):
    """Send buzzer alert command"""
    command = {
        "alert": "buzzer",
        "reason": reason,
        "timestamp": "now"
    }
    return send_mqtt_command(command)