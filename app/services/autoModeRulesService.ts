import api from './api';

export interface AutoModeRules {
  // Control flags
  temperature_control_enabled: boolean;
  humidity_control_enabled: boolean;
  light_control_enabled: boolean;
  pir_enabled: boolean;
  
  // Thresholds
  temperature_high_threshold: number;
  humidity_high_threshold: number;
  light_open_threshold: number;
  light_close_threshold: number;
  
  // Master switch
  enabled: boolean;
}

export const autoModeRulesService = {
  async getRules(): Promise<{ rules: AutoModeRules; is_default: boolean }> {
    const response = await api.get('/auto-mode/rules');
    return response.data;
  },

  async updateRules(rules: Partial<AutoModeRules>): Promise<{ success: boolean; rules: AutoModeRules }> {
    const response = await api.put('/auto-mode/rules', rules);
    return response.data;
  },
};


