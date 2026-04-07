import { VeeraLogo } from '@/components/branding/VeeraLogo';
import { Button } from '@/components/ui/Button';
import { fontFamily, theme } from '@/constants/theme';
import { resolvePlantQr } from '@/lib/api/plants';
import { setPendingQrToken } from '@/lib/pendingPlantLink';
import { normalizeQrPayload } from '@/lib/qr';
import { safeDecodeURIComponent } from '@/lib/safeDecode';
import { useAuth } from '@/providers/AuthProvider';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Phase = 'loading' | 'error' | 'auth';

export default function PlantDeepLinkScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const raw = Array.isArray(token) ? token[0] : token;
  const { session, loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authRedirectDone = useRef(false);
  const resolveStarted = useRef(false);
  const hasNavigated = useRef(false);

  const runResolve = useCallback(
    async (tokenStr: string) => {
      const normalized = normalizeQrPayload(safeDecodeURIComponent(tokenStr));
      if (!normalized) {
        setErrorMessage('This link does not contain a valid plant code.');
        setPhase('error');
        return;
      }
      try {
        const plantId = await resolvePlantQr(normalized);
        if (!plantId) {
          setErrorMessage(
            'This plant link is inactive or the plant is unavailable. If you just got a new sticker, try again later.'
          );
          setPhase('error');
          return;
        }
        if (hasNavigated.current) return;
        hasNavigated.current = true;
        router.replace(`/(app)/plant/${plantId}`);
      } catch (e) {
        setErrorMessage((e as Error).message || 'Something went wrong opening this plant.');
        setPhase('error');
      }
    },
    []
  );

  useEffect(() => {
    if (!raw) {
      setErrorMessage('Missing plant link.');
      setPhase('error');
      return;
    }

    if (authLoading) return;

    if (!session) {
      if (!authRedirectDone.current) {
        authRedirectDone.current = true;
        setPhase('auth');
        void (async () => {
          await setPendingQrToken(safeDecodeURIComponent(raw));
          router.replace('/(auth)/login');
        })();
      }
      return;
    }

    if (resolveStarted.current) return;
    resolveStarted.current = true;
    setPhase('loading');
    void runResolve(raw);
  }, [raw, session, authLoading, runResolve]);

  if (phase === 'auth') {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 24 }]}>
        <VeeraLogo size="md" variant="onLight" />
        <ActivityIndicator color={theme.accent} style={{ marginTop: 24 }} />
        <Text style={styles.hint}>Signing you in…</Text>
      </View>
    );
  }

  if (phase === 'error' && errorMessage) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 24, paddingHorizontal: 28 }]}>
        <VeeraLogo size="md" variant="onLight" />
        <Text style={styles.errTitle}>Plant link</Text>
        <Text style={styles.errBody}>{errorMessage}</Text>
        <Button title="Go home" onPress={() => router.replace('/(app)/(tabs)')} style={styles.btn} />
        <Button
          title="Try scan"
          variant="secondary"
          onPress={() => router.replace('/(app)/(tabs)/scan')}
          style={styles.btn2}
        />
      </View>
    );
  }

  return (
    <View style={[styles.center, { paddingTop: insets.top + 24 }]}>
      <VeeraLogo size="md" variant="onLight" />
      <ActivityIndicator color={theme.accent} size="large" style={{ marginTop: 28 }} />
      <Text style={styles.hint}>Opening plant…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
    fontFamily: fontFamily.body,
  },
  errTitle: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    fontFamily: fontFamily.displayBold,
  },
  errBody: {
    marginTop: 12,
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: fontFamily.body,
  },
  btn: { marginTop: 28, alignSelf: 'stretch', maxWidth: 320 },
  btn2: { marginTop: 12, alignSelf: 'stretch', maxWidth: 320 },
});
