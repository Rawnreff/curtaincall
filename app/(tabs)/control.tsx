import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { ControlButton } from '../../components/ControlButton';
import { controlAPI, sensorAPI } from '../_services/api';
import { SensorData } from '../../types';

export default function ControlScreen() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await sensorAPI.getLatestData();
      setSensorData(data);
      setIsAutoMode(data.status_tirai === 'Auto');
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleControlCommand = async (action: 'open' | 'close') => {
    try {
      setLoading(true);
      await controlAPI.sendCommand({
        mode: 'manual',
        action: action,
      });
      const actionText = action === 'open' ? 'Buka' : 'Tutup';
      Alert.alert('Success', `Perintah ${actionText} berhasil dikirim`);
      // Refresh status setelah 2 detik
      setTimeout(fetchStatus, 2000);
    } catch (error) {
      console.error('Error sending command:', error);
      Alert.alert('Error', 'Gagal mengirim perintah');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoMode = async (value: boolean) => {
    try {
      setLoading(true);
      if (value) {
        await controlAPI.sendCommand({ mode: 'auto' });
      } else {
        await controlAPI.sendCommand({ mode: 'manual' });
      }
      setIsAutoMode(value);
      Alert.alert('Success', `Mode ${value ? 'Auto' : 'Manual'} diaktifkan`);
    } catch (error) {
      console.error('Error toggling mode:', error);
      Alert.alert('Error', 'Gagal mengubah mode');
      setIsAutoMode(!value); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kontrol Tirai</Text>
        <Text style={styles.subtitle}>
          Status saat ini: {sensorData?.posisi || 'Memuat...'}
        </Text>
      </View>

      {/* Auto/Manual Mode Toggle */}
      <View style={styles.modeContainer}>
        <Text style={styles.modeText}>Mode Otomatis</Text>
        <Switch
          value={isAutoMode}
          onValueChange={toggleAutoMode}
          disabled={loading}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isAutoMode ? '#007AFF' : '#f4f3f4'}
        />
      </View>

      {/* Manual Controls */}
      {!isAutoMode && (
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Kontrol Manual</Text>
          <View style={styles.buttonRow}>
            <ControlButton
              title="Buka"
              onPress={() => handleControlCommand('open')}
              variant="primary"
              disabled={loading || sensorData?.posisi === 'Terbuka'}
            />
            <ControlButton
              title="Tutup"
              onPress={() => handleControlCommand('close')}
              variant="secondary"
              disabled={loading || sensorData?.posisi === 'Tertutup'}
            />
          </View>
        </View>
      )}

      {/* Status Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Informasi Sistem</Text>
        <View style={styles.infoRow}>
          <Text>Posisi Tirai:</Text>
          <Text style={styles.infoValue}>
            {sensorData?.posisi || 'Memuat...'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text>Mode Sistem:</Text>
          <Text style={styles.infoValue}>
            {isAutoMode ? 'Otomatis' : 'Manual'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text>Terakhir Update:</Text>
          <Text style={styles.infoValue}>
            {sensorData?.timestamp ? 
              new Date(sensorData.timestamp).toLocaleTimeString() : 
              'Memuat...'
            }
          </Text>
        </View>
      </View>

      {isAutoMode && (
        <View style={styles.autoModeInfo}>
          <Text style={styles.autoModeText}>
            📢 Sistem dalam mode otomatis. Tirai akan menyesuaikan 
            berdasarkan kondisi cahaya dan suhu secara otomatis.
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
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  modeText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  controlSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoValue: {
    fontWeight: '500',
    color: '#007AFF',
  },
  autoModeInfo: {
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  autoModeText: {
    color: '#1976D2',
    lineHeight: 20,
  },
});