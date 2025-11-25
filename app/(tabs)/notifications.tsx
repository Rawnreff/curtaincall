import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { notificationService } from '../services/notificationService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../contexts/NotificationContext';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get notification context methods
  const { refreshUnreadCount, decrementUnreadCount } = useNotifications();

  useEffect(() => {
    loadNotifications();
  }, []);

  // Reload notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
      refreshUnreadCount(); // Refresh badge count when tab is focused
    }, [])
  );

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      console.log('📋 Loaded notifications:', data.length);
      if (data.length > 0) {
        const sample = data[0] as any;
        console.log('📋 Sample notification:', {
          id: sample.id,
          _id: sample._id,
          read: sample.read,
          title: sample.title
        });
      }
      setNotifications(data);
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification: any) => {
    // Show detail modal
    setSelectedNotification(notification);
    setShowDetailModal(true);

    // Mark as read if unread
    const notificationId = notification.id || notification._id;
    if (!notification.read && notificationId) {
      try {
        console.log('📬 Marking notification as read:', notificationId);

        // Immediately decrement badge count for instant feedback
        decrementUnreadCount();

        // Update local state immediately
        setNotifications(prev =>
          prev.map(n =>
            (n.id === notificationId || n._id === notificationId)
              ? { ...n, read: true }
              : n
          )
        );

        // Send API request in background
        await notificationService.markAsRead(notificationId);
        console.log('✅ Notification marked as read successfully');

      } catch (error: any) {
        console.error('❌ Failed to mark notification as read:', error);
        // Refresh to sync state if API call failed
        refreshUnreadCount();
      }
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedNotification(null);
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadNotifications();
      // Refresh badge count after marking all as read
      await refreshUnreadCount();
    } catch (error: any) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const getNotificationGradient = (type: string): [string, string] => {
    switch (type) {
      case 'temperature_high': return ['#fa709a', '#fee140'];
      case 'motor_error': return ['#f093fb', '#f5576c'];
      case 'auto_mode': return ['#4facfe', '#00f2fe'];
      case 'auto_mode_control': return ['#4facfe', '#00f2fe'];
      case 'auto_mode_settings': return ['#4facfe', '#00f2fe'];
      case 'manual_control': return ['#10b981', '#059669'];
      case 'voice_control': return ['#667eea', '#764ba2'];
      case 'voice_control_error': return ['#f5576c', '#f093fb'];
      case 'pir_motion': return ['#FFA726', '#FF7043'];
      case 'pir_settings': return ['#FFA726', '#FF7043'];
      case 'sleep_mode': return ['#6366f1', '#4f46e5'];
      case 'sleep_mode_activated': return ['#6366f1', '#4f46e5'];
      case 'sleep_mode_deactivated': return ['#10b981', '#059669'];
      default: return ['#667eea', '#764ba2'];
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'temperature_high': return 'thermometer';
      case 'motor_error': return 'construct';
      case 'auto_mode': return 'flash';
      case 'auto_mode_control': return 'power';
      case 'auto_mode_settings': return 'settings';
      case 'manual_control': return 'hand-left';
      case 'voice_control': return 'mic';
      case 'voice_control_error': return 'mic-off';
      case 'pir_motion': return 'walk';
      case 'pir_settings': return 'walk';
      case 'sleep_mode': return 'moon';
      case 'sleep_mode_activated': return 'moon';
      case 'sleep_mode_deactivated': return 'moon-outline';
      default: return 'information-circle';
    }
  };

  const NotificationItem = ({ item }: any) => {
    const isUnread = !item.read;

    return (
      <TouchableOpacity
        style={[styles.notificationItem, isUnread && styles.notificationItemUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationIconContainer}>
          <LinearGradient
            colors={getNotificationGradient(item.type)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.notificationIconGradient}
          >
            <Ionicons
              name={getNotificationIcon(item.type)}
              size={24}
              color="#FFFFFF"
            />
          </LinearGradient>
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, isUnread && styles.notificationTitleUnread]}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <View style={styles.notificationFooter}>
            <Ionicons name="time-outline" size={14} color="#B0B8C5" />
            <Text style={styles.notificationTime}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#B0B8C5" />
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#667eea"
            colors={['#667eea']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Alerts</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {notifications.length > 0 && unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.markAllGradient}
              >
                <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                <Text style={styles.markAllText}>Mark All</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.subtitle}>System notifications and warnings</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loadingGradient}
              >
                <Ionicons name="notifications" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIconGradient}
              >
                <Ionicons name="checkmark-circle" size={64} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>
              No notifications at the moment. We'll notify you when something important happens.
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification, index) => (
              <NotificationItem key={index} item={notification} />
            ))}
          </View>
        )}

        {/* Alert Types Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#667eea" />
            <Text style={styles.infoTitle}>Alert Types</Text>
          </View>

          <View style={styles.alertTypesList}>
            <View style={styles.alertTypeItem}>
              <View style={styles.alertTypeIconContainer}>
                <LinearGradient
                  colors={['#fa709a', '#fee140']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.alertTypeIconGradient}
                >
                  <Ionicons name="thermometer" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.alertTypeContent}>
                <Text style={styles.alertTypeTitle}>High Temperature</Text>
                <Text style={styles.alertTypeDesc}>Temperature above threshold</Text>
              </View>
            </View>

            <View style={styles.alertTypeItem}>
              <View style={styles.alertTypeIconContainer}>
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.alertTypeIconGradient}
                >
                  <Ionicons name="flash" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.alertTypeContent}>
                <Text style={styles.alertTypeTitle}>Auto Mode Action</Text>
                <Text style={styles.alertTypeDesc}>Automatic curtain adjustments</Text>
              </View>
            </View>

            <View style={styles.alertTypeItem}>
              <View style={styles.alertTypeIconContainer}>
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.alertTypeIconGradient}
                >
                  <Ionicons name="power" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.alertTypeContent}>
                <Text style={styles.alertTypeTitle}>Auto Mode Control</Text>
                <Text style={styles.alertTypeDesc}>Auto mode enabled/disabled</Text>
              </View>
            </View>

            <View style={styles.alertTypeItem}>
              <View style={styles.alertTypeIconContainer}>
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.alertTypeIconGradient}
                >
                  <Ionicons name="settings" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.alertTypeContent}>
                <Text style={styles.alertTypeTitle}>Auto Mode Settings</Text>
                <Text style={styles.alertTypeDesc}>Threshold settings updated</Text>
              </View>
            </View>

            <View style={styles.alertTypeItem}>
              <View style={styles.alertTypeIconContainer}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.alertTypeIconGradient}
                >
                  <Ionicons name="hand-left" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.alertTypeContent}>
                <Text style={styles.alertTypeTitle}>Manual Control</Text>
                <Text style={styles.alertTypeDesc}>User-initiated actions</Text>
              </View>
            </View>

            <View style={styles.alertTypeItem}>
              <View style={styles.alertTypeIconContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.alertTypeIconGradient}
                >
                  <Ionicons name="mic" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.alertTypeContent}>
                <Text style={styles.alertTypeTitle}>Voice Control</Text>
                <Text style={styles.alertTypeDesc}>Voice command executed</Text>
              </View>
            </View>

            <View style={styles.alertTypeItem}>
              <View style={styles.alertTypeIconContainer}>
                <LinearGradient
                  colors={['#f5576c', '#f093fb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.alertTypeIconGradient}
                >
                  <Ionicons name="mic-off" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.alertTypeContent}>
                <Text style={styles.alertTypeTitle}>Voice Control Error</Text>
                <Text style={styles.alertTypeDesc}>Voice command failed</Text>
              </View>
            </View>

            <View style={styles.alertTypeItem}>
              <View style={styles.alertTypeIconContainer}>
                <LinearGradient
                  colors={['#FFA726', '#FF7043']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.alertTypeIconGradient}
                >
                  <Ionicons name="walk" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.alertTypeContent}>
                <Text style={styles.alertTypeTitle}>Motion Detection</Text>
                <Text style={styles.alertTypeDesc}>Motion detection enabled/disabled/triggered</Text>
              </View>
            </View>

            <View style={styles.alertTypeItem}>
              <View style={styles.alertTypeIconContainer}>
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.alertTypeIconGradient}
                >
                  <Ionicons name="construct" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.alertTypeContent}>
                <Text style={styles.alertTypeTitle}>Motor Error</Text>
                <Text style={styles.alertTypeDesc}>Mechanical issues detected</Text>
              </View>
            </View>

            <View style={styles.alertTypeItem}>
              <View style={styles.alertTypeIconContainer}>
                <LinearGradient
                  colors={['#6366f1', '#4f46e5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.alertTypeIconGradient}
                >
                  <Ionicons name="moon" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.alertTypeContent}>
                <Text style={styles.alertTypeTitle}>Sleep Mode</Text>
                <Text style={styles.alertTypeDesc}>Sleep mode activated/deactivated</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="fade"
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedNotification && (
              <>
                {/* Icon */}
                <View style={styles.modalIconContainer}>
                  <LinearGradient
                    colors={getNotificationGradient(selectedNotification.type)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalIconGradient}
                  >
                    <Ionicons
                      name={getNotificationIcon(selectedNotification.type)}
                      size={48}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                </View>

                {/* Title */}
                <Text style={styles.modalTitle}>{selectedNotification.title}</Text>

                {/* Message */}
                <Text style={styles.modalMessage}>{selectedNotification.message}</Text>

                {/* Timestamp */}
                <View style={styles.modalTimestamp}>
                  <Ionicons name="time-outline" size={16} color="#8F9BB3" />
                  <Text style={styles.modalTime}>
                    {new Date(selectedNotification.timestamp).toLocaleString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>

                {/* Type Badge */}
                <View style={styles.modalTypeBadge}>
                  <Text style={styles.modalTypeText}>
                    {selectedNotification.type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closeDetailModal}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalCloseGradient}
                  >
                    <Text style={styles.modalCloseText}>Close</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2E3A59',
    letterSpacing: -1,
  },
  unreadBadge: {
    backgroundColor: '#FF5252',
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  unreadBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  markAllButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  markAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#8F9BB3',
    fontWeight: '500',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8F9BB3',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2E3A59',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 15,
    color: '#8F9BB3',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 40,
  },
  notificationsList: {
    paddingHorizontal: 20,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  notificationItemUnread: {
    backgroundColor: '#F0F4FF',
    borderWidth: 2,
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  notificationIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E3A59',
    letterSpacing: -0.2,
  },
  notificationTitleUnread: {
    fontWeight: '800',
    color: '#1A1A1A',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#8F9BB3',
    marginBottom: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#B0B8C5',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E3A59',
    letterSpacing: -0.3,
  },
  alertTypesList: {
    gap: 4,
  },
  alertTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  alertTypeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 14,
  },
  alertTypeIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTypeContent: {
    flex: 1,
  },
  alertTypeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E3A59',
    marginBottom: 3,
  },
  alertTypeDesc: {
    fontSize: 13,
    color: '#8F9BB3',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
  },
  modalIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2E3A59',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  modalMessage: {
    fontSize: 16,
    color: '#8F9BB3',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '500',
  },
  modalTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  modalTime: {
    fontSize: 13,
    color: '#8F9BB3',
    fontWeight: '600',
  },
  modalTypeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    marginBottom: 24,
  },
  modalTypeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#667eea',
    letterSpacing: 1,
  },
  modalCloseButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  modalCloseGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});