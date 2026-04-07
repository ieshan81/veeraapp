import { VeeraLogo } from '@/components/branding/VeeraLogo';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { fontFamily, theme } from '@/constants/theme';
import { useOnboarding } from '@/hooks/useOnboarding';
import { requestNotificationPermission } from '@/lib/reminders';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const { complete } = useOnboarding();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    try {
      if (firstName.trim() && user?.id) {
        await supabase.from('profiles').update({ display_name: firstName.trim() }).eq('id', user.id);
        await refreshProfile();
      }
      await requestNotificationPermission();
      await complete();
      router.replace('/(app)/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      {step === 0 && (
        <View style={styles.block}>
          <VeeraLogo size="lg" style={{ marginBottom: 20 }} />
          <GlassCard>
            <Text style={styles.h1}>Grow with every leaf</Text>
            <Text style={styles.p}>
              Scan a plant QR code, add it to your collection, and track care over time.
            </Text>
            <Button title="Next" onPress={() => setStep(1)} style={styles.mt} />
          </GlassCard>
        </View>
      )}
      {step === 1 && (
        <View style={styles.block}>
          <GlassCard>
            <Text style={styles.h2}>Scan</Text>
            <Text style={styles.p}>Point your camera at a VEERA sticker or open a plant link.</Text>
            <Text style={styles.h2}>Track</Text>
            <Text style={styles.p}>Give each plant a nickname, room, and reminders that fit your routine.</Text>
            <Text style={styles.h2}>Grow</Text>
            <Text style={styles.p}>Log notes and photos to see how your plants thrive.</Text>
            <Button title="Next" onPress={() => setStep(2)} style={styles.mt} />
          </GlassCard>
        </View>
      )}
      {step === 2 && (
        <View style={styles.block}>
          <GlassCard>
            <Text style={styles.h1}>What should we call you?</Text>
            <Text style={styles.p}>Used for a friendly greeting on your home screen.</Text>
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor={theme.textSecondary}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            <Button title="Enable reminders & finish" onPress={finish} loading={saving} style={styles.mt} />
            <Button title="Skip" onPress={finish} variant="ghost" style={styles.skip} />
          </GlassCard>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingTop: 24,
  },
  h1: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
    fontFamily: fontFamily.displayBold,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginTop: 16,
    marginBottom: 6,
    fontFamily: fontFamily.displayBold,
  },
  p: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
    fontFamily: fontFamily.body,
  },
  mt: {
    marginTop: 28,
  },
  skip: {
    marginTop: 12,
  },
  input: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radiusMd,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.surfaceElevated,
    fontFamily: fontFamily.body,
  },
});
