
/**
 * API Configuration for CurtainCall Frontend
 * 
 * SETUP INSTRUCTIONS:
 * 1. Jalankan backend Flask di komputer yang sama dengan frontend (localhost)
 * 2. Atau ganti BASE_URL dengan IP address komputer backend
 * 
 * CARA MENCARI IP ADDRESS:
 * - Windows: buka CMD, ketik: ipconfig (lihat IPv4 Address)
 * - Mac/Linux: buka Terminal, ketik: ifconfig (lihat inet)
 * 
 * CONTOH:
 * - Localhost (same device): http://localhost:5000
 * - LAN (different device): http://192.168.1.100:5000
 * - External IP: http://10.218.17.102:5000
 */

export const API_CONFIG = {
  // GANTI IP INI SESUAI DENGAN IP BACKEND ANDA
  BASE_URL: 'http://localhost:5000', // Default: localhost
  // BASE_URL: 'http://192.168.1.100:5000', // Contoh: LAN IP
  // BASE_URL: 'http://10.218.17.102:5000', // Contoh: External IP
  
  TIMEOUT: 10000, // 10 seconds timeout
};

export const ENDPOINTS = {
  SENSORS: {
    SAVE: '/api/sensors/save',       // ESP32 POST sensor data
    DATA: '/api/sensors/data',        // GET latest sensor data
    HISTORY: '/api/sensors/history',  // GET sensor history
    HEALTH: '/api/sensors/health',    // GET sensor system health
  },
  CONTROL: {
    TIRAI: '/api/control/tirai',     // POST control command (open/close/auto)
    STATUS: '/api/control/status',   // GET curtain status
  },
  USERS: {
    LOGIN: '/api/users/login',       // POST login
    REGISTER: '/api/users/register', // POST register
    PROFILE: '/api/users',           // GET user profile
  },
  HEALTH: '/api/health',             // GET system health
};