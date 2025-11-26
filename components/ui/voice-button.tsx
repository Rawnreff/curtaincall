import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, GestureResponderEvent, ViewStyle, Animated, Easing, Modal, TextInput, Text, ActivityIndicator, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Cross-platform recording options for expo-av. Cast to any to avoid TS issues
const RECORDING_OPTIONS: any = {
  android: {
    extension: '.m4a',
    outputFormat: (Audio as any).RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4 || 2,
    audioEncoder: (Audio as any).RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC || 3,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.caf',
    audioQuality: (Audio as any).RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH || 127,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm'
  }
};
// dynamic require to avoid crashing on web when native module is missing
// detect Expo Go ownership to avoid loading native bindings inside Expo Go
let ExpoConstants: any;
try { ExpoConstants = require('expo-constants'); } catch (e) { ExpoConstants = undefined; }
let isExpoGo = !!(ExpoConstants && ExpoConstants.appOwnership === 'expo');
// Disable react-native-voice by default in this Expo-managed project to avoid
// loading native bindings that are not present in Expo Go. If you switch to
// a bare workflow or custom dev client and want native STT, re-enable this.
let Voice: any = undefined;
import { NETWORK_CONFIG } from '../../app/config/network.config';
import { useControl } from '../../app/contexts/ControlContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  onPress?: (e: GestureResponderEvent) => void;
  accessibilityLabel?: string;
  style?: ViewStyle | ViewStyle[];
};

