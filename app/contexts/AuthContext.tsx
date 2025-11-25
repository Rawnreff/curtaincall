import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { router } from 'expo-router';

// Helper functions untuk storage dengan fallback
const storage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage directly for web for better reliability
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          console.log(`💾 Stored ${key} in localStorage`);
        } else {
          // Fallback to AsyncStorage
          await AsyncStorage.setItem(key, value);
          console.log(`💾 Stored ${key} in AsyncStorage`);
        }
      } else {
        // Gunakan SecureStore untuk native platforms
        await SecureStore.setItemAsync(key, value);
        console.log(`💾 Stored ${key} in SecureStore`);
      }
    } catch (error) {
      console.error(`❌ Error storing ${key}:`, error);
      // Fallback ke AsyncStorage jika SecureStore gagal
      await AsyncStorage.setItem(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage directly for web
        if (typeof window !== 'undefined' && window.localStorage) {
          const value = window.localStorage.getItem(key);
          console.log(`📖 Retrieved ${key} from localStorage:`, !!value);
          return value;
        } else {
          // Fallback to AsyncStorage
          const value = await AsyncStorage.getItem(key);
          console.log(`📖 Retrieved ${key} from AsyncStorage:`, !!value);
          return value;
        }
      } else {
        const value = await SecureStore.getItemAsync(key);
        console.log(`📖 Retrieved ${key} from SecureStore:`, !!value);
        return value;
      }
    } catch (error) {
      console.error(`❌ Error retrieving ${key}:`, error);
      // Fallback ke AsyncStorage
      return await AsyncStorage.getItem(key);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage directly for web
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          console.log(`🗑️ Removed ${key} from localStorage`);
        } else {
          // Fallback to AsyncStorage
          await AsyncStorage.removeItem(key);
          console.log(`🗑️ Removed ${key} from AsyncStorage`);
        }
      } else {
        await SecureStore.deleteItemAsync(key);
        console.log(`🗑️ Removed ${key} from SecureStore`);
      }
    } catch (error) {
      console.error(`❌ Error removing ${key}:`, error);
      // Fallback ke AsyncStorage
      await AsyncStorage.removeItem(key);
    }
  },
};

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      console.log('🔄 Loading stored auth...');
      const storedToken = await storage.getItem('auth_token');
      const storedUser = await storage.getItem('user_data');
      
      console.log('📦 Stored token exists:', !!storedToken);
      console.log('📦 Stored user exists:', !!storedUser);
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // IMPORTANT: Set token to API service immediately
        authService.setToken(storedToken);
        console.log('✅ Auth restored from storage');
      } else {
        console.log('⚠️ No stored auth found');
      }
    } catch (error) {
      console.error('❌ Failed to load stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    
    setUser(response.user);
    setToken(response.token);
    
    await storage.setItem('auth_token', response.token);
    await storage.setItem('user_data', JSON.stringify(response.user));
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authService.register(name, email, password);
    
    setUser(response.user);
    setToken(response.token);
    
    await storage.setItem('auth_token', response.token);
    await storage.setItem('user_data', JSON.stringify(response.user));
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    
    await storage.removeItem('auth_token');
    await storage.removeItem('user_data');
    
    authService.logout();
    router.replace('/login');
  };

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    await storage.setItem('user_data', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}