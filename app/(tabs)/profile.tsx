//(tabs)/profile.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  // Settings States
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [autoMode, setAutoMode] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometricAuth, setBiometricAuth] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const SettingsToggle = ({ icon, title, subtitle, value, onValueChange, gradient }: any) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.settingIconGradient}
          >
            <Ionicons name={icon} size={22} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E0E0E0', true: '#667eea' }}
        thumbColor={value ? '#FFFFFF' : '#F4F4F4'}
        ios_backgroundColor="#E0E0E0"
      />
    </View>
  );

  const SettingsButton = ({ icon, title, subtitle, onPress, gradient, badge }: any) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.settingIconGradient}
          >
            <Ionicons name={icon} size={22} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#B0B8C5" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* User Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </LinearGradient>
        </View>
        <Text style={styles.userName}>
          {user?.name || 'User'}
        </Text>
        <Text style={styles.userEmail}>
          {user?.email || 'user@example.com'}
        </Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsCard}>
          <SettingsButton
            icon="person"
            title="Edit Profile"
            subtitle="Update your personal information"
            gradient={['#667eea', '#764ba2']}
            onPress={() => Alert.alert('Coming Soon', 'Edit profile feature will be available soon')}
          />
          <SettingsButton
            icon="key"
            title="Change Password"
            subtitle="Update your password"
            gradient={['#f093fb', '#f5576c']}
            onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon')}
          />
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingsCard}>
          <SettingsToggle
            icon="notifications"
            title="Push Notifications"
            subtitle="Receive app notifications"
            value={pushNotifications}
            onValueChange={setPushNotifications}
            gradient={['#667eea', '#764ba2']}
          />
          <SettingsToggle
            icon="mail"
            title="Email Notifications"
            subtitle="Receive email updates"
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            gradient={['#4facfe', '#00f2fe']}
          />
          <SettingsToggle
            icon="musical-notes"
            title="Sound"
            subtitle="Play notification sounds"
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            gradient={['#fa709a', '#fee140']}
          />
          <SettingsToggle
            icon="phone-portrait"
            title="Vibration"
            subtitle="Vibrate on notifications"
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
            gradient={['#f093fb', '#f5576c']}
          />
        </View>
      </View>

      {/* Smart Home Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Smart Home</Text>
        <View style={styles.settingsCard}>
          <SettingsToggle
            icon="construct"
            title="Auto Mode"
            subtitle="Enable automatic curtain control"
            value={autoMode}
            onValueChange={setAutoMode}
            gradient={['#10b981', '#059669']}
          />
          <SettingsButton
            icon="time"
            title="Schedule"
            subtitle="Set automated schedules"
            gradient={['#667eea', '#764ba2']}
            onPress={() => Alert.alert('Coming Soon', 'Schedule settings will be available soon')}
          />
          <SettingsButton
            icon="location"
            title="Location Services"
            subtitle="Use location for automation"
            gradient={['#4facfe', '#00f2fe']}
            badge="Active"
            onPress={() => Alert.alert('Location Services', 'Location services are currently enabled')}
          />
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingsCard}>
          <SettingsToggle
            icon="moon"
            title="Dark Mode"
            subtitle="Use dark theme"
            value={darkMode}
            onValueChange={setDarkMode}
            gradient={['#667eea', '#764ba2']}
          />
          <SettingsButton
            icon="color-palette"
            title="Theme"
            subtitle="Customize app colors"
            gradient={['#fa709a', '#fee140']}
            onPress={() => Alert.alert('Coming Soon', 'Theme customization will be available soon')}
          />
          <SettingsButton
            icon="text"
            title="Text Size"
            subtitle="Adjust font size"
            gradient={['#10b981', '#059669']}
            onPress={() => Alert.alert('Coming Soon', 'Text size settings will be available soon')}
          />
        </View>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security & Privacy</Text>
        <View style={styles.settingsCard}>
          <SettingsToggle
            icon="finger-print"
            title="Biometric Authentication"
            subtitle="Use Face ID / Touch ID"
            value={biometricAuth}
            onValueChange={setBiometricAuth}
            gradient={['#667eea', '#764ba2']}
          />
          <SettingsButton
            icon="shield-checkmark"
            title="Privacy Policy"
            subtitle="View our privacy policy"
            gradient={['#10b981', '#059669']}
            onPress={() => Alert.alert('Privacy Policy', 'Our privacy policy protects your data')}
          />
          <SettingsButton
            icon="document-text"
            title="Terms of Service"
            subtitle="Read terms and conditions"
            gradient={['#4facfe', '#00f2fe']}
            onPress={() => Alert.alert('Terms of Service', 'View our terms of service')}
          />
        </View>
      </View>

      {/* Data & Storage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Storage</Text>
        <View style={styles.settingsCard}>
          <SettingsButton
            icon="cloud-download"
            title="Data Usage"
            subtitle="Monitor data consumption"
            gradient={['#667eea', '#764ba2']}
            badge="2.3 MB"
            onPress={() => Alert.alert('Data Usage', 'Total data used: 2.3 MB')}
          />
          <SettingsButton
            icon="save"
            title="Cache"
            subtitle="Clear app cache"
            gradient={['#fa709a', '#fee140']}
            badge="15 MB"
            onPress={() => Alert.alert('Clear Cache', 'Are you sure you want to clear cache?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', onPress: () => Alert.alert('Success', 'Cache cleared!') }
            ])}
          />
          <SettingsButton
            icon="download"
            title="Export Data"
            subtitle="Download your data"
            gradient={['#10b981', '#059669']}
            onPress={() => Alert.alert('Coming Soon', 'Data export will be available soon')}
          />
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.settingsCard}>
          <SettingsButton
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help with the app"
            gradient={['#667eea', '#764ba2']}
            onPress={() => Alert.alert('Coming Soon', 'Help center will be available soon')}
          />
          <SettingsButton
            icon="information-circle"
            title="App Version"
            subtitle="1.0.0 (Build 1001)"
            gradient={['#667eea', '#764ba2']}
            onPress={() => Alert.alert('About CurtainCall', 'CurtainCall v1.0.0\nBuild 1001\nSmart Curtain Control System')}
          />
          <SettingsButton
            icon="star"
            title="Rate App"
            subtitle="Rate us on the app store"
            gradient={['#fa709a', '#fee140']}
            onPress={() => Alert.alert('Rate App', 'Thank you for your support!')}
          />
          <SettingsButton
            icon="chatbubbles"
            title="Send Feedback"
            subtitle="Help us improve"
            gradient={['#4facfe', '#00f2fe']}
            onPress={() => Alert.alert('Feedback', 'Send your feedback to: feedback@curtaincall.com')}
          />
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out" size={22} color="#FFFFFF" />
            <Text style={[styles.logoutButtonText, { marginLeft: 10 }]}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity 
          style={styles.dangerButton}
          onPress={() => Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Account Deleted', 'Your account has been deleted.') }
            ]
          )}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#fa709a', '#fee140']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dangerGradient}
          >
            <Ionicons name="trash" size={22} color="#FFFFFF" />
            <Text style={[styles.dangerButtonText, { marginLeft: 10 }]}>Delete Account</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    color: '#2E3A59',
    letterSpacing: -0.4,
  },
  userEmail: {
    fontSize: 15,
    color: '#8F9BB3',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E3A59',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  settingIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E3A59',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8F9BB3',
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667eea',
  },
  logoutButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  dangerButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#fa709a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  dangerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});