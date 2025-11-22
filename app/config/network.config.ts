import { Platform } from 'react-native';

/**
 * Network Configuration untuk CurtainCall Frontend
 * Semua konfigurasi IP address dan network settings ada di sini
 */

// ⚙️ KONFIGURASI IP ADDRESS
// Ganti dengan IP address komputer/server Anda
const BACKEND_IP = '192.168.1.5'; // IP address backend Flask
const BACKEND_PORT = 5000; // Port backend Flask
const MQTT_BROKER_IP = '192.168.1.5'; // IP address MQTT broker
const MQTT_BROKER_PORT = 1883; // Port MQTT broker

// ⚙️ FORCE PHYSICAL DEVICE MODE
// Set ke true jika menggunakan physical device (Android/iOS)
// Set ke false untuk menggunakan auto-detect (emulator/simulator)
const FORCE_PHYSICAL_DEVICE = true; // ⚙️ UBAH INI JIKA PERLU

/**
 * Get API Base URL berdasarkan platform
 */
const getBaseURL = () => {
  if (__DEV__) {
    // Jika force physical device mode, selalu gunakan custom IP
    if (FORCE_PHYSICAL_DEVICE) {
      console.log('📱 Using physical device mode with IP:', BACKEND_IP);
      return `http://${BACKEND_IP}:${BACKEND_PORT}/api`;
    }
    
    // Auto-detect berdasarkan platform
    if (Platform.OS === 'android') {
      // Android emulator menggunakan 10.0.2.2 untuk mengakses host machine
      return `http://10.0.2.2:${BACKEND_PORT}/api`;
    } else if (Platform.OS === 'ios') {
      // iOS simulator bisa pakai localhost
      return `http://localhost:${BACKEND_PORT}/api`;
    } else {
      // Web atau platform lain
      return `http://localhost:${BACKEND_PORT}/api`;
    }
  }
  // Production mode - gunakan IP yang dikonfigurasi
  return `http://${BACKEND_IP}:${BACKEND_PORT}/api`;
};

/**
 * Network Configuration
 */
export const NETWORK_CONFIG = {
  // Backend API Configuration
  BACKEND_IP,
  BACKEND_PORT,
  API_BASE_URL: getBaseURL(),
  API_TIMEOUT: 30000, // 30 detik
  
  // MQTT Broker Configuration (untuk referensi jika diperlukan di frontend)
  MQTT_BROKER_IP,
  MQTT_BROKER_PORT,
  
  // Platform info
  PLATFORM: Platform.OS,
};

/**
 * Helper function untuk mendapatkan full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = NETWORK_CONFIG.API_BASE_URL;
  // Remove leading slash jika ada
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

export default NETWORK_CONFIG;

