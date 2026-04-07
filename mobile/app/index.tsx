import { useAuth } from '@/providers/AuthProvider';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';

export default function Index() {
  const { session, loading: authLoading, configError } = useAuth();
  const { done: onboardingDone, loading: obLoading } = useOnboarding();

  if (configError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>Configuration needed</Text>
        <Text style={styles.errSub}>
          Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment (.env).
        </Text>
      </View>
    );
  }

  if (authLoading || obLoading || onboardingDone === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(app)/(tabs)" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.surface,
  },
  errTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errSub: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