export default function VoiceButton({ onPress, accessibilityLabel = 'Voice Command', style }: Props) {
  const wave1 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [showModal, setShowModal] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState('Tap mic to record');
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [commandError, setCommandError] = useState<string | null>(null);
  const { sendCommand } = useControl();
  const mediaRecorderRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const recordedChunksRef = useRef<any[]>([]);
  const expoRecordingRef = useRef<any>(null);
  // Guard: check whether native Voice module is available and appears fully bound to native
  // We intentionally disable the native react-native-voice usage when using
  // Expo Go. Use web fallbacks or expo-av recording + /proses_audio upload instead.
  const voiceAvailable = false;

  useEffect(() => {
    // Outward-only waves: animate 0 -> 1 (scale & fade out) then reset to 0 instantly
    // and restart after a pause. This prevents the "returning" visual artifact.
    let mounted = true;

    const runWave = (value: Animated.Value, initialDelay = 0, repeatDelay = 40000) => {
      if (!mounted) return;
      // reset to center instantly
      value.setValue(0);
      Animated.sequence([
        Animated.delay(initialDelay),
        Animated.timing(value, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.circle),
          useNativeDriver: true,
        }),
        Animated.delay(repeatDelay),
      ]).start(() => {
        if (mounted) runWave(value, 0, repeatDelay);
      });
    };

    // start single outward wave with long pause between repeats (10s)
    runWave(wave1, 0, 15000);

    return () => {
      mounted = false;
    };
  }, [wave1]);

  // Pulse animation for recording state
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Rotation animation for processing state
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [loading, rotateAnim]);

  // Glow animation for processing state
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [loading, glowAnim]);

  // Speech-to-text handlers using react-native-voice (only if available)
  useEffect(() => {
    if (!voiceAvailable) return;
    Voice.onSpeechResults = (e: any) => {
      const results = e.value || [];
      if (results.length > 0) {
        setInputText(results[0]);
      }
    };

    Voice.onSpeechError = (e: any) => {
      console.warn('Speech error', e);
      setIsRecording(false);
    };

    return () => {
      try { Voice.destroy().then(Voice.removeAllListeners); } catch (e) { /* ignore */ }
    };
  }, [voiceAvailable]);

  const uploadAudioBlob = async (blob: Blob) => {
    setLoading(true);
    setStatusText('Processing...');
    setCommandError(null);
    try {
      // Use the NLP service (port 5001) for audio processing/upload
      const nlpBase = `http://${NETWORK_CONFIG.BACKEND_IP}:5001`;
      const base = nlpBase;
      const form = new FormData();
      // modern browsers accept Blob directly
      form.append('file', blob, 'voice.webm');
      const uploadUrl = `${base}/proses_audio`;
      console.log('[uploadAudioBlob] uploading to', uploadUrl);
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      console.log('[uploadAudioBlob] response:', data);
      
      if (data && data.text) {
        setInputText(data.text);
        
        // Check if command was successful and saved to database
        if (data.status === 'success' && data.database_updated) {
          const action = data.prediksi === 'BUKA' ? 'Opening' : 'Closing';
          setCommandResult(`${action} curtain...`);
          setStatusText(`Command: "${data.text}"`);
          setCommandError(null);
          
          // Auto-close after 2 seconds
          setTimeout(() => {
            setShowModal(false);
            resetModal();
          }, 2000);
        } else {
          // Command not recognized or invalid
          const errorMessage = data.pesan || 'Command not recognized';
          setCommandError(errorMessage);
          setStatusText(`"${data.text}"`);
          setCommandResult(null);
          
          // Show alert for invalid command
          setTimeout(() => {
            Alert.alert(
              'Invalid Command',
              errorMessage,
              [{ text: 'OK', onPress: () => {} }]
            );
          }, 500);
        }
      }
    } catch (err: any) {
      console.warn('uploadAudioBlob error', err);
      setCommandError('Upload failed. Please try again.');
      setStatusText('Error');
    } finally {
      setLoading(false);
    }
  };

  const uploadLocalFile = async (uri: string) => {
    setLoading(true);
    setStatusText('Processing...');
    setCommandError(null);
    try {
      // Send audio uploads to the NLP service running on port 5001
      const nlpBase = `http://${NETWORK_CONFIG.BACKEND_IP}:5001`;
      const base = nlpBase;
      const form = new FormData();
      const parts = uri.split('/');
      const name = parts[parts.length - 1] || 'recording.m4a';
      // Try to infer mime type from extension
      let type = 'audio/m4a';
      const m = name.match(/\.([a-z0-9]+)$/i);
      if (m && m[1]) type = `audio/${m[1]}`;
      // On React Native / Expo, try appending file as { uri, name, type } first
      const uploadUrl = `${base}/proses_audio`;
      console.log('[uploadLocalFile] attempting upload with RN FormData', { uri, name, type, uploadUrl });
      (form as any).append('file', { uri, name, type });
      let res = await fetch(uploadUrl, {
        method: 'POST',
        body: form,
      });

      // If server rejects or response not OK, try converting URI to blob and reupload
      if (!res.ok) {
        let respText = '';
        try { respText = await res.text(); } catch (e) { respText = String(e); }
        console.warn('[uploadLocalFile] first attempt failed, status=', res.status, 'body=', respText);
        // try fetch(uri) -> blob (works on many RN/Expo setups)
        try {
          const r2 = await fetch(uri);
          const blob = await r2.blob();
          const form2 = new FormData();
          form2.append('file', blob, name);
          console.log('[uploadLocalFile] retrying upload with blob', { name, type, uploadUrl });
          res = await fetch(uploadUrl, { method: 'POST', body: form2 });
        } catch (e2: any) {
          console.warn('[uploadLocalFile] blob conversion/upload failed', e2);
          // As a last-resort fallback on Expo Go / Android, try expo-file-system uploadAsync
          try {
            if (FileSystem && typeof FileSystem.uploadAsync === 'function') {
              console.log('[uploadLocalFile] attempting expo-file-system uploadAsync fallback', { uri, uploadUrl });
              const resFS = await FileSystem.uploadAsync(uploadUrl, uri, {
                httpMethod: 'POST',
                // Use any-cast to avoid TypeScript mismatch across expo-file-system versions
                uploadType: (FileSystem as any).FileSystemUploadType?.MULTIPART,
                fieldName: 'file',
                mimeType: type,
              });
              console.log('[uploadLocalFile] expo-file-system upload result', resFS);
              if (resFS.status >= 200 && resFS.status < 300) {
                try {
                  const dataFS = JSON.parse(resFS.body);
                  if (dataFS && dataFS.text) setInputText(dataFS.text);
                } catch (parseErr) {
                  console.warn('[uploadLocalFile] failed parsing FS response', parseErr);
                }
                return;
              } else {
                console.warn('[uploadLocalFile] expo-file-system upload returned non-OK', resFS.status, resFS.body);
              }
            }
          } catch (fsErr) {
            console.warn('[uploadLocalFile] expo-file-system upload failed', fsErr);
          }
          throw e2;
        }
      }

      const data = await res.json();
      console.log('[uploadLocalFile] server response', data);
      
      if (data && data.text) {
        setInputText(data.text);
        
        // Check if command was successful and saved to database
        if (data.status === 'success' && data.database_updated) {
          const action = data.prediksi === 'BUKA' ? 'Opening' : 'Closing';
          setCommandResult(`${action} curtain...`);
          setStatusText(`Command: "${data.text}"`);
          setCommandError(null);
          
          // Auto-close after 2 seconds
          setTimeout(() => {
            setShowModal(false);
            resetModal();
          }, 2000);
        } else {
          // Command not recognized or invalid
          const errorMessage = data.pesan || 'Command not recognized';
          setCommandError(errorMessage);
          setStatusText(`"${data.text}"`);
          setCommandResult(null);
          
          // Show alert for invalid command
          setTimeout(() => {
            Alert.alert(
              'Invalid Command',
              errorMessage,
              [{ text: 'OK', onPress: () => {} }]
            );
          }, 500);
        }
      }
    } catch (err: any) {
      console.warn('uploadLocalFile error', err);
      setCommandError('Upload failed. Please try again.');
      setStatusText('Error');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setInputText('');
    setStatusText('Tap mic to record');
    setCommandResult(null);
    setCommandError(null);
    setIsRecording(false);
    setLoading(false);
  };

  const startRecording = async () => {
    setStatusText('Listening...');
    setCommandResult(null);
    setCommandError(null);
    
    // Web: prefer Web Speech API, fallback to MediaRecorder
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        try {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.lang = 'id-ID';
          recognitionRef.current.interimResults = false;
          recognitionRef.current.maxAlternatives = 1;
          recognitionRef.current.onresult = (ev: any) => {
            const t = ev.results && ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript;
            if (t) setInputText(t);
          };
          recognitionRef.current.onerror = (e: any) => {
            console.warn('WebSpeech error', e);
            setIsRecording(false);
          };
          recognitionRef.current.onend = () => setIsRecording(false);
          recognitionRef.current.start();
          setIsRecording(true);
          return;
        } catch (e: any) {
          console.warn('Web Speech start failed', e);
        }
      }

      // fallback to MediaRecorder flow
      if (navigator.mediaDevices && (navigator.mediaDevices as any).getUserMedia) {
        try {
          const stream = await (navigator.mediaDevices as any).getUserMedia({ audio: true });
          const mediaType = (window as any).MediaRecorder && (window as any).MediaRecorder.isTypeSupported && (window as any).MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
          const mr = new (window as any).MediaRecorder(stream, { mimeType: mediaType });
          recordedChunksRef.current = [];
          mr.ondataavailable = (e: any) => { if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data); };
          mr.onstop = async () => {
            const blob = new Blob(recordedChunksRef.current, { type: mediaType });
            await uploadAudioBlob(blob);
            try { stream.getTracks().forEach((t: any) => t.stop()); } catch {}
          };
          mediaRecorderRef.current = { recorder: mr, stream };
          mr.start();
          setIsRecording(true);
          return;
        } catch (e: any) {
          console.warn('MediaRecorder start failed', e);
        }
      }

      Alert.alert('Not supported', 'Speech recognition is not available in this browser. You can type your command instead.');
      return;
    }

    // Native (Android/iOS): try react-native-voice if installed
    if (voiceAvailable) {
      try {
        setInputText('');
        setIsRecording(true);
        await Voice.start('id-ID');
      } catch (err: any) {
        console.warn('Voice start error', err);
        Alert.alert('Voice start error', err?.message || String(err));
        setIsRecording(false);
      }
      return;
    }
    // If native module not present, attempt Expo-managed recording (expo-av) for Expo Go
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Microphone permission is required to record audio.');
          return;
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const recording = new Audio.Recording();
        // Prepare recording with explicit cross-platform options
        await recording.prepareToRecordAsync(RECORDING_OPTIONS);
        await recording.startAsync();
        expoRecordingRef.current = recording;
        setIsRecording(true);
        return;
      } catch (e: any) {
        console.warn('expo-av recording start failed', e);
      }
    }

    // Otherwise show instructions
    Alert.alert(
      'Voice unavailable',
      'Native speech-to-text module is not installed. For native support install `@react-native-voice/voice` and rebuild the app, or use the web version where available.',
    );
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setLoading(true);
    setStatusText('Processing...');
    
    if (Platform.OS === 'web') {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
        recognitionRef.current = null;
        return;
      }
      if (mediaRecorderRef.current) {
        try {
          const mr = mediaRecorderRef.current.recorder;
          if (mr && mr.state !== 'inactive') mr.stop();
        } catch (e) { console.warn('MediaRecorder stop error', e); }
        mediaRecorderRef.current = null;
        return;
      }
      return;
    }

    if (voiceAvailable) {
      try {
        await Voice.stop();
      } catch (err: any) {
        console.warn('Voice stop error', err);
      }
      return;
    }

    // If expo-av recording was active, stop and upload
    if (expoRecordingRef.current) {
      try {
        const rec = expoRecordingRef.current as any;
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();
        expoRecordingRef.current = null;
        if (uri) {
          await uploadLocalFile(uri);
        }
      } catch (e: any) {
        console.warn('expo-av stop error', e);
        Alert.alert('Recording error', e?.message || String(e));
        setLoading(false);
      }
      return;
    }
  };

  const waveStyle = (animatedValue: Animated.Value) => ({
    transform: [
      {
        // grow larger so wave moves clearly outward
        scale: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.7, 3.0] }),
      },
    ],
    opacity: animatedValue.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 0.22, 0] }),
  });

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else if (!loading) {
      startRecording();
    }
  };

  return (
    <View style={[styles.container, style as any]} pointerEvents="box-none">
      {/* Outer animated wave (single outward pulse) */}
      <Animated.View style={[styles.wave, waveStyle(wave1), { backgroundColor: 'rgba(102,126,234,0.18)' }]} pointerEvents="none" />

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setShowModal(true)}
        accessibilityLabel={accessibilityLabel}
        style={styles.touchable}
      >
        {/* Liquid glass white base + subtle highlights */}
        <View style={styles.glassBase}>
          <LinearGradient
            colors={['rgba(255,255,255,0.995)', 'rgba(255,255,255,0.92)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.glassGradient}
          />
          <View style={styles.glassInnerShadow} />
          <Ionicons name="mic" size={24} color="#667eea" />
        </View>
      </TouchableOpacity>
      {/* Clean voice command modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => { setShowModal(false); resetModal(); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Large mic button in center */}
            <Animated.View style={[styles.micButtonContainer, isRecording && !loading && { transform: [{ scale: pulseAnim }] }]}>
              <TouchableOpacity
                onPress={handleMicPress}
                disabled={loading && !isRecording}
                activeOpacity={0.8}
              >
                {isRecording ? (
                  // Recording state - filled gradient with glow
                  <View style={styles.recordingContainer}>
                    <View style={styles.recordingGlow} />
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.largeMicButtonActive}
                    >
                      <View style={styles.micButtonInner}>
                        <Ionicons name="mic" size={48} color="#fff" />
                      </View>
                    </LinearGradient>
                  </View>
                ) : loading ? (
                  // Processing state - animated gradient with processing icon
                  <View style={styles.processingContainer}>
                    <Animated.View 
                      style={[
                        styles.processingGlow,
                        {
                          opacity: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 0.6],
                          }),
                          transform: [{
                            scale: glowAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1.2, 1.4],
                            }),
                          }],
                        },
                      ]} 
                    />
                    <LinearGradient
                      colors={['#f59e0b', '#f97316']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.largeMicButtonProcessing}
                    >
                      <Animated.View
                        style={{
                          transform: [{
                            rotate: rotateAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          }],
                        }}
                      >
                        <Ionicons name="cog" size={48} color="#fff" />
                      </Animated.View>
                    </LinearGradient>
                  </View>
                ) : (
                  // Idle state - soft gradient background with border
                  <View style={styles.largeMicButton}>
                    <LinearGradient
                      colors={['rgba(102,126,234,0.05)', 'rgba(118,75,162,0.05)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.micButtonGradient}
                    />
                    <View style={styles.micButtonBorder} />
                    <Ionicons name="mic-outline" size={48} color="#667eea" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Status text */}
            <Text style={[
              styles.statusText,
              loading && styles.statusTextProcessing
            ]}>
              {statusText}
            </Text>

            {/* Command result (if successful) */}
            {commandResult && (
              <View style={styles.resultContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.resultText}>{commandResult}</Text>
              </View>
            )}

            {/* Command error (if invalid) */}
            {commandError && (
              <View style={styles.errorContainer}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
                <Text style={styles.errorText}>{commandError}</Text>
              </View>
            )}

            {/* Close button */}
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => { setShowModal(false); resetModal(); }}
              disabled={loading}
            >
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // container intentionally left to be positioned by parent
  },
  wave: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102,126,234,0.18)',
    alignSelf: 'center',
    left: -28,
    top: -28,
  },
  touchable: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    // subtle shadow
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'visible',
  },
  gradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBase: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.14)',
    backgroundColor: 'rgba(255,255,255,0.98)',
    shadowColor: 'rgba(102,126,234,0.14)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  glassGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glassInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 34,
    backgroundColor: 'rgba(0,0,0,0.03)',
    opacity: 0.15,
  },
  /* Modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
    position: 'relative',
  },
  micButtonContainer: {
    marginBottom: 24,
  },
  largeMicButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  micButtonGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  micButtonBorder: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: 'rgba(102,126,234,0.2)',
  },
  micButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  recordingGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#667eea',
    opacity: 0.3,
    transform: [{ scale: 1.2 }],
  },
  largeMicButtonActive: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  processingContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  processingGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f59e0b',
    opacity: 0.4,
    transform: [{ scale: 1.3 }],
  },
  largeMicButtonProcessing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusTextProcessing: {
    color: '#f59e0b',
    fontWeight: '700',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderRadius: 12,
    gap: 8,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(156,163,175,0.1)',
  },
});
