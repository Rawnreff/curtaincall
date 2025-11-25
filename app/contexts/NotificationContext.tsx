import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { notificationService } from '../services/notificationService';

interface NotificationContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
    decrementUnreadCount: () => void;
    setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch unread notifications count
    const refreshUnreadCount = async () => {
        try {
            const notifications = await notificationService.getNotifications();
            const count = notifications.filter((n: any) => !n.read).length;
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    // Decrement count (called when marking as read)
    const decrementUnreadCount = () => {
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    // Initial fetch and periodic refresh every 30 seconds (as backup)
    useEffect(() => {
        refreshUnreadCount();
        const interval = setInterval(refreshUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                unreadCount,
                refreshUnreadCount,
                decrementUnreadCount,
                setUnreadCount
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
