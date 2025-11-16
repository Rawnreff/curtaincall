export const Constants = {
  // Sensor thresholds
  TEMPERATURE_THRESHOLD: 35, // °C
  LIGHT_OPEN_THRESHOLD: 250, // lux
  LIGHT_CLOSE_THRESHOLD: 500, // lux
  
  // API endpoints (backup jika config utama gagal)
  FALLBACK_BASE_URL: 'http://localhost:5000/api',
  
  // Polling intervals
  SENSOR_POLLING_INTERVAL: 1000, // 1 detik
  NOTIFICATION_POLLING_INTERVAL: 5000, // 5 detik
  
  // App constants
  APP_NAME: 'CurtainCall',
  VERSION: '1.0.0',
};

export const Colors = {
  primary: '#667eea',
  primaryDark: '#5a6fd8',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export const CurtainStatus = {
  OPEN: 'Terbuka',
  CLOSED: 'Tertutup',
  AUTO: 'Auto',
} as const;