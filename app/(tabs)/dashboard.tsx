import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useSensor } from '../contexts/SensorContext';
import { useControl } from '../contexts/ControlContext';
import { getSleepModeStatus, deactivateSleepMode } from '../services/pirSleepService';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { sensorData, loading, refreshData } = useSensor();
  const { sendCommand } = useControl();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = new Animated.Value(1);
  const [quickCloseLoading, setQuickCloseLoading] = useState(false);
  const [quickOpenLoading, setQuickOpenLoading] = useState(false);
  const [sleepModeActive, setSleepModeActive] = useState(false);

  useEffect(() => {
    // Set initial fade animation only once on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load sleep mode status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSleepModeStatus();
    }, [])
  );

  const loadSleepModeStatus = async () => {
    try {
      const status = await getSleepModeStatus();
      setSleepModeActive(status.active);
      console.log('📊 Dashboard: Sleep mode status loaded:', status.active);
    } catch (error) {
      console.error('Error loading sleep mode status:', error);
    }
  };

  const handleQuickClose = async () => {
    if (sleepModeActive) {
      Alert.alert('Sleep Mode Active', 'Cannot control curtain while sleep mode is active');
      return;
    }

    if (sensorData?.position === 'Close') {
      Alert.alert('Info', 'Curtain is already closed');
      return;
    }

    setQuickCloseLoading(true);
    try {
      await sendCommand('manual', 'close');

      // Refresh data after successful command
      setTimeout(() => {
        refreshData();
      }, 1000);

      Alert.alert(
        '✅ Success',
        'Curtain closing command sent',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      Alert.alert(
        '❌ Error',
        error.response?.data?.error || 'Failed to send close command',
        [{ text: 'OK', style: 'cancel' }]
      );
    } finally {
      setQuickCloseLoading(false);
    }
  };

  const handleDeactivateSleepMode = async () => {
    setQuickOpenLoading(true);
    try {
      const response = await deactivateSleepMode();
      setSleepModeActive(false);

      // Refresh data after deactivating sleep mode
      setTimeout(() => {
        refreshData();
        loadSleepModeStatus();
      }, 1000);

      Alert.alert(
        '✅ Sleep Mode Deactivated',
        response.message || 'Sleep mode has been turned off',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      Alert.alert(
        '❌ Error',
        error.response?.data?.message || 'Failed to deactivate sleep mode',
        [{ text: 'OK', style: 'cancel' }]
      );
    } finally {
      setQuickOpenLoading(false);
    }
  };

  const handleQuickOpen = async () => {
    if (sensorData?.position === 'Open') {
      Alert.alert('Info', 'Curtain is already open');
      return;
    }

    setQuickOpenLoading(true);
    try {
      await sendCommand('manual', 'open');

      // Refresh data after successful command
      setTimeout(() => {
        refreshData();
      }, 1000);

      Alert.alert(
        '✅ Success',
        'Curtain opening command sent',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      Alert.alert(
        '❌ Error',
        error.response?.data?.error || 'Failed to send open command',
        [{ text: 'OK', style: 'cancel' }]
      );
    } finally {
      setQuickOpenLoading(false);
    }
  };

  const handleSettings = () => {
    router.push('/(tabs)/control');
  };

  const StatusCard = ({ title, value, unit, icon, colors, trend }: any) => (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.cardContainer}>
        {/* Gradient Border Effect */}
        <LinearGradient
          colors={colors || ['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorderGradient}
        >
          {/* Inner Card with Glassmorphism */}
          <View style={styles.cardInner}>
            {/* Background Glow */}
            <View style={styles.cardGlow} />
            
            {/* Icon Badge */}
            <View style={styles.cardIconBadge}>
              <LinearGradient
                colors={[...colors].reverse()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconBadgeGradient}
              >
                <Text style={styles.cardIconText}>{icon}</Text>
              </LinearGradient>
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{title}</Text>
                {trend && (
                  <View style={styles.trendBadge}>
                    <Text style={styles.trendText}>{trend}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.cardValueContainer}>
                <Text style={styles.cardValue}>{value}</Text>
                {unit && <Text style={styles.cardUnit}>{unit}</Text>}
              </View>

              {/* Decorative Line */}
              <LinearGradient
                colors={[...colors, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardDecorativeLine}
              />
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleRefresh = () => {
    refreshData();
    loadSleepModeStatus();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 20 }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={handleRefresh}
          tintColor="#667eea"
          colors={['#667eea']}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section - Enhanced Modern Design */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          {/* Decorative Background Elements */}
          <View style={styles.heroDecorativeCircle1} />
          <View style={styles.heroDecorativeCircle2} />
          
          {/* Content */}
          <View style={styles.heroContent}>
            <View style={styles.heroGreetingContainer}>
              <View style={styles.heroGreetingBadge}>
                <Text style={styles.heroGreeting}>{getGreeting()}</Text>
              </View>
              <Text style={styles.heroTime}>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            
            <Text style={styles.heroTitle}>Smart Curtain{'\n'}Control</Text>
            
            <View style={styles.heroSubtitleContainer}>
              <View style={styles.heroIconBadge}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.heroSubtitle}>Everything at your fingertips</Text>
            </View>
          </View>


        </LinearGradient>
      </View>

      {/* Main Status Card */}
      <View style={styles.mainStatusCard}>
        <View style={styles.mainStatusHeader}>
          <View>
            <Text style={styles.mainStatusLabel}>Curtain Status</Text>
            <Text style={styles.mainStatusValue}>
              {sensorData?.position || 'Loading...'}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            sleepModeActive && { backgroundColor: '#ede9fe' }
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: sleepModeActive ? '#6366f1' : sensorData?.position === 'Open' ? '#4CAF50' : '#FF9800' }
            ]} />
            <Text style={[
              styles.statusBadgeText,
              sleepModeActive && { color: '#6366f1' }
            ]}>
              {sleepModeActive ? 'Sleep Mode' : sensorData?.curtain_status || 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={
                sensorData?.position === 'Open'
                  ? ['#10b981', '#059669']  // Green when open
                  : ['#f5576c', '#f093fb']  // Red when closed
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: sensorData?.position === 'Open' ? '100%' : '10%' }  // 10% when closed
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {sensorData?.position === 'Open' ? '100% Open' : 'Curtain Closed'}
          </Text>
        </View>

        <View style={styles.quickActions}>
          {sensorData?.position === 'Open' ? (
            <TouchableOpacity
              style={styles.quickActionButtonClose}
              onPress={handleQuickClose}
              disabled={quickCloseLoading || sleepModeActive}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  (quickCloseLoading || sleepModeActive)
                    ? ['#E0E0E0', '#BDBDBD']  // Gray when disabled
                    : ['#FF9800', '#F57C00']  // Orange when enabled
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionButtonGradient}
              >
                {quickCloseLoading ? (
                  <>
                    <Ionicons name="hourglass" size={18} color="#FFFFFF" />
                    <Text style={styles.quickActionText}>Closing...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.quickActionText}>Close</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : sleepModeActive ? (
            <TouchableOpacity
              style={styles.quickActionButtonOpenSleep}
              onPress={handleDeactivateSleepMode}
              disabled={quickOpenLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366f1', '#4f46e5']}  // Purple for sleep mode deactivate
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionButtonGradient}
              >
                {quickOpenLoading ? (
                  <>
                    <Ionicons name="hourglass" size={18} color="#FFFFFF" />
                    <Text style={styles.quickActionText}>Turning Off...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="moon-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.quickActionText}>Wake Up</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.quickActionButtonOpen}
              onPress={handleQuickOpen}
              disabled={quickOpenLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}  // Green when enabled
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionButtonGradient}
              >
                {quickOpenLoading ? (
                  <>
                    <Ionicons name="hourglass" size={18} color="#FFFFFF" />
                    <Text style={styles.quickActionText}>Opening...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="arrow-up-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.quickActionText}>Open</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.quickActionButtonSecondary}
            onPress={handleSettings}
            activeOpacity={0.8}
          >
            <Ionicons name="construct" size={18} color="#667eea" />
            <Text style={styles.quickActionTextSecondary}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sensor Grid */}
      <View style={styles.sensorGrid}>
        <StatusCard
          title="Temperature"
          value={sensorData?.temperature || '--'}
          unit="°C"
          icon="🌡️"
          colors={['#667eea', '#764ba2']}
        />
        <StatusCard
          title="Humidity"
          value={sensorData?.humidity || '--'}
          unit="%"
          icon="💧"
          colors={['#f093fb', '#f5576c']}
        />
        <StatusCard
          title="Light"
          value={sensorData?.light || '--'}
          unit="lux"
          icon="💡"
          colors={['#4facfe', '#00f2fe']}
        />
        <StatusCard
          title="Mode"
          value={sleepModeActive ? 'Sleep' : sensorData?.curtain_status || '--'}
          icon={sleepModeActive ? '🌙' : '🎛️'}
          colors={sleepModeActive ? ['#6366f1', '#4f46e5'] : ['#10b981', '#059669']}
        />
      </View>

      {/* Recent Activity - Enhanced Modern Design */}
      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="time-outline" size={18} color="#667eea" />
            </View>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/notifications')} 
            activeOpacity={0.7}
            style={styles.viewAllButton}
          >
            <Text style={styles.sectionLink}>View All</Text>
            <Ionicons name="arrow-forward" size={14} color="#667eea" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.activityItem}
          onPress={() => router.push('/(tabs)/control')}
          activeOpacity={0.7}
        >
          <View style={styles.activityIconContainer}>
            <View style={styles.activityIcon}>
              <LinearGradient
                colors={
                  sleepModeActive
                    ? ['#6366f1', '#4f46e5']
                    : ['#667eea', '#764ba2']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activityIconGradient}
              >
                <Text style={styles.activityEmoji}>
                  {sleepModeActive ? '🌙' : '🌅'}
                </Text>
              </LinearGradient>
            </View>
            {/* Pulse animation indicator */}
            <View style={styles.activityPulse} />
          </View>
          
          <View style={styles.activityContent}>
            <View style={styles.activityTitleRow}>
              <Text style={styles.activityTitle}>
                {sleepModeActive
                  ? 'Sleep mode active'
                  : sensorData?.curtain_status === 'Auto'
                    ? 'Auto mode active'
                    : 'Manual mode active'}
              </Text>
              <View style={[
                styles.activityStatusBadge,
                { backgroundColor: sleepModeActive ? '#ede9fe' : sensorData?.curtain_status === 'Auto' ? '#d1fae5' : '#e0e7ff' }
              ]}>
                <View style={[
                  styles.activityStatusDot,
                  { backgroundColor: sleepModeActive ? '#6366f1' : sensorData?.curtain_status === 'Auto' ? '#10b981' : '#667eea' }
                ]} />
              </View>
            </View>
            <View style={styles.activityTimeRow}>
              <Ionicons name="time-outline" size={12} color="#8F9BB3" />
              <Text style={styles.activityTime}>
                {sensorData?.timestamp ? new Date(sensorData.timestamp).toLocaleString() : 'Just now'}
              </Text>
            </View>
          </View>
          
          <View style={styles.activityArrow}>
            <Ionicons name="chevron-forward" size={20} color="#B0B8C5" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.activityItem}
          onPress={() => router.push('/(tabs)/control')}
          activeOpacity={0.7}
        >
          <View style={styles.activityIconContainer}>
            <View style={styles.activityIcon}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activityIconGradient}
              >
                <Text style={styles.activityEmoji}>📱</Text>
              </LinearGradient>
            </View>
          </View>
          
          <View style={styles.activityContent}>
            <View style={styles.activityTitleRow}>
              <Text style={styles.activityTitle}>
                Curtain {sensorData?.position?.toLowerCase() || 'status updated'}
              </Text>
              <View style={[
                styles.activityStatusBadge,
                { backgroundColor: sensorData?.position === 'Open' ? '#d1fae5' : '#fee2e2' }
              ]}>
                <View style={[
                  styles.activityStatusDot,
                  { backgroundColor: sensorData?.position === 'Open' ? '#10b981' : '#f87171' }
                ]} />
              </View>
            </View>
            <View style={styles.activityTimeRow}>
              <Ionicons name="time-outline" size={12} color="#8F9BB3" />
              <Text style={styles.activityTime}>
                {sensorData?.timestamp ? new Date(sensorData.timestamp).toLocaleString() : 'Recently'}
              </Text>
            </View>
          </View>
          
          <View style={styles.activityArrow}>
            <Ionicons name="chevron-forward" size={20} color="#B0B8C5" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Last Update */}
      <View style={styles.lastUpdateContainer}>
        <View style={styles.updateDot} />
        <Text style={styles.lastUpdateText}>
          Last synced: {sensorData?.timestamp ? new Date(sensorData.timestamp).toLocaleTimeString() : 'Just now'}
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  heroSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  heroGradient: {
    padding: 28,
    paddingVertical: 40,
    position: 'relative',
  },
  heroDecorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -80,
    right: -60,
  },
  heroDecorativeCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -40,
    left: -30,
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  heroGreetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroGreetingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroGreeting: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTime: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  heroSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  mainStatusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  mainStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  mainStatusLabel: {
    fontSize: 14,
    color: '#8F9BB3',
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  mainStatusValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2E3A59',
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF50',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F1F3F5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#8F9BB3',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButtonClose: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionButtonOpen: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionButtonOpenSleep: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  quickActionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F3F5',
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickActionTextSecondary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingRight: 12,
    marginBottom: 24,
    gap: 12,
  },
  card: {
    width: '47%',
    marginBottom: 4,
  },
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardBorderGradient: {
    padding: 2,
    borderRadius: 24,
  },
  cardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    minHeight: 160,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  cardGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
  },
  cardIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  cardIconBadgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconText: {
    fontSize: 28,
  },
  cardContent: {
    position: 'relative',
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    color: '#8F9BB3',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  trendBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#667eea',
  },
  cardValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2E3A59',
    letterSpacing: -1.5,
  },
  cardUnit: {
    fontSize: 16,
    color: '#8F9BB3',
    fontWeight: '700',
    marginLeft: 4,
  },
  cardDecorativeLine: {
    height: 3,
    width: '40%',
    borderRadius: 2,
    marginTop: 4,
  },
  activitySection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2E3A59',
    letterSpacing: -0.5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667eea',
    letterSpacing: 0.3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  activityIconContainer: {
    position: 'relative',
    marginRight: 14,
  },
  activityIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  activityIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityPulse: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    top: 0,
    left: 0,
  },
  activityContent: {
    flex: 1,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E3A59',
    letterSpacing: -0.2,
    flex: 1,
  },
  activityStatusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  activityStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#8F9BB3',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activityArrow: {
    marginLeft: 8,
  },
  lastUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginHorizontal: 20,
  },
  updateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  lastUpdateText: {
    fontSize: 13,
    color: '#8F9BB3',
    fontWeight: '600',
  },
});