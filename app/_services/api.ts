import axios from 'axios';
import { API_CONFIG, ENDPOINTS } from './config';
import { SensorData, ControlCommand } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Mock data untuk demo
const mockSensorData: SensorData = {
  suhu: 28.5,
  kelembapan: 65.2,
  cahaya: 420,
  posisi: 'Terbuka',
  status_tirai: 'Auto',
  timestamp: new Date().toISOString()
};

const mockHistoryData: SensorData[] = Array.from({ length: 24 }, (_, i) => ({
  suhu: 25 + Math.random() * 10,
  kelembapan: 60 + Math.random() * 20,
  cahaya: 300 + Math.random() * 500,
  posisi: Math.random() > 0.5 ? 'Terbuka' : 'Tertutup',
  status_tirai: 'Auto',
  timestamp: new Date(Date.now() - i * 3600000).toISOString()
}));

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const sensorAPI = {
  // Ambil data sensor terbaru
  getLatestData: async (): Promise<SensorData> => {
    try {
      const response = await api.get(ENDPOINTS.SENSORS.DATA);
      return response.data;
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      console.log('Using mock data as fallback');
      // Fallback ke mock data jika backend tidak tersedia
      return {
        ...mockSensorData,
        suhu: 25 + Math.random() * 10,
        cahaya: 300 + Math.random() * 500,
        timestamp: new Date().toISOString()
      };
    }
  },

  // Ambil riwayat data sensor
  getHistory: async (hours: number = 24): Promise<SensorData[]> => {
    try {
      const response = await api.get(`${ENDPOINTS.SENSORS.HISTORY}?hours=${hours}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching history:', error);
      console.log('Using mock history data as fallback');
      return mockHistoryData;
    }
  },

  // Simpan data sensor (dipanggil oleh ESP32)
  saveData: async (data: Partial<SensorData>): Promise<void> => {
    await api.post(ENDPOINTS.SENSORS.SAVE, data);
  },
};

export const controlAPI = {
  // Kirim perintah kontrol tirai
  sendCommand: async (command: ControlCommand): Promise<void> => {
    try {
      console.log('Sending control command:', command);
      await api.post(ENDPOINTS.CONTROL.TIRAI, command);
    } catch (error) {
      console.error('Error sending command:', error);
      throw error;
    }
  },

  // Ambil status kontrol
  getStatus: async (): Promise<{ status_tirai: string; mode: string; last_update: string }> => {
    try {
      const response = await api.get(ENDPOINTS.CONTROL.STATUS);
      return response.data;
    } catch (error) {
      console.error('Error fetching status:', error);
      // Fallback ke mock status
      return {
        status_tirai: 'Auto',
        mode: 'auto',
        last_update: new Date().toISOString()
      };
    }
  },
};

export const userAPI = {
  login: async (email: string, password: string): Promise<{ user: any; token: string }> => {
    try {
      const response = await api.post(ENDPOINTS.USERS.LOGIN, { email, password });
      
      // Save token to AsyncStorage
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (userData: any): Promise<{ user: any; token: string }> => {
    try {
      const response = await api.post(ENDPOINTS.USERS.REGISTER, userData);
      
      // Save token to AsyncStorage
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  getProfile: async (userId: string): Promise<any> => {
    const response = await api.get(`${ENDPOINTS.USERS.PROFILE}/${userId}`);
    return response.data;
  },
};

export const systemAPI = {
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    try {
      const response = await api.get(ENDPOINTS.HEALTH);
      return response.data;
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  },
};

export default api;