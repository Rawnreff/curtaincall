import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sensorService } from '../services/sensorService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('24h');

  useEffect(() => {
    loadHistory();
  }, [selectedPeriod]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await sensorService.getHistory(selectedPeriod);
      setHistory(data);
    } catch (error: any) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const PeriodButton = ({ period, label, icon }: any) => (
    <TouchableOpacity
      style={[styles.periodButton]}
      onPress={() => setSelectedPeriod(period)}
      activeOpacity={0.8}
    >
      {selectedPeriod === period ? (
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.periodButtonGradient}
        >
          <Ionicons name={icon} size={16} color="#FFFFFF" />
          <Text style={styles.periodButtonTextActive}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.periodButtonInactive}>
          <Ionicons name={icon} size={16} color="#8F9BB3" />
          <Text style={styles.periodButtonText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const DataPoint = ({ time, value, unit, gradient }: any) => (
    <View style={styles.dataPoint}>
      <View style={styles.dataPointLeft}>
        <View style={styles.dataPointIconContainer}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dataPointIconGradient}
          >
            <View style={styles.dataPointDot} />
          </LinearGradient>
        </View>
        <Text style={styles.dataTime}>{new Date(time).toLocaleTimeString()}</Text>
      </View>
      <View style={styles.dataPointRight}>
        <Text style={styles.dataValue}>{value}</Text>
        <Text style={styles.dataUnit}>{unit}</Text>
      </View>
    </View>
  );

  const calculateStats = () => {
    if (history.length === 0) return { maxTemp: 0, minTemp: 0, maxLight: 0, minLight: 0, avgTemp: 0, avgHumidity: 0 };
    
    const temps = history.map((h: any) => h.suhu || 0);
    const lights = history.map((h: any) => h.cahaya || 0);
    const humidity = history.map((h: any) => h.kelembapan || 0);
    
    return {
      maxTemp: Math.max(...temps),
      minTemp: Math.min(...temps),
      maxLight: Math.max(...lights),
      minLight: Math.min(...lights),
      avgTemp: (temps.reduce((a, b) => a + b, 0) / temps.length),
      avgHumidity: (humidity.reduce((a, b) => a + b, 0) / humidity.length),
    };
  };

  const stats = calculateStats();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Performance overview</Text>
      </View>

      {/* Period Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.periodSelector}
      >
        <PeriodButton period="1h" label="1 Hour" icon="time-outline" />
        <PeriodButton period="6h" label="6 Hours" icon="hourglass-outline" />
        <PeriodButton period="24h" label="24 Hours" icon="calendar-outline" />
        <PeriodButton period="7d" label="7 Days" icon="calendar-clear-outline" />
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loadingGradient}
            >
              <Ionicons name="analytics" size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconGradient}
            >
              <Ionicons name="bar-chart-outline" size={48} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.emptyTitle}>No Data Available</Text>
          <Text style={styles.emptyText}>
            History data will appear here once your system starts collecting information
          </Text>
        </View>
      ) : (
        <>
          {/* Statistics Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCardGradient}
              >
                <Ionicons name="thermometer" size={28} color="#FFFFFF" />
                <Text style={styles.statValue}>{stats.maxTemp.toFixed(1)}°C</Text>
                <Text style={styles.statLabel}>Max Temperature</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCardGradient}
              >
                <Ionicons name="thermometer-outline" size={28} color="#FFFFFF" />
                <Text style={styles.statValue}>{stats.minTemp.toFixed(1)}°C</Text>
                <Text style={styles.statLabel}>Min Temperature</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#fa709a', '#fee140']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCardGradient}
              >
                <Ionicons name="sunny" size={28} color="#FFFFFF" />
                <Text style={styles.statValue}>{stats.maxLight}</Text>
                <Text style={styles.statLabel}>Max Light (lux)</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#43e97b', '#38f9d7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCardGradient}
              >
                <Ionicons name="water" size={28} color="#FFFFFF" />
                <Text style={styles.statValue}>{stats.avgHumidity.toFixed(0)}%</Text>
                <Text style={styles.statLabel}>Avg Humidity</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Chart Visualization */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Temperature Trend</Text>
                <Text style={styles.chartSubtitle}>Last {selectedPeriod}</Text>
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={styles.legendDot} />
                  <Text style={styles.legendText}>Temp</Text>
                </View>
              </View>
            </View>
            <View style={styles.chart}>
              {history.slice(0, 12).map((item, index) => {
                const maxTemp = Math.max(...history.map((h: any) => h.suhu || 0));
                const height = ((item.suhu || 0) / maxTemp) * 100;
                return (
                  <View key={index} style={styles.chartBarContainer}>
                    <View style={[styles.chartBar, { height: `${height}%` }]}>
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.chartBarGradient}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Temperature History */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="thermometer" size={24} color="#667eea" />
              <Text style={styles.sectionTitle}>Temperature History</Text>
            </View>
            <View style={styles.dataList}>
              {history.slice(0, 8).map((item, index) => (
                <DataPoint
                  key={index}
                  time={item.timestamp || item.history_timestamp}
                  value={item.suhu}
                  unit="°C"
                  gradient={['#667eea', '#764ba2']}
                />
              ))}
            </View>
          </View>

          {/* Light History */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sunny" size={24} color="#fa709a" />
              <Text style={styles.sectionTitle}>Light Intensity</Text>
            </View>
            <View style={styles.dataList}>
              {history.slice(0, 8).map((item, index) => (
                <DataPoint
                  key={index}
                  time={item.timestamp || item.history_timestamp}
                  value={item.cahaya}
                  unit="lux"
                  gradient={['#fa709a', '#fee140']}
                />
              ))}
            </View>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryGradient}
            >
              <Ionicons name="checkmark-circle" size={48} color="#FFFFFF" />
              <Text style={styles.summaryTitle}>System Running Smoothly</Text>
              <Text style={styles.summaryText}>
                {history.length} data points collected in the last {selectedPeriod}
              </Text>
            </LinearGradient>
          </View>
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2E3A59',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#8F9BB3',
    fontWeight: '500',
  },
  periodSelector: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  periodButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  periodButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 8,
  },
  periodButtonInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  periodButtonTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8F9BB3',
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
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#667eea',
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
    fontSize: 22,
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
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  statCard: {
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
  statCardGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E3A59',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  chartSubtitle: {
    fontSize: 13,
    color: '#8F9BB3',
    fontWeight: '600',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#667eea',
  },
  legendText: {
    fontSize: 12,
    color: '#8F9BB3',
    fontWeight: '600',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    gap: 6,
  },
  chartBarContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 20,
  },
  chartBarGradient: {
    width: '100%',
    height: '100%',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E3A59',
    letterSpacing: -0.3,
  },
  dataList: {
    gap: 4,
  },
  dataPoint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  dataPointLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dataPointIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dataPointIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataPointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  dataTime: {
    fontSize: 14,
    color: '#8F9BB3',
    fontWeight: '600',
  },
  dataPointRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  dataValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E3A59',
    letterSpacing: -0.3,
  },
  dataUnit: {
    fontSize: 13,
    color: '#8F9BB3',
    fontWeight: '600',
  },
  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  summaryGradient: {
    padding: 32,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  summaryText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
});