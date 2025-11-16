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
};