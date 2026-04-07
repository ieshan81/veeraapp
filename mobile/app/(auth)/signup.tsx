import { VeeraLogo } from '@/components/branding/VeeraLogo';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { fontFamily, theme } from '@/constants/theme';
import { consumePendingQrToken } from '@/lib/pendingPlantLink';
import { supabase } from '@/lib/supabase';
import { router, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function SignupScreen() {
  const nav = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { error: e } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: '' },
        },
      });
      if (e) {
        setError(e.message);
        return;
      }
      const pending = await consumePendingQrToken();
      if (pending) {
        router.replace(`/p/${encodeURIComponent(pending)}` as Href);
        return;
      }
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <VeeraLogo size="lg" style={{ marginTop: 16, marginBottom: 8 }} />
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.sub}>Use the same email you use for VEERA.</Text>
        <GlassCard style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={styles.err}>{error}</Text> : null}
          <Button title="Sign up" onPress={onSubmit} loading={loading} style={styles.btn} />
        </GlassCard>
        <Pressable onPress={() => nav.back()}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: {
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    marginTop: 8,
    fontFamily: fontFamily.displayBold,
  },
  sub: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 8,
    marginBottom: 20,
    fontFamily: fontFamily.body,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radiusMd,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    color: theme.text,
    backgroundColor: theme.surfaceElevated,
    fontFamily: fontFamily.body,
  },
  err: {
    color: theme.danger,
    marginBottom: 12,
    fontSize: 14,
    fontFamily: fontFamily.body,
  },
  btn: {
    marginTop: 8,
  },
  link: {
    marginTop: 24,
    textAlign: 'center',
    color: theme.accent,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.semi,
  },
});
