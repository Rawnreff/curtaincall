import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Animated, TextInput, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useControl } from '../contexts/ControlContext';
import { useSensor } from '../contexts/SensorContext';
import { autoModeRulesService, AutoModeRules } from '../services/autoModeRulesService';
import { getSleepModeStatus, activateSleepMode, deactivateSleepMode, updatePIRSettings } from '../services/pirSleepService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ControlScreen() {
  const { sendCommand } = useControl();
  const { sensorData, refreshData } = useSensor();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<string | null>(null);
  const [rules, setRules] = useState<AutoModeRules>({
    temperature_control_enabled: true,
    humidity_control_enabled: true,
    light_control_enabled: true,
    pir_enabled: true,
    temperature_high_threshold: 35.0,
    humidity_high_threshold: 80.0,
    light_open_threshold: 250,
    light_close_threshold: 500,
    enabled: true,
  });
  const [editingRules, setEditingRules] = useState<AutoModeRules>(rules);
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [sleepModeActive, setSleepModeActive] = useState(false);
  const [sleepModeLoading, setSleepModeLoading] = useState(false);
  const scaleAnim = new Animated.Value(1);

  // Helper function to safely determine if auto mode is active
  const isAutoMode = () => {
    // Handle edge cases: undefined, null, or unexpected values
    if (!sensorData?.status_tirai) return false;
    return sensorData.status_tirai === 'Auto';
  };

  useEffect(() => {
    loadRules();
    loadSleepModeStatus();
  }, []);

  // Reload sleep mode status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSleepModeStatus();
    }, [])
  );

  const loadRules = async () => {
    try {
      setRulesLoading(true);
      const response = await autoModeRulesService.getRules();
      setRules(response.rules);
      setEditingRules(response.rules);
    } catch (error: any) {
      console.error('Error loading rules:', error);
      Alert.alert('Error', 'Failed to load auto mode rules');
    } finally {
      setRulesLoading(false);
    }
  };

  const loadSleepModeStatus = async () => {
    try {
      const status = await getSleepModeStatus();
      setSleepModeActive(status.active);
    } catch (error: any) {
      console.error('Error loading sleep mode status:', error);
    }
  };

  const handleToggleSleepMode = async () => {
    if (sleepModeLoading) return;

    try {
      setSleepModeLoading(true);
      
      if (sleepModeActive) {
        // Deactivate sleep mode
        const response = await deactivateSleepMode();
        setSleepModeActive(false);
        Alert.alert('Sleep Mode Deactivated', response.message);
        // Reload rules to get restored settings
        await loadRules();
      } else {
        // Activate sleep mode - show confirmation
        Alert.alert(
          'Activate Sleep Mode?',
          'This will close the curtain and disable all automated functions (PIR, auto mode, manual control).',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Activate',
              style: 'destructive',
              onPress: async () => {
                try {
                  const response = await activateSleepMode();
                  setSleepModeActive(true);
                  Alert.alert('Sleep Mode Activated', response.message);
                  // Refresh sensor data to show closed curtain
                  await refreshData();
                } catch (error: any) {
                  Alert.alert('Error', error.response?.data?.message || 'Failed to activate sleep mode');
                }
              }
            }
          ]
        );
        return; // Exit early since we're showing confirmation dialog
      }
    } catch (error: any) {
      console.error('Error toggling sleep mode:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to toggle sleep mode');
    } finally {
      setSleepModeLoading(false);
    }
  };

  const handleSaveRules = async () => {
    // Validate rules
    if (editingRules.light_open_threshold >= editingRules.light_close_threshold) {
      Alert.alert('Invalid Rules', 'Light open threshold must be less than light close threshold');
      return;
    }

    if (editingRules.light_open_threshold < 0 || editingRules.light_close_threshold < 0) {
      Alert.alert('Invalid Rules', 'Light thresholds must be positive');
      return;
    }

    if (editingRules.temperature_high_threshold < 0 || editingRules.temperature_high_threshold > 100) {
      Alert.alert('Invalid Rules', 'Temperature threshold must be between 0 and 100°C');
      return;
    }

    if (editingRules.humidity_high_threshold < 0 || editingRules.humidity_high_threshold > 100) {
      Alert.alert('Invalid Rules', 'Humidity threshold must be between 0 and 100%');
      return;
    }

    try {
      setRulesLoading(true);
      const response = await autoModeRulesService.updateRules(editingRules);
      setRules(response.rules);
      setIsEditingRules(false);
      Alert.alert('Success', 'Auto mode rules updated successfully');
    } catch (error: any) {
      console.error('Error saving rules:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update auto mode rules');
    } finally {
      setRulesLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRules(rules);
    setIsEditingRules(false);
  };

  const handleToggleControlType = async (controlType: 'temperature' | 'humidity' | 'light' | 'pir', value: boolean) => {
    const fieldName = controlType === 'pir' 
      ? 'pir_enabled' 
      : `${controlType}_control_enabled` as keyof AutoModeRules;
    const updatedRules = { ...rules, [fieldName]: value };
    setRules(updatedRules);
    
    try {
      setRulesLoading(true);
      
      // Update auto mode rules
      await autoModeRulesService.updateRules(updatedRules);
      
      // If PIR, also update pir_settings collection separately
      if (controlType === 'pir') {
        try {
          await updatePIRSettings(value);
          console.log('✅ PIR settings updated in pir_settings collection');
        } catch (pirError) {
          console.error('⚠️ Failed to update pir_settings collection:', pirError);
          // Don't fail the whole operation if pir_settings update fails
        }
      }
      
      const controlName = controlType === 'pir' 
        ? 'PIR Motion Detection' 
        : controlType.charAt(0).toUpperCase() + controlType.slice(1) + ' control';
      Alert.alert('Success', `${controlName} ${value ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      console.error(`Error toggling ${controlType} control:`, error);
      // Revert on error
      setRules(rules);
      Alert.alert('Error', error.response?.data?.error || `Failed to update ${controlType} control`);
    } finally {
      setRulesLoading(false);
    }
  };

  const handleCommand = async (mode: string, action: string) => {
    // Haptic feedback animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setLoading(action);
    try {
      await sendCommand(mode, action);
      
      // Refresh sensor data after successful command to get updated curtain_data
      setTimeout(() => {
        refreshData();
      }, 1000);
      
      Alert.alert(
        '✅ Success',
        `Command sent: ${action}`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      Alert.alert(
        '❌ Error',
        error.response?.data?.error || 'Failed to send command',
        [{ text: 'OK', style: 'cancel' }]
      );
    } finally {
      setLoading(null);
    }
  };

  const ControlButton = ({ title, icon, iconName, mode, action, colors, disabled }: any) => (
    <TouchableOpacity
      style={[styles.controlButton, disabled && styles.controlButtonDisabled]}
      onPress={() => handleCommand(mode, action)}
      disabled={disabled || loading === action}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={disabled ? ['#E0E0E0', '#BDBDBD'] : colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.controlButtonGradient}
      >
        <View style={styles.controlButtonContent}>
          {iconName ? (
            <Ionicons name={iconName} size={40} color="#FFFFFF" />
          ) : (
            <Text style={styles.controlButtonIcon}>{icon}</Text>
          )}
          <Text style={styles.controlButtonTitle}>{title}</Text>
          {loading === action && (
            <View style={styles.loadingIndicator}>
              <Text style={styles.loadingText}>Sending...</Text>
            </View>
          )}
        </View>
        {!disabled && (
          <View style={styles.buttonShine} />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const getModeIcon = () => {
    if (sleepModeActive) return '🌙';
    if (sensorData?.status_tirai === 'Auto') return '🤖';
    return '👤';
  };

  const getModeColor = (): [string, string] => {
    if (sleepModeActive) return ['#6366f1', '#4f46e5']; // Purple for sleep mode
    if (sensorData?.status_tirai === 'Auto') return ['#10b981', '#059669']; // Green for auto
    return ['#667eea', '#764ba2']; // Blue for manual
  };

  const getCurrentMode = () => {
    if (sleepModeActive) return 'Sleep Mode';
    return sensorData?.status_tirai || 'Loading...';
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Control</Text>
        <Text style={styles.subtitle}>Manage your smart curtain</Text>
      </View>

      {/* Sleep Mode Card */}
      <View style={styles.sleepModeCard}>
        <LinearGradient
          colors={sleepModeActive ? ['#6366f1', '#4f46e5'] : ['#374151', '#1f2937']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sleepModeGradient}
        >
          <View style={styles.sleepModeContent}>
            <View style={styles.sleepModeLeft}>
              <Ionicons 
                name={sleepModeActive ? "moon" : "moon-outline"} 
                size={32} 
                color="#fff" 
              />
              <View style={styles.sleepModeInfo}>
                <Text style={styles.sleepModeTitle}>Sleep Mode</Text>
                <Text style={styles.sleepModeDescription}>
                  {sleepModeActive 
                    ? 'All controls disabled' 
                    : 'Disable all automation'}
                </Text>
              </View>
            </View>
            <Switch
              value={sleepModeActive}
              onValueChange={handleToggleSleepMode}
              disabled={sleepModeLoading}
              trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="rgba(255, 255, 255, 0.3)"
            />
          </View>
        </LinearGradient>
      </View>

      {/* Current Mode Card */}
      <View style={styles.currentModeCard}>
        <LinearGradient
          colors={getModeColor()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modeCardGradient}
        >
          <View style={styles.modeCardContent}>
            <View style={styles.modeIconContainer}>
              <Text style={styles.modeIcon}>{getModeIcon()}</Text>
            </View>
            <View style={styles.modeInfo}>
              <Text style={styles.modeLabel}>Current Mode</Text>
              <Text style={styles.modeValue}>{getCurrentMode()}</Text>
            </View>
          </View>
          <View style={styles.modeStatusIndicator}>
            <View style={styles.modeStatusDot} />
            <Text style={styles.modeStatusText}>Active</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Curtain Position Status */}
      <View style={styles.positionCard}>
        <Text style={styles.positionLabel}>Curtain Position</Text>
        <View style={styles.positionDisplay}>
          <View style={styles.curtainVisual}>
            <LinearGradient
              colors={
                sensorData?.posisi === 'Terbuka' 
                  ? ['#10b981', '#059669']  // Green when open
                  : ['#f5576c', '#f093fb']  // Red when closed
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.curtainBar,
                { height: sensorData?.posisi === 'Terbuka' ? '100%' : '15%' }
              ]}
            />
          </View>
          <View style={styles.positionInfo}>
            <Text style={styles.positionValue}>{sensorData?.posisi || 'Unknown'}</Text>
            <Text style={[
              styles.positionPercent,
              { color: sensorData?.posisi === 'Terbuka' ? '#10b981' : '#f5576c' }
            ]}>
              {sensorData?.posisi === 'Terbuka' ? '100% Open' : 'Closed'}
            </Text>
          </View>
        </View>
      </View>

      {/* Manual Control Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="hand-left" size={24} color="#2E3A59" />
          <Text style={styles.sectionTitle}>Manual Control</Text>
        </View>
        
        <View style={styles.controlButtonGrid}>
          <ControlButton
            title="Open Curtain"
            iconName="arrow-up-circle"
            mode="manual"
            action="open"
            colors={['#10b981', '#059669']}
            disabled={sleepModeActive || sensorData?.posisi === 'Terbuka'}
          />
          <ControlButton
            title="Close Curtain"
            iconName="arrow-down-circle"
            mode="manual"
            action="close"
            colors={['#fa709a', '#fee140']}
            disabled={sleepModeActive || sensorData?.posisi === 'Tertutup'}
          />
        </View>

        {sleepModeActive && (
          <View style={[styles.infoBox, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="moon" size={20} color="#f59e0b" />
            <Text style={[styles.infoText, { color: '#92400e' }]}>
              Sleep mode is active - All controls are disabled
            </Text>
          </View>
        )}

        {!sleepModeActive && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#667eea" />
            <Text style={styles.infoText}>
              Manual control will override auto mode temporarily
            </Text>
          </View>
        )}
      </View>

      {/* PIR Motion Detection Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="walk" size={24} color="#2E3A59" />
          <Text style={styles.sectionTitle}>Motion Detection</Text>
        </View>

        <View style={[styles.pirCard, sleepModeActive && styles.pirCardDisabled]}>
          <View style={styles.pirHeader}>
            <View style={styles.pirIconContainer}>
              <LinearGradient
                colors={sleepModeActive ? ['#E0E0E0', '#BDBDBD'] : ['#FFA726', '#FF7043']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pirIconGradient}
              >
                <Ionicons name="walk" size={24} color={sleepModeActive ? '#9E9E9E' : '#FFFFFF'} />
              </LinearGradient>
            </View>
            <View style={styles.pirInfo}>
              <Text style={[styles.pirTitle, sleepModeActive && styles.pirTitleDisabled]}>PIR Motion Sensor</Text>
              <Text style={[styles.pirDescription, sleepModeActive && styles.pirDescriptionDisabled]}>
                {sleepModeActive ? 'Disabled during sleep mode' : 'Automatically toggle curtain when motion detected'}
              </Text>
            </View>
          </View>

          <View style={styles.pirToggleContainer}>
            <View style={styles.pirToggleInfo}>
              <Text style={[styles.pirToggleLabel, sleepModeActive && styles.pirToggleLabelDisabled]}>
                Motion Detection
              </Text>
              <Text style={[styles.pirToggleStatus, sleepModeActive && styles.pirToggleStatusDisabled]}>
                {rules.pir_enabled ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <Switch
              value={rules.pir_enabled}
              onValueChange={(value) => handleToggleControlType('pir', value)}
              disabled={rulesLoading || sleepModeActive}
              trackColor={{ false: '#E4E9F2', true: '#FFA726' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {sleepModeActive && (
            <View style={[styles.infoBox, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="moon" size={20} color="#f59e0b" />
              <Text style={[styles.infoText, { color: '#92400e' }]}>
                Sleep mode is active - Motion detection is disabled
              </Text>
            </View>
          )}

          {!sleepModeActive && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#FFA726" />
              <Text style={styles.infoText}>
                PIR sensor works independently from auto mode. When motion is detected, curtain will toggle automatically.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Auto Mode Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="construct" size={24} color="#2E3A59" />
          <Text style={styles.sectionTitle}>Automation</Text>
        </View>

        <View style={[styles.autoModeCard, sleepModeActive && styles.autoModeCardDisabled]}>
          <View style={styles.autoModeHeader}>
            <View style={styles.autoModeIconContainer}>
              <LinearGradient
                colors={sleepModeActive ? ['#E0E0E0', '#BDBDBD'] : ['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.autoModeIconGradient}
              >
                <Ionicons name="sunny" size={24} color={sleepModeActive ? '#9E9E9E' : '#FFFFFF'} />
              </LinearGradient>
            </View>
            <View style={styles.autoModeInfo}>
              <Text style={[styles.autoModeTitle, sleepModeActive && styles.autoModeTitleDisabled]}>Smart Auto Mode</Text>
              <Text style={[styles.autoModeDescription, sleepModeActive && styles.autoModeDescriptionDisabled]}>
                {sleepModeActive ? 'Disabled during sleep mode' : 'Adjusts based on temperature, humidity, and light'}
              </Text>
            </View>
          </View>

          {/* Status Indicator */}
          <View style={styles.modeStatusIndicatorCard}>
            <Ionicons 
              name={isAutoMode() ? 'checkmark-circle' : 'hand-right'} 
              size={20} 
              color={isAutoMode() ? '#10b981' : '#667eea'} 
            />
            <Text style={[
              styles.modeStatusIndicatorText,
              { color: isAutoMode() ? '#10b981' : '#667eea' }
            ]}>
              Currently Active: {isAutoMode() ? 'Auto Mode' : 'Manual Mode'}
            </Text>
          </View>

          <View style={styles.autoModeButtons}>
            <TouchableOpacity
              style={[
                styles.autoModeButton,
                isAutoMode() && styles.autoModeButtonActive,
                sleepModeActive && styles.autoModeButtonDisabled
              ]}
              onPress={() => handleCommand('auto', 'enable')}
              disabled={sleepModeActive || isAutoMode() || loading === 'enable'}
            >
              <LinearGradient
                colors={
                  sleepModeActive
                    ? ['#E0E0E0', '#BDBDBD']
                    : isAutoMode() 
                    ? ['#10b981', '#059669'] 
                    : ['#F1F3F5', '#F1F3F5']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.autoModeButtonGradient}
              >
                {isAutoMode() && (
                  <View style={styles.activeCheckmark}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  </View>
                )}
                <Ionicons 
                  name="play-circle" 
                  size={24} 
                  color={isAutoMode() ? '#FFFFFF' : '#8F9BB3'} 
                />
                <Text style={[
                  styles.autoModeButtonText,
                  isAutoMode() && styles.autoModeButtonTextActive
                ]}>
                  Enable Auto
                </Text>
                {loading === 'enable' && (
                  <Text style={styles.autoModeButtonLoading}>...</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.autoModeButton,
                !isAutoMode() && styles.autoModeButtonActive,
                sleepModeActive && styles.autoModeButtonDisabled
              ]}
              onPress={() => handleCommand('auto', 'disable')}
              disabled={sleepModeActive || !isAutoMode() || loading === 'disable'}
            >
              <LinearGradient
                colors={
                  sleepModeActive
                    ? ['#E0E0E0', '#BDBDBD']
                    : !isAutoMode() 
                    ? ['#667eea', '#764ba2'] 
                    : ['#F1F3F5', '#F1F3F5']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.autoModeButtonGradient}
              >
                {!isAutoMode() && (
                  <View style={styles.activeCheckmark}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  </View>
                )}
                <Ionicons 
                  name="pause-circle" 
                  size={24} 
                  color={!isAutoMode() ? '#FFFFFF' : '#8F9BB3'} 
                />
                <Text style={[
                  styles.autoModeButtonText,
                  !isAutoMode() && styles.autoModeButtonTextActive
                ]}>
                  Disable Auto
                </Text>
                {loading === 'disable' && (
                  <Text style={styles.autoModeButtonLoading}>...</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {sleepModeActive && (
            <View style={[styles.infoBox, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="moon" size={20} color="#f59e0b" />
              <Text style={[styles.infoText, { color: '#92400e' }]}>
                Sleep mode is active - Auto mode controls are disabled
              </Text>
            </View>
          )}

          {!sleepModeActive && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#667eea" />
              <Text style={styles.infoText}>
                Use the toggles below to enable/disable specific auto mode controls
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Auto Mode Rules */}
      <View style={[styles.rulesCard, sleepModeActive && styles.rulesCardDisabled]}>
        <View style={styles.rulesHeader}>
          <Ionicons name="bulb" size={24} color={sleepModeActive ? '#9E9E9E' : '#667eea'} />
          <Text style={[styles.rulesTitle, sleepModeActive && styles.rulesTitleDisabled]}>Auto Mode Rules</Text>
          {!isEditingRules ? (
            <TouchableOpacity 
              onPress={() => setIsEditingRules(true)} 
              activeOpacity={0.7}
              disabled={sleepModeActive}
            >
              <Ionicons name="create-outline" size={24} color={sleepModeActive ? '#9E9E9E' : '#667eea'} />
            </TouchableOpacity>
          ) : (
            <View style={styles.rulesActionButtons}>
              <TouchableOpacity onPress={handleCancelEdit} activeOpacity={0.7} style={styles.cancelButton}>
                <Ionicons name="close" size={20} color="#8F9BB3" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveRules} 
                activeOpacity={0.7} 
                style={styles.saveButton}
                disabled={rulesLoading}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isEditingRules ? (
          <>
            {sleepModeActive && (
              <View style={[styles.infoBox, { backgroundColor: '#fef3c7', marginBottom: 16 }]}>
                <Ionicons name="moon" size={20} color="#f59e0b" />
                <Text style={[styles.infoText, { color: '#92400e' }]}>
                  Sleep mode is active - Auto mode rules are disabled
                </Text>
              </View>
            )}

            {/* Temperature Control */}
            <View style={[styles.controlTypeHeader, sleepModeActive && styles.controlTypeHeaderDisabled]}>
              <Ionicons name="thermometer" size={20} color={sleepModeActive ? '#9E9E9E' : '#f5576c'} />
              <Text style={[styles.controlTypeTitle, sleepModeActive && styles.controlTypeTitleDisabled]}>Temperature Control (Priority 1)</Text>
              <Switch
                value={editingRules.temperature_control_enabled}
                onValueChange={(value) => setEditingRules({ ...editingRules, temperature_control_enabled: value })}
                disabled={sleepModeActive}
                trackColor={{ false: '#E4E9F2', true: sleepModeActive ? '#BDBDBD' : '#f5576c' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.ruleItemEditable}>
              <View style={styles.ruleIconContainer}>
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ruleIconGradient}
                >
                  <Ionicons name="thermometer" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.ruleContentEditable}>
                <Text style={styles.ruleText}>High Temperature Threshold</Text>
                <Text style={styles.ruleDescription}>Close curtain when temperature exceeds this value</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.ruleInput}
                    value={editingRules.temperature_high_threshold.toString()}
                    onChangeText={(text) => {
                      const value = parseFloat(text) || 0;
                      setEditingRules({ ...editingRules, temperature_high_threshold: value });
                    }}
                    keyboardType="numeric"
                    placeholder="35.0"
                    editable={editingRules.temperature_control_enabled}
                  />
                  <Text style={styles.inputUnit}>°C</Text>
                </View>
              </View>
            </View>

            {/* Humidity Control */}
            <View style={[styles.controlTypeHeader, sleepModeActive && styles.controlTypeHeaderDisabled]}>
              <Ionicons name="water" size={20} color={sleepModeActive ? '#9E9E9E' : '#10b981'} />
              <Text style={[styles.controlTypeTitle, sleepModeActive && styles.controlTypeTitleDisabled]}>Humidity Control (Priority 2)</Text>
              <Switch
                value={editingRules.humidity_control_enabled}
                onValueChange={(value) => setEditingRules({ ...editingRules, humidity_control_enabled: value })}
                disabled={sleepModeActive}
                trackColor={{ false: '#E4E9F2', true: sleepModeActive ? '#BDBDBD' : '#10b981' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.ruleItemEditable}>
              <View style={styles.ruleIconContainer}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ruleIconGradient}
                >
                  <Ionicons name="water" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.ruleContentEditable}>
                <Text style={styles.ruleText}>High Humidity Threshold</Text>
                <Text style={styles.ruleDescription}>Open curtain when humidity exceeds this value</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.ruleInput}
                    value={editingRules.humidity_high_threshold.toString()}
                    onChangeText={(text) => {
                      const value = parseFloat(text) || 0;
                      setEditingRules({ ...editingRules, humidity_high_threshold: value });
                    }}
                    keyboardType="numeric"
                    placeholder="80.0"
                    editable={editingRules.humidity_control_enabled}
                  />
                  <Text style={styles.inputUnit}>%</Text>
                </View>
              </View>
            </View>

            {/* Light Control */}
            <View style={[styles.controlTypeHeader, sleepModeActive && styles.controlTypeHeaderDisabled]}>
              <Ionicons name="sunny" size={20} color={sleepModeActive ? '#9E9E9E' : '#fa709a'} />
              <Text style={[styles.controlTypeTitle, sleepModeActive && styles.controlTypeTitleDisabled]}>Light Control (Priority 3)</Text>
              <Switch
                value={editingRules.light_control_enabled}
                onValueChange={(value) => setEditingRules({ ...editingRules, light_control_enabled: value })}
                disabled={sleepModeActive}
                trackColor={{ false: '#E4E9F2', true: sleepModeActive ? '#BDBDBD' : '#fa709a' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.ruleItemEditable}>
              <View style={styles.ruleIconContainer}>
                <LinearGradient
                  colors={['#fa709a', '#fee140']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ruleIconGradient}
                >
                  <Ionicons name="sunny" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.ruleContentEditable}>
                <Text style={styles.ruleText}>High Brightness Threshold</Text>
                <Text style={styles.ruleDescription}>Close curtain when light exceeds this value</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.ruleInput}
                    value={editingRules.light_close_threshold.toString()}
                    onChangeText={(text) => {
                      const value = parseFloat(text) || 0;
                      setEditingRules({ ...editingRules, light_close_threshold: value });
                    }}
                    keyboardType="numeric"
                    placeholder="500"
                    editable={editingRules.light_control_enabled}
                  />
                  <Text style={styles.inputUnit}>lux</Text>
                </View>
              </View>
            </View>

            <View style={styles.ruleItemEditable}>
              <View style={styles.ruleIconContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ruleIconGradient}
                >
                  <Ionicons name="moon" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.ruleContentEditable}>
                <Text style={styles.ruleText}>Low Brightness Threshold</Text>
                <Text style={styles.ruleDescription}>Open curtain when light falls below this value</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.ruleInput}
                    value={editingRules.light_open_threshold.toString()}
                    onChangeText={(text) => {
                      const value = parseFloat(text) || 0;
                      setEditingRules({ ...editingRules, light_open_threshold: value });
                    }}
                    keyboardType="numeric"
                    placeholder="250"
                    editable={editingRules.light_control_enabled}
                  />
                  <Text style={styles.inputUnit}>lux</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Temperature Control */}
            <View style={[styles.controlTypeHeader, sleepModeActive && styles.controlTypeHeaderDisabled]}>
              <Ionicons name="thermometer" size={20} color={sleepModeActive ? '#9E9E9E' : '#f5576c'} />
              <Text style={[styles.controlTypeTitle, sleepModeActive && styles.controlTypeTitleDisabled]}>Temperature Control (Priority 1)</Text>
              <Switch
                value={rules.temperature_control_enabled}
                onValueChange={(value) => handleToggleControlType('temperature', value)}
                disabled={rulesLoading || sleepModeActive}
                trackColor={{ false: '#E4E9F2', true: sleepModeActive ? '#BDBDBD' : '#f5576c' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {rules.temperature_control_enabled && (
              <View style={[styles.ruleItem, sleepModeActive && styles.ruleItemDisabled]}>
                <View style={styles.ruleIconContainer}>
                  <LinearGradient
                    colors={sleepModeActive ? ['#E0E0E0', '#BDBDBD'] : ['#f093fb', '#f5576c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ruleIconGradient}
                  >
                    <Ionicons name="thermometer" size={20} color={sleepModeActive ? '#9E9E9E' : '#FFFFFF'} />
                  </LinearGradient>
                </View>
                <View style={styles.ruleContent}>
                  <Text style={[styles.ruleText, sleepModeActive && styles.ruleTextDisabled]}>High Temperature</Text>
                  <Text style={[styles.ruleValue, sleepModeActive && styles.ruleValueDisabled]}>Temp {'>'} {rules.temperature_high_threshold}°C → Close curtain</Text>
                </View>
              </View>
            )}

            {/* Humidity Control */}
            <View style={[styles.controlTypeHeader, sleepModeActive && styles.controlTypeHeaderDisabled]}>
              <Ionicons name="water" size={20} color={sleepModeActive ? '#9E9E9E' : '#10b981'} />
              <Text style={[styles.controlTypeTitle, sleepModeActive && styles.controlTypeTitleDisabled]}>Humidity Control (Priority 2)</Text>
              <Switch
                value={rules.humidity_control_enabled}
                onValueChange={(value) => handleToggleControlType('humidity', value)}
                disabled={rulesLoading || sleepModeActive}
                trackColor={{ false: '#E4E9F2', true: sleepModeActive ? '#BDBDBD' : '#10b981' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {rules.humidity_control_enabled && (
              <View style={[styles.ruleItem, sleepModeActive && styles.ruleItemDisabled]}>
                <View style={styles.ruleIconContainer}>
                  <LinearGradient
                    colors={sleepModeActive ? ['#E0E0E0', '#BDBDBD'] : ['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ruleIconGradient}
                  >
                    <Ionicons name="water" size={20} color={sleepModeActive ? '#9E9E9E' : '#FFFFFF'} />
                  </LinearGradient>
                </View>
                <View style={styles.ruleContent}>
                  <Text style={[styles.ruleText, sleepModeActive && styles.ruleTextDisabled]}>High Humidity</Text>
                  <Text style={[styles.ruleValue, sleepModeActive && styles.ruleValueDisabled]}>Humidity {'>'} {rules.humidity_high_threshold}% → Open curtain</Text>
                </View>
              </View>
            )}

            {/* Light Control */}
            <View style={[styles.controlTypeHeader, sleepModeActive && styles.controlTypeHeaderDisabled]}>
              <Ionicons name="sunny" size={20} color={sleepModeActive ? '#9E9E9E' : '#fa709a'} />
              <Text style={[styles.controlTypeTitle, sleepModeActive && styles.controlTypeTitleDisabled]}>Light Control (Priority 3)</Text>
              <Switch
                value={rules.light_control_enabled}
                onValueChange={(value) => handleToggleControlType('light', value)}
                disabled={rulesLoading || sleepModeActive}
                trackColor={{ false: '#E4E9F2', true: sleepModeActive ? '#BDBDBD' : '#fa709a' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {rules.light_control_enabled && (
              <>
                <View style={[styles.ruleItem, sleepModeActive && styles.ruleItemDisabled]}>
                  <View style={styles.ruleIconContainer}>
                    <LinearGradient
                      colors={sleepModeActive ? ['#E0E0E0', '#BDBDBD'] : ['#fa709a', '#fee140']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.ruleIconGradient}
                    >
                      <Ionicons name="sunny" size={20} color={sleepModeActive ? '#9E9E9E' : '#FFFFFF'} />
                    </LinearGradient>
                  </View>
                  <View style={styles.ruleContent}>
                    <Text style={[styles.ruleText, sleepModeActive && styles.ruleTextDisabled]}>High Brightness</Text>
                    <Text style={[styles.ruleValue, sleepModeActive && styles.ruleValueDisabled]}>Light {'>'} {rules.light_close_threshold} lux → Close curtain</Text>
                  </View>
                </View>

                <View style={[styles.ruleItem, sleepModeActive && styles.ruleItemDisabled]}>
                  <View style={styles.ruleIconContainer}>
                    <LinearGradient
                      colors={sleepModeActive ? ['#E0E0E0', '#BDBDBD'] : ['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.ruleIconGradient}
                    >
                      <Ionicons name="moon" size={20} color={sleepModeActive ? '#9E9E9E' : '#FFFFFF'} />
                    </LinearGradient>
                  </View>
                  <View style={styles.ruleContent}>
                    <Text style={[styles.ruleText, sleepModeActive && styles.ruleTextDisabled]}>Low Brightness</Text>
                    <Text style={[styles.ruleValue, sleepModeActive && styles.ruleValueDisabled]}>Light {'<'} {rules.light_open_threshold} lux → Open curtain</Text>
                  </View>
                </View>
              </>
            )}
          </>
        )}
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
  currentModeCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modeCardGradient: {
    padding: 24,
  },
  modeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeIcon: {
    fontSize: 32,
  },
  modeInfo: {
    flex: 1,
  },
  modeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  modeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  modeStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  modeStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sleepModeCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  sleepModeGradient: {
    padding: 20,
  },
  sleepModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sleepModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sleepModeInfo: {
    marginLeft: 16,
    flex: 1,
  },
  sleepModeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sleepModeDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  positionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  positionLabel: {
    fontSize: 14,
    color: '#8F9BB3',
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  positionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  curtainVisual: {
    width: 80,
    height: 120,
    backgroundColor: '#F1F3F5',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: '#E4E9F2',
  },
  curtainBar: {
    width: '100%',
    borderRadius: 10,
  },
  positionInfo: {
    flex: 1,
  },
  positionValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2E3A59',
    marginBottom: 6,
    letterSpacing: -1,
  },
  positionPercent: {
    fontSize: 16,
    color: '#8F9BB3',
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E3A59',
    letterSpacing: -0.5,
  },
  controlButtonGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  controlButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    position: 'relative',
  },
  controlButtonContent: {
    alignItems: 'center',
    gap: 12,
  },
  controlButtonIcon: {
    fontSize: 40,
  },
  controlButtonTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  loadingIndicator: {
    marginTop: 8,
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
    lineHeight: 18,
  },
  pirCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  pirCardDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  pirHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pirIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginRight: 14,
  },
  pirIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pirInfo: {
    flex: 1,
  },
  pirTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E3A59',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  pirTitleDisabled: {
    color: '#9E9E9E',
  },
  pirDescription: {
    fontSize: 14,
    color: '#8F9BB3',
    fontWeight: '500',
  },
  pirDescriptionDisabled: {
    color: '#BDBDBD',
  },
  pirToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  pirToggleInfo: {
    flex: 1,
  },
  pirToggleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E3A59',
    marginBottom: 4,
  },
  pirToggleLabelDisabled: {
    color: '#9E9E9E',
  },
  pirToggleStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFA726',
  },
  pirToggleStatusDisabled: {
    color: '#BDBDBD',
  },
  autoModeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  autoModeCardDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  autoModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  autoModeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginRight: 14,
  },
  autoModeIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoModeInfo: {
    flex: 1,
  },
  autoModeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E3A59',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  autoModeTitleDisabled: {
    color: '#9E9E9E',
  },
  autoModeDescription: {
    fontSize: 14,
    color: '#8F9BB3',
    fontWeight: '500',
  },
  autoModeDescriptionDisabled: {
    color: '#BDBDBD',
  },
  modeStatusIndicatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  modeStatusIndicatorText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  autoModeButtons: {
    gap: 12,
    marginBottom: 14,
  },
  autoModeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  autoModeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  autoModeButtonDisabled: {
    opacity: 0.5,
  },
  autoModeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  autoModeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8F9BB3',
  },
  autoModeButtonTextActive: {
    color: '#FFFFFF',
  },
  activeCheckmark: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  autoModeButtonLoading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rulesCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  rulesCardDisabled: {
    backgroundColor: '#F5F5F5',
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E3A59',
    letterSpacing: -0.3,
    marginLeft: 12,
    flex: 1,
  },
  rulesTitleDisabled: {
    color: '#9E9E9E',
  },
  rulesActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    marginBottom: 16,
  },
  ruleToggleContent: {
    flex: 1,
    marginRight: 16,
  },
  ruleToggleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E3A59',
    marginBottom: 4,
  },
  ruleToggleDescription: {
    fontSize: 13,
    color: '#8F9BB3',
    fontWeight: '500',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  ruleItemDisabled: {
    opacity: 0.5,
  },
  ruleItemEditable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  ruleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 14,
  },
  ruleIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleContent: {
    flex: 1,
  },
  ruleContentEditable: {
    flex: 1,
    marginLeft: 14,
  },
  ruleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E3A59',
    marginBottom: 3,
  },
  ruleTextDisabled: {
    color: '#9E9E9E',
  },
  ruleDescription: {
    fontSize: 12,
    color: '#8F9BB3',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 8,
  },
  ruleValue: {
    fontSize: 13,
    color: '#8F9BB3',
    fontWeight: '500',
  },
  ruleValueDisabled: {
    color: '#BDBDBD',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  ruleInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2E3A59',
    padding: 0,
  },
  inputUnit: {
    fontSize: 14,
    color: '#8F9BB3',
    fontWeight: '600',
    marginLeft: 8,
  },
  controlTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
    gap: 10,
  },
  controlTypeTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#2E3A59',
    letterSpacing: 0.2,
  },
  controlTypeHeaderDisabled: {
    backgroundColor: '#F0F0F0',
  },
  controlTypeTitleDisabled: {
    color: '#9E9E9E',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
