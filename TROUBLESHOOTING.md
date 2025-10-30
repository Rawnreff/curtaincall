# 🔧 Troubleshooting Guide

Quick fixes untuk masalah umum.

---

## ❌ Dashboard Tidak Muncul

### Symptoms:
- Halaman blank/putih
- Console menampilkan warnings tapi tidak ada errors
- App tidak crash tapi tidak render

### Solutions:

#### 1. Clear Cache & Restart (MOST EFFECTIVE)

**Windows (PowerShell):**
```powershell
cd frontend

# Stop server (Ctrl+C)

# Clear cache
Remove-Item -Recurse -Force .expo
Remove-Item -Recurse -Force node_modules\.cache

# Restart with cache clear
npm start -- --clear
```

**Or simply:**
```powershell
npx expo start --clear
```

#### 2. Hard Refresh Browser

**Chrome/Edge:**
```
Ctrl + Shift + R  (Windows)
Cmd + Shift + R   (Mac)
```

**Or:**
```
F12 → Right click refresh button → Empty Cache and Hard Reload
```

#### 3. Check Console for ERRORS (not warnings)

Open DevTools (F12) → Console tab

**Look for RED errors:**
- ❌ SyntaxError
- ❌ ReferenceError
- ❌ TypeError
- ❌ Cannot find module

**Ignore YELLOW warnings:**
- ⚠️ shadow* deprecated (safe to ignore)
- ⚠️ Route missing export (safe to ignore)
- ⚠️ Image resizeMode (safe to ignore)

#### 4. Verify File Saved

Make sure `dashboard.tsx` is saved:
- Check file indicator in VS Code (white dot = unsaved)
- Press `Ctrl+S` to save
- Check terminal if Expo detected changes

#### 5. Check Browser Tab

Sometimes browser tab needs refresh:
- Close tab completely
- Reopen: http://localhost:19006
- Or use: http://localhost:8081

#### 6. Reinstall Dependencies (if needed)

```bash
cd frontend
rm -rf node_modules
npm install
npm start
```

---

## ⚠️ Warnings vs Errors

### Warnings (Yellow) - Safe to Ignore:
```
⚠️ "shadow*" style props are deprecated
⚠️ Route "./contexts/AuthContext.tsx" missing export
⚠️ Route "./services/config.ts" missing export
⚠️ Image: style.resizeMode is deprecated
```
**Action:** None needed. App will work fine.

### Errors (Red) - Must Fix:
```
❌ SyntaxError: Unexpected token
❌ Module not found: Can't resolve
❌ TypeError: Cannot read property
```
**Action:** Fix the error immediately.

---

## 🔄 Complete Reset Procedure

If nothing works, do complete reset:

```bash
# 1. Stop server (Ctrl+C)

# 2. Clean everything
cd frontend
rm -rf node_modules
rm -rf .expo
rm -rf .expo-shared

# 3. Clear npm cache
npm cache clean --force

# 4. Reinstall
npm install

# 5. Start fresh
npm start -- --clear
```

---

## 🌐 Web-Specific Issues

### White Screen on Web:

1. **Check URL:**
   - Should be: http://localhost:8081
   - Or: http://localhost:19006

2. **Check Browser Console:**
   - F12 → Console
   - Look for RED errors

3. **Try Different Browser:**
   - Chrome
   - Firefox
   - Edge

4. **Disable Browser Extensions:**
   - Ad blockers
   - Privacy extensions
   - May interfere with dev server

---

## 📱 Mobile-Specific Issues

### Expo Go App:

1. **Same Network:**
   - Phone and computer must be on same WiFi
   - Check WiFi name on both devices

2. **Scan QR Again:**
   - Sometimes QR becomes stale
   - Stop server, restart, scan new QR

3. **Clear Expo Go Cache:**
   - Shake phone
   - "Reload"
   - Or "Go to Home"

---

## 🔍 Debugging Steps

### Step 1: Check Terminal
```
Looking for:
✓ Metro bundler started
✓ Expo DevTools running at http://localhost:8081
✓ Logs from connected devices

NOT looking for:
❌ Error: Cannot find module
❌ SyntaxError
❌ Failed to compile
```

### Step 2: Check Browser
```
F12 → Console

Looking for:
✓ [HMR] bundle built
✓ Component logs (if any)

NOT looking for:
❌ Failed to compile
❌ Module not found
❌ Syntax errors
```

### Step 3: Check Network
```
F12 → Network tab

Looking for:
✓ bundle.js loaded (200 OK)
✓ assets loaded
✓ No 404 errors
```

---

## ✅ Quick Checklist

Dashboard not showing? Check:

- [ ] Server is running (npm start)
- [ ] URL correct (localhost:8081 or 19006)
- [ ] Browser console - no RED errors
- [ ] File saved (Ctrl+S)
- [ ] Cache cleared (npm start -- --clear)
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Different browser tried
- [ ] Dependencies installed (npm install)

---

## 💡 Pro Tips

### 1. Use --clear Flag
```bash
npm start -- --clear
```
Clears cache on every start. Slower but more reliable.

### 2. Check File Watcher
Sometimes file changes not detected:
```bash
# Increase file watch limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 3. Use Tunnel (if network issues)
```bash
npm start -- --tunnel
```
Creates public URL, useful for testing.

---

## 🆘 Still Not Working?

### Last Resort:

1. **Create New Expo Project:**
```bash
npx create-expo-app test-app
cd test-app
npm start
```

If this works → Problem with your project  
If this fails → Problem with environment

2. **Check Expo Doctor:**
```bash
npx expo-doctor
```

3. **Update Expo CLI:**
```bash
npm install -g expo-cli@latest
```

---

## 📞 Getting Help

If still stuck, provide:
1. ✅ Operating System (Windows/Mac/Linux)
2. ✅ Node version: `node --version`
3. ✅ npm version: `npm --version`
4. ✅ Expo version: Check package.json
5. ✅ Full error message (RED text)
6. ✅ Terminal output
7. ✅ Browser console screenshot

---

**Last Updated:** 2025-10-30

