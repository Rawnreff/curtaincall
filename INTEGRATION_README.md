# NLP Backend Integration

## Overview

NLP Service sekarang terintegrasi langsung dengan backend database dan MQTT broker. Setiap perintah suara yang berhasil diproses akan:

1. **Update database** (`curtain_data` collection) dengan posisi tirai baru
2. **Log aktivitas** ke `control_logs` collection untuk audit trail
3. **Kirim MQTT command** ke ESP32 untuk menggerakkan tirai fisik
4. **Buat notifikasi** di `notifications` collection untuk user feedback

## Features

### Voice Command Processing

Ketika user mengirim audio ke endpoint `/proses_audio`:

1. Audio ditranskrip menggunakan **Gemini 2.0 Flash**
2. Teks hasil transkrip diklasifikasi menggunakan **Naive Bayes** model
3. Jika intent valid (BUKA/TUTUP) dengan confidence >= 0.5:
   - Database `curtain_data` diupdate
   - Entry dibuat di `control_logs`
   - MQTT command dikirim ke ESP32
   - Notification dibuat untuk user

### Response Format

```json
{
  "status": "success",
  "pesan": "Siap, menutup gorden... 🌑",
  "prediksi": "TUTUP",
  "probabilitas": 0.878,
  "teks_asli": "Tutup gorong.",
  "text": "Tutup gorong.",
  "database_updated": true,
  "mqtt_sent": true,
  "notification_created": true,
  "database_available": true,
  "mqtt_available": true
}
```

### Database Operations

#### curtain_data Collection

```python
{
    "_id": "current",
    "posisi": "Tertutup",  # "Terbuka" or "Tertutup"
    "status_tirai": "Auto",  # Preserved from existing data
    "suhu": 29.3,  # Preserved sensor data
    "kelembapan": 55.8,  # Preserved sensor data
    "cahaya": 420,  # Preserved sensor data
    "timestamp": datetime.utcnow(),
    "updated_at": datetime.utcnow()
}
```

#### control_logs Collection

```python
{
    "user_id": "voice_control",
    "username": "Voice Assistant",
    "mode": "manual",
    "action": "close",  # "open" or "close"
    "status": "success",  # "success" or "failed"
    "timestamp": datetime.utcnow(),
    "ip_address": "192.168.1.100",
    "transcript": "tutup gorden",  # Original voice transcript
    "confidence": 0.878  # Model confidence score
}
```

#### notifications Collection

```python
{
    "type": "voice_control",
    "title": "Voice Command Executed",
    "message": "Voice command executed: 'tutup gorden' → close",
    "priority": "medium",
    "read": False,
    "timestamp": datetime.utcnow(),
    "created_at": datetime.utcnow()
}
```

### MQTT Message Format

```json
{
  "mode": "manual",
  "action": "close",
  "source": "voice",
  "timestamp": "2024-11-22T10:30:00.000Z",
  "transcript": "tutup gorden"
}
```

Published to topic: `/curtain/control`

## Configuration

### Environment Variables (.env)

```bash
# Gemini AI
GEMINI_API_KEY=your_api_key_here

# MongoDB
MONGO_URI=mongodb://localhost:27017/curtaincall

# MQTT Broker
MQTT_BROKER_IP=127.0.0.1
MQTT_BROKER_PORT=1883

# Flask
SECRET_KEY=nlp-secret-key-2024
```

## Error Handling

### Graceful Degradation

- **MongoDB unavailable**: Service continues running, returns error in response
- **MQTT unavailable**: Database still updates, MQTT error logged
- **Low confidence**: No database operations, error response returned
- **Invalid intent**: No database operations, error response returned

### Error Response Example

```json
{
  "status": "error",
  "pesan": "Kurang yakin (45%), coba ulangi?",
  "prediksi": "UNKNOWN",
  "probabilitas": 0.45,
  "text": "buka tutup gorden",
  "database_updated": false,
  "database_available": true,
  "mqtt_available": true
}
```

## Testing

### Run Integration Tests

```bash
# Test connections
python test_integration.py

# Test voice command processing
python test_voice_command.py

# Test BUKA command
python test_buka_command.py
```

### Expected Output

All tests should show:
- ✅ MongoDB connection successful
- ✅ MQTT connection successful
- ✅ Database updated successfully
- ✅ MQTT command sent successfully
- ✅ Notification created successfully

## API Endpoints

### POST /proses_audio

Upload audio file for transcription and processing.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `file` (audio file)

**Response:** JSON with processing results and operation status

### POST /proses_suara

Send text directly for processing (no audio transcription).

**Request:**
- Method: POST
- Content-Type: application/json
- Body: `{"teks": "tutup gorden"}`

**Response:** JSON with processing results and operation status

## Architecture

```
┌─────────────────┐
│  Mobile App     │
└────────┬────────┘
         │ HTTP POST /proses_audio
         ▼
┌─────────────────┐      ┌──────────────┐
│  NLP Service    │◄────►│   MongoDB    │
│   (Port 5001)   │      │ curtaincall  │
└────────┬────────┘      └──────────────┘
         │ MQTT
         ▼
┌─────────────────┐
│     ESP32       │
│  (Curtain HW)   │
└─────────────────┘
```

## Modules

### db_operations.py

- `init_mongodb(app)`: Initialize MongoDB connection
- `update_curtain_data(intent, preserve_sensors)`: Update curtain position
- `log_voice_control(...)`: Create audit log entry
- `create_voice_notification(...)`: Create user notification
- `is_db_available()`: Check database connection status

### mqtt_client.py

- `init_mqtt_client()`: Initialize MQTT client
- `send_voice_command(intent, transcript)`: Send command to ESP32
- `is_mqtt_available()`: Check MQTT connection status

## Troubleshooting

### MongoDB Connection Failed

1. Check if MongoDB is running: `mongod --version`
2. Verify MONGO_URI in .env file
3. Check MongoDB logs for errors

### MQTT Connection Failed

1. Check if MQTT broker is running (Mosquitto)
2. Verify MQTT_BROKER_IP and MQTT_BROKER_PORT in .env
3. Test with: `mosquitto_sub -t /curtain/control -v`

### Low Confidence Predictions

1. Check training data in `data_latih` array
2. Add more training examples for unclear commands
3. Adjust confidence threshold (currently 0.5)

## Next Steps

1. Add more training data for better intent classification
2. Implement user authentication for voice commands
3. Add support for more complex commands (e.g., "buka setengah")
4. Implement voice command history in database
5. Add analytics for voice command usage
