# ✅ Frontend-Backend Integration Checklist

Quick checklist untuk memastikan frontend dan backend terintegrasi dengan baik.

---

## 🔧 Setup (One-time)

### Backend
- [ ] Python 3.8+ installed
- [ ] MongoDB installed & running
- [ ] MQTT broker installed (optional)
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Database initialized (`python scripts/init_database.py`)
- [ ] Backend running (`python run.py`)
- [ ] Backend accessible di `http://localhost:5000` atau IP LAN

### Frontend
- [ ] Node.js 18+ installed
- [ ] Frontend dependencies installed (`npm install`)
- [ ] `config.ts` updated dengan IP backend yang benar
- [ ] Expo Go app installed di phone (jika testing di device)

---

## 🔌 Connection Setup

### 1. Cari IP Address Backend

**Windows:**
```cmd
ipconfig
```
Cari baris: `IPv4 Address. . . . . . . . . . . : 192.168.x.x`

**Mac/Linux:**
```bash
ifconfig | grep inet
```

### 2. Update Frontend Config

Edit `frontend/app/services/config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://192.168.x.x:5000', // Ganti dengan IP backend
  TIMEOUT: 10000,
};
```

**Skenario:**
- **Same device:** `http://localhost:5000`
- **Different device (same WiFi):** `http://192.168.x.x:5000`
- **External network:** `http://YOUR_PUBLIC_IP:5000` (perlu port forwarding)

### 3. Test Connection

```bash
# Test dari frontend device
curl http://192.168.x.x:5000/api/health
```

Expected:
```json
{
  "status": "healthy",
  "service": "CurtainCall Backend",
  "timestamp": "2025-10-30T..."
}
```

---

## 🧪 Testing Integration

### Test 1: Backend Health ✅
```bash
curl http://YOUR_BACKEND_IP:5000/api/health
```
- [ ] Status 200 OK
- [ ] Returns JSON dengan `status: "healthy"`

### Test 2: Register User ✅
Di frontend:
1. [ ] Buka app
2. [ ] Tap "Register"
3. [ ] Isi form (username, email, password)
4. [ ] Tap "Register"
5. [ ] Berhasil register & otomatis login
6. [ ] Token tersimpan

Atau via curl:
```bash
curl -X POST http://YOUR_BACKEND_IP:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'
```

### Test 3: Login ✅
Di frontend:
1. [ ] Logout (jika sudah login)
2. [ ] Tap "Login"
3. [ ] Isi email & password
4. [ ] Tap "Login"
5. [ ] Berhasil login
6. [ ] Redirect ke Dashboard

### Test 4: Dashboard (Sensor Data) ✅
1. [ ] Dashboard screen terbuka
2. [ ] Data sensor muncul (suhu, kelembapan, cahaya, status tirai)
3. [ ] Data update setiap 5 detik
4. [ ] Pull-to-refresh bekerja
5. [ ] "Terakhir update" timestamp berubah

**Check Console:**
```
Fetching sensor data...
Using mock data as fallback // Jika backend down
```

### Test 5: Control Screen ✅
1. [ ] Control screen terbuka
2. [ ] Status tirai muncul (Terbuka/Tertutup/Separuh)
3. [ ] Mode sistem terlihat (Otomatis/Manual)
4. [ ] Switch Auto/Manual bekerja
5. [ ] Tombol Buka/Tutup muncul saat Manual mode
6. [ ] Kirim perintah berhasil
7. [ ] Status update setelah 2 detik

**Test Commands:**
- [ ] Switch ke Manual mode
- [ ] Tap "Buka" → Alert "Perintah Buka berhasil dikirim"
- [ ] Tap "Tutup" → Alert "Perintah Tutup berhasil dikirim"
- [ ] Switch ke Auto mode → Alert "Mode Auto diaktifkan"

### Test 6: History Screen ✅
1. [ ] History screen terbuka
2. [ ] Grafik muncul (suhu & cahaya)
3. [ ] Filter hours bekerja (1h, 6h, 12h, 24h)
4. [ ] Data history fetch dari backend

### Test 7: Profile Screen ✅
1. [ ] Profile screen terbuka
2. [ ] User info muncul (username, email)
3. [ ] Preferences terlihat
4. [ ] Logout button bekerja
5. [ ] Setelah logout, redirect ke Login screen

---

## 🚨 Common Issues & Solutions

### Issue 1: "Network request failed"

**Problem:** Frontend tidak bisa connect ke backend

**Checklist:**
- [ ] Backend running? (`python run.py`)
- [ ] IP address benar di `config.ts`?
- [ ] Backend listening di `0.0.0.0` (not `127.0.0.1`)?
- [ ] Firewall allow port 5000?
- [ ] Same WiFi network?

