from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.sensor_model import get_current_sensor_data, get_sensor_history, save_sensor_data
from app import get_db
from datetime import datetime, timedelta, timezone

# Indonesia timezone (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

def make_aware(dt):
    """Convert naive datetime to timezone-aware datetime (WIB)"""
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Naive datetime, assume it's UTC and convert to WIB
        return dt.replace(tzinfo=timezone.utc).astimezone(WIB)
    return dt

sensors_bp = Blueprint('sensors', __name__)

@sensors_bp.route('/data', methods=['GET'])
@jwt_required()
def get_sensor_data():
    """Get current sensor data"""
    try:
        data = get_current_sensor_data()
        
        if not data:
            return jsonify({
                'error': 'No sensor data available',
                'suhu': 0,
                'kelembapan': 0,
                'cahaya': 0,
                'posisi': 'Unknown',
                'status_tirai': 'Unknown',
                'timestamp': None
            }), 200
        
        # Remove MongoDB _id and convert to JSON serializable
        data.pop('_id', None)
        if 'timestamp' in data and data['timestamp']:
            # MongoDB stores as UTC, convert to WIB for display
            if data['timestamp'].tzinfo is None:
                # Naive datetime from MongoDB, treat as UTC
                data['timestamp'] = data['timestamp'].replace(tzinfo=timezone.utc).astimezone(WIB).isoformat()
            else:
                # Already timezone-aware, convert to WIB
                data['timestamp'] = data['timestamp'].astimezone(WIB).isoformat()
        
        return jsonify(data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sensors_bp.route('/save', methods=['POST'])
def save_sensor_data_endpoint():
    """Save sensor data from ESP32"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['suhu', 'kelembapan', 'cahaya', 'posisi', 'status_tirai']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        success = save_sensor_data(data)
        
        if success:
            return jsonify({'message': 'Sensor data saved successfully'}), 200
        else:
            return jsonify({'error': 'Failed to save sensor data'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sensors_bp.route('/history', methods=['GET'])
@jwt_required()
def get_sensor_history_endpoint():
    """Get sensor history data"""
    try:
        # Get time period from query parameter
        period = request.args.get('period', '24h')
        
        # Convert period to hours
        period_hours = {
            '1h': 1,
            '6h': 6,
            '24h': 24,
            '7d': 168
        }.get(period, 24)
        
        history_data = get_sensor_history(hours=period_hours)
        
        # Convert to JSON serializable format
        for item in history_data:
            item['_id'] = str(item['_id'])
            if 'timestamp' in item and item['timestamp']:
                # MongoDB stores as UTC, convert to WIB for display
                if item['timestamp'].tzinfo is None:
                    item['timestamp'] = item['timestamp'].replace(tzinfo=timezone.utc).astimezone(WIB).isoformat()
                else:
                    item['timestamp'] = item['timestamp'].astimezone(WIB).isoformat()
            if 'history_timestamp' in item and item['history_timestamp']:
                # MongoDB stores as UTC, convert to WIB for display
                if item['history_timestamp'].tzinfo is None:
                    item['history_timestamp'] = item['history_timestamp'].replace(tzinfo=timezone.utc).astimezone(WIB).isoformat()
                else:
                    item['history_timestamp'] = item['history_timestamp'].astimezone(WIB).isoformat()
        
        return jsonify(history_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sensors_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_sensor_stats():
    """Get sensor statistics"""
    try:
        db = get_db()
        sensor_data_collection = db.get_collection('curtain_data')
        
        # Get data from last 24 hours for stats
        time_threshold = datetime.now(WIB) - timedelta(hours=24)
        
        # Query with UTC time for compatibility with old data
        time_threshold_utc = time_threshold.astimezone(timezone.utc).replace(tzinfo=None)
        
        history_data = list(sensor_data_collection.find({
            'timestamp': {'$gte': time_threshold_utc}
        }))
        
        if not history_data:
            return jsonify({'message': 'No data available for statistics'}), 200
        
        # Calculate basic statistics
        temperatures = [d['suhu'] for d in history_data if 'suhu' in d]
        humidity = [d['kelembapan'] for d in history_data if 'kelembapan' in d]
        light = [d['cahaya'] for d in history_data if 'cahaya' in d]
        
        stats = {
            'temperature': {
                'current': temperatures[-1] if temperatures else 0,
                'average': sum(temperatures) / len(temperatures) if temperatures else 0,
                'max': max(temperatures) if temperatures else 0,
                'min': min(temperatures) if temperatures else 0
            },
            'humidity': {
                'current': humidity[-1] if humidity else 0,
                'average': sum(humidity) / len(humidity) if humidity else 0,
                'max': max(humidity) if humidity else 0,
                'min': min(humidity) if humidity else 0
            },
            'light': {
                'current': light[-1] if light else 0,
                'average': sum(light) / len(light) if light else 0,
                'max': max(light) if light else 0,
                'min': min(light) if light else 0
            }
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500