export interface SensorData {
  suhu: number;
  kelembapan: number;
  cahaya: number;
  posisi: string;
  status_tirai: 'Auto' | 'Manual' | 'Buka' | 'Tutup';
  timestamp: string;
}

export interface ControlCommand {
  mode: 'manual' | 'auto';
  action?: 'open' | 'close';  // Updated to match backend (was: buka/tutup)
}

export interface User {
  id: string;
  username: string;
  email: string;
  preferences?: {
    auto_mode: boolean;
    temperature_threshold: number;
    light_threshold: number;
  };
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}