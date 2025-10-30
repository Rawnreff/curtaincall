import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { sensorAPI } from '../_services/api';
import { SensorData } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function DashboardScreen() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [fadeAnim] = useState(new Animated.Value(0));

  const fetchSensorData = async () => {
    try {
      const data = await sensorAPI.getLatestData();
      setSensorData(data);
      setLastUpdate(new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      Alert.alert('Error', 'Gagal mengambil data sensor');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSensorData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getTemperatureColor = (temp: number) => {
    if (temp < 20) return ['#3B82F6', '#60A5FA']; // Cold - Blue
    if (temp < 28) return ['#10B981', '#34D399']; // Normal - Green
    if (temp < 35) return ['#F59E0B', '#FBBF24']; // Warm - Orange
    return ['#EF4444', '#F87171']; // Hot - Red
  };

  const getHumidityColor = (humidity: number) => {
    if (humidity < 40) return ['#F59E0B', '#FBBF24']; // Low - Orange
    if (humidity < 70) return ['#3B82F6', '#60A5FA']; // Normal - Blue
    return ['#8B5CF6', '#A78BFA']; // High - Purple
  };

  const getLightColor = (light: number) => {
    if (light < 200) return ['#6366F1', '#818CF8']; // Dark - Indigo
    if (light < 500) return ['#F59E0B', '#FBBF24']; // Medium - Orange
    return ['#FBBF24', '#FDE047']; // Bright - Yellow
  };

  const getCurtainStatusColor = (posisi: string) => {
    if (posisi === 'Terbuka') return ['#10B981', '#34D399']; // Open - Green
    if (posisi === 'Tertutup') return ['#EF4444', '#F87171']; // Closed - Red
    return ['#6366F1', '#818CF8']; // Half - Indigo
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#A855F7']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Selamat Datang</Text>
            <Text style={styles.title}>CurtainCall Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#FFF" />
            {sensorData && sensorData.suhu > 35 && (
              <View style={styles.notificationBadge} />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <Animated.View style={[styles.statusCard, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.statusGradient}
          >
            <View style={styles.statusHeader}>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.statusText}>Sistem Aktif</Text>
              </View>
              <Text style={styles.updateTime}>
                <Ionicons name="time-outline" size={14} color="#64748B" />
                {' '}{lastUpdate || 'Memuat...'}
              </Text>
            </View>
            
            <View style={styles.modeContainer}>
              <Ionicons 
                name={sensorData?.status_tirai === 'Auto' ? "flash" : "hand-left"}
                size={20} 
                color="#6366F1" 
              />
              <Text style={styles.modeText}>
                Mode: <Text style={styles.modeBold}>{sensorData?.status_tirai || 'Auto'}</Text>
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Sensor Cards Grid */}
        <View style={styles.gridContainer}>
          {/* Temperature Card */}
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={getTemperatureColor(sensorData?.suhu || 25)}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="thermometer" size={32} color="#FFF" />
                </View>
                <View style={styles.cardData}>
                  <Text style={styles.cardLabel}>Suhu</Text>
                  <Text style={styles.cardValue}>
                    {sensorData?.suhu?.toFixed(1) || '--'}°
                  </Text>
                  <Text style={styles.cardUnit}>Celsius</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Humidity Card */}
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={getHumidityColor(sensorData?.kelembapan || 60)}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="water" size={32} color="#FFF" />
                </View>
                <View style={styles.cardData}>
                  <Text style={styles.cardLabel}>Kelembapan</Text>
                  <Text style={styles.cardValue}>
                    {sensorData?.kelembapan?.toFixed(0) || '--'}%
                  </Text>
                  <Text style={styles.cardUnit}>Humidity</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Light Card */}
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={getLightColor(sensorData?.cahaya || 300)}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="sunny" size={32} color="#FFF" />
                </View>
                <View style={styles.cardData}>
                  <Text style={styles.cardLabel}>Cahaya</Text>
                  <Text style={styles.cardValue}>
                    {sensorData?.cahaya || '--'}
                  </Text>
                  <Text style={styles.cardUnit}>Lux</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Curtain Status Card */}
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={getCurtainStatusColor(sensorData?.posisi || 'Tertutup')}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={
                      sensorData?.posisi === 'Terbuka' ? 'arrow-up-circle' :
                      sensorData?.posisi === 'Tertutup' ? 'arrow-down-circle' :
                      'remove-circle'
                    } 
                    size={32} 
                    color="#FFF" 
                  />
                </View>
                <View style={styles.cardData}>
                  <Text style={styles.cardLabel}>Status Tirai</Text>
                  <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
                    {sensorData?.posisi || '--'}
                  </Text>
                  <Text style={styles.cardUnit}>Position</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Temperature Alert */}
        {sensorData && sensorData.suhu > 35 && (
          <Animated.View style={[styles.alertCard, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={['#FEE2E2', '#FECACA']}
              style={styles.alertGradient}
            >
              <View style={styles.alertContent}>
                <View style={styles.alertIcon}>
                  <Ionicons name="warning" size={24} color="#DC2626" />
                </View>
                <View style={styles.alertTextContainer}>
                  <Text style={styles.alertTitle}>⚠️ Peringatan Suhu Tinggi!</Text>
                  <Text style={styles.alertDescription}>
                    Suhu mencapai {sensorData.suhu.toFixed(1)}°C. Buzzer telah diaktifkan.
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color="#6366F1" />
            <Text style={styles.infoTitle}>Informasi Sistem</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Auto Refresh</Text>
            <Text style={styles.infoValue}>Setiap 5 detik</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Data Source</Text>
            <Text style={styles.infoValue}>ESP32 Sensor</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Koneksi</Text>
            <View style={styles.connectionStatus}>
              <View style={styles.connectionDot} />
              <Text style={styles.infoValue}>Terhubung</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  content: {
    flex: 1,
    marginTop: -16,
  },
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  statusGradient: {
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  updateTime: {
    fontSize: 12,
    color: '#64748B',
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modeText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  modeBold: {
    fontWeight: '700',
    color: '#6366F1',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  card: {
    width: CARD_WIDTH,
    margin: 8,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  cardGradient: {
    padding: 20,
    minHeight: 160,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardData: {
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  cardUnit: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  alertCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  alertGradient: {
    padding: 16,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 12,
    color: '#DC2626',
    lineHeight: 18,
  },
  infoCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
});
