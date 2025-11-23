import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSensor } from '../contexts/SensorContext';
import { useControl } from '../contexts/ControlContext';
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

  useEffect(() => {
    // Set initial fade animation only once on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleQuickClose = async () => {
    if (sensorData?.posisi === 'Tertutup') {
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

  const handleQuickOpen = async () => {
    if (sensorData?.posisi === 'Terbuka') {
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
      <LinearGradient
        colors={colors || ['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
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
        <View style={styles.cardIcon}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 20 }}
      refreshControl={
        <RefreshControl 
          refreshing={loading} 
          onRefresh={refreshData}
          tintColor="#667eea"
          colors={['#667eea']}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <Text style={styles.heroGreeting}>{getGreeting()}</Text>
          <Text style={styles.heroTitle}>Smart Curtain Control</Text>
          <Text style={styles.heroSubtitle}>Everything at your fingertips</Text>
        </LinearGradient>
      </View>

      {/* Main Status Card */}
      <View style={styles.mainStatusCard}>
        <View style={styles.mainStatusHeader}>
          <View>
            <Text style={styles.mainStatusLabel}>Curtain Status</Text>
            <Text style={styles.mainStatusValue}>
              {sensorData?.posisi || 'Loading...'}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={[
              styles.statusDot,
              { backgroundColor: sensorData?.posisi === 'Terbuka' ? '#4CAF50' : '#FF9800' }
            ]} />
            <Text style={styles.statusBadgeText}>
              {sensorData?.status_tirai || 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={
                sensorData?.posisi === 'Terbuka' 
                  ? ['#10b981', '#059669']  // Green when open
                  : ['#f5576c', '#f093fb']  // Red when closed
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: sensorData?.posisi === 'Terbuka' ? '100%' : '10%' }  // 10% when closed
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {sensorData?.posisi === 'Terbuka' ? '100% Open' : 'Closed'}
          </Text>
        </View>

        <View style={styles.quickActions}>
          {sensorData?.posisi === 'Terbuka' ? (
            <TouchableOpacity 
              style={[styles.quickActionButtonClose, quickCloseLoading && styles.quickActionButtonDisabled]}
              onPress={handleQuickClose}
              disabled={quickCloseLoading}
              activeOpacity={0.8}
            >
              {quickCloseLoading ? (
                <>
                  <Ionicons name="hourglass" size={18} color="#FFFFFF" />
                  <Text style={styles.quickActionText}>Closing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.quickActionText}>Quick Close</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.quickActionButtonOpen, quickOpenLoading && styles.quickActionButtonDisabled]}
              onPress={handleQuickOpen}
              disabled={quickOpenLoading}
              activeOpacity={0.8}
            >
              {quickOpenLoading ? (
                <>
                  <Ionicons name="hourglass" size={18} color="#FFFFFF" />
                  <Text style={styles.quickActionText}>Opening...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="arrow-up-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.quickActionText}>Quick Open</Text>
                </>
              )}
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
          value={sensorData?.suhu || '--'}
          unit="°C"
          icon="🌡️"
          colors={['#667eea', '#764ba2']}
          trend={sensorData?.suhu ? '+2°' : null}
        />
        <StatusCard
          title="Humidity"
          value={sensorData?.kelembapan || '--'}
          unit="%"
          icon="💧"
          colors={['#f093fb', '#f5576c']}
          trend={sensorData?.kelembapan ? '-3%' : null}
        />
        <StatusCard
          title="Light"
          value={sensorData?.cahaya || '--'}
          unit="lux"
          icon="💡"
          colors={['#4facfe', '#00f2fe']}
          trend={sensorData?.cahaya ? '+50' : null}
        />
        <StatusCard
          title="Mode"
          value={sensorData?.status_tirai || '--'}
          icon="🎛️"
          colors={['#10b981', '#059669']}
        />
      </View>

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')} activeOpacity={0.7}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.activityItem}
          onPress={() => router.push('/(tabs)/control')}
          activeOpacity={0.7}
        >
          <View style={styles.activityIcon}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activityIconGradient}
            >
              <Text style={styles.activityEmoji}>🌅</Text>
            </LinearGradient>
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>
              {sensorData?.status_tirai === 'Auto' ? 'Auto mode active' : 'Manual mode active'}
            </Text>
            <Text style={styles.activityTime}>
              {sensorData?.timestamp ? new Date(sensorData.timestamp).toLocaleString() : 'Just now'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B0B8C5" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.activityItem}
          onPress={() => router.push('/(tabs)/control')}
          activeOpacity={0.7}
        >
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
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>
              Curtain {sensorData?.posisi?.toLowerCase() || 'status updated'}
            </Text>
            <Text style={styles.activityTime}>
              {sensorData?.timestamp ? new Date(sensorData.timestamp).toLocaleString() : 'Recently'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B0B8C5" />
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
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  heroGradient: {
    padding: 32,
    paddingVertical: 36,
  },
  heroGreeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    padding: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionButtonOpen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionButtonDisabled: {
    opacity: 0.6,
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
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  card: {
    width: '47%',
    marginHorizontal: '1.5%',
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  cardGradient: {
    padding: 20,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  trendBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  cardUnit: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginLeft: 4,
  },
  cardIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    opacity: 0.3,
  },
  iconText: {
    fontSize: 40,
  },
  activitySection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E3A59',
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    overflow: 'hidden',
  },
  activityIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 22,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E3A59',
    marginBottom: 3,
  },
  activityTime: {
    fontSize: 12,
    color: '#8F9BB3',
    fontWeight: '500',
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