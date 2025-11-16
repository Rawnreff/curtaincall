import api from './api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get('/notifications');
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    console.log('📤 Calling markAsRead API:', `/notifications/${notificationId}/read`);
    const response = await api.patch(`/notifications/${notificationId}/read`);
    console.log('📥 MarkAsRead response:', response.data);
    return response.data;
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },
};