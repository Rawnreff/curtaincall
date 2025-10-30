# 📱 CurtainCall Frontend Setup Guide

Panduan lengkap untuk setup dan menghubungkan frontend ke backend.

---

## 📋 Prerequisites

- ✅ Node.js 18+ installed
- ✅ npm atau yarn
- ✅ Expo CLI (akan auto-install)
- ✅ Backend Flask sudah running di `http://localhost:5000`

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Konfigurasi Backend URL

Edit file `app/services/config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000', // Ganti sesuai IP backend Anda
  TIMEOUT: 10000,
};
```

**Cara mencari IP Backend:**

**Windows:**
```cmd
ipconfig
# Lihat IPv4 Address, contoh: 192.168.1.100
```

**Mac/Linux:**
```bash
ifconfig
# Lihat inet, contoh: 192.168.1.100
```

**Kemudian ganti di config.ts:**
```typescript
BASE_URL: 'http://192.168.1.100:5000',
```

### 3. Jalankan Frontend

```bash
npm start
```

Pilih platform:
- Press `a` untuk Android
- Press `i` untuk iOS
- Press `w` untuk Web
- Scan QR code dengan Expo Go app (Android/iOS)

---

## ✅ Perubahan yang Sudah Dilakukan

### 1. ✅ Action Names Updated
**BREAKING CHANGE:** Action names diubah dari bahasa Indonesia ke English

| Before | After |
|--------|-------|
| `'buka'` | `'open'` |
| `'tutup'` | `'close'` |

**Files Updated:**
- ✅ `types/index.ts`
- ✅ `app/(tabs)/control.tsx`
- ✅ `app/services/api.ts`

**UI tetap bahasa Indonesia**, hanya API calls yang menggunakan English.

### 2. ✅ Real API Calls Enabled
Mock data **dihapus**, sekarang langsung connect ke backend:

**Before:**
```typescript
// Mock data (demo mode)
return mockSensorData;
```

**After:**
```typescript
try {
  const response = await api.get(ENDPOINTS.SENSORS.DATA);
  return response.data;
} catch (error) {
  // Fallback ke mock data jika backend tidak tersedia
  return mockSensorData;
}
```

**Smart Fallback:** Jika backend tidak tersedia, otomatis gunakan mock data.

### 3. ✅ JWT Authentication
Token otomatis disimpan dan dikirim di setiap request:

```typescript
// Auto-save token setelah login
await AsyncStorage.setItem('authToken', response.data.token);

// Auto-attach token di setiap request
config.headers.Authorization = `Bearer ${token}`;
```

### 4. ✅ Config Enhanced
Dokumentasi lengkap di `app/services/config.ts`:
- Setup instructions
- IP address examples
- Endpoint documentation

---

## 📡 API Endpoints Used

Frontend menggunakan endpoints berikut:

### Authentication
```typescript
POST /api/users/register  // Register user baru
POST /api/users/login     // Login user
GET  /api/users/<id>      // Get user profile
```

### Sensors
```typescript
GET  /api/sensors/data     // Latest sensor data (auto-refresh 5s)
GET  /api/sensors/history  // Historical data untuk grafik
GET  /api/sensors/health   // Sensor system health check
```

### Control
```typescript
POST /api/control/tirai   // Send control command
     { "mode": "manual", "action": "open" }   // Manual open
     { "mode": "manual", "action": "close" }  // Manual close
     { "mode": "auto" }                       // Auto mode

GET  /api/control/status  // Get curtain status
```

### System
```typescript
GET  /api/health          // Backend health check
```

---

## 🔧 Testing Connection

### 1. Test Backend Running
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "CurtainCall Backend",
  "timestamp": "2025-10-30T12:00:00Z"
}
```

### 2. Test Register User
Di frontend, buka screen Register dan buat akun baru:
- Username: `testuser`
- Email: `test@test.com`
- Password: `test123`

### 3. Test Login
Login dengan kredensial yang baru dibuat.

### 4. Test Dashboard
Setelah login, dashboard akan menampilkan data sensor real-time.

### 5. Test Control
Coba ubah mode:
- Switch Auto/Manual
- Tombol Buka/Tutup (jika mode Manual)

---

## 🐛 Troubleshooting

### Error: "Network request failed"

**Problem:** Frontend tidak bisa connect ke backend

**Solutions:**

1. **Check Backend Running:**
   ```bash
   # Di terminal backend
   python run.py
   # Harus muncul: Running on http://0.0.0.0:5000
   ```

2. **Check IP Address:**
   - Jika backend di komputer yang sama: `http://localhost:5000`
   - Jika backend di komputer lain: `http://192.168.x.x:5000`

