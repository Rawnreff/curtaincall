# Web Authentication Fix

## Problem

When accessing the app on web browser, API requests to protected endpoints (like `/api/sensors/data`) returned **401 UNAUTHORIZED** error, even though the user was logged in. This issue didn't occur on Expo Go (mobile).

### Error Message
```
GET http://192.168.1.5:5000/api/sensors/data 401 (UNAUTHORIZED)
```

## Root Cause

The issue was caused by **token not being properly restored and set to the API service** when the web app loads. Here's what was happening:

1. User logs in → Token saved to AsyncStorage ✅
2. User refreshes page → Token loaded from AsyncStorage ✅
3. **BUT**: Token was NOT set to axios instance ❌
4. API requests made without Authorization header → 401 error ❌

### Why it worked on Expo Go but not Web?

- **Expo Go (Mobile)**: App stays in memory, token remains in axios instance
- **Web**: Page refresh clears memory, axios instance loses token

## Solution

### 1. Enhanced Token Restoration

**File**: `frontend/app/contexts/AuthContext.tsx`

Added proper token restoration with logging:

```typescript
const loadStoredAuth = async () => {
  try {
    console.log('🔄 Loading stored auth...');
    const storedToken = await storage.getItem('auth_token');
    const storedUser = await storage.getItem('user_data');
    
    console.log('📦 Stored token exists:', !!storedToken);
    console.log('📦 Stored user exists:', !!storedUser);
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // IMPORTANT: Set token to API service immediately
      authService.setToken(storedToken);
      console.log('✅ Auth restored from storage');
    }
  } catch (error) {
    console.error('❌ Failed to load stored auth:', error);
  } finally {
    setLoading(false);
  }
};
```

**Key Fix**: Added `authService.setToken(storedToken)` to ensure token is set to axios instance.

### 2. Improved Web Storage

**File**: `frontend/app/contexts/AuthContext.tsx`

Changed from AsyncStorage to **localStorage** for web platform:

```typescript
const storage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use localStorage directly for web for better reliability
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } else {
      // Use SecureStore for native platforms
      await SecureStore.setItemAsync(key, value);
    }
  },
  
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};
```

**Benefits**:
- ✅ More reliable on web (native browser API)
- ✅ Synchronous access (no async issues)
- ✅ Better debugging with browser DevTools

### 3. Enhanced Logging

**File**: `frontend/app/services/api.ts`

Added comprehensive logging to track token attachment:

```typescript
export const setToken = (token: string | null) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('✅ Token set in API service:', token.substring(0, 20) + '...');
  } else {
    delete api.defaults.headers.common['Authorization'];
    console.log('🔓 Token cleared from API service');
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
      console.log('🔑 Token attached to request:', config.url);
    } else {
      console.log('⚠️ No token available for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

## Testing

### Before Fix
```
1. Login on web ✅
2. Refresh page
3. API request → 401 UNAUTHORIZED ❌
4. Console: "⚠️ No token available for request: /api/sensors/data"
```

### After Fix
```
1. Login on web ✅
2. Refresh page
3. Console logs:
   - "🔄 Loading stored auth..."
   - "📦 Stored token exists: true"
   - "📦 Stored user exists: true"
   - "✅ Token set in API service: eyJhbGciOiJIUzI1NiIs..."
   - "✅ Auth restored from storage"
4. API request → 200 OK ✅
5. Console: "🔑 Token attached to request: /api/sensors/data"
```

## Debugging

### Check Token in Browser

**Chrome DevTools**:
1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **Local Storage**
4. Check for `auth_token` and `user_data`

**Console**:
```javascript
// Check if token exists
localStorage.getItem('auth_token')

// Check if token is set in API
// (Look for console logs when making requests)
```

### Console Logs to Watch

✅ **Success Flow**:
```
🔄 Loading stored auth...
📦 Stored token exists: true
📦 Stored user exists: true
✅ Token set in API service: eyJhbGci...
✅ Auth restored from storage
🔑 Token attached to request: /api/sensors/data
```

❌ **Failure Flow**:
```
🔄 Loading stored auth...
📦 Stored token exists: false
⚠️ No stored auth found
⚠️ No token available for request: /api/sensors/data
```

## Platform Differences

| Feature | Web | iOS/Android |
|---------|-----|-------------|
| Storage | localStorage | SecureStore |
| Token Persistence | Survives page refresh | Survives app restart |
| Debugging | Browser DevTools | React Native Debugger |
| Security | Browser storage | Encrypted keychain |

## Common Issues

### Issue 1: Token not persisting after refresh

**Solution**: Check browser localStorage in DevTools

### Issue 2: 401 errors after login

**Solution**: Check console for "Token set in API service" log

### Issue 3: Token exists but still 401

**Solution**: Token might be expired, try logging in again

## Security Notes

### Web (localStorage)
- ✅ Accessible via JavaScript
- ⚠️ Vulnerable to XSS attacks
- 💡 Use HTTPS in production
- 💡 Implement token expiration

### Mobile (SecureStore)
- ✅ Encrypted storage
- ✅ Protected by OS keychain
- ✅ More secure than web

## Future Improvements

1. **Token Refresh**: Implement automatic token refresh before expiration
2. **Secure Cookies**: Consider using httpOnly cookies for web
3. **Token Expiration**: Add expiration check before API calls
4. **Logout on 401**: Automatically logout user on token expiration
5. **Session Management**: Implement proper session timeout

## Related Files

- `frontend/app/contexts/AuthContext.tsx` - Authentication state management
- `frontend/app/services/api.ts` - Axios instance and interceptors
- `frontend/app/services/authService.ts` - Authentication API calls
- `frontend/app/config/network.config.ts` - API endpoint configuration

## Summary

The fix ensures that:
1. ✅ Token is properly saved to localStorage on web
2. ✅ Token is restored from storage on app load
3. ✅ Token is immediately set to axios instance
4. ✅ All API requests include Authorization header
5. ✅ Comprehensive logging for debugging

Now the web app works exactly like the mobile app! 🎉
