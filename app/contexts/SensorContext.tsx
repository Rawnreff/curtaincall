import React, { createContext, useState, useContext, useEffect } from 'react';
import { sensorService } from '../services/sensorService';
import { useAuth } from './AuthContext';

interface SensorData {
  temperature: number;
  humidity: number;
  light: number;
  position: string;
  curtain_status: string;
  timestamp: string;
}

interface SensorContextType {
  sensorData: SensorData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

export function SensorProvider({ children }: { children: React.ReactNode }) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Hanya load data jika user sudah login
    if (!authLoading && user) {
      loadSensorData();
      
      // Polling setiap 3 detik untuk data real-time
      const interval = setInterval(loadSensorData, 3000);
      
      return () => clearInterval(interval);
    } else if (!authLoading && !user) {
      // User belum login, set loading to false dan clear data
      setLoading(false);
      setSensorData(null);
      setError(null);
    }
  }, [user, authLoading]);

  const loadSensorData = async () => {
    // Skip jika user belum login
    if (!user) {
      return;
    }

    try {
      setError(null);
      const data = await sensorService.getCurrentData();
      setSensorData(data);
    } catch (err: any) {
      // Handle 401 error (unauthorized) dengan lebih baik
      if (err.response?.status === 401) {
        // User tidak authorized, mungkin token expired
        setError(null); // Jangan set error untuk 401, biarkan AuthContext handle
        setSensorData(null);
        return;
      }
      // Hanya log error untuk error selain 401
      setError('Failed to fetch sensor data');
      console.error('Sensor data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    await loadSensorData();
  };

  return (
    <SensorContext.Provider value={{ sensorData, loading, error, refreshData }}>
      {children}
    </SensorContext.Provider>
  );
}

export function useSensor() {
  const context = useContext(SensorContext);
  if (context === undefined) {
    throw new Error('useSensor must be used within a SensorProvider');
  }
  return context;
}