import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './contexts/AuthContext';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection and try again.';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Cannot connect to server.\n\nPlease check:\n1. Backend is running on port 5000\n2. IP address is correct\n3. Device and computer are on the same network\n4. Firewall is not blocking the connection';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Modern Gradient Background */}
      <LinearGradient
        colors={['#0F0C29', '#302B63', '#24243e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />

      {/* Geometric Shapes */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.square} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>

          {/* Brand Section */}
          <View style={styles.brandSection}>
            <View style={styles.iconContainer}>
              <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconGradient}>
                <Ionicons name="sparkles" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.brandName}>Get Started</Text>
            <Text style={styles.tagline}>Join CurtainCall Today</Text>
          </View>

          {/* Card Container */}
          <View style={styles.cardWrapper}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Create Account</Text>
                <Text style={styles.cardSubtitle}>Fill in your details below</Text>
              </View>

              <View style={styles.formSection}>
                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>FULL NAME</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="John Doe"
                      placeholderTextColor="#B0B0B0"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                  <View style={styles.inputUnderline} />
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor="#B0B0B0"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.inputUnderline} />
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Minimum 6 characters"
                      placeholderTextColor="#B0B0B0"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputUnderline} />
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CONFIRM PASSWORD</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter password"
                      placeholderTextColor="#B0B0B0"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                      <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputUnderline} />
                </View>

                {/* Register Button */}
                <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
                  <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.registerGradient}>
                    <Text style={styles.registerText}>{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</Text>
                    <Ionicons name="rocket" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Login Link */}
                <TouchableOpacity onPress={() => router.back()} style={styles.loginButton} activeOpacity={0.7}>
                  <Text style={styles.loginText}>Already have an account? <Text style={styles.loginBold}>Sign In</Text></Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0C29',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    top: -100,
    left: -100,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(118, 75, 162, 0.1)',
    bottom: -50,
    right: -50,
  },
  square: {
    position: 'absolute',
    width: 150,
    height: 150,
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    transform: [{ rotate: '45deg' }],
    top: 150,
    left: -75,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#B0B0B0',
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 25,
  },
  cardHeader: {
    marginBottom: 28,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#667eea',
    marginBottom: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
    paddingVertical: 8,
  },
  eyeButton: {
    padding: 8,
  },
  inputUnderline: {
    height: 2,
    backgroundColor: '#E8E8E8',
    marginTop: 4,
  },
  registerButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  registerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  registerText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#999',
    fontWeight: '700',
  },
  loginButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  loginBold: {
    color: '#667eea',
    fontWeight: '900',
  },
});