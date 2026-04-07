import { theme } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accentLight,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-plants"
        options={{
          title: 'My Plants',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(15,30,22,0.92)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      ios: { height: 88, paddingBottom: 28 },
      default: { height: 64, paddingBottom: 8 },
    }),
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabItem: {
    paddingTop: 6,
  },
});
