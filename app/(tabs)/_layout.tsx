import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, Dimensions, Text } from 'react-native';
import VoiceButton from '../../components/ui/voice-button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NotificationProvider, useNotifications } from '../contexts/NotificationContext';

const { width: screenWidth } = Dimensions.get('window');

function TabLayoutContent() {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  // Calculate responsive padding for mobile
  const horizontalPadding = screenWidth < 375 ? 12 : screenWidth < 414 ? 16 : 20;
  const bottomInset = Math.max(insets.bottom, 8);
  const isSmallScreen = screenWidth < 375;

  // Dynamic styles based on screen size
  const dynamicStyles = {
    tabBarLabel: {
      fontSize: isSmallScreen ? 10 : 11,
      fontWeight: '700' as const,
      marginTop: isSmallScreen ? 4 : 6,
      letterSpacing: 0.2,
    },
    tabBarIcon: {
      marginTop: 2,
      marginBottom: isSmallScreen ? 2 : 4,
    },
    tabBarItem: {
      paddingVertical: 2,
      paddingHorizontal: isSmallScreen ? 2 : 4,
    },
    iconContainer: {
      width: isSmallScreen ? 40 : 44,
      height: isSmallScreen ? 40 : 44,
      borderRadius: isSmallScreen ? 20 : 22,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: 'transparent',
    },
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarStyle: [
            styles.tabBar,
            {
              bottom: bottomInset,
              left: horizontalPadding,
              right: horizontalPadding,
              height: isSmallScreen ? 72 : 78,
              paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 8,
              paddingTop: 10,
              paddingHorizontal: 4,
              borderRadius: 40,
            },
          ],
          tabBarActiveTintColor: '#667eea',
          tabBarInactiveTintColor: '#7A8798',
          tabBarLabelStyle: dynamicStyles.tabBarLabel,
          tabBarIconStyle: dynamicStyles.tabBarIcon,
          tabBarItemStyle: dynamicStyles.tabBarItem,
          tabBarBackground: () => (
            <View style={styles.tabBarBackground}>
              {/* Base glass gradient */}
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.95)',
                  'rgba(255, 255, 255, 0.85)',
                  'rgba(255, 255, 255, 0.75)',
                  'rgba(255, 255, 255, 0.8)'
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.glassGradient}
              />
              {/* Top highlight - main light reflection */}
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.1)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0.4 }}
                style={styles.glassHighlight}
              />
              {/* Side highlights for depth */}
              <View style={styles.glassSideHighlightLeft} />
              <View style={styles.glassSideHighlightRight} />
              {/* Inner shadow overlay */}
              <View style={styles.glassInnerShadow} />
              {/* Glass border overlay */}
              <View style={styles.glassBorder} />
              {/* Subtle noise texture overlay */}
              <View style={styles.glassNoise} />
            </View>
          ),
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#2E3A59',
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 20,
            letterSpacing: -0.5,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Home',
            tabBarIcon: ({ size, color, focused }) => (
              <View style={[dynamicStyles.iconContainer, focused && styles.iconContainerActive]}>
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={focused ? size + 2 : size}
                  color={focused ? '#FFFFFF' : color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="control"
          options={{
            title: 'Control',
            tabBarIcon: ({ size, color, focused }) => (
              <View style={[dynamicStyles.iconContainer, focused && styles.iconContainerActive]}>
                <Ionicons
                  name={focused ? "options" : "options-outline"}
                  size={focused ? size + 2 : size}
                  color={focused ? '#FFFFFF' : color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ size, color, focused }) => (
              <View style={[dynamicStyles.iconContainer, focused && styles.iconContainerActive]}>
                <Ionicons
                  name={focused ? "analytics" : "analytics-outline"}
                  size={focused ? size + 2 : size}
                  color={focused ? '#FFFFFF' : color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ size, color, focused }) => (
              <View style={{ position: 'relative' }}>
                <View style={[dynamicStyles.iconContainer, focused && styles.iconContainerActive]}>
                  <Ionicons
                    name={focused ? "notifications" : "notifications-outline"}
                    size={focused ? size + 2 : size}
                    color={focused ? '#FFFFFF' : color}
                  />
                </View>
                {/* Notification Badge */}
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ size, color, focused }) => (
              <View style={[dynamicStyles.iconContainer, focused && styles.iconContainerActive]}>
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={focused ? size + 2 : size}
                  color={focused ? '#FFFFFF' : color}
                />
              </View>
            ),
          }}
        />
      </Tabs>
      {/* Voice command button overlay (right-bottom, above tab bar) */}
      <VoiceButton
        onPress={() => {
          // Default action: navigate to a voice command modal or start recording
          console.log('Voice command pressed');
        }}
        // Position the button to the right-bottom slightly higher above the tab bar
        style={{
          right: horizontalPadding - 8,
          bottom: bottomInset + (isSmallScreen ? 82 : 88),
          position: 'absolute',
        }}
      />
    </View>
  );
}

// Wrapper with NotificationProvider
export default function TabLayout() {
  return (
    <NotificationProvider>
      <TabLayoutContent />
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderRadius: 40,
    borderTopWidth: 0,
    overflow: 'hidden',
    // Multi-layer shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 25,
    ...Platform.select({
      ios: {
        // iOS specific styles for glass effect
      },
      android: {
        // Android specific styles
      },
    }),
  },
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    overflow: 'hidden',
  },
  glassGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    borderRadius: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  glassSideHighlightLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '20%',
    height: '100%',
    borderRadius: 40,
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  glassSideHighlightRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '20%',
    height: '100%',
    borderRadius: 40,
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  glassInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  glassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    // Subtle inner glow
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  glassNoise: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.3,
  },
  iconContainerActive: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF5252',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FF5252',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 12,
  },
});