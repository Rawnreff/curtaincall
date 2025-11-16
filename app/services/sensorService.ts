import api from './api';

interface SensorData {
  suhu: number;
  kelembapan: number;
  cahaya: number;
  posisi: string;
  status_tirai: string;
  timestamp: string;
}

export const sensorService = {
  async getCurrentData(): Promise<SensorData> {
    const response = await api.get('/sensors/data');
    return response.data;
  },

  async getHistory(period: string = '24h'): Promise<SensorData[]> {
    const response = await api.get(`/sensors/history?period=${period}`);
    return response.data;
  },

  async getStats(): Promise<any> {
    const response = await api.get('/sensors/stats');
    return response.data;
  },
};