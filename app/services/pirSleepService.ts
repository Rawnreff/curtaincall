/**
 * PIR and Sleep Mode Service
 * Handles API calls for PIR settings and sleep mode
 */
import api from './api';

// PIR Settings Types
export interface PIRSettings {
  enabled: boolean;
  last_updated: string;
}

export interface PIRUpdateResponse {
  success: boolean;
  message: string;
  settings: PIRSettings;
}

// Sleep Mode Types
export interface SleepModeStatus {
  active: boolean;
  activated_at?: string;
  previous_settings?: {
    pir_enabled: boolean;
    auto_mode_enabled: boolean;
  };
}

export interface SleepModeResponse {
  success: boolean;
  message: string;
  curtain_closed?: boolean;
  activated_at?: string;
  restored_settings?: {
    pir_enabled: boolean;
    auto_mode_enabled: boolean;
  };
}

// PIR Settings API
export const getPIRSettings = async (): Promise<PIRSettings> => {
  try {
    console.log('📡 Fetching PIR settings...');
    const response = await api.get('/pir/settings');
    console.log('✅ PIR settings fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching PIR settings:', error.response?.data || error.message);
    throw error;
  }
};

export const updatePIRSettings = async (enabled: boolean): Promise<PIRUpdateResponse> => {
  try {
    console.log('📡 Updating PIR settings:', { enabled });
    const response = await api.put('/pir/settings', { enabled });
    console.log('✅ PIR settings updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error updating PIR settings:', error.response?.data || error.message);
    throw error;
  }
};

// Sleep Mode API
export const getSleepModeStatus = async (): Promise<SleepModeStatus> => {
  try {
    console.log('📡 Fetching sleep mode status...');
    const response = await api.get('/sleep-mode');
    console.log('✅ Sleep mode status fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching sleep mode status:', error.response?.data || error.message);
    throw error;
  }
};

export const activateSleepMode = async (): Promise<SleepModeResponse> => {
  try {
    console.log('📡 Activating sleep mode...');
    const response = await api.post('/sleep-mode/activate');
    console.log('✅ Sleep mode activated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error activating sleep mode:', error.response?.data || error.message);
    throw error;
  }
};

export const deactivateSleepMode = async (): Promise<SleepModeResponse> => {
  try {
    console.log('📡 Deactivating sleep mode...');
    const response = await api.post('/sleep-mode/deactivate');
    console.log('✅ Sleep mode deactivated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error deactivating sleep mode:', error.response?.data || error.message);
    throw error;
  }
};
