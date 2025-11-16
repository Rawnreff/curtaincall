import api from './api';

export const controlService = {
  async sendControlCommand(mode: string, action: string): Promise<void> {
    await api.post('/control/tirai', { mode, action });
  },

  async getControlStatus(): Promise<any> {
    const response = await api.get('/control/status');
    return response.data;
  },
};