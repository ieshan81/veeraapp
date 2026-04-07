import { VeeraLogo } from '@/components/branding/VeeraLogo';
import { Button } from '@/components/ui/Button';
import { BotanicalBackground } from '@/components/ui/BotanicalBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { fontFamily, theme } from '@/constants/theme';
import { useOnboarding } from '@/hooks/useOnboarding';
import { requestNotificationPermission } from '@/lib/reminders';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const STEPS = [
  {
    title: 'Scan',
    body: 'Point your camera at a VEERA QR on your plant — we’ll open the right profile instantly.',
    icon: 'qr-code-outline' as const,
  },
  {
    title: 'Learn',
    body: 'See care guidance, light and water cues, and rich detail from our catalog.',
    icon: 'book-outline' as const,
  },
  {
    title: 'Collect',
    body: 'Add the plant to My Plants with a nickname and room — duplicates are welcome.',
    icon: 'leaf-outline' as const,
  },
  {
    title: 'Plan',
    body: 'VEERA drafts a care plan: watering rhythm, daily reminders, and your next tasks.',
    icon: 'calendar-outline' as const,
  },
  {
    title: 'Grow',
    body: 'Track the journey with logs and photos — reminders keep you gently on schedule.',
    icon: 'trending-up-outline' as const,
  },
];

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
    <BotanicalBackground variant="light">
      <Screen scroll transparent>
        {step < STEPS.length && (
          <View style={styles.block}>
            <VeeraLogo size="md" variant="onLight" style={{ marginBottom: 16 }} />
            <GlassCard>
              <View style={styles.stepHeader}>
                <View style={styles.iconWrap}>
                  <Ionicons name={STEPS[step].icon} size={22} color={theme.accent} />
                </View>
                <Text style={styles.stepKicker}>Step {step + 1} of {STEPS.length}</Text>
              </View>
              <Text style={styles.h1}>{STEPS[step].title}</Text>
              <Text style={styles.p}>{STEPS[step].body}</Text>
              <View style={styles.dots}>
                {STEPS.map((_, i) => (
                  <View key={i} style={[styles.dot, i === step && styles.dotOn]} />
                ))}
              </View>
              <Button
                title={step < STEPS.length - 1 ? 'Next' : 'Almost there'}
                onPress={() => setStep((s) => s + 1)}
                style={styles.mt}
              />
            </GlassCard>
          </View>
        )}
        {step === STEPS.length && (
          <View style={styles.block}>
            <VeeraLogo size="md" variant="onLight" style={{ marginBottom: 16 }} />
            <GlassCard>
              <Text style={styles.h1}>What should we call you?</Text>
              <Text style={styles.p}>Used for a calm greeting on your home screen.</Text>
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
    </BotanicalBackground>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingTop: 24,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepKicker: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
    letterSpacing: 0.5,
    fontFamily: fontFamily.semi,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.border,
  },
  dotOn: {
    backgroundColor: theme.accent,
    width: 22,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 10,
    fontFamily: fontFamily.displayBold,
  },
  p: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
    fontFamily: fontFamily.body,
  },
  mt: {
    marginTop: 24,
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
