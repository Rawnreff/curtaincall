import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { sensorAPI } from '../_services/api';
import { SensorData } from '../../types';

const screenWidth = Dimensions.get('window').width;

export default function HistoryScreen() {
  const [historyData, setHistoryData] = useState<SensorData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<number>(24); // hours

  const fetchHistory = async (hours: number = 24) => {
    try {
      const data = await sensorAPI.getHistory(hours);
      setHistoryData(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      Alert.alert('Error', 'Gagal mengambil data riwayat');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory(timeRange);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchHistory(timeRange);
  }, [timeRange]);

  // Prepare chart data
  const temperatureData = {
    labels: historyData
      .filter((_, index) => index % 6 === 0) // Show every 6th point
      .map(data => new Date(data.timestamp).getHours().toString()),
    datasets: [
      {
        data: historyData.map(data => data.suhu),
        color: () => '#FF6B6B',
        strokeWidth: 2,
      },
    ],
  };

  const lightData = {
    labels: historyData
      .filter((_, index) => index % 6 === 0)
      .map(data => new Date(data.timestamp).getHours().toString()),
    datasets: [
      {
        data: historyData.map(data => data.cahaya),
        color: () => '#FFD93D',
        strokeWidth: 2,
      },
    ],
  };

  const humidityData = {
    labels: historyData
      .filter((_, index) => index % 6 === 0)
      .map(data => new Date(data.timestamp).getHours().toString()),
    datasets: [
      {
        data: historyData.map(data => data.kelembapan),
        color: () => '#4ECDC4',
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Sensor</Text>
        <View style={styles.timeRangeContainer}>
          <Text
            style={[styles.timeRangeButton, timeRange === 6 && styles.activeTimeRange]}
            onPress={() => setTimeRange(6)}
          >
            6 Jam
          </Text>
          <Text
            style={[styles.timeRangeButton, timeRange === 24 && styles.activeTimeRange]}
            onPress={() => setTimeRange(24)}
          >
            24 Jam
          </Text>
          <Text
            style={[styles.timeRangeButton, timeRange === 48 && styles.activeTimeRange]}
            onPress={() => setTimeRange(48)}
          >
            48 Jam
          </Text>
        </View>
      </View>

      {historyData.length > 0 ? (
        <>
          {/* Temperature Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Suhu (°C)</Text>
            <LineChart
              data={temperatureData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Light Intensity Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Intensitas Cahaya (lux)</Text>
            <LineChart
              data={lightData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Humidity Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Kelembapan (%)</Text>
            <LineChart
              data={humidityData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Tidak ada data riwayat yang tersedia
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeRangeButton: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    color: '#666',
    fontWeight: '500',
  },
  activeTimeRange: {
    backgroundColor: '#007AFF',
    color: 'white',
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});