**Test:**
```bash
# Dari device frontend
ping 192.168.x.x
curl http://192.168.x.x:5000/api/health
```

### Issue 2: "401 Unauthorized"

**Problem:** Token tidak valid

**Solution:**
```typescript
// Clear token dan login lagi
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.removeItem('authToken');
// Then login again
```

### Issue 3: Data tetap mock

**Problem:** Backend tidak return data sensor

**Check:**
1. [ ] ESP32 kirim data ke backend?
2. [ ] Backend save data ke MongoDB?
3. [ ] MongoDB running?
4. [ ] Collection `curtain_data` ada data?

**Verify:**
```bash
# Check MongoDB
mongosh
use curtaincall
db.curtain_data.find()
```

### Issue 4: Control tidak bekerja

**Problem:** Perintah dikirim tapi tirai tidak respond

**Check:**
1. [ ] Backend receive command? (check `logs/app.log`)
2. [ ] MQTT broker running?
3. [ ] ESP32 subscribe to `/curtain/control` topic?
4. [ ] ESP32 process command dari MQTT?

---

## 📊 Integration Status Dashboard

### Backend Status
- [ ] ✅ Running (`python run.py`)
- [ ] ✅ MongoDB connected
- [ ] ✅ MQTT connected
- [ ] ✅ Health endpoint OK
- [ ] ✅ API endpoints working

### Frontend Status
- [ ] ✅ Running (`npm start`)
- [ ] ✅ Config updated (IP address)
- [ ] ✅ Can reach backend
- [ ] ✅ Authentication working
- [ ] ✅ Data fetching working
- [ ] ✅ Control commands working

### ESP32 Status (Optional)
- [ ] ⚠️ Connected to WiFi
- [ ] ⚠️ Sending sensor data
- [ ] ⚠️ Receiving control commands
- [ ] ⚠️ MQTT connected

---

## 🎯 Success Criteria

Integration dianggap berhasil jika:

1. ✅ **Authentication:** Login & Register bekerja, token tersimpan
2. ✅ **Dashboard:** Data sensor muncul dan update otomatis
3. ✅ **Control:** Perintah buka/tutup/auto terkirim
4. ✅ **Real-time:** Data update setiap 3-5 detik
5. ✅ **Persistence:** Logout & login lagi, session tetap ada
6. ✅ **Error Handling:** Jika backend down, fallback ke mock data

---

## 📱 End-to-End Test Flow

### Complete User Journey:

1. **Start Backend**
   ```bash
   cd backend
   python run.py
   ```
   ✅ Backend running on http://0.0.0.0:5000

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```
   ✅ Expo running, scan QR code

3. **Register**
   - Open app
   - Tap "Register"
   - Fill form
   - Register success
   ✅ User created, auto-login

4. **View Dashboard**
   - Dashboard opens
   - Sensor cards show data
   - Data updates every 5s
   ✅ Real-time sensor monitoring

5. **Control Curtain**
   - Go to Control tab
   - Switch to Manual mode
   - Tap "Buka"
   - See success alert
   ✅ Command sent to backend

6. **View History**
   - Go to History tab
   - See line chart
   - Change filter (6h, 12h, 24h)
   ✅ Historical data visualization

7. **Logout & Login**
   - Go to Profile tab
   - Tap Logout
   - Login again with same credentials
   ✅ Session management working

---

## 🏆 Final Checklist

Before considering integration complete:

### Documentation
- [ ] Read `FRONTEND_SETUP.md`
- [ ] Read `FRONTEND_CHANGES_SUMMARY.md`
- [ ] Read `../backend/README.md`
- [ ] Read `../backend/API_REFERENCE.md`

### Configuration
- [ ] Backend IP configured correctly
- [ ] Backend accessible from frontend device
- [ ] JWT secret configured
- [ ] CORS allowed origins updated

### Testing
- [ ] All 7 integration tests passed
- [ ] No errors in backend logs
- [ ] No errors in frontend console
- [ ] Smooth user experience

### Performance
- [ ] API response < 1 second
- [ ] Dashboard refresh works smoothly
- [ ] No lag in UI
- [ ] Memory usage normal

---

## 🚀 Ready for Production?

- [ ] Backend deployed to server
- [ ] Frontend build created (APK/IPA)
- [ ] Production IP configured
- [ ] SSL/HTTPS enabled
- [ ] Database backed up
- [ ] Monitoring setup
- [ ] Error tracking enabled
- [ ] User testing completed

---

**Status Template:**

```
✅ Backend: Running
✅ Frontend: Running
✅ Connection: OK
✅ Authentication: Working
✅ Dashboard: Data updating
✅ Control: Commands working
✅ Integration: 100% Complete
```

**Last Updated:** 2025-10-30  
**Integration Version:** 1.0.1

