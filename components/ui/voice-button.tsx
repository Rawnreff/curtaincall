import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, GestureResponderEvent, ViewStyle, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  onPress?: (e: GestureResponderEvent) => void;
  accessibilityLabel?: string;
  style?: ViewStyle | ViewStyle[];
};

export default function VoiceButton({ onPress, accessibilityLabel = 'Voice Command', style }: Props) {
  const wave1 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Outward-only waves: animate 0 -> 1 (scale & fade out) then reset to 0 instantly
    // and restart after a pause. This prevents the "returning" visual artifact.
    let mounted = true;

    const runWave = (value: Animated.Value, initialDelay = 40000, repeatDelay = 40000) => {
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
    runWave(wave1, 0, 20000);

    return () => {
      mounted = false;
    };
  }, [wave1]);

  const waveStyle = (animatedValue: Animated.Value) => ({
    transform: [
      {
        // grow larger so wave moves clearly outward
        scale: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.7, 3.0] }),
      },
    ],
    opacity: animatedValue.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 0.22, 0] }),
  });

  return (
    <View style={[styles.container, style as any]} pointerEvents="box-none">
      {/* Outer animated wave (single outward pulse) */}
      <Animated.View style={[styles.wave, waveStyle(wave1), { backgroundColor: 'rgba(102,126,234,0.18)' }]} pointerEvents="none" />

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
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
});
