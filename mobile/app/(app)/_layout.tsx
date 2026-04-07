import { VeeraLogo } from '@/components/branding/VeeraLogo';
import { HomeHeaderButton, SmartBackButton } from '@/components/navigation/SmartHeaderButtons';
import { theme } from '@/constants/theme';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function AppStackLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.textLight,
        headerBackTitle: 'Back',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="plant/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="my-plant/[id]"
        options={{
          headerTransparent: true,
          headerTitle: () => <VeeraLogo size="sm" variant="onDark" />,
          headerTintColor: theme.textLight,
          headerLeft: () => <SmartBackButton />,
          headerRight: () => <HomeHeaderButton />,
        }}
      />
      <Stack.Screen
        name="add-plant"
        options={{
          title: 'Add to My Plants',
          presentation: 'modal',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
          headerLeft: () => <SmartBackButton mode="light" fallback="/(app)/(tabs)" />,
          headerRight: () => <HomeHeaderButton mode="light" />,
        }}
      />
      <Stack.Screen
        name="add-progress"
        options={{
          title: 'Log progress',
          presentation: 'modal',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
          headerLeft: () => <SmartBackButton mode="light" fallback="/(app)/(tabs)" />,
          headerRight: () => <HomeHeaderButton mode="light" />,
        }}
      />
      <Stack.Screen
        name="greenguru"
        options={{
          title: 'GreenGuru',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.textLight,
          headerLeft: () => <SmartBackButton />,
          headerRight: () => <HomeHeaderButton />,
        }}
      />
    </Stack>
  );
}
