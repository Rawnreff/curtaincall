import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, AuthContextType } from '../../types';
import { userAPI } from '../_services/api';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await getStoredToken();
      if (token) {
        // Untuk demo, kita set authenticated true
        // Di production, verifikasi token dengan backend
        setIsAuthenticated(true);
        
        // Mock user data untuk demo
        setUser({
          id: '1',
          username: 'demo_user',
          email: 'user@example.com',
          preferences: {
            auto_mode: true,
            temperature_threshold: 35,
            light_threshold: 500
          }
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStoredToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  };

  const setStoredToken = async (token: string) => {
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  };

  const removeStoredToken = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Untuk demo, kita mock response
      // Di production, gunakan: const { user: userData, token } = await userAPI.login(email, password);
      const mockUser = {
        id: '1',
        username: email.split('@')[0],
        email: email,
        preferences: {
          auto_mode: true,
          temperature_threshold: 35,
          light_threshold: 500
        }
      };
      const mockToken = 'mock_jwt_token';
      
      setUser(mockUser);
      await setStoredToken(mockToken);
      setIsAuthenticated(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      Alert.alert('Login Error', errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      // Untuk demo, kita mock response
      const mockUser = {
        id: '2',
        username: userData.username,
        email: userData.email,
        preferences: {
          auto_mode: true,
          temperature_threshold: 35,
          light_threshold: 500
        }
      };
      const mockToken = 'mock_jwt_token';
      
      setUser(mockUser);
      await setStoredToken(mockToken);
      setIsAuthenticated(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      Alert.alert('Registration Error', errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    await removeStoredToken();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      loading,
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};