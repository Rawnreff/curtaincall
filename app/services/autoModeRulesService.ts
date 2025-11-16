import api from './api';

export interface AutoModeRules {
  light_open_threshold: number;
  light_close_threshold: number;
  temperature_threshold: number;
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


