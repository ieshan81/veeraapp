import { VeeraLogo } from '@/components/branding/VeeraLogo';
import { GlassCard } from '@/components/ui/GlassCard';
import { fontFamily, theme } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, signOut } = useAuth();
  const [notifStatus, setNotifStatus] = useState<string>('…');

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) =>
      setNotifStatus(status),
    );
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12, paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <VeeraLogo size="sm" light />
        </View>

        <Text style={styles.h1}>Profile</Text>

        {/* Account card */}
        <GlassCard dark style={styles.card}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color={theme.accentLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {profile?.display_name || 'User'}
              </Text>
              <Text style={styles.email}>{user?.email ?? '—'}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <GlassCard dark>
          <View style={styles.notifRow}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={theme.accentLight}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.notifLabel}>
                Permission: {notifStatus}
              </Text>
              <Text style={styles.notifHint}>
                Reminders are scheduled on this device when enabled per plant.
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* About */}
        <Text style={styles.sectionTitle}>About</Text>
        <GlassCard dark>
          <Text style={styles.aboutText}>
            VEERA v1 — plant care companion.
          </Text>
          <Text style={styles.aboutHint}>
            Catalog and QR codes are managed in the VEERA admin panel.
          </Text>
        </GlassCard>

        {/* Sign out */}
        <Pressable
          style={styles.signOutBtn}
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/login');
          }}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
    marginBottom: 20,
  },

  // Account
  card: { marginBottom: 4 },
  avatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(114,191,155,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textLight,
    fontFamily: fontFamily.displayBold,
  },
  email: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 3,
    fontFamily: fontFamily.body,
  },

  // Section
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.textMuted,
    marginTop: 28,
    marginBottom: 12,
    fontFamily: fontFamily.semi,
  },

  // Notifications
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notifLabel: {
    fontSize: 16,
    color: theme.textLight,
    fontFamily: fontFamily.semi,
    fontWeight: '600',
  },
  notifHint: {
    marginTop: 6,
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 20,
    fontFamily: fontFamily.body,
  },

  // About
  aboutText: {
    fontSize: 16,
    color: theme.textLight,
    fontFamily: fontFamily.semi,
    fontWeight: '600',
  },
  aboutHint: {
    marginTop: 8,
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 20,
    fontFamily: fontFamily.body,
  },

  // Sign out
  signOutBtn: {
    marginTop: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.radiusMd,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textMuted,
    fontFamily: fontFamily.semi,
  },
});