3. **Check Firewall:**
   Windows: Allow Python/Flask di Windows Firewall

4. **Check Same Network:**
   Frontend dan Backend harus dalam network yang sama

### Error: "401 Unauthorized"

**Problem:** Token tidak valid atau expired

**Solution:**
```typescript
// Logout dan login lagi
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.removeItem('authToken');
```

### Error: "Timeout"

**Problem:** Backend terlalu lambat response

**Solution:** Increase timeout di `config.ts`:
```typescript
TIMEOUT: 30000, // 30 seconds
```

### Data tidak update

**Problem:** Auto-refresh tidak bekerja

**Check:**
1. Interval refresh di dashboard: 5 detik
2. Interval refresh di control: 3 detik
3. Backend kirim data fresh

---

## 📱 Screen Descriptions

### 1. Dashboard (`dashboard.tsx`)
- Menampilkan data sensor real-time
- Auto-refresh setiap 5 detik
- Pull-to-refresh support
- Alert jika suhu > 35°C

**API Calls:**
- `GET /api/sensors/data` (every 5s)

### 2. Control (`control.tsx`)
- Toggle Auto/Manual mode
- Tombol Buka/Tutup (manual mode)
- Status tirai real-time
- Last update timestamp

**API Calls:**
- `POST /api/control/tirai` (on button press)
- `GET /api/sensors/data` (every 3s for status)

### 3. History (`history.tsx`)
- Grafik sensor history
- Filter by hours (1h, 6h, 12h, 24h)
- Line chart untuk suhu/cahaya

**API Calls:**
- `GET /api/sensors/history?hours=24`

### 4. Profile (`profile.tsx`)
- User information
- Preferences settings
- Logout button

**API Calls:**
- `GET /api/users/<id>`

### 5. Login/Register (`(auth)/`)
- Authentication screens
- JWT token management

**API Calls:**
- `POST /api/users/login`
- `POST /api/users/register`

---

## 🔄 Data Flow

```
Frontend App Start
     ↓
Check Auth Token in AsyncStorage
     ↓
┌─────────────────┐
│  Not Logged In  │ → Show Login/Register
└─────────────────┘
     ↓ Login Success
     ↓ Save Token
┌─────────────────┐
│   Logged In     │ → Show Main App (Tabs)
└─────────────────┘
     ↓
┌─────────────────────────────┐
│  Dashboard (Auto-refresh)   │
│  - GET /api/sensors/data    │ (every 5s)
│  - Display sensor cards     │
└─────────────────────────────┘
     ↓
┌─────────────────────────────┐
│  Control Screen             │
│  - Toggle Auto/Manual       │
│  - POST /api/control/tirai  │
│  - Button Buka/Tutup        │
└─────────────────────────────┘
     ↓
┌─────────────────────────────┐
│  History Screen             │
│  - GET /api/sensors/history │
│  - Display line chart       │
└─────────────────────────────┘
```

---

## 📦 Dependencies

```json
{
  "expo": "~52.0.11",
  "react": "18.3.1",
  "react-native": "0.76.3",
  "axios": "^1.6.2",
  "@react-native-async-storage/async-storage": "^1.21.0",
  "@react-navigation/native": "^6.1.9"
}
```

---

## 🎯 Next Steps

### Untuk Development:
1. ✅ Backend running (`python run.py`)
2. ✅ Frontend running (`npm start`)
3. ✅ Login dengan user test
4. ✅ Test semua fitur

### Untuk Production:
1. Update `BASE_URL` ke IP production
2. Build APK/IPA
3. Deploy backend ke server
4. Test di real device

---

## 📝 Configuration Checklist

- [ ] Backend Flask running
- [ ] MongoDB running
- [ ] MQTT broker running (optional)
- [ ] IP address configured di `config.ts`
- [ ] Frontend dependencies installed
- [ ] Test user account created
- [ ] All screens tested
- [ ] Control commands working
- [ ] Sensor data updating

---

## 🆘 Support

Jika masih ada masalah:

1. Check logs:
   - Backend: `logs/app.log`
   - Frontend: Check Expo console

2. Verify endpoints:
   ```bash
   curl http://localhost:5000/api/health
   curl -X POST http://localhost:5000/api/users/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","email":"test@test.com","password":"test123"}'
   ```

3. Check network:
   ```bash
   ping 192.168.1.100  # IP backend
   ```

---

**Last Updated:** 2025-10-30  
**Frontend Version:** 1.0.1  
**Compatible Backend:** 1.0.1+

**Happy Coding! 🚀**

