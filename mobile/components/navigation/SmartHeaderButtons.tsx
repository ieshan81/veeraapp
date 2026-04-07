import { theme } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  fallback?: Href;
  tint?: string;
  /** `light` = pale modal / auth headers; `dark` = default on botanical backgrounds. */
  mode?: 'dark' | 'light';
};

export function SmartBackButton({
  fallback = '/(app)/(tabs)',
  tint,
  mode = 'dark',
}: Props) {
  const navigation = useNavigation();
  const resolvedTint = tint ?? (mode === 'light' ? theme.text : theme.textLight);
  const circleStyle = mode === 'light' ? styles.circleLight : styles.circle;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={12}
      onPress={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          router.replace(fallback);
        }
      }}
      style={circleStyle}
    >
      <Ionicons name="chevron-back" size={22} color={resolvedTint} />
    </Pressable>
  );
}

export function HomeHeaderButton({
  tint,
  mode = 'dark',
}: {
  tint?: string;
  mode?: 'dark' | 'light';
}) {
  const resolvedTint = tint ?? (mode === 'light' ? theme.text : theme.textLight);
  const circleStyle = mode === 'light' ? styles.circleLight : styles.circle;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Home"
      hitSlop={12}
      onPress={() => router.replace('/(app)/(tabs)')}
      style={circleStyle}
    >
      <Ionicons name="home-outline" size={20} color={resolvedTint} />
    </Pressable>
  );
}

export function HeaderHomeRow({ fallback = '/(app)/(tabs)' }: { fallback?: Href }) {
  return (
    <View style={styles.row}>
      <SmartBackButton fallback={fallback} />
      <HomeHeaderButton />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26,46,40,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
