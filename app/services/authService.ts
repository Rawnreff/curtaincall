import api, { setToken as setApiToken, clearToken } from './api';

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await api.post('/users/login', { email, password });
      const data = response.data;
      
      console.log('✅ Login successful:', data);
      
      // Set token untuk request selanjutnya
      if (data.token) {
        setApiToken(data.token);
      }
      
      return {
        user: data.user,
        token: data.token
      };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  async register(name: string, email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('📝 Registering user:', { name, email });
      const response = await api.post('/users/register', { name, email, password });
      const data = response.data;
      
      console.log('✅ Registration successful:', data);
      
      // Set token untuk request selanjutnya
      if (data.token) {
        setApiToken(data.token);
      }
      
      return {
        user: data.user,
        token: data.token
      };
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  async logout(): Promise<void> {
    clearToken();
  },

  setToken(token: string | null): void {
    setApiToken(token);
  },

  async updateProfile(name: string, email: string): Promise<{ user: any }> {
    try {
      console.log('📝 Updating profile:', { name, email });
      const response = await api.put('/users/profile', { name, email });
      console.log('✅ Profile updated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Update profile error:', error);
      throw error;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      console.log('🔐 Changing password...');
      const response = await api.put('/users/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      console.log('✅ Password changed:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Change password error:', error);
      throw error;
    }
  },
};