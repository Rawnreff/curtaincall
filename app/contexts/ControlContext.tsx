import React, { createContext, useState, useContext } from 'react';
import { controlService } from '../services/controlService';

interface ControlContextType {
  sending: boolean;
  sendCommand: (mode: string, action: string) => Promise<void>;
  lastCommand: { mode: string; action: string } | null;
}

const ControlContext = createContext<ControlContextType | undefined>(undefined);

export function ControlProvider({ children }: { children: React.ReactNode }) {
  const [sending, setSending] = useState(false);
  const [lastCommand, setLastCommand] = useState<{ mode: string; action: string } | null>(null);

  const sendCommand = async (mode: string, action: string) => {
    setSending(true);
    try {
      await controlService.sendControlCommand(mode, action);
      setLastCommand({ mode, action });
      
      // Refresh sensor data after successful command
      // Small delay to allow backend to update
      setTimeout(() => {
        // This will be handled by the component using useSensor().refreshData()
      }, 500);
    } finally {
      setSending(false);
    }
  };

  return (
    <ControlContext.Provider value={{ sending, sendCommand, lastCommand }}>
      {children}
    </ControlContext.Provider>
  );
}

export function useControl() {
  const context = useContext(ControlContext);
  if (context === undefined) {
    throw new Error('useControl must be used within a ControlProvider');
  }
  return context;
}