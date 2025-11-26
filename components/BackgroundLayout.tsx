import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    Easing
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Generate random stars
const NUM_STARS = 50;
const stars = Array.from({ length: NUM_STARS }).map((_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 2000,
}));

const Star = ({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) => {
    const opacity = useSharedValue(0.2);
    const scale = useSharedValue(1);

    useEffect(() => {
        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.2, { duration: 1000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            )
        );

        scale.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1.5, { duration: 1000 }),
                    withTiming(1, { duration: 1000 })
                ),
                -1,
                true
            )
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View
            style={[
                styles.star,
                { left: x, top: y, width: size, height: size, borderRadius: size / 2 },
                animatedStyle,
            ]}
        />
    );
};

const BackgroundLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <View style={styles.container}>
            {/* Base Gradient */}
            <LinearGradient
                colors={['#0F0C29', '#302B63', '#24243e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.background}
            />

            {/* Ambient Light Orbs */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            {/* Stars */}
            <View style={styles.starsContainer}>
                {stars.map((star) => (
                    <Star key={star.id} {...star} />
                ))}
            </View>

            {/* Content */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0C29',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    starsContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    star: {
        position: 'absolute',
        backgroundColor: '#FFF',
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
    },
    orb1: {
        position: 'absolute',
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: 'rgba(102, 126, 234, 0.15)',
        top: -width * 0.2,
        left: -width * 0.2,
        zIndex: 0,
        transform: [{ scale: 1.2 }],
    },
    orb2: {
        position: 'absolute',
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: width * 0.35,
        backgroundColor: 'rgba(118, 75, 162, 0.15)',
        bottom: -width * 0.1,
        right: -width * 0.1,
        zIndex: 0,
    },
    content: {
        flex: 1,
        zIndex: 2,
    },
});

export default BackgroundLayout;
