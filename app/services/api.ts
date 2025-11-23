import axios from 'axios';
import { Platform } from 'react-native';
import NETWORK_CONFIG from '../config/network.config';

const BASE_URL = NETWORK_CONFIG.API_BASE_URL;

console.log('🌐 API Base URL:', BASE_URL);
console.log('📱 Platform:', Platform.OS);
console.log('💡 Network Config:', {
  backendIP: NETWORK_CONFIG.BACKEND_IP,
  backendPort: NETWORK_CONFIG.BACKEND_PORT,
  mqttBroker: `${NETWORK_CONFIG.MQTT_BROKER_IP}:${NETWORK_CONFIG.MQTT_BROKER_PORT}`
});
console.log('💡 Jika menggunakan physical device, ubah IP di app/config/network.config.ts');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Token management
let authToken: string | null = null;

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

export const getToken = () => {
  return authToken;
};

export const clearToken = () => {
  authToken = null;
  delete api.defaults.headers.common['Authorization'];
};

// Request interceptor untuk menambahkan token
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

// Response interceptor untuk handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip logging untuk 401 errors (unauthorized) - normal jika user belum login
    const is401Error = error.response?.status === 401;
    const isAuthEndpoint = error.config?.url?.includes('/users/login') || 
                          error.config?.url?.includes('/users/register');
    
    // Log error untuk debugging (skip untuk 401 non-auth endpoints)
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timeout:', error.message);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('🔌 Network error - Cannot connect to server:', BASE_URL);
      console.error('💡 Troubleshooting:');
      console.error('   1. Pastikan backend Flask berjalan di port', NETWORK_CONFIG.BACKEND_PORT);
      console.error('   2. Untuk physical device, pastikan IP address benar:', NETWORK_CONFIG.BACKEND_IP);
      console.error('   3. Pastikan komputer dan device di network yang sama');
      console.error('   4. Cek firewall tidak memblokir port', NETWORK_CONFIG.BACKEND_PORT);
      console.error('   5. Test di browser: http://' + NETWORK_CONFIG.BACKEND_IP + ':' + NETWORK_CONFIG.BACKEND_PORT + '/api/users/login');
    } else if (error.response) {
      // Server responded dengan error status
      // Hanya log jika bukan 401 atau jika 401 dari auth endpoint
      if (!is401Error || isAuthEndpoint) {
        console.error('❌ Server error:', error.response.status, error.response.data);
      }
    } else if (error.request) {
      // Request dibuat tapi tidak ada response
      console.error('⚠️ No response from server:', error.message);
      console.error('💡 URL yang dicoba:', BASE_URL);
      console.error('💡 Pastikan backend berjalan dan bisa diakses');
    } else {
      console.error('❌ Request error:', error.message);
    }

    if (is401Error && !isAuthEndpoint) {
      // Token expired atau invalid untuk protected endpoints
      // Clear token tapi jangan redirect (biarkan AuthContext handle)
      clearToken();
    }
    return Promise.reject(error);
  }
);

export default api